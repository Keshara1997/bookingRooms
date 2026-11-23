import "dotenv/config";

import { Worker } from "bullmq";
import IORedis from "ioredis";

const QUEUE_NAME = "bookingrooms-notifications";

const redisUrl =
  process.env.REDIS_URL ?? "redis://:horilla_redis_pass@127.0.0.1:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(
      `[${new Date().toISOString()}] ${job.name}`,
      JSON.stringify(job.data),
    );

    if (job.name === "reservation.confirmed") {
      console.log(
        `TODO: send confirmation email for reservation ${job.data.reservationId}`,
      );
    }
  },
  { connection },
);

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

console.log(`bookingRooms worker listening on queue "${QUEUE_NAME}"`);