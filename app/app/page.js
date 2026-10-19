import { db } from "@/lib/db";
import BookingForm from "@/components/BookingForm";

export const revalidate = 600; // ISR: cheap at 4-6k monthly users

async function load() {
  try {
    const [vehicles, packages, reviews] = await Promise.all([
      db.vehicle.findMany({ where: { active: true }, orderBy: { perKm: "asc" } }),
      db.package.findMany({ where: { active: true } }),
      db.review.findMany({ where: { visible: true }, take: 6 }),
    ]);
    return { vehicles, packages, reviews };
  } catch {
    return { vehicles: [], packages: [], reviews: [] };
  }
}

const services = [
  ["🛣️", "Outstation Cabs", "One-way and round trips across Maharashtra"],
  ["✈️", "Airport Transfers", "On-time pickups and drops, 24/7"],
  ["⏱️", "Local Hourly Rentals", "8hr/80km and 12hr/120km packages"],
  ["🏢", "Corporate Travel", "Monthly billing and dedicated vehicles"],
  ["🧳", "Tour Packages", "Shirdi, Lonavala, Mahabaleshwar and more"],
  ["🚆", "Railway Station Transfers", "Hassle-free station pickups"],
];
const steps = [
  ["1", "Enter Your Route", "Tell us pickup, drop and time."],
  ["2", "Receive Your Quote", "Get a transparent quote and WhatsApp confirmation."],
  ["3", "Travel Comfortably", "A verified driver arrives, with a reminder before pickup."],
];
const faqs = [
  ["How do I book?", "Fill the form above, call, or message us on WhatsApp. We respond within minutes."],
  ["Are there hidden charges?", "No. Tolls, taxes and driver allowance are included in the quote."],
  ["Will I get reminders?", "Yes, you receive a WhatsApp confirmation instantly and a reminder before your trip."],
];

export default async function Home() {
  const { vehicles, packages, reviews } = await load();
  const phone = process.env.NEXT_PUBLIC_PHONE || "919999999999";
  return (
    <main>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-bold text-xl text-[#c41e5b]">YourBrand<span className="text-gray-900"> Rentals</span></a>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#services" className="hover:text-[#c41e5b]">Services</a>
            <a href="#fleet" className="hover:text-[#c41e5b]">Fleet</a>
            <a href="#packages" className="hover:text-[#c41e5b]">Packages</a>
            <a href="#faq" className="hover:text-[#c41e5b]">FAQ</a>
          </nav>
          <a href={`tel:+${phone}`} className="btn-primary rounded-full px-5 py-2 text-sm">Call Now</a>
        </div>
      </header>

      <section className="hero-bg">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <span className="inline-block bg-white/15 border border-white/30 rounded-full px-4 py-1 text-xs font-semibold mb-5">● Live 24/7 · Verified drivers</span>
            <h1 className="font-bold leading-[1.06] mb-5" style={{ fontSize: "clamp(2rem,4.2vw,3.75rem)", letterSpacing: "-.035em" }}>Safe Journeys.<br />Smiling Futures.</h1>
            <p className="text-white/80 max-w-lg mb-6">Reliable cabs for outstation, airport and local travel. Transparent pricing with no hidden charges.</p>
            <ul className="grid sm:grid-cols-3 gap-3 text-sm">
              {["Transparent pricing", "Verified drivers", "WhatsApp updates"].map((t) => (
                <li key={t} className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 backdrop-blur">✔ {t}</li>
              ))}
            </ul>
          </div>
          <BookingForm vehicles={vehicles} />
        </div>
      </section>

      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12"><span className="section-tag">Services</span><h2 className="text-4xl font-bold">Rides for Every Occasion</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(([i, t, d]) => (
              <div key={t} className="card p-6"><div className="w-14 h-14 rounded-2xl bg-pink-100 grid place-items-center text-2xl mb-4">{i}</div><h3 className="font-semibold text-lg mb-1">{t}</h3><p className="text-gray-600 text-sm">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="section-tag">How it works</span><h2 className="text-4xl font-bold mb-12">Book in 3 Easy Steps</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(([n, t, d]) => (
              <div key={n} className="card p-6"><div className="w-12 h-12 mx-auto rounded-full btn-primary grid place-items-center mb-4">{n}</div><h3 className="font-bold text-lg mb-1">{t}</h3><p className="text-gray-600 text-sm">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="fleet" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12"><span className="section-tag">Fleet</span><h2 className="text-4xl font-bold">Choose Your Ride</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vehicles.map((v) => (
              <div key={v.id} className="card p-6">
                <div className="h-28 rounded-xl bg-gradient-to-br from-pink-50 to-pink-200 grid place-items-center text-5xl mb-4">🚗</div>
                <h3 className="font-bold">{v.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{v.category} · {v.seats} seats</p>
                <p className="text-[#c41e5b] font-bold">₹{v.perKm}/km</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12"><span className="section-tag">Packages</span><h2 className="text-4xl font-bold">Popular Tour Packages</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-[#9E1242] to-[#e44177]" />
                <div className="p-5"><h3 className="font-bold text-lg">{p.title}</h3><p className="text-sm text-gray-600 mb-3">{p.summary}</p><p className="text-[#c41e5b] font-bold">From ₹{p.priceFrom}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="py-20 text-white" style={{ background: "linear-gradient(135deg,#0e0409,#1e0818,#0e0409)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">What Travellers Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6"><div className="text-yellow-400 mb-2">{"★".repeat(r.rating)}</div><p className="text-white/80 text-sm mb-3">“{r.text}”</p><p className="font-semibold text-sm">{r.name}</p></div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          {faqs.map(([q, a]) => (
            <details key={q} className="card mb-3 p-5"><summary className="font-semibold cursor-pointer">{q}</summary><p className="text-gray-600 text-sm mt-3">{a}</p></details>
          ))}
        </div>
      </section>

      <footer className="hero-bg text-white py-10 text-center text-sm">
        <p className="font-bold text-lg mb-2">Book Your Next Ride in Under 60 Seconds</p>
        <a href={`https://wa.me/${phone}`} className="inline-block bg-white text-[#8b1a2e] font-semibold rounded-full px-6 py-2">Chat on WhatsApp</a>
        <p className="mt-6 text-white/60">© {new Date().getFullYear()} YourBrand Rentals</p>
      </footer>

      <a href={`https://wa.me/${phone}`} aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-green-500 text-white grid place-items-center text-2xl shadow-lg">💬</a>
    </main>
  );
}
