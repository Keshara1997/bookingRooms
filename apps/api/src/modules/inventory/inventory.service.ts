
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { CreateInventoryDto } from "./dto/create-inventory.dto.js";
  import { UpdateInventoryDto } from "./dto/update-inventory.dto.js";
  import { QueryInventoryDto } from "./dto/query-inventory.dto.js";
  
  @Injectable()
  export class InventoryService {
    constructor(private readonly prisma: PrismaService) {}
  
    /**
     * Convert a date-only string into a UTC date.
     * Example: 2026-12-01 -> 2026-12-01T00:00:00.000Z
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
     * Format a database date as YYYY-MM-DD.
     */
    private formatDate(date: Date): string {
      return date.toISOString().slice(0, 10);
    }
  
    /**
     * Calculate the number of rooms that can still be sold.
     */
    private calculateAvailableRooms(inventory: {
      totalRooms: number;
      reservedRooms: number;
      blockedRooms: number;
    }): number {
      return (
        inventory.totalRooms -
        inventory.reservedRooms -
        inventory.blockedRooms
      );
    }
  
    /**
     * Confirm that the branch belongs to the tenant
     * and that the room type belongs to the branch's hotel.
     */
    private async validateBranchAndRoomType(
      tenantId: string,
      branchId: string,
      roomTypeId: string,
    ) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          tenantId,
        },
        select: {
          id: true,
          tenantId: true,
          hotelId: true,
        },
      });
  
      if (!branch) {
        throw new NotFoundException("Branch not found.");
      }
  
      const roomType = await this.prisma.roomType.findFirst({
        where: {
          id: roomTypeId,
          tenantId,
          hotelId: branch.hotelId,
        },
        select: {
          id: true,
          hotelId: true,
        },
      });
  
      if (!roomType) {
        throw new NotFoundException(
          "Room type not found for this hotel's branch.",
        );
      }
  
      return { branch, roomType };
    }
  
    /**
     * Count the physical rooms for a room type in a branch.
     */
    private async countPhysicalRooms(
      tenantId: string,
      branchId: string,
      roomTypeId: string,
    ): Promise<number> {
      return this.prisma.room.count({
        where: {
          tenantId,
          branchId,
          roomTypeId,
        },
      });
    }
  
    /**
     * Create inventory for one room type on one date.
     */
    async create(
      tenantId: string,
      branchId: string,
      dto: CreateInventoryDto,
    ) {
      const date = this.parseDate(dto.date);
  
      const { branch } = await this.validateBranchAndRoomType(
        tenantId,
        branchId,
        dto.roomTypeId,
      );
  
      const physicalRooms = await this.countPhysicalRooms(
        tenantId,
        branchId,
        dto.roomTypeId,
      );
  
      if (dto.totalRooms > physicalRooms) {
        throw new BadRequestException(
          `You cannot add ${dto.totalRooms} rooms. Only ${physicalRooms} physical rooms exist in this branch for this room type.`,
        );
      }
  
      try {
        const inventory = await this.prisma.roomInventory.create({
          data: {
            tenantId,
            hotelId: branch.hotelId,
            branchId,
            roomTypeId: dto.roomTypeId,
            date,
            totalRooms: dto.totalRooms,
          },
        });
  
        return {
          ...inventory,
          date: this.formatDate(inventory.date),
          availableRooms: this.calculateAvailableRooms(inventory),
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "Inventory already exists for this room type, branch, and date.",
          );
        }
  
        throw error;
      }
    }
  
    /**
     * Retrieve inventory for a branch within a date range.
     * The from and to dates are both included.
     */
    async findAll(
      tenantId: string,
      branchId: string,
      query: QueryInventoryDto,
    ) {
      const from = this.parseDate(query.from);
      const to = this.parseDate(query.to);
  
      if (from > to) {
        throw new BadRequestException(
          "The 'from' date must be before or equal to the 'to' date.",
        );
      }
  
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          tenantId,
        },
        select: {
          id: true,
        },
      });
  
      if (!branch) {
        throw new NotFoundException("Branch not found.");
      }
  
      const page = query.page ?? 1;
      const limit = query.limit ?? 31;
      const skip = (page - 1) * limit;
  
      const where = {
        tenantId,
        branchId,
        date: {
          gte: from,
          lte: to,
        },
      };
  
      const [inventories, total] = await this.prisma.$transaction([
        this.prisma.roomInventory.findMany({
          where,
          include: {
            roomType: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: [
            { date: "asc" },
            { roomType: { name: "asc" } },
          ],
          skip,
          take: limit,
        }),
        this.prisma.roomInventory.count({ where }),
      ]);
  
      return {
        data: inventories.map((inventory) => ({
          ...inventory,
          date: this.formatDate(inventory.date),
          availableRooms: this.calculateAvailableRooms(inventory),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  
    /**
     * Retrieve one inventory record.
     */
    async findOne(
      tenantId: string,
      branchId: string,
      inventoryId: string,
    ) {
      const inventory = await this.prisma.roomInventory.findFirst({
        where: {
          id: inventoryId,
          tenantId,
          branchId,
        },
        include: {
          roomType: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
  
      if (!inventory) {
        throw new NotFoundException("Inventory record not found.");
      }
  
      return {
        ...inventory,
        date: this.formatDate(inventory.date),
        availableRooms: this.calculateAvailableRooms(inventory),
      };
    }
  
    /**
     * Update the total sellable room count.
     */
    async update(
      tenantId: string,
      branchId: string,
      inventoryId: string,
      dto: UpdateInventoryDto,
    ) {
      const inventory = await this.prisma.roomInventory.findFirst({
        where: {
          id: inventoryId,
          tenantId,
          branchId,
        },
      });
  
      if (!inventory) {
        throw new NotFoundException("Inventory record not found.");
      }
  
      const minimumRequired =
        inventory.reservedRooms + inventory.blockedRooms;
  
      if (dto.totalRooms < minimumRequired) {
        throw new BadRequestException(
          `Total rooms cannot be less than ${minimumRequired}, because ${inventory.reservedRooms} rooms are reserved and ${inventory.blockedRooms} rooms are blocked.`,
        );
      }
  
      const physicalRooms = await this.countPhysicalRooms(
        tenantId,
        branchId,
        inventory.roomTypeId,
      );
  
      if (dto.totalRooms > physicalRooms) {
        throw new BadRequestException(
          `You cannot set inventory to ${dto.totalRooms}. Only ${physicalRooms} physical rooms exist in this branch for this room type.`,
        );
      }
  
      const updatedInventory = await this.prisma.roomInventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          totalRooms: dto.totalRooms,
        },
      });
  
      return {
        ...updatedInventory,
        date: this.formatDate(updatedInventory.date),
        availableRooms: this.calculateAvailableRooms(updatedInventory),
      };
    }
  }
  