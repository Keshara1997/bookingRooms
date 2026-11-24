import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
      <main className="w-full max-w-lg rounded-2xl border bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-bold">BookingRooms</h1>
        <p className="mt-2 text-gray-600">
          Demo hotel platform — book online or manage properties in the
          dashboard.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/hotels"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white hover:bg-blue-700"
          >
            Find a hotel
          </Link>
          <Link
            href="/login"
            className="rounded-lg border px-5 py-2.5 text-center hover:bg-slate-50"
          >
            Staff login
          </Link>
        </div>
      </main>
    </div>
  );
}