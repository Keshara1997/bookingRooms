
#!/bin/bash

set -e

echo "Creating bookingRooms project structure..."

# Root directories
mkdir -p apps/{api,web,worker}
mkdir -p packages/{shared,ui,config,typescript-config}
mkdir -p infrastructure/{docker,nginx,aws/{ec2,rds,s3,cloudwatch,terraform},monitoring/{prometheus,grafana/dashboards},scripts}
mkdir -p docs/{architecture,api,database,deployment,development,diagrams}
mkdir -p tests/{e2e,integration,performance,security}
mkdir -p .github/workflows

# Create files and their parent directories
while IFS= read -r file; do
    [ -z "$file" ] && continue
    mkdir -p "$(dirname "$file")"
    touch "$file"
done <<'FILES'

# Root files
.gitignore
.dockerignore
.editorconfig
.env.example
docker-compose.yml
docker-compose.dev.yml
docker-compose.prod.yml
package.json
tsconfig.json
README.md
CONTRIBUTING.md
LICENSE
SECURITY.md

# API - Root
apps/api/.env
apps/api/.env.example
apps/api/nest-cli.json
apps/api/package.json
apps/api/tsconfig.json
apps/api/tsconfig.build.json
apps/api/eslint.config.mjs

# API - Prisma
apps/api/prisma/schema.prisma
apps/api/prisma/seed.ts
apps/api/prisma/migrations/migration_lock.toml
apps/api/prisma/seeds/tenant.seed.ts
apps/api/prisma/seeds/user.seed.ts
apps/api/prisma/seeds/hotel.seed.ts
apps/api/prisma/seeds/branch.seed.ts
apps/api/prisma/seeds/room-type.seed.ts
apps/api/prisma/seeds/room.seed.ts

# API - Core
apps/api/src/main.ts
apps/api/src/app.module.ts

# API - Common
apps/api/src/common/decorators/current-user.decorator.ts
apps/api/src/common/decorators/current-tenant.decorator.ts
apps/api/src/common/decorators/roles.decorator.ts
apps/api/src/common/decorators/public.decorator.ts
apps/api/src/common/decorators/permissions.decorator.ts

apps/api/src/common/guards/jwt-auth.guard.ts
apps/api/src/common/guards/tenant.guard.ts
apps/api/src/common/guards/roles.guard.ts
apps/api/src/common/guards/permissions.guard.ts

apps/api/src/common/filters/http-exception.filter.ts
apps/api/src/common/filters/prisma-exception.filter.ts

apps/api/src/common/interceptors/logging.interceptor.ts
apps/api/src/common/interceptors/response.interceptor.ts

apps/api/src/common/middleware/request-id.middleware.ts
apps/api/src/common/middleware/tenant-context.middleware.ts

apps/api/src/common/interfaces/authenticated-request.interface.ts
apps/api/src/common/interfaces/pagination.interface.ts

apps/api/src/common/constants/app.constants.ts

apps/api/src/common/utils/slug.util.ts
apps/api/src/common/utils/date.util.ts
apps/api/src/common/utils/pagination.util.ts

# API - Config
apps/api/src/config/configuration.ts
apps/api/src/config/database.config.ts
apps/api/src/config/redis.config.ts
apps/api/src/config/jwt.config.ts
apps/api/src/config/app.config.ts

# API - Database
apps/api/src/database/prisma.module.ts
apps/api/src/database/prisma.service.ts
apps/api/src/database/database-health.controller.ts

# API - Health
apps/api/src/modules/health/health.module.ts
apps/api/src/modules/health/health.controller.ts
apps/api/src/modules/health/health.service.ts

# API - Auth
apps/api/src/modules/auth/dto/register.dto.ts
apps/api/src/modules/auth/dto/login.dto.ts
apps/api/src/modules/auth/dto/refresh-token.dto.ts
apps/api/src/modules/auth/dto/change-password.dto.ts
apps/api/src/modules/auth/auth.controller.ts
apps/api/src/modules/auth/auth.service.ts
apps/api/src/modules/auth/auth.module.ts
apps/api/src/modules/auth/strategies/jwt.strategy.ts

# API - Tenants
apps/api/src/modules/tenants/dto/create-tenant.dto.ts
apps/api/src/modules/tenants/dto/update-tenant.dto.ts
apps/api/src/modules/tenants/tenants.controller.ts
apps/api/src/modules/tenants/tenants.service.ts
apps/api/src/modules/tenants/tenants.module.ts

