import Link from "next/link";

import { DashboardSession } from "@/components/dashboard-session";
import { TenantSwitcher } from "@/components/tenant-switcher";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/hotels", label: "Hotels" },
  { href: "/dashboard/room-types", label: "Room types" },
  { href: "/dashboard/rooms", label: "Rooms" },
  { href: "/dashboard/reservations", label: "Reservations" },
  { href: "/dashboard/guests", label: "Guests" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/pricing", label: "Pricing" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">
            bookingRooms Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <TenantSwitcher />
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
            <Link href="/" className="text-blue-600 hover:underline">
              View site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-52 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <DashboardSession>
          <div className="min-w-0 flex-1">{children}</div>
        </DashboardSession>
      </div>
    </div>
  );
}