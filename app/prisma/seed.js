const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  await db.admin.upsert({
    where: { email },
    update: process.env.ADMIN_RESET === "1" ? { passwordHash: await bcrypt.hash(password, 10) } : {},
    create: { email, passwordHash: await bcrypt.hash(password, 10) },
  });

  if ((await db.vehicle.count()) === 0) {
    await db.vehicle.createMany({
      data: [
        { name: "Swift Dzire / Aura", category: "Sedan", seats: 4, ac: true, perKm: 12, hourly8: 1800, extraKm: 12, waitingPerHr: 150, nightCharge: 300, specs: "2 bags, music system" },
        { name: "Ertiga", category: "SUV", seats: 6, ac: true, perKm: 15, hourly8: 2400, extraKm: 15, waitingPerHr: 200, nightCharge: 400, specs: "3 bags, extra legroom" },
        { name: "Innova Crysta", category: "Premium SUV", seats: 7, ac: true, perKm: 20, hourly8: 3200, extraKm: 20, waitingPerHr: 250, nightCharge: 500, specs: "4 bags, captain seats" },
        { name: "Tempo Traveller", category: "Tempo", seats: 13, ac: false, perKm: 28, hourly8: 4500, extraKm: 28, waitingPerHr: 300, nightCharge: 600, specs: "Push-back seats" },
      ],
    });
    await db.package.createMany({
      data: [
        { title: "Shirdi Round Trip", summary: "Pune to Shirdi and back, darshan-friendly timing", duration: "1 day", itinerary: "Early morning pickup\nShirdi darshan\nReturn by evening", priceFrom: 6500 },
        { title: "Lonavala Day Trip", summary: "Scenic day outing with sightseeing stops", duration: "1 day", itinerary: "Pickup\nTiger Point and Bhushi Dam\nReturn", priceFrom: 3200 },
        { title: "Mahabaleshwar Trip", summary: "Hill station weekend getaway", duration: "2 days / 1 night", itinerary: "Day 1: Pune to Mahabaleshwar, sightseeing\nDay 2: Panchgani and return", priceFrom: 7500 },
      ],
    });
    await db.review.createMany({
      data: [
        { name: "Rohit S.", rating: 5, text: "On-time pickup and a very polite driver. Transparent pricing." },
        { name: "Anita K.", rating: 5, text: "Smooth airport transfer at 4 AM. Highly recommended." },
      ],
    });
  }
  console.log("Seeded. Owner login:", email);
}
main().finally(() => db.$disconnect());