# API - Users
apps/api/src/modules/users/dto/create-user.dto.ts
apps/api/src/modules/users/dto/update-user.dto.ts
apps/api/src/modules/users/dto/update-profile.dto.ts
apps/api/src/modules/users/users.controller.ts
apps/api/src/modules/users/users.service.ts
apps/api/src/modules/users/users.module.ts

# API - Memberships
apps/api/src/modules/memberships/dto/invite-member.dto.ts
apps/api/src/modules/memberships/dto/update-member-role.dto.ts
apps/api/src/modules/memberships/memberships.controller.ts
apps/api/src/modules/memberships/memberships.service.ts
apps/api/src/modules/memberships/memberships.module.ts

# API - Hotels
apps/api/src/modules/hotels/dto/create-hotel.dto.ts
apps/api/src/modules/hotels/dto/update-hotel.dto.ts
apps/api/src/modules/hotels/dto/query-hotels.dto.ts
apps/api/src/modules/hotels/hotels.controller.ts
apps/api/src/modules/hotels/hotels.service.ts
apps/api/src/modules/hotels/hotels.module.ts

# API - Branches
apps/api/src/modules/branches/dto/create-branch.dto.ts
apps/api/src/modules/branches/dto/update-branch.dto.ts
apps/api/src/modules/branches/branches.controller.ts
apps/api/src/modules/branches/branches.service.ts
apps/api/src/modules/branches/branches.module.ts

# API - Room Types
apps/api/src/modules/room-types/dto/create-room-type.dto.ts
apps/api/src/modules/room-types/dto/update-room-type.dto.ts
apps/api/src/modules/room-types/dto/query-room-types.dto.ts
apps/api/src/modules/room-types/room-types.controller.ts
apps/api/src/modules/room-types/room-types.service.ts
apps/api/src/modules/room-types/room-types.module.ts

# API - Rooms
apps/api/src/modules/rooms/dto/create-room.dto.ts
apps/api/src/modules/rooms/dto/update-room.dto.ts
apps/api/src/modules/rooms/dto/query-rooms.dto.ts
apps/api/src/modules/rooms/rooms.controller.ts
apps/api/src/modules/rooms/rooms.service.ts
apps/api/src/modules/rooms/rooms.module.ts

# API - Amenities
apps/api/src/modules/amenities/amenities.controller.ts
apps/api/src/modules/amenities/amenities.service.ts
apps/api/src/modules/amenities/amenities.module.ts

# API - Pricing and Rate Plans
apps/api/src/modules/pricing/pricing.controller.ts
apps/api/src/modules/pricing/pricing.service.ts
apps/api/src/modules/pricing/pricing.module.ts
apps/api/src/modules/rate-plans/rate-plans.controller.ts
apps/api/src/modules/rate-plans/rate-plans.service.ts
apps/api/src/modules/rate-plans/rate-plans.module.ts

# API - Inventory and Availability
apps/api/src/modules/inventory/inventory.controller.ts
apps/api/src/modules/inventory/inventory.service.ts
apps/api/src/modules/inventory/inventory.module.ts
apps/api/src/modules/availability/availability.controller.ts
apps/api/src/modules/availability/availability.service.ts
apps/api/src/modules/availability/availability.module.ts

# API - Reservations
apps/api/src/modules/reservations/dto/create-reservation.dto.ts
apps/api/src/modules/reservations/dto/update-reservation.dto.ts
apps/api/src/modules/reservations/dto/cancel-reservation.dto.ts
apps/api/src/modules/reservations/dto/search-reservations.dto.ts
apps/api/src/modules/reservations/reservations.controller.ts
apps/api/src/modules/reservations/reservations.service.ts
apps/api/src/modules/reservations/reservations.module.ts
apps/api/src/modules/reservations/reservation-number.service.ts

# API - Guests
apps/api/src/modules/guests/guests.controller.ts
apps/api/src/modules/guests/guests.service.ts
apps/api/src/modules/guests/guests.module.ts

# API - Payments
apps/api/src/modules/payments/payments.controller.ts
apps/api/src/modules/payments/payments.service.ts
apps/api/src/modules/payments/payments.module.ts
apps/api/src/modules/payments/providers/payment-provider.interface.ts
apps/api/src/modules/payments/providers/stripe.provider.ts
apps/api/src/modules/payments/providers/payhere.provider.ts

