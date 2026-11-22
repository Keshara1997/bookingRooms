import { IsEnum } from "class-validator";

import { RoomStatus } from "../../../generated/prisma/enums.js";

export class UpdateRoomStatusDto {
  @IsEnum(RoomStatus)
  status!: RoomStatus;
}