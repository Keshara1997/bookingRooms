import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  HotelStatus,
  ReservationSource,
} from "../../generated/prisma/enums.js";
import { PrismaService } from "../../database/prisma.service.js";
import { AvailabilityService } from "../inventory/availability.service.js";
import { PricingCalculatorService } from "../pricing/pricing-calculator.service.js";
import { ReservationsService } from "../reservations/reservations.service.js";
import { PublicCreateBookingDto } from "./dto/public-create-booking.dto.js";

@Injectable()
export class PublicStorefrontService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly pricingCalculator: PricingCalculatorService,
    private readonly reservations: ReservationsService,
  ) {}

  async resolveTenantBySlug(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found.");
    }

    return tenant;
  }

  async listHotels(tenantSlug: string) {
    const tenant = await this.resolveTenantBySlug(tenantSlug);

    return this.prisma.hotel.findMany({
      where: {
        tenantId: tenant.id,
        status: HotelStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        currency: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async getHotel(tenantSlug: string, hotelSlug: string) {
    const tenant = await this.resolveTenantBySlug(tenantSlug);

    const hotel = await this.prisma.hotel.findFirst({
      where: {
        tenantId: tenant.id,
        slug: hotelSlug,
        status: HotelStatus.ACTIVE,
      },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            country: true,
          },
        },
        roomTypes: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            maxAdults: true,
            maxChildren: true,
            basePrice: true,
          },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException("Hotel not found.");
    }

    return {
      tenant: { slug: tenant.slug, name: tenant.name },
      hotel,
    };
  }

  async searchStays(
    tenantSlug: string,
    branchId: string,
    checkIn: string,
    checkOut: string,
    adults: number,
    children: number,
  ) {
    const tenant = await this.resolveTenantBySlug(tenantSlug);

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        tenantId: tenant.id,
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found.");
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        tenantId: tenant.id,
        hotelId: branch.hotelId,
      },
    });

    const results = [];

    for (const roomType of roomTypes) {
      if (
        adults > roomType.maxAdults ||
        children > roomType.maxChildren
      ) {
        continue;
      }

      const availability = await this.availability.checkAvailability(
        tenant.id,
        branchId,
        {
          roomTypeId: roomType.id,
          checkIn,
          checkOut,
          adults,
          children,
          rooms: 1,
        },
      );

      if (!availability.available) {
        continue;
      }

      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          tenantId: tenant.id,
          roomTypeId: roomType.id,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (!ratePlan) {
        results.push({
          roomType: {
            id: roomType.id,
            name: roomType.name,
            code: roomType.code,
            description: roomType.description,
          },
          ratePlan: null,
          pricing: null,
          currency: branch.hotel.currency,
        });
        continue;
      }

      const pricing = await this.pricingCalculator.calculate({
        tenantId: tenant.id,
        ratePlanId: ratePlan.id,
        checkIn,
        checkOut,
      });

      results.push({
        roomType: {
          id: roomType.id,
          name: roomType.name,
          code: roomType.code,
          description: roomType.description,
        },
        ratePlan: {
          id: ratePlan.id,
          name: ratePlan.name,
          code: ratePlan.code,
        },
        pricing: {
          total: pricing.total,
          currency: pricing.currency,
          nights: pricing.numberOfNights,
        },
        currency: pricing.currency,
      });
    }

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
      },
      hotel: branch.hotel,
      stay: { checkIn, checkOut, adults, children },
      options: results,
    };
  }

  async createBooking(
    tenantSlug: string,
    branchId: string,
    dto: PublicCreateBookingDto,
  ) {
    const tenant = await this.resolveTenantBySlug(tenantSlug);

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        tenantId: tenant.id,
      },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found.");
    }

    const roomType = await this.prisma.roomType.findFirst({
      where: {
        id: dto.roomTypeId,
        tenantId: tenant.id,
        hotelId: branch.hotelId,
      },
    });

    if (!roomType) {
      throw new BadRequestException("Invalid room type.");
    }

    const ratePlan = await this.prisma.ratePlan.findFirst({
      where: {
        id: dto.ratePlanId,
        tenantId: tenant.id,
        roomTypeId: dto.roomTypeId,
        isActive: true,
      },
    });

    if (!ratePlan) {
      throw new BadRequestException("Invalid rate plan.");
    }

    return this.reservations.create(tenant.id, branchId, {
      guest: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        country: dto.country,
      },
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      adults: dto.adults,
      children: dto.children ?? 0,
      rooms: [
        {
          roomTypeId: dto.roomTypeId,
          ratePlanId: dto.ratePlanId,
        },
      ],
      source: ReservationSource.WEBSITE,
      confirmOnCreate: false,
    });
  }

  async findBookingByCode(tenantSlug: string, confirmationCode: string) {
    const tenant = await this.resolveTenantBySlug(tenantSlug);

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        tenantId: tenant.id,
        confirmationCode: {
          equals: confirmationCode,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        confirmationCode: true,
        status: true,
        checkIn: true,
        checkOut: true,
        currency: true,
        totalAmount: true,
        hotel: { select: { name: true, slug: true } },
        branch: { select: { name: true, city: true } },
        guest: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rooms: {
          include: {
            roomType: { select: { name: true } },
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException("Reservation not found.");
    }

    return reservation;
  }
}