# API - Invoices and Refunds
apps/api/src/modules/invoices/invoices.controller.ts
apps/api/src/modules/invoices/invoices.service.ts
apps/api/src/modules/invoices/invoices.module.ts
apps/api/src/modules/refunds/refunds.controller.ts
apps/api/src/modules/refunds/refunds.service.ts
apps/api/src/modules/refunds/refunds.module.ts

# API - Housekeeping and Maintenance
apps/api/src/modules/housekeeping/housekeeping.controller.ts
apps/api/src/modules/housekeeping/housekeeping.service.ts
apps/api/src/modules/housekeeping/housekeeping.module.ts
apps/api/src/modules/maintenance/maintenance.controller.ts
apps/api/src/modules/maintenance/maintenance.service.ts
apps/api/src/modules/maintenance/maintenance.module.ts

# API - Notifications, Reviews, Promotions
apps/api/src/modules/notifications/notifications.controller.ts
apps/api/src/modules/notifications/notifications.service.ts
apps/api/src/modules/notifications/notifications.module.ts
apps/api/src/modules/reviews/reviews.controller.ts
apps/api/src/modules/reviews/reviews.service.ts
apps/api/src/modules/reviews/reviews.module.ts
apps/api/src/modules/promotions/promotions.controller.ts
apps/api/src/modules/promotions/promotions.service.ts
apps/api/src/modules/promotions/promotions.module.ts

# API - Reports and Files
apps/api/src/modules/reports/reports.controller.ts
apps/api/src/modules/reports/reports.service.ts
apps/api/src/modules/reports/reports.module.ts
apps/api/src/modules/files/files.controller.ts
apps/api/src/modules/files/files.service.ts
apps/api/src/modules/files/files.module.ts

# API - Integrations
apps/api/src/modules/integrations/integrations.controller.ts
apps/api/src/modules/integrations/integrations.service.ts
apps/api/src/modules/integrations/integrations.module.ts

# API - Audit Logs
apps/api/src/modules/audit-logs/audit-logs.controller.ts
apps/api/src/modules/audit-logs/audit-logs.service.ts
apps/api/src/modules/audit-logs/audit-logs.module.ts

# API - Events
apps/api/src/events/events.module.ts
apps/api/src/events/events.service.ts
apps/api/src/events/event-publisher.ts
apps/api/src/events/event-types.ts

# API - Tests
apps/api/test/app.e2e-spec.ts
apps/api/test/auth.e2e-spec.ts
apps/api/test/hotels.e2e-spec.ts
apps/api/test/branches.e2e-spec.ts
apps/api/test/reservations.e2e-spec.ts

# WEB - Root
apps/web/.env.local
apps/web/.env.example
apps/web/next.config.ts
apps/web/postcss.config.mjs
apps/web/tailwind.config.ts
apps/web/tsconfig.json
apps/web/eslint.config.mjs

# WEB - Public
apps/web/public/images/.gitkeep
apps/web/public/icons/.gitkeep
apps/web/public/logos/.gitkeep
apps/web/public/fonts/.gitkeep

# WEB - App
apps/web/src/app/layout.tsx
apps/web/src/app/page.tsx
apps/web/src/app/globals.css
apps/web/src/app/not-found.tsx
apps/web/src/app/error.tsx
apps/web/src/app/loading.tsx

# WEB - Authentication
apps/web/src/app/\(auth\)/login/page.tsx
apps/web/src/app/\(auth\)/register/page.tsx
apps/web/src/app/\(auth\)/forgot-password/page.tsx
apps/web/src/app/\(auth\)/reset-password/page.tsx
apps/web/src/app/\(auth\)/verify-email/page.tsx

# WEB - Admin
apps/web/src/app/\(admin\)/dashboard/layout.tsx
apps/web/src/app/\(admin\)/dashboard/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/new/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/\[hotelId\]/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/\[hotelId\]/edit/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/\[hotelId\]/branches/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/\[hotelId\]/branches/new/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/\[hotelId\]/branches/\[branchId\]/page.tsx
apps/web/src/app/\(admin\)/dashboard/hotels/\[hotelId\]/branches/\[branchId\]/edit/page.tsx

apps/web/src/app/\(admin\)/dashboard/room-types/page.tsx
apps/web/src/app/\(admin\)/dashboard/room-types/new/page.tsx
apps/web/src/app/\(admin\)/dashboard/room-types/\[roomTypeId\]/edit/page.tsx

apps/web/src/app/\(admin\)/dashboard/rooms/page.tsx
apps/web/src/app/\(admin\)/dashboard/rooms/new/page.tsx
apps/web/src/app/\(admin\)/dashboard/rooms/\[roomId\]/page.tsx

apps/web/src/app/\(admin\)/dashboard/reservations/page.tsx
apps/web/src/app/\(admin\)/dashboard/reservations/new/page.tsx
apps/web/src/app/\(admin\)/dashboard/reservations/calendar/page.tsx
apps/web/src/app/\(admin\)/dashboard/reservations/\[reservationId\]/page.tsx

apps/web/src/app/\(admin\)/dashboard/guests/page.tsx
apps/web/src/app/\(admin\)/dashboard/guests/\[guestId\]/page.tsx
apps/web/src/app/\(admin\)/dashboard/pricing/page.tsx
apps/web/src/app/\(admin\)/dashboard/pricing/rate-plans/page.tsx
apps/web/src/app/\(admin\)/dashboard/inventory/page.tsx
apps/web/src/app/\(admin\)/dashboard/availability/page.tsx
apps/web/src/app/\(admin\)/dashboard/housekeeping/page.tsx
apps/web/src/app/\(admin\)/dashboard/maintenance/page.tsx
apps/web/src/app/\(admin\)/dashboard/payments/page.tsx
apps/web/src/app/\(admin\)/dashboard/invoices/page.tsx
apps/web/src/app/\(admin\)/dashboard/promotions/page.tsx
apps/web/src/app/\(admin\)/dashboard/reviews/page.tsx
apps/web/src/app/\(admin\)/dashboard/reports/page.tsx
apps/web/src/app/\(admin\)/dashboard/staff/page.tsx
apps/web/src/app/\(admin\)/dashboard/integrations/page.tsx
apps/web/src/app/\(admin\)/dashboard/settings/page.tsx
apps/web/src/app/\(admin\)/dashboard/settings/profile/page.tsx
apps/web/src/app/\(admin\)/dashboard/settings/users/page.tsx
apps/web/src/app/\(admin\)/dashboard/settings/billing/page.tsx

# WEB - Storefront
apps/web/src/app/\(storefront\)/hotels/page.tsx
apps/web/src/app/\(storefront\)/hotels/\[hotelSlug\]/page.tsx
apps/web/src/app/\(storefront\)/search/page.tsx
apps/web/src/app/\(storefront\)/rooms/\[roomTypeId\]/page.tsx
apps/web/src/app/\(storefront\)/booking/page.tsx
apps/web/src/app/\(storefront\)/booking/checkout/page.tsx
apps/web/src/app/\(storefront\)/booking/confirmation/page.tsx
apps/web/src/app/\(storefront\)/booking/\[bookingReference\]/page.tsx
apps/web/src/app/\(storefront\)/account/page.tsx
apps/web/src/app/\(storefront\)/account/login/page.tsx
apps/web/src/app/\(storefront\)/account/register/page.tsx
apps/web/src/app/\(storefront\)/account/bookings/page.tsx
apps/web/src/app/\(storefront\)/account/profile/page.tsx
apps/web/src/app/\(storefront\)/about/page.tsx
apps/web/src/app/\(storefront\)/contact/page.tsx
apps/web/src/app/\(storefront\)/terms/page.tsx
apps/web/src/app/\(storefront\)/privacy/page.tsx

# WEB - Components
apps/web/src/components/ui/button.tsx
apps/web/src/components/ui/input.tsx
apps/web/src/components/ui/select.tsx
apps/web/src/components/ui/textarea.tsx
apps/web/src/components/ui/modal.tsx
apps/web/src/components/ui/dialog.tsx
apps/web/src/components/ui/dropdown.tsx
apps/web/src/components/ui/badge.tsx
apps/web/src/components/ui/table.tsx
apps/web/src/components/ui/pagination.tsx
apps/web/src/components/ui/skeleton.tsx
apps/web/src/components/ui/empty-state.tsx

