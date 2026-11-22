import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { HotelsService } from "./hotels.service.js";
import { HotelsController } from "../reports/reports.module.js";

@Module({
  imports: [AuthModule],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}