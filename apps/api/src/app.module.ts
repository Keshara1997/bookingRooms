import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "./database/prisma.module.js";

import { AuthModule } from "./modules/auth/auth.module.js";
import { TenantsModule } from "./modules/tenants/tenants.module.js";
import { HotelsModule } from "./modules/hotels/hotels.module.js";
import { BranchesModule } from "./modules/branches/branches.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    PrismaModule,
    AuthModule,
    TenantsModule,
    HotelsModule,
    BranchesModule,
  ],
})
export class AppModule {}