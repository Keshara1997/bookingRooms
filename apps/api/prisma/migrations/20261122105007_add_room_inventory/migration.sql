-- CreateEnum
CREATE TYPE "RoomBlockReason" AS ENUM ('MAINTENANCE', 'REPAIR', 'OUT_OF_SERVICE', 'MANAGEMENT_USE', 'OTHER');

-- CreateEnum
CREATE TYPE "RoomBlockStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "room_inventories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalRooms" INTEGER NOT NULL DEFAULT 0,
    "reservedRooms" INTEGER NOT NULL DEFAULT 0,
    "blockedRooms" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_blocks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" "RoomBlockReason" NOT NULL DEFAULT 'MAINTENANCE',
    "status" "RoomBlockStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_inventories_tenantId_date_idx" ON "room_inventories"("tenantId", "date");

-- CreateIndex
CREATE INDEX "room_inventories_hotelId_date_idx" ON "room_inventories"("hotelId", "date");

-- CreateIndex
CREATE INDEX "room_inventories_roomTypeId_date_idx" ON "room_inventories"("roomTypeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "room_inventories_branchId_roomTypeId_date_key" ON "room_inventories"("branchId", "roomTypeId", "date");

-- CreateIndex
CREATE INDEX "room_blocks_tenantId_status_idx" ON "room_blocks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "room_blocks_roomId_startDate_endDate_idx" ON "room_blocks"("roomId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "room_inventories" ADD CONSTRAINT "room_inventories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inventories" ADD CONSTRAINT "room_inventories_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inventories" ADD CONSTRAINT "room_inventories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inventories" ADD CONSTRAINT "room_inventories_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
