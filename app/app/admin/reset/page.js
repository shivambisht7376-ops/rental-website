import { resetPassword } from "../actions";

export default function Reset({ searchParams }) {
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <form action={resetPassword} className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Choose a new password</h1>
        {searchParams?.error && <p className="text-red-600 text-sm">Passwords must match and be at least 8 characters.</p>}
        <input type="hidden" name="token" value={searchParams?.token || ""} />
        <input name="password" type="password" required minLength={8} placeholder="New password (8+ characters)" className="form-field" />
        <input name="confirm" type="password" required minLength={8} placeholder="Repeat new password" className="form-field" />
        <button className="btn-primary w-full rounded-xl py-3">Save password</button>
      </form>
    </div>
  );
}