apps/web/src/components/admin/sidebar.tsx
apps/web/src/components/admin/header.tsx
apps/web/src/components/admin/dashboard-layout.tsx
apps/web/src/components/admin/tenant-switcher.tsx
apps/web/src/components/admin/hotel-selector.tsx

apps/web/src/components/hotels/hotel-card.tsx
apps/web/src/components/hotels/hotel-form.tsx
apps/web/src/components/hotels/hotel-table.tsx
apps/web/src/components/branches/branch-card.tsx
apps/web/src/components/branches/branch-form.tsx
apps/web/src/components/branches/branch-table.tsx

apps/web/src/components/storefront/navbar.tsx
apps/web/src/components/storefront/footer.tsx
apps/web/src/components/storefront/hotel-search.tsx
apps/web/src/components/storefront/room-card.tsx
apps/web/src/components/storefront/booking-summary.tsx
apps/web/src/components/storefront/date-range-picker.tsx

# WEB - Hooks
apps/web/src/hooks/use-auth.ts
apps/web/src/hooks/use-tenant.ts
apps/web/src/hooks/use-hotels.ts
apps/web/src/hooks/use-branches.ts
apps/web/src/hooks/use-reservations.ts
apps/web/src/hooks/use-debounce.ts

# WEB - Lib
apps/web/src/lib/api.ts
apps/web/src/lib/auth.ts
apps/web/src/lib/hotel-types.ts
apps/web/src/lib/validation.ts
apps/web/src/lib/format-date.ts
apps/web/src/lib/format-currency.ts
apps/web/src/lib/utils.ts

# WEB - Providers
apps/web/src/providers/app-provider.tsx
apps/web/src/providers/auth-provider.tsx
apps/web/src/providers/tenant-provider.tsx
apps/web/src/providers/query-provider.tsx

# WEB - Stores
apps/web/src/stores/auth.store.ts
apps/web/src/stores/tenant.store.ts
apps/web/src/stores/booking.store.ts

# WEB - Types
apps/web/src/types/api.types.ts
apps/web/src/types/auth.types.ts
apps/web/src/types/hotel.types.ts
apps/web/src/types/booking.types.ts
apps/web/src/types/user.types.ts

# WORKER
apps/worker/src/main.ts
apps/worker/src/worker.module.ts
apps/worker/src/config/redis.config.ts
apps/worker/src/config/worker.config.ts
apps/worker/src/processors/email.processor.ts
apps/worker/src/processors/notification.processor.ts
apps/worker/src/processors/booking.processor.ts
apps/worker/src/processors/payment.processor.ts
apps/worker/src/processors/invoice.processor.ts
apps/worker/src/processors/report.processor.ts
apps/worker/src/processors/cleanup.processor.ts
apps/worker/src/queues/email.queue.ts
apps/worker/src/queues/notification.queue.ts
apps/worker/src/queues/booking.queue.ts
apps/worker/src/queues/payment.queue.ts
apps/worker/src/queues/report.queue.ts
apps/worker/src/consumers/booking.consumer.ts
apps/worker/src/consumers/payment.consumer.ts
apps/worker/src/consumers/notification.consumer.ts
apps/worker/src/services/email.service.ts
apps/worker/src/services/sms.service.ts
apps/worker/src/services/invoice.service.ts
apps/worker/src/services/report.service.ts
apps/worker/src/utils/retry.util.ts
apps/worker/src/utils/logger.util.ts
apps/worker/package.json
apps/worker/tsconfig.json
apps/worker/.env.example

# PACKAGES - Shared
packages/shared/src/enums/booking-status.enum.ts
packages/shared/src/enums/payment-status.enum.ts
packages/shared/src/enums/room-status.enum.ts
packages/shared/src/enums/user-role.enum.ts
packages/shared/src/types/user.type.ts
packages/shared/src/types/hotel.type.ts
packages/shared/src/types/room.type.ts
packages/shared/src/types/booking.type.ts
packages/shared/src/types/payment.type.ts
packages/shared/src/constants/currency.constant.ts
packages/shared/src/constants/timezone.constant.ts
packages/shared/src/constants/pagination.constant.ts
packages/shared/src/validation/email.schema.ts
packages/shared/src/validation/booking.schema.ts
packages/shared/src/validation/hotel.schema.ts
packages/shared/src/index.ts
packages/shared/package.json

