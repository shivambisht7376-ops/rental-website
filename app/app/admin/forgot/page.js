import { requestReset } from "../actions";

export default function Forgot({ searchParams }) {
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <form action={requestReset} className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Forgot password</h1>
        {searchParams?.sent && <p className="text-green-700 text-sm">If that email belongs to the owner account, a reset link has been sent. It is valid for 1 hour.</p>}
        {searchParams?.expired && <p className="text-red-600 text-sm">That link has expired. Please request a new one.</p>}
        <input name="email" type="email" required placeholder="Owner email" className="form-field" />
        <button className="btn-primary w-full rounded-xl py-3">Send reset link</button>
        <a href="/admin/login" className="block text-center text-sm text-gray-500">Back to login</a>
      </form>
    </div>
  );
}
