import { Global, Module } from "@nestjs/common";

import { NotificationQueueService } from "./notification-queue.service.js";

@Global()
@Module({
  providers: [NotificationQueueService],
  exports: [NotificationQueueService],
})
export class QueuesModule {}