# PACKAGES - UI
packages/ui/src/button.tsx
packages/ui/src/input.tsx
packages/ui/src/modal.tsx
packages/ui/src/index.ts
packages/ui/package.json

# PACKAGES - Config
packages/config/package.json
packages/typescript-config/base.json
packages/typescript-config/nextjs.json
packages/typescript-config/nestjs.json
packages/typescript-config/package.json

# INFRASTRUCTURE - Docker
infrastructure/docker/api.Dockerfile
infrastructure/docker/web.Dockerfile
infrastructure/docker/worker.Dockerfile
infrastructure/docker/postgres.Dockerfile

# INFRASTRUCTURE - Nginx
infrastructure/nginx/nginx.conf
infrastructure/nginx/api.conf
infrastructure/nginx/web.conf

# INFRASTRUCTURE - AWS
infrastructure/aws/ec2/deployment-guide.md
infrastructure/aws/rds/database-guide.md
infrastructure/aws/s3/storage-guide.md
infrastructure/aws/cloudwatch/monitoring-guide.md
infrastructure/aws/terraform/main.tf
infrastructure/aws/terraform/variables.tf
infrastructure/aws/terraform/outputs.tf
infrastructure/aws/terraform/networking.tf
infrastructure/aws/terraform/security-groups.tf
infrastructure/aws/terraform/database.tf

# INFRASTRUCTURE - Monitoring
infrastructure/monitoring/prometheus/prometheus.yml
infrastructure/monitoring/grafana/dashboards/bookingrooms-dashboard.json

# INFRASTRUCTURE - Scripts
infrastructure/scripts/setup.sh
infrastructure/scripts/setup.ps1
infrastructure/scripts/backup-database.sh
infrastructure/scripts/restore-database.sh
infrastructure/scripts/migrate-database.sh
infrastructure/scripts/health-check.sh

# DOCS - Architecture
docs/architecture/system-architecture.md
docs/architecture/backend-architecture.md
docs/architecture/frontend-architecture.md
docs/architecture/multi-tenant-architecture.md
docs/architecture/event-driven-architecture.md
docs/architecture/security-architecture.md

# DOCS - API
docs/api/api-overview.md
docs/api/authentication.md
docs/api/hotels.md
docs/api/branches.md
docs/api/rooms.md
docs/api/reservations.md
docs/api/payments.md
docs/api/webhooks.md

# DOCS - Database
docs/database/database-design.md
docs/database/entity-relationships.md
docs/database/migration-guide.md
docs/database/indexing-strategy.md

# DOCS - Development
docs/development/windows-setup.md
docs/development/environment-variables.md
docs/development/coding-standards.md
docs/development/git-workflow.md
docs/development/troubleshooting.md

# DOCS - Deployment
docs/deployment/docker-deployment.md
docs/deployment/aws-deployment.md
docs/deployment/production-checklist.md
docs/deployment/backup-and-recovery.md

# DOCS - Diagrams
docs/diagrams/system-architecture.mmd
docs/diagrams/database-erd.mmd
docs/diagrams/booking-workflow.mmd
docs/diagrams/payment-workflow.mmd
docs/diagrams/authentication-workflow.mmd

# TESTS
tests/e2e/authentication.e2e-spec.ts
tests/e2e/hotel-management.e2e-spec.ts
tests/e2e/branch-management.e2e-spec.ts
tests/e2e/room-management.e2e-spec.ts
tests/e2e/booking-workflow.e2e-spec.ts
tests/integration/database.integration-spec.ts
tests/integration/payment.integration-spec.ts
tests/integration/notification.integration-spec.ts
tests/integration/tenant-isolation.integration-spec.ts
tests/performance/hotel-search.js
tests/performance/availability-search.js
tests/performance/booking-load-test.js
tests/security/authentication.security-spec.ts
tests/security/authorization.security-spec.ts
tests/security/tenant-isolation.security-spec.ts
tests/security/booking-security.security-spec.ts

# GITHUB ACTIONS
.github/workflows/api-ci.yml
.github/workflows/web-ci.yml
.github/workflows/worker-ci.yml
.github/workflows/tests.yml
.github/workflows/docker-build.yml
.github/workflows/security-scan.yml
.github/workflows/deploy-production.yml

FILES

echo ""
echo "=========================================="
echo "bookingRooms structure created successfully!"
echo "=========================================="
