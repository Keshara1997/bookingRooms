
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  import { RoomBlockStatus } from "../../generated/prisma/enums.js";
  import { BlockRoomDto } from "./dto/block-room.dto.js";
  
  @Injectable()
  export class RoomBlocksService {
    constructor(private readonly prisma: PrismaService) {}
  
    /**
     * Validate a date-only string and convert it to UTC.
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
     * Add days using UTC to avoid local timezone problems.
     */
    private addDays(date: Date, days: number): Date {
      const result = new Date(date);
      result.setUTCDate(result.getUTCDate() + days);
      return result;
    }
  
    /**
     * Get all nights in a room block.
     * The end date is excluded.
     */
    private getNights(startDate: Date, endDate: Date): Date[] {
      const nights: Date[] = [];
  
      for (
        let current = new Date(startDate);
        current < endDate;
        current = this.addDays(current, 1)
      ) {
        nights.push(new Date(current));
      }
  
      return nights;
    }
  
    /**
     * Create a block for one physical room.
     *
     * The room block and daily inventory updates happen
     * inside one database transaction.
     */
    async create(
      tenantId: string,
      roomId: string,
      dto: BlockRoomDto,
    ) {
      const startDate = this.parseDate(dto.startDate);
      const endDate = this.parseDate(dto.endDate);
  
      if (startDate >= endDate) {
        throw new BadRequestException(
          "The end date must be after the start date.",
        );
      }
  
      const nights = this.getNights(startDate, endDate);
  
      if (nights.length > 365) {
        throw new BadRequestException(
          "A room block cannot be longer than 365 nights.",
        );
      }
  
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // 1. Find the physical room belonging to this tenant.
            const room = await tx.room.findFirst({
              where: {
                id: roomId,
                tenantId,
              },
              select: {
                id: true,
                roomNumber: true,
                tenantId: true,
                branchId: true,
                roomTypeId: true,
              },
            });
  
            if (!room) {
              throw new NotFoundException("Room not found.");
            }
  
            // 2. Prevent overlapping active blocks for this room.
            const overlappingBlock = await tx.roomBlock.findFirst({
              where: {
                tenantId,
                roomId,
                status: RoomBlockStatus.ACTIVE,
                startDate: {
                  lt: endDate,
                },
                endDate: {
                  gt: startDate,
                },
              },
              select: {
                id: true,
                startDate: true,
                endDate: true,
              },
            });
  
            if (overlappingBlock) {
              throw new ConflictException(
                "This room already has an active block that overlaps the requested dates.",
              );
            }
  
            // 3. Find daily inventory for the room's branch and room type.
            const inventoryRecords =
              await tx.roomInventory.findMany({
                where: {
                  tenantId,
                  branchId: room.branchId,
                  roomTypeId: room.roomTypeId,
                  date: {
                    gte: startDate,
                    lt: endDate,
                  },
                },
                orderBy: {
                  date: "asc",
                },
              });
  
            // Every night must have an inventory record.
            if (inventoryRecords.length !== nights.length) {
              throw new ConflictException(
                "Daily inventory is missing for one or more dates. Create the inventory before blocking this room.",
              );
            }
  
            const inventoryByDate = new Map(
              inventoryRecords.map((inventory) => [
                this.formatDate(inventory.date),
                inventory,
              ]),
            );
  
            // 4. Confirm that one room can be blocked on every night.
            for (const night of nights) {
              const dateKey = this.formatDate(night);
              const inventory = inventoryByDate.get(dateKey);
  
              if (!inventory) {
                throw new ConflictException(
                  `Inventory is missing for ${dateKey}.`,
                );
              }
  
              const availableRooms =
                inventory.totalRooms -
                inventory.reservedRooms -
                inventory.blockedRooms;
  
              if (availableRooms < 1) {
                throw new ConflictException(
                  `No available inventory remains for ${dateKey}.`,
                );
              }
            }
  
            // 5. Increase blockedRooms for each night.
            for (const night of nights) {
              const dateKey = this.formatDate(night);
              const inventory = inventoryByDate.get(dateKey);
  
              if (!inventory) {
                throw new ConflictException(
                  `Inventory is missing for ${dateKey}.`,
                );
              }
  
              await tx.roomInventory.update({
                where: {
                  id: inventory.id,
                },
                data: {
                  blockedRooms: {
                    increment: 1,
                  },
                },
              });
            }
  
            // 6. Create the room block record.
            const roomBlock = await tx.roomBlock.create({
              data: {
                tenantId,
                roomId,
                startDate,
                endDate,
                reason: dto.reason,
                notes: dto.notes,
              },
              include: {
                room: {
                  select: {
                    id: true,
                    roomNumber: true,
                    branchId: true,
                    roomTypeId: true,
                  },
                },
              },
            });
  
            return {
              ...roomBlock,
              startDate: this.formatDate(roomBlock.startDate),
              endDate: this.formatDate(roomBlock.endDate),
            };
          },
          {
            isolationLevel: "Serializable",
          },
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2034"
        ) {
          throw new ConflictException(
            "The room inventory changed during this operation. Please try again.",
          );
        }
  
        throw error;
      }
    }
  
    /**
     * Retrieve active and cancelled blocks for a physical room.
     */
    async findAll(
      tenantId: string,
      roomId: string,
    ) {
      const room = await this.prisma.room.findFirst({
        where: {
          id: roomId,
          tenantId,
        },
        select: {
          id: true,
          roomNumber: true,
        },
      });
  
      if (!room) {
        throw new NotFoundException("Room not found.");
      }
  
      const roomBlocks = await this.prisma.roomBlock.findMany({
        where: {
          tenantId,
          roomId,
        },
        orderBy: [
          { startDate: "desc" },
          { createdAt: "desc" },
        ],
      });
  
      return {
        room,
        data: roomBlocks.map((block) => ({
          ...block,
          startDate: this.formatDate(block.startDate),
          endDate: this.formatDate(block.endDate),
        })),
      };
    }
  
    /**
     * Cancel an active room block.
     *
     * The blocked inventory is released in the same transaction.
     */
    async cancel(
      tenantId: string,
      roomBlockId: string,
    ) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // 1. Find the block belonging to this tenant.
            const roomBlock = await tx.roomBlock.findFirst({
              where: {
                id: roomBlockId,
                tenantId,
              },
              include: {
                room: {
                  select: {
                    id: true,
                    branchId: true,
                    roomTypeId: true,
                  },
                },
              },
            });
  
            if (!roomBlock) {
              throw new NotFoundException(
                "Room block not found.",
              );
            }
  
            if (roomBlock.status === RoomBlockStatus.CANCELLED) {
              throw new ConflictException(
                "This room block has already been cancelled.",
              );
            }
  
            // 2. Get all nights covered by this block.
            const nights = this.getNights(
              roomBlock.startDate,
              roomBlock.endDate,
            );
  
            // 3. Find the matching daily inventory records.
            const inventoryRecords =
              await tx.roomInventory.findMany({
                where: {
                  tenantId,
                  branchId: roomBlock.room.branchId,
                  roomTypeId: roomBlock.room.roomTypeId,
                  date: {
                    gte: roomBlock.startDate,
                    lt: roomBlock.endDate,
                  },
                },
              });
  
            if (inventoryRecords.length !== nights.length) {
              throw new ConflictException(
                "Cannot cancel this block because one or more daily inventory records are missing.",
              );
            }
  
            const inventoryByDate = new Map(
              inventoryRecords.map((inventory) => [
                this.formatDate(inventory.date),
                inventory,
              ]),
            );
  
            // 4. Verify that each night has a blocked room to release.
            for (const night of nights) {
              const dateKey = this.formatDate(night);
              const inventory = inventoryByDate.get(dateKey);
  
              if (!inventory || inventory.blockedRooms < 1) {
                throw new ConflictException(
                  `Cannot release blocked inventory for ${dateKey}.`,
                );
              }
            }
  
            // 5. Decrease blockedRooms for each night.
            for (const night of nights) {
              const dateKey = this.formatDate(night);
              const inventory = inventoryByDate.get(dateKey);
  
              if (!inventory) {
                throw new ConflictException(
                  `Inventory is missing for ${dateKey}.`,
                );
              }
  
              await tx.roomInventory.update({
                where: {
                  id: inventory.id,
                },
                data: {
                  blockedRooms: {
                    decrement: 1,
                  },
                },
              });
            }
  
            // 6. Mark the block as cancelled.
            const updatedBlock = await tx.roomBlock.update({
              where: {
                id: roomBlock.id,
              },
              data: {
                status: RoomBlockStatus.CANCELLED,
              },
            });
  
            return {
              ...updatedBlock,
              startDate: this.formatDate(updatedBlock.startDate),
              endDate: this.formatDate(updatedBlock.endDate),
            };
          },
          {
            isolationLevel: "Serializable",
          },
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2034"
        ) {
          throw new ConflictException(
            "The room inventory changed during this operation. Please try again.",
          );
        }
  
        throw error;
      }
    }
  }
  