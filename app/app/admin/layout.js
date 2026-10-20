import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import NewAlert from "@/components/NewAlert";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Dashboard" };

const NAV = [
  ["/admin", "New Booking Requests"],
  ["/admin/upcoming", "Upcoming Trips"],
  ["/admin/bookings", "All Bookings"],
  ["/admin/customers", "Customer Records"],
  ["/admin/routes", "Routes & Prices"],
  ["/admin/vehicles", "Vehicles"],
  ["/admin/packages", "Tour Packages"],
  ["/admin/payments", "Payment Records"],
  ["/admin/history", "Booking History"],
  ["/admin/settings", "Website & Settings"],
];

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) return <>{children}</>; // login / forgot / reset pages

  const newCount = await db.booking.count({ where: { status: "NEW" } });
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <b className="text-[#c41e5b]">Owner Dashboard</b>
          <div className="flex items-center gap-4">
            <NewAlert initial={newCount} />
            <Link href="/" className="text-sm text-gray-500">View website</Link>
            <LogoutButton />
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2 text-sm whitespace-nowrap">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="px-3 py-1.5 rounded-full border bg-white hover:bg-pink-50 hover:text-[#c41e5b]">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
