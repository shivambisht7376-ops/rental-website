const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  await db.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: await bcrypt.hash(password, 10) },
  });

  if ((await db.vehicle.count()) === 0) {
    await db.vehicle.createMany({
      data: [
        { name: "Swift Dzire / Aura", category: "Sedan", seats: 4, perKm: 12, hourly8: 1800 },
        { name: "Ertiga", category: "SUV", seats: 6, perKm: 15, hourly8: 2400 },
        { name: "Innova Crysta", category: "Premium SUV", seats: 7, perKm: 20, hourly8: 3200 },
        { name: "Tempo Traveller", category: "Tempo", seats: 13, perKm: 28, hourly8: 4500 },
      ],
    });
    await db.package.createMany({
      data: [
        { title: "Shirdi Round Trip", summary: "Pune to Shirdi and back, darshan-friendly timing", priceFrom: 6500 },
        { title: "Lonavala Day Trip", summary: "Scenic day outing with sightseeing stops", priceFrom: 3200 },
        { title: "Mahabaleshwar Trip", summary: "Hill station weekend getaway", priceFrom: 7500 },
      ],
    });
    await db.review.createMany({
      data: [
        { name: "Rohit S.", rating: 5, text: "On-time pickup and a very polite driver. Transparent pricing." },
        { name: "Anita K.", rating: 5, text: "Smooth airport transfer at 4 AM. Highly recommended." },
      ],
    });
  }
  console.log("Seeded. Admin:", email);
}
main().finally(() => db.$disconnect());
