
import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  // ============================================
  // GUEST INPUT TYPES
  // ============================================
  
  export interface CreateGuestInput {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    notes?: string;
  }
  
  export interface UpdateGuestInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    notes?: string;
  }
  
  // ============================================
  // GUEST SERVICE
  // ============================================
  
  @Injectable()
  export class GuestsService {
    constructor(
      private readonly prisma: PrismaService,
    ) {}
  
    // ==========================================
    // CREATE GUEST
    // ==========================================
  
    async create(
      tenantId: string,
      input: CreateGuestInput,
    ) {
      const email = input.email?.trim().toLowerCase();
      const phone = input.phone?.trim();
  
      if (email) {
        const existingEmail = await this.prisma.guest.findFirst({
          where: {
            tenantId,
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });
  
        if (existingEmail) {
          throw new ConflictException(
            "A guest with this email address already exists.",
          );
        }
      }
  
      if (phone) {
        const existingPhone = await this.prisma.guest.findFirst({
          where: {
            tenantId,
            phone,
          },
        });
  
        if (existingPhone) {
          throw new ConflictException(
            "A guest with this phone number already exists.",
          );
        }
      }
  
      return this.prisma.guest.create({
        data: {
          tenantId,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email,
          phone,
          address: input.address?.trim(),
          country: input.country?.trim(),
          notes: input.notes?.trim(),
        },
      });
    }
  
    // ==========================================
    // FIND ALL GUESTS
    // ==========================================
  
    async findAll(
      tenantId: string,
      search?: string,
      page = 1,
      limit = 20,
    ) {
      const safePage = Math.max(1, Math.floor(page));
      const safeLimit = Math.min(
        100,
        Math.max(1, Math.floor(limit)),
      );
  
      const skip = (safePage - 1) * safeLimit;
  
      const normalizedSearch = search?.trim();
  
      const where: any = {
        tenantId,
      };
  
      if (normalizedSearch) {
        where.OR = [
          {
            firstName: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: normalizedSearch,
            },
          },
        ];
      }
  
      const [guests, total] = await this.prisma.$transaction([
        this.prisma.guest.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: {
                reservations: true,
              },
            },
          },
        }),
  
        this.prisma.guest.count({
          where,
        }),
      ]);
  
      return {
        data: guests,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      };
    }
  
    // ==========================================
    // FIND ONE GUEST
    // ==========================================
  
    async findOne(
      tenantId: string,
      guestId: string,
    ) {
      const guest = await this.prisma.guest.findFirst({
        where: {
          id: guestId,
          tenantId,
        },
        include: {
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      });
  
      if (!guest) {
        throw new NotFoundException("Guest not found.");
      }
  
      return guest;
    }
  
    // ==========================================
    // UPDATE GUEST
    // ==========================================
  
    async update(
      tenantId: string,
      guestId: string,
      input: UpdateGuestInput,
    ) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          id: guestId,
          tenantId,
        },
      });
  
      if (!existingGuest) {
        throw new NotFoundException("Guest not found.");
      }
  
      const email =
        input.email === undefined
          ? undefined
          : input.email.trim().toLowerCase();
  
      const phone =
        input.phone === undefined
          ? undefined
          : input.phone.trim();
  
      if (email) {
        const duplicateEmail = await this.prisma.guest.findFirst({
          where: {
            tenantId,
            email: {
              equals: email,
              mode: "insensitive",
            },
            NOT: {
              id: guestId,
            },
          },
        });
  
        if (duplicateEmail) {
          throw new ConflictException(
            "Another guest already uses this email address.",
          );
        }
      }
  
      if (phone) {
        const duplicatePhone = await this.prisma.guest.findFirst({
          where: {
            tenantId,
            phone,
            NOT: {
              id: guestId,
            },
          },
        });
  
        if (duplicatePhone) {
          throw new ConflictException(
            "Another guest already uses this phone number.",
          );
        }
      }
  
      return this.prisma.guest.update({
        where: {
          id: guestId,
        },
        data: {
          firstName: input.firstName?.trim(),
          lastName: input.lastName?.trim(),
          email,
          phone,
          address: input.address?.trim(),
          country: input.country?.trim(),
          notes: input.notes?.trim(),
        },
      });
    }
  
    // ==========================================
    // GUEST RESERVATION HISTORY
    // ==========================================
  
    async getReservationHistory(
      tenantId: string,
      guestId: string,
    ) {
      const guest = await this.prisma.guest.findFirst({
        where: {
          id: guestId,
          tenantId,
        },
        select: {
          id: true,
        },
      });
  
      if (!guest) {
        throw new NotFoundException("Guest not found.");
      }
  
      const reservations = await this.prisma.reservation.findMany({
        where: {
          tenantId,
          guestId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          hotel: true,
          branch: true,
          rooms: {
            include: {
              roomType: true,
              room: true,
              ratePlan: true,
            },
          },
          payments: true,
        },
      });
  
      return {
        guestId,
        totalReservations: reservations.length,
        reservations,
      };
    }
  }
  