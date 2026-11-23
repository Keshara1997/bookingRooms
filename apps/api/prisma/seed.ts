import "dotenv/config";

import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  MembershipRole,
  RoomStatus,
} from "../src/generated/prisma/enums.js";

const DEMO = {
  tenantSlug: "demo-hotels",
  userEmail: "admin@demo.bookingrooms.local",
  password: "Demo1234!",
  companyName: "Demo Hotels",
} as const;

function utcDateOnly(daysFromToday: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: DEMO.tenantSlug },
  });

  if (existingTenant) {
    console.log(
      `Demo tenant already exists (${existingTenant.slug}). Skipping seed.`,
    );
    console.log(`Login: ${DEMO.userEmail} / ${DEMO.password}`);
    console.log(`Tenant ID: ${existingTenant.id}`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await argon2.hash(DEMO.password, {
    type: argon2.argon2id,
  });

  const tenant = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: DEMO.userEmail,
        passwordHash,
        firstName: "Demo",
        lastName: "Admin",
        phone: "+94771234567",
      },
    });

    const createdTenant = await tx.tenant.create({
      data: {
        name: DEMO.companyName,
        slug: DEMO.tenantSlug,
        email: DEMO.userEmail,
        phone: "+94112345678",
      },
    });

    await tx.membership.create({
      data: {
        tenantId: createdTenant.id,
        userId: user.id,
        role: MembershipRole.OWNER,
      },
    });

    const hotel = await tx.hotel.create({
      data: {
        tenantId: createdTenant.id,
        name: "Colombo City Hotel",
        slug: "colombo-city",
        description: "Demo property for local development.",
        email: "frontdesk@colombo-city.demo",
        phone: "+94112345678",
        currency: "LKR",
        timezone: "Asia/Colombo",
      },
    });

    const branch = await tx.branch.create({
      data: {
        tenantId: createdTenant.id,
        hotelId: hotel.id,
        name: "Main Wing",
        code: "MAIN",
        address: "123 Galle Road",
        city: "Colombo",
        country: "Sri Lanka",
        phone: "+94112345678",
      },
    });

    const deluxe = await tx.roomType.create({
      data: {
        tenantId: createdTenant.id,
        hotelId: hotel.id,
        name: "Deluxe Room",
        code: "DLX",
        description: "King bed, city view.",
        maxAdults: 2,
        maxChildren: 1,
        basePrice: "8500.00",
        size: "28.00",
      },
    });

    const standard = await tx.roomType.create({
      data: {
        tenantId: createdTenant.id,
        hotelId: hotel.id,
        name: "Standard Room",
        code: "STD",
        description: "Queen bed.",
        maxAdults: 2,
        maxChildren: 0,
        basePrice: "6500.00",
        size: "22.00",
      },
    });

    const wifi = await tx.amenity.create({
      data: {
        tenantId: createdTenant.id,
        name: "Wi-Fi",
        icon: "wifi",
      },
    });

    const ac = await tx.amenity.create({
      data: {
        tenantId: createdTenant.id,
        name: "Air conditioning",
        icon: "ac",
      },
    });

    await tx.roomTypeAmenity.createMany({
      data: [
        { roomTypeId: deluxe.id, amenityId: wifi.id },
        { roomTypeId: deluxe.id, amenityId: ac.id },
        { roomTypeId: standard.id, amenityId: wifi.id },
      ],
    });

    const roomNumbers = ["101", "102", "201"];
    for (const roomNumber of roomNumbers) {
      await tx.room.create({
        data: {
          tenantId: createdTenant.id,
          branchId: branch.id,
          roomTypeId:
            roomNumber === "201" ? deluxe.id : standard.id,
          roomNumber,
          floor: roomNumber.startsWith("2") ? 2 : 1,
          status: RoomStatus.AVAILABLE,
        },
      });
    }

    const ratePlan = await tx.ratePlan.create({
      data: {
        tenantId: createdTenant.id,
        hotelId: hotel.id,
        roomTypeId: deluxe.id,
        name: "Best Flexible",
        code: "BAR",
        description: "Demo best-available rate.",
        minStayNights: 1,
        isRefundable: true,
        isActive: true,
      },
    });

    for (let day = 0; day < 45; day += 1) {
      const date = utcDateOnly(day);

      await tx.dailyRate.create({
        data: {
          tenantId: createdTenant.id,
          ratePlanId: ratePlan.id,
          date,
          price: "9000.00",
        },
      });

      for (const roomTypeId of [deluxe.id, standard.id]) {
        await tx.roomInventory.create({
          data: {
            tenantId: createdTenant.id,
            hotelId: hotel.id,
            branchId: branch.id,
            roomTypeId,
            date,
            totalRooms: roomTypeId === deluxe.id ? 1 : 2,
            reservedRooms: 0,
            blockedRooms: 0,
          },
        });
      }
    }

    await tx.guest.create({
      data: {
        tenantId: createdTenant.id,
        firstName: "Sample",
        lastName: "Guest",
        email: "guest@example.com",
        phone: "+94770000000",
        address: "45 Beach Road",
        country: "Sri Lanka",
        notes: "Created by seed script.",
      },
    });

    return createdTenant;
  });

  console.log("bookingRooms demo data seeded successfully.");
  console.log("");
  console.log("--- Sign in (admin web) ---");
  console.log(`  Email:    ${DEMO.userEmail}`);
  console.log(`  Password: ${DEMO.password}`);
  console.log(`  Tenant:   ${tenant.name} (${tenant.id})`);
  console.log("");
  console.log("--- URLs ---");
  console.log("  Web:  http://localhost:3001/login");
  console.log("  API:  http://localhost:3000/api/v1");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});