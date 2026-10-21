import Link from "next/link";
import { userSignup } from "../auth-actions";
import { GoogleButton, ERRORS } from "@/components/auth-ui";

export const metadata = { title: "Sign up" };

export default function Signup({ searchParams }) {
  const err = ERRORS[searchParams?.error] || (searchParams?.error === "invalid" ? "Please check your details." : null);
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Create your account</h1>
        <p className="text-sm text-gray-500 -mt-2">Track your bookings and book faster next time.</p>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <GoogleButton role="user" label="Sign up with Google" />
        <p className="text-center text-xs text-gray-400">or</p>
        <form action={userSignup} className="space-y-3">
          <input name="name" required placeholder="Full name" className="form-field" />
          <input name="email" type="email" required placeholder="Email" className="form-field" />
          <input name="phone" inputMode="numeric" maxLength={10} placeholder="Mobile number (optional)" className="form-field" />
          <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className="form-field" />
          <button className="btn-primary w-full rounded-xl py-3">Sign up</button>
        </form>
        <p className="text-center text-sm text-gray-600">Already registered? <Link href="/login" className="text-[#c41e5b] font-semibold">Log in</Link></p>
      </div>
    </div>
  );
}
