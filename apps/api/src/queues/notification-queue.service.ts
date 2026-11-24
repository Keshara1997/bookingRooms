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
    guestEmail?: string | null;
    guestName: string;
    hotelName: string;
    branchName: string;
    checkIn: string;
    checkOut: string;
    currency: string;
    totalAmount: string;
  }) {
    await this.add("reservation.confirmed", payload);
  }

  async enqueueInvoiceIssued(payload: {
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    guestEmail?: string | null;
    guestName: string;
    hotelName: string;
    confirmationCode: string;
    currency: string;
    total: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }>;
  }) {
    await this.add("invoice.issued", payload);
  }

  private async add(
    name: string,
    payload: Record<string, unknown>,
  ) {
    if (!this.queue) {
      return;
    }

    try {
      await this.queue.add(name, payload, {
        removeOnComplete: 100,
        removeOnFail: 200,
      });
    } catch (error) {
      this.logger.warn(
        `Could not enqueue ${name}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }
}