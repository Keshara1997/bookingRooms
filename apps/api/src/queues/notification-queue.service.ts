import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const QUEUE_NAME = "bookingrooms-notifications";

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private queue: Queue | null = null;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>("REDIS_URL");

    if (!redisUrl) {
      this.logger.warn(
        "REDIS_URL is not set; background notifications are disabled.",
      );
      return;
    }

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue(QUEUE_NAME, { connection });
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }

  async enqueueReservationConfirmed(payload: {
    tenantId: string;
    reservationId: string;
    confirmationCode: string;
  }) {
    if (!this.queue) {
      return;
    }

    try {
      await this.queue.add("reservation.confirmed", payload, {
        removeOnComplete: 100,
        removeOnFail: 200,
      });
    } catch (error) {
      this.logger.warn(
        `Could not enqueue reservation confirmation: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }
}