import { db } from "./db";

export const DEFAULT_SETTINGS = {
  businessName: "YourBrand Rentals",
  tagline: "Safe Journeys. Smiling Futures.",
  heroText: "Reliable cabs for outstation, airport and local travel. Transparent pricing with no hidden charges.",
  bannerImage: "",
  bannerNotice: "",
  phone: "919999999999", // country code, no +
  whatsapp: "919999999999",
  email: "",
  address: "",
};

export async function getSettings() {
  try {
    const rows = await db.setting.findMany();
    const out = { ...DEFAULT_SETTINGS };
    for (const r of rows) out[r.key] = r.value;
    return out;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
