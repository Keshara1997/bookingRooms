import Link from "next/link";

const shortcuts = [
  {
    href: "/dashboard/hotels",
    title: "Hotels",
    description: "Properties, branches, and contact details.",
  },
  {
    href: "/dashboard/reservations",
    title: "Reservations",
    description: "Bookings, arrivals, and status changes.",
  },
  {
    href: "/dashboard/guests",
    title: "Guests",
    description: "Guest profiles and stay history.",
  },
  {
    href: "/dashboard/payments",
    title: "Payments",
    description: "Charges, refunds, and online checkout.",
  },
];

export default function DashboardHomePage() {
  return (
    <main>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-500">
        Manage inventory, reservations, and payments for your organization.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}