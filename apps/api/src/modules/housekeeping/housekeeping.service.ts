import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  HousekeepingStatus,
  RoomStatus,
} from "../../generated/prisma/enums.js";
import { PrismaService } from "../../database/prisma.service.js";
import { UpdateHousekeepingTaskDto } from "./dto/update-housekeeping-task.dto.js";

@Injectable()
export class HousekeepingService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBranch(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found.");
    }

    return this.prisma.housekeepingTask.findMany({
      where: {
        tenantId,
        room: { branchId },
        status: {
          in: [
            HousekeepingStatus.PENDING,
            HousekeepingStatus.IN_PROGRESS,
          ],
        },
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async updateTask(
    tenantId: string,
    taskId: string,
    dto: UpdateHousekeepingTaskDto,
  ) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id: taskId, tenantId },
      include: { room: true },
    });

    if (!task) {
      throw new NotFoundException("Housekeeping task not found.");
    }

    const completedAt =
      dto.status === HousekeepingStatus.COMPLETED
        ? new Date()
        : dto.status === HousekeepingStatus.PENDING ||
            dto.status === HousekeepingStatus.IN_PROGRESS
          ? null
          : undefined;

    const updated = await this.prisma.housekeepingTask.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        description: dto.description,
        ...(completedAt !== undefined ? { completedAt } : {}),
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
          },
        },
      },
    });

    if (dto.status === HousekeepingStatus.COMPLETED) {
      await this.prisma.room.update({
        where: { id: task.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });
    }

    return updated;
  }

  async createCheckoutCleaningTasks(
    tenantId: string,
    reservationId: string,
  ) {
    const rooms = await this.prisma.reservationRoom.findMany({
      where: {
        reservationId,
        roomId: { not: null },
      },
      select: { roomId: true },
    });

    const roomIds = [
      ...new Set(
        rooms
          .map((line) => line.roomId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    for (const roomId of roomIds) {
      const existing = await this.prisma.housekeepingTask.findFirst({
        where: {
          tenantId,
          roomId,
          status: {
            in: [
              HousekeepingStatus.PENDING,
              HousekeepingStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (existing) {
        continue;
      }

      await this.prisma.housekeepingTask.create({
        data: {
          tenantId,
          roomId,
          description: `Post-checkout cleaning (reservation ${reservationId})`,
          scheduledAt: new Date(),
        },
      });

      await this.prisma.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.CLEANING },
      });
    }

  }

  async startTask(tenantId: string, taskId: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundException("Housekeeping task not found.");
    }

    if (task.status !== HousekeepingStatus.PENDING) {
      throw new BadRequestException("Only pending tasks can be started.");
    }

    return this.updateTask(tenantId, taskId, {
      status: HousekeepingStatus.IN_PROGRESS,
    });
  }
}