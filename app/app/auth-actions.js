"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, createUserSession, USER_COOKIE } from "@/lib/auth";

const s = (fd, k) => (fd.get(k) ?? "").toString().trim();

/* ───────── Customers ───────── */

export async function userSignup(fd) {
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  const phone = s(fd, "phone").replace(/\D/g, "");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) redirect("/signup?error=invalid");
  if (password.length < 8) redirect("/signup?error=password");
  if (phone && !/^[6-9]\d{9}$/.test(phone)) redirect("/signup?error=phone");
  if (await db.user.findUnique({ where: { email } })) redirect("/signup?error=exists");
  const user = await db.user.create({ data: { name, email, phone: phone || null, passwordHash: await bcrypt.hash(password, 10) } });
  await createUserSession(user.id);
  redirect("/account");
}

export async function userLogin(fd) {
  const email = s(fd, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await bcrypt.compare(s(fd, "password"), user.passwordHash)))
    redirect("/login?error=invalid");
  await createUserSession(user.id);
  redirect("/account");
}

export async function userLogout() {
  cookies().delete(USER_COOKIE);
  redirect("/");
}

/* ───────── Owner sign-up (invite code required) ───────── */

export async function adminSignup(fd) {
  const code = process.env.ADMIN_SIGNUP_CODE;
  if (!code) redirect("/admin/signup?error=disabled");
  if (s(fd, "code") !== code) redirect("/admin/signup?error=code");
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect("/admin/signup?error=invalid");
  if (password.length < 8) redirect("/admin/signup?error=password");
  if (await db.admin.findUnique({ where: { email } })) redirect("/admin/signup?error=exists");
  const admin = await db.admin.create({ data: { email, passwordHash: await bcrypt.hash(password, 10) } });
  await createSession(admin.id);
  redirect("/admin");
}
