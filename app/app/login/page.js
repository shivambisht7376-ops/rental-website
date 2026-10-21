import Link from "next/link";
import { userLogin } from "../auth-actions";
import { GoogleButton, ERRORS } from "@/components/auth-ui";

export const metadata = { title: "Log in" };

export default function Login({ searchParams }) {
  const err = ERRORS[searchParams?.error];
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Log in</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <GoogleButton role="user" />
        <p className="text-center text-xs text-gray-400">or</p>
        <form action={userLogin} className="space-y-3">
          <input name="email" type="email" required placeholder="Email" className="form-field" />
          <input name="password" type="password" required placeholder="Password" className="form-field" />
          <button className="btn-primary w-full rounded-xl py-3">Log in</button>
        </form>
        <p className="text-center text-sm text-gray-600">New here? <Link href="/signup" className="text-[#c41e5b] font-semibold">Create an account</Link></p>
        <Link href="/" className="block text-center text-xs text-gray-400">← Back to website</Link>
      </div>
    </div>
  );
}
