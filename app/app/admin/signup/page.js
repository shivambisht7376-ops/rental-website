import Link from "next/link";
import { db } from "@/lib/db";
import { adminSignup } from "../../auth-actions";
import { GoogleButton, ERRORS } from "@/components/auth-ui";

export const dynamic = "force-dynamic";

export default async function AdminSignup({ searchParams }) {
  const err = ERRORS[searchParams?.error] || (searchParams?.error === "invalid" ? "Please check your email." : null);
  let adminCount = 0;
  try {
    adminCount = await db.admin.count();
  } catch (e) {
    console.error("Database check failed:", e);
  }
  const isFirstAdmin = adminCount === 0;

  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">{isFirstAdmin ? "Initial Owner Setup" : "Owner Sign-Up"}</h1>
        <p className="text-sm text-gray-500 -mt-2">
          {isFirstAdmin
            ? "Create the primary administrator credentials to manage your website."
            : "You need the invite code from the website owner."}
        </p>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <form action={adminSignup} className="space-y-3">
          {!isFirstAdmin && (
            <input name="code" type="password" required placeholder="Invite code" className="form-field" />
          )}
          <input name="email" type="email" required placeholder="Owner Email" className="form-field" />
          <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className="form-field" />
          <button className="btn-primary w-full rounded-xl py-3">
            {isFirstAdmin ? "Complete Initial Setup" : "Create owner account"}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center">Google sign-in works for approved owner emails only.</p>
        <GoogleButton role="admin" label="Owner login with Google" />
        <Link href="/admin/login" className="block text-center text-sm text-gray-500">Back to login</Link>
      </div>
    </div>
  );
}
