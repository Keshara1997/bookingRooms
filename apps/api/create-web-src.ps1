
$ErrorActionPreference = "Stop"

$root = "apps/web/src"

# Create directories
$directories = @(
    "app",
    "app/(auth)/login",
    "app/(auth)/register",
    "app/(auth)/forgot-password",
    "app/(auth)/reset-password",
    "app/(auth)/verify-email",

    "app/(admin)/dashboard",
    "app/(admin)/dashboard/hotels/new",
    "app/(admin)/dashboard/hotels/[hotelId]/edit",
    "app/(admin)/dashboard/hotels/[hotelId]/branches",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/new",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/[branchId]",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/[branchId]/edit",

    "app/(admin)/dashboard/room-types",
    "app/(admin)/dashboard/room-types/new",
    "app/(admin)/dashboard/room-types/[roomTypeId]/edit",

    "app/(admin)/dashboard/rooms",
    "app/(admin)/dashboard/rooms/new",
    "app/(admin)/dashboard/rooms/[roomId]",

    "app/(admin)/dashboard/reservations",
    "app/(admin)/dashboard/reservations/new",
    "app/(admin)/dashboard/reservations/calendar",
    "app/(admin)/dashboard/reservations/[reservationId]",

    "app/(admin)/dashboard/guests",
    "app/(admin)/dashboard/guests/[guestId]",

    "app/(admin)/dashboard/pricing/rate-plans",
    "app/(admin)/dashboard/inventory",
    "app/(admin)/dashboard/availability",
    "app/(admin)/dashboard/housekeeping",
    "app/(admin)/dashboard/maintenance",
    "app/(admin)/dashboard/payments",
    "app/(admin)/dashboard/invoices",
    "app/(admin)/dashboard/promotions",
    "app/(admin)/dashboard/reviews",
    "app/(admin)/dashboard/reports",
    "app/(admin)/dashboard/staff",
    "app/(admin)/dashboard/integrations",

    "app/(admin)/dashboard/settings/profile",
    "app/(admin)/dashboard/settings/users",
    "app/(admin)/dashboard/settings/billing",

    "app/(storefront)/hotels/[hotelSlug]",
    "app/(storefront)/search",
    "app/(storefront)/rooms/[roomTypeId]",

    "app/(storefront)/booking/checkout",
    "app/(storefront)/booking/confirmation",
    "app/(storefront)/booking/[bookingReference]",

    "app/(storefront)/account/login",
    "app/(storefront)/account/register",
    "app/(storefront)/account/bookings",
    "app/(storefront)/account/profile",

    "app/(storefront)/about",
    "app/(storefront)/contact",
    "app/(storefront)/terms",
    "app/(storefront)/privacy",

    "components/ui",
    "components/admin",
    "components/hotels",
    "components/branches",
    "components/rooms",
    "components/reservations",
    "components/guests",
    "components/booking",
    "components/storefront",

    "hooks",
    "lib",
    "providers",
    "stores",
    "types"
)

