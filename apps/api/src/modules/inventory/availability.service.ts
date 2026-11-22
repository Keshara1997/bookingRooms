
import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  import { CheckAvailabilityDto } from "./dto/check-availability.dto.js";
  
  @Injectable()
  export class AvailabilityService {
    constructor(private readonly prisma: PrismaService) {}
  
    /**
     * Validate and convert YYYY-MM-DD into a UTC date.
     */
    private parseDate(dateString: string): Date {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new BadRequestException(
          "Invalid date. Use YYYY-MM-DD format.",
        );
      }
  
      const date = new Date(`${dateString}T00:00:00.000Z`);
  
      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== dateString
      ) {
        throw new BadRequestException("Invalid calendar date.");
      }
  
      return date;
    }
  
    /**
     * Format a date as YYYY-MM-DD.
     */
    private formatDate(date: Date): string {
      return date.toISOString().slice(0, 10);
    }
  
    /**
     * Move a UTC date forward by a number of days.
     */
    private addDays(date: Date, days: number): Date {
      const result = new Date(date);
      result.setUTCDate(result.getUTCDate() + days);
      return result;
    }
  
    /**
     * Calculate the number of nights between two dates.
     */
    private calculateNights(
      checkIn: Date,
      checkOut: Date,
    ): number {
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
      return (
        (checkOut.getTime() - checkIn.getTime()) /
        millisecondsPerDay
      );
    }
  
    /**
     * Check whether the requested dates, room type,
     * guest capacity, and room quantity are available.
     */
    async checkAvailability(
      tenantId: string,
      branchId: string,
      dto: CheckAvailabilityDto,
    ) {
      const checkIn = this.parseDate(dto.checkIn);
      const checkOut = this.parseDate(dto.checkOut);
  
      if (checkIn >= checkOut) {
        throw new BadRequestException(
          "Check-out date must be after the check-in date.",
        );
      }
  
      const nights = this.calculateNights(checkIn, checkOut);
  
      if (nights > 365) {
        throw new BadRequestException(
          "A stay cannot be longer than 365 nights.",
        );
      }
  
      const requestedRooms = dto.rooms ?? 1;
      const requestedAdults = dto.adults ?? 1;
      const requestedChildren = dto.children ?? 0;
  
      // Verify that the branch belongs to this tenant.
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          tenantId,
        },
        select: {
          id: true,
          name: true,
          hotelId: true,
        },
      });
  
      if (!branch) {
        throw new NotFoundException("Branch not found.");
      }
  
      // Verify that the room type belongs to the same hotel.
      const roomType = await this.prisma.roomType.findFirst({
        where: {
          id: dto.roomTypeId,
          tenantId,
          hotelId: branch.hotelId,
        },
        select: {
          id: true,
          name: true,
          code: true,
          maxAdults: true,
          maxChildren: true,
          basePrice: true,
        },
      });
  
      if (!roomType) {
        throw new NotFoundException(
          "Room type not found for this hotel's branch.",
        );
      }
  
      // Check the guest capacity across the requested rooms.
      const maximumAdults =
        roomType.maxAdults * requestedRooms;
  
      const maximumChildren =
        roomType.maxChildren * requestedRooms;
  
      if (requestedAdults > maximumAdults) {
        return {
          available: false,
          reason: "ADULT_CAPACITY_EXCEEDED",
          message:
            `This room type supports up to ${maximumAdults} adults ` +
            `for ${requestedRooms} requested room(s).`,
          requested: {
            rooms: requestedRooms,
            adults: requestedAdults,
            children: requestedChildren,
          },
          capacity: {
            adults: maximumAdults,
            children: maximumChildren,
          },
        };
      }
  
      if (requestedChildren > maximumChildren) {
        return {
          available: false,
          reason: "CHILD_CAPACITY_EXCEEDED",
          message:
            `This room type supports up to ${maximumChildren} children ` +
            `for ${requestedRooms} requested room(s).`,
          requested: {
            rooms: requestedRooms,
            adults: requestedAdults,
            children: requestedChildren,
          },
          capacity: {
            adults: maximumAdults,
            children: maximumChildren,
          },
        };
      }
  
      // Load inventory for every night.
      // The checkout date is intentionally excluded.
      const inventoryRecords =
        await this.prisma.roomInventory.findMany({  
          where: {
            tenantId,
            branchId,
            roomTypeId: roomType.id,
            date: {
              gte: checkIn,
              lt: checkOut,
            },
          },
          orderBy: {
            date: "asc",
          },
          select: {
            date: true,
            totalRooms: true,
            reservedRooms: true,
            blockedRooms: true,
          },
        });
  
      // Index inventory by its date for quick lookup.
      const inventoryByDate = new Map(
        inventoryRecords.map((inventory) => [
          this.formatDate(inventory.date),
          inventory,
        ]),
      );
  
      const nightlyAvailability: Array<{
        date: string;
        totalRooms: number;
        reservedRooms: number;
        blockedRooms: number;
        availableRooms: number;
        sufficient: boolean;
      }> = [];
  
      let stayIsAvailable = true;
  
      // Check each night individually.
      for (let day = 0; day < nights; day++) {
        const currentDate = this.addDays(checkIn, day);
        const dateKey = this.formatDate(currentDate);
  
        const inventory = inventoryByDate.get(dateKey);
  
        // Missing inventory means zero rooms are available.
        if (!inventory) {
          stayIsAvailable = false;
  
          nightlyAvailability.push({
            date: dateKey,
            totalRooms: 0,
            reservedRooms: 0,
            blockedRooms: 0,
            availableRooms: 0,
            sufficient: false,
          });
  
          continue;
        }
  
        const availableRooms =
          inventory.totalRooms -
          inventory.reservedRooms -
          inventory.blockedRooms;
  
        const sufficient =
          availableRooms >= requestedRooms;
  
        if (!sufficient) {
          stayIsAvailable = false;
        }
  
        nightlyAvailability.push({
          date: dateKey,
          totalRooms: inventory.totalRooms,
          reservedRooms: inventory.reservedRooms,
          blockedRooms: inventory.blockedRooms,
          availableRooms,
          sufficient,
        });
      }
  
      return {
        available: stayIsAvailable,
        reason: stayIsAvailable
          ? null
          : "INSUFFICIENT_INVENTORY",
        message: stayIsAvailable
          ? "The requested rooms are available for the entire stay."
          : "The requested rooms are not available for every night of the stay.",
        branch: {
          id: branch.id,
          name: branch.name,
        },
        roomType: {
          id: roomType.id,
          name: roomType.name,
          code: roomType.code,
          basePrice: roomType.basePrice,
        },
        stay: {
          checkIn: this.formatDate(checkIn),
          checkOut: this.formatDate(checkOut),
          nights,
        },
        requested: {
          rooms: requestedRooms,
          adults: requestedAdults,
          children: requestedChildren,
        },
        capacity: {
          adults: maximumAdults,
          children: maximumChildren,
        },
        nightlyAvailability,
      };
    }
  }
  