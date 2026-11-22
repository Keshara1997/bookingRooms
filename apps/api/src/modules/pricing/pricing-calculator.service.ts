
import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  export interface CalculatePricingInput {
    tenantId: string;
    ratePlanId: string;
    checkIn: string;
    checkOut: string;
  }
  
  export interface NightlyPrice {
    date: string;
    price: number;
    source: "DAILY_RATE" | "BASE_PRICE";
  }
  
  export interface CalculatePricingResult {
    ratePlanId: string;
    ratePlanName: string;
    roomTypeId: string;
    roomTypeName: string;
    currency: string;
    checkIn: string;
    checkOut: string;
    numberOfNights: number;
    nightlyPrices: NightlyPrice[];
    subtotal: number;
    total: number;
  }
  
  @Injectable()
  export class PricingCalculatorService {
    constructor(private readonly prisma: PrismaService) {}
  
    async calculate(
      input: CalculatePricingInput,
    ): Promise<CalculatePricingResult> {
      const { tenantId, ratePlanId, checkIn, checkOut } = input;
  
      // 1. Validate the dates.
      const startDate = this.parseDate(checkIn, "checkIn");
      const endDate = this.parseDate(checkOut, "checkOut");
  
      if (endDate <= startDate) {
        throw new BadRequestException(
          "Check-out date must be after check-in date.",
        );
      }
  
      const numberOfNights = this.getNumberOfNights(
        startDate,
        endDate,
      );
  
      // 2. Find the rate plan belonging to this tenant.
      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          id: ratePlanId,
          tenantId,
          isActive: true,
        },
        include: {
          hotel: true,
          roomType: true,
        },
      });
  
      if (!ratePlan) {
        throw new NotFoundException("Active rate plan not found.");
      }
  
      // 3. Check the room type belongs to the same tenant and hotel.
      if (
        ratePlan.roomType.tenantId !== tenantId ||
        ratePlan.roomType.hotelId !== ratePlan.hotelId ||
        ratePlan.hotel.tenantId !== tenantId
      ) {
        throw new BadRequestException(
          "The rate plan has an invalid room type or hotel association.",
        );
      }
  
      // 4. Validate the minimum and maximum stay.
      if (numberOfNights < ratePlan.minStayNights) {
        throw new BadRequestException(
          `This rate plan requires at least ${ratePlan.minStayNights} night(s).`,
        );
      }
  
      if (
        ratePlan.maxStayNights !== null &&
        numberOfNights > ratePlan.maxStayNights
      ) {
        throw new BadRequestException(
          `This rate plan allows a maximum of ${ratePlan.maxStayNights} night(s).`,
        );
      }
  
      // 5. Load configured daily rates for the requested dates.
      // Check-out is excluded because guests do not stay that night.
      const dailyRates = await this.prisma.dailyRate.findMany({
        where: {
          tenantId,
          ratePlanId,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });
  
      const dailyRateMap = new Map(
        dailyRates.map((rate) => [
          this.formatDate(rate.date),
          rate,
        ]),
      );
  
      // 6. Calculate the price for each night.
      const nightlyPrices: NightlyPrice[] = [];
  
      for (let index = 0; index < numberOfNights; index++) {
        const nightDate = this.addDays(startDate, index);
        const dateKey = this.formatDate(nightDate);
  
        const dailyRate = dailyRateMap.get(dateKey);
  
        if (dailyRate?.isClosed) {
          throw new BadRequestException(
            `The selected rate plan is unavailable on ${dateKey}.`,
          );
        }
  
        if (index === 0 && dailyRate?.closedToArrival) {
          throw new BadRequestException(
            `Check-in is not allowed on ${dateKey}.`,
          );
        }
  
        if (
          index === numberOfNights - 1 &&
          dailyRate?.closedToDeparture
        ) {
          throw new BadRequestException(
            `Check-out is not allowed on ${dateKey}.`,
          );
        }
  
        // Daily restrictions override rate-plan restrictions.
        const minimumStay =
          dailyRate?.minStayNights ?? ratePlan.minStayNights;
  
        const maximumStay =
          dailyRate?.maxStayNights ?? ratePlan.maxStayNights;
  
        if (numberOfNights < minimumStay) {
          throw new BadRequestException(
            `A minimum stay of ${minimumStay} night(s) applies on ${dateKey}.`,
          );
        }
  
        if (
          maximumStay !== null &&
          numberOfNights > maximumStay
        ) {
          throw new BadRequestException(
            `A maximum stay of ${maximumStay} night(s) applies on ${dateKey}.`,
          );
        }
  
        const price = dailyRate
          ? Number(dailyRate.price)
          : Number(ratePlan.roomType.basePrice);
  
        if (!Number.isFinite(price) || price < 0) {
          throw new BadRequestException(
            `Invalid room price configured for ${dateKey}.`,
          );
        }
  
        nightlyPrices.push({
          date: dateKey,
          price,
          source: dailyRate ? "DAILY_RATE" : "BASE_PRICE",
        });
      }
  
      // 7. Calculate the total.
      const subtotalInCents = nightlyPrices.reduce(
        (sum, night) => sum + this.toCents(night.price),
        0,
      );
  
      const subtotal = subtotalInCents / 100;
  
      return {
        ratePlanId: ratePlan.id,
        ratePlanName: ratePlan.name,
        roomTypeId: ratePlan.roomType.id,
        roomTypeName: ratePlan.roomType.name,
        currency: ratePlan.hotel.currency,
        checkIn: this.formatDate(startDate),
        checkOut: this.formatDate(endDate),
        numberOfNights,
        nightlyPrices,
        subtotal,
        total: subtotal,
      };
    }
  
    private parseDate(value: string, fieldName: string): Date {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new BadRequestException(
          `${fieldName} must use YYYY-MM-DD format.`,
        );
      }
  
      const date = new Date(`${value}T00:00:00.000Z`);
  
      if (
        Number.isNaN(date.getTime()) ||
        this.formatDate(date) !== value
      ) {
        throw new BadRequestException(
          `${fieldName} is not a valid calendar date.`,
        );
      }
  
      return date;
    }
  
    private getNumberOfNights(
      checkIn: Date,
      checkOut: Date,
    ): number {
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
      return Math.round(
        (checkOut.getTime() - checkIn.getTime()) /
          millisecondsPerDay,
      );
    }
  
    private addDays(date: Date, days: number): Date {
      const result = new Date(date);
      result.setUTCDate(result.getUTCDate() + days);
      return result;
    }
  
    private formatDate(date: Date): string {
      return date.toISOString().slice(0, 10);
    }
  
    private toCents(amount: number): number {
      return Math.round(amount * 100);
    }
  }
  