foreach ($directory in $directories) {
    $path = Join-Path $root $directory
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

# Create files
$files = @(
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
    "app/not-found.tsx",
    "app/error.tsx",
    "app/loading.tsx",

    "app/(auth)/login/page.tsx",
    "app/(auth)/register/page.tsx",
    "app/(auth)/forgot-password/page.tsx",
    "app/(auth)/reset-password/page.tsx",
    "app/(auth)/verify-email/page.tsx",

    "app/(admin)/dashboard/layout.tsx",
    "app/(admin)/dashboard/page.tsx",

    "app/(admin)/dashboard/hotels/page.tsx",
    "app/(admin)/dashboard/hotels/new/page.tsx",
    "app/(admin)/dashboard/hotels/[hotelId]/page.tsx",
    "app/(admin)/dashboard/hotels/[hotelId]/edit/page.tsx",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/page.tsx",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/new/page.tsx",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/[branchId]/page.tsx",
    "app/(admin)/dashboard/hotels/[hotelId]/branches/[branchId]/edit/page.tsx",

    "app/(admin)/dashboard/room-types/page.tsx",
    "app/(admin)/dashboard/room-types/new/page.tsx",
    "app/(admin)/dashboard/room-types/[roomTypeId]/edit/page.tsx",

    "app/(admin)/dashboard/rooms/page.tsx",
    "app/(admin)/dashboard/rooms/new/page.tsx",
    "app/(admin)/dashboard/rooms/[roomId]/page.tsx",

    "app/(admin)/dashboard/reservations/page.tsx",
    "app/(admin)/dashboard/reservations/new/page.tsx",
    "app/(admin)/dashboard/reservations/calendar/page.tsx",
    "app/(admin)/dashboard/reservations/[reservationId]/page.tsx",

    "app/(admin)/dashboard/guests/page.tsx",
    "app/(admin)/dashboard/guests/[guestId]/page.tsx",

    "app/(admin)/dashboard/pricing/page.tsx",
    "app/(admin)/dashboard/pricing/rate-plans/page.tsx",

    "app/(admin)/dashboard/inventory/page.tsx",
    "app/(admin)/dashboard/availability/page.tsx",
    "app/(admin)/dashboard/housekeeping/page.tsx",
    "app/(admin)/dashboard/maintenance/page.tsx",
    "app/(admin)/dashboard/payments/page.tsx",
    "app/(admin)/dashboard/invoices/page.tsx",
    "app/(admin)/dashboard/promotions/page.tsx",
    "app/(admin)/dashboard/reviews/page.tsx",
    "app/(admin)/dashboard/reports/page.tsx",
    "app/(admin)/dashboard/staff/page.tsx",
    "app/(admin)/dashboard/integrations/page.tsx",

    "app/(admin)/dashboard/settings/page.tsx",
    "app/(admin)/dashboard/settings/profile/page.tsx",
    "app/(admin)/dashboard/settings/users/page.tsx",
    "app/(admin)/dashboard/settings/billing/page.tsx",

    "app/(storefront)/hotels/page.tsx",
    "app/(storefront)/hotels/[hotelSlug]/page.tsx",
    "app/(storefront)/search/page.tsx",
    "app/(storefront)/rooms/[roomTypeId]/page.tsx",

    "app/(storefront)/booking/page.tsx",
    "app/(storefront)/booking/checkout/page.tsx",
    "app/(storefront)/booking/confirmation/page.tsx",
    "app/(storefront)/booking/[bookingReference]/page.tsx",

    "app/(storefront)/account/page.tsx",
    "app/(storefront)/account/login/page.tsx",
    "app/(storefront)/account/register/page.tsx",
    "app/(storefront)/account/bookings/page.tsx",
    "app/(storefront)/account/profile/page.tsx",

    "app/(storefront)/about/page.tsx",
    "app/(storefront)/contact/page.tsx",
    "app/(storefront)/terms/page.tsx",
    "app/(storefront)/privacy/page.tsx",

    "components/ui/button.tsx",
    "components/ui/input.tsx",
    "components/ui/select.tsx",
    "components/ui/textarea.tsx",
    "components/ui/modal.tsx",
    "components/ui/dialog.tsx",
    "components/ui/dropdown.tsx",
    "components/ui/badge.tsx",
    "components/ui/table.tsx",
    "components/ui/pagination.tsx",
    "components/ui/skeleton.tsx",
    "components/ui/empty-state.tsx",

    "components/admin/sidebar.tsx",
    "components/admin/header.tsx",
    "components/admin/dashboard-layout.tsx",
    "components/admin/tenant-switcher.tsx",
    "components/admin/hotel-selector.tsx",

    "components/hotels/hotel-card.tsx",
    "components/hotels/hotel-form.tsx",
    "components/hotels/hotel-table.tsx",

    "components/branches/branch-card.tsx",
    "components/branches/branch-form.tsx",
    "components/branches/branch-table.tsx",

    "components/storefront/navbar.tsx",
    "components/storefront/footer.tsx",
    "components/storefront/hotel-search.tsx",
    "components/storefront/room-card.tsx",
    "components/storefront/booking-summary.tsx",
    "components/storefront/date-range-picker.tsx",

    "hooks/use-auth.ts",
    "hooks/use-tenant.ts",
    "hooks/use-hotels.ts",
    "hooks/use-branches.ts",
    "hooks/use-reservations.ts",
    "hooks/use-debounce.ts",

    "lib/api.ts",
    "lib/auth.ts",
    "lib/hotel-types.ts",
    "lib/validation.ts",
    "lib/format-date.ts",
    "lib/format-currency.ts",
    "lib/utils.ts",

    "providers/app-provider.tsx",
    "providers/auth-provider.tsx",
    "providers/tenant-provider.tsx",
    "providers/query-provider.tsx",

    "stores/auth.store.ts",
    "stores/tenant.store.ts",
    "stores/booking.store.ts",

    "types/api.types.ts",
    "types/auth.types.ts",
    "types/hotel.types.ts",
    "types/booking.types.ts",
    "types/user.types.ts"
)

$created = 0
$skipped = 0

foreach ($file in $files) {
    $path = Join-Path $root $file

    if (-not (Test-Path $path)) {
        New-Item -ItemType File -Path $path -Force | Out-Null
        $created++
    }
    else {
        $skipped++
    }
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " bookingRooms Web Structure Ready" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Created files: $created" -ForegroundColor Green
Write-Host "Existing files preserved: $skipped" -ForegroundColor Yellow
Write-Host "Location: $root" -ForegroundColor Cyan
