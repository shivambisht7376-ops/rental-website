import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { inr } from "@/lib/format";
import BookingForm from "@/components/BookingForm";
import AuthLink from "@/components/AuthLink";

export const revalidate = 300; // owner edits also trigger an instant refresh

async function load() {
  try {
    const [vehicles, packages, reviews, routes] = await Promise.all([
      db.vehicle.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { perKm: "asc" }] }),
      db.package.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
      db.review.findMany({ where: { visible: true }, take: 6 }),
      db.route.findMany({ where: { active: true }, orderBy: { from: "asc" }, include: { fares: true } }),
    ]);
    return { vehicles, packages, reviews, routes };
  } catch {
    return { vehicles: [], packages: [], reviews: [], routes: [] };
  }
}

const services = [
  ["🛣️", "Intercity / Outstation", "One-way and round trips"],
  ["✈️", "Airport Transfers", "On-time pickups and drops, 24/7"],
  ["⏱️", "Local Hourly Rentals", "Hourly and full-day packages"],
  ["🏢", "Corporate Travel", "Dedicated vehicles for teams"],
  ["🧳", "Tour Packages", "Popular trips with itineraries"],
  ["🚆", "Station Transfers", "Hassle-free station pickups"],
];
const steps = [
  ["1", "Send a request", "Fill the form with your route, date and vehicle."],
  ["2", "We confirm", "Our team checks availability and confirms your fare."],
  ["3", "Travel comfortably", "Get your Booking ID and a verified driver."],
];
const faqs = [
  ["How do I book?", "Send a request using the form. Your booking is confirmed only after our team replies with the fare and your Booking ID."],
  ["Are there hidden charges?", "No. Your confirmed fare is agreed before the trip. Extra km, waiting and night charges are shown with each vehicle."],
  ["How will you contact me?", "We will message or call you on the mobile number you provide."],
];

export default async function Home() {
  const [{ vehicles, packages, reviews, routes }, s] = await Promise.all([load(), getSettings()]);
  const vname = (id) => vehicles.find((v) => v.id === id)?.name;
  return (
    <main>
      {s.bannerNotice && <div className="bg-[#3E0516] text-white text-center text-sm py-2 px-4">{s.bannerNotice}</div>}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-bold text-xl text-[#c41e5b]">{s.businessName}</a>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#services" className="hover:text-[#c41e5b]">Services</a>
            <a href="#fleet" className="hover:text-[#c41e5b]">Fleet</a>
            {routes.length > 0 && <a href="#routes" className="hover:text-[#c41e5b]">Routes</a>}
            {packages.length > 0 && <a href="#packages" className="hover:text-[#c41e5b]">Packages</a>}
            <a href="#faq" className="hover:text-[#c41e5b]">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <AuthLink />
            <a href={`tel:+${s.phone}`} className="btn-primary rounded-full px-5 py-2 text-sm">Call Now</a>
          </div>
        </div>
      </header>

      <section className="hero-bg relative" style={s.bannerImage ? { backgroundImage: `linear-gradient(rgba(60,5,24,.78),rgba(60,5,24,.78)), url(${s.bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <span className="inline-block bg-white/15 border border-white/30 rounded-full px-4 py-1 text-xs font-semibold mb-5">● Open 24/7 · Verified drivers</span>
            <h1 className="font-bold leading-[1.06] mb-5" style={{ fontSize: "clamp(2rem,4.2vw,3.75rem)", letterSpacing: "-.035em" }}>{s.tagline}</h1>
            <p className="text-white/80 max-w-lg mb-6">{s.heroText}</p>
            <ul className="grid sm:grid-cols-3 gap-3 text-sm">
              {["Transparent pricing", "Verified drivers", "Confirmed by our team"].map((t) => (
                <li key={t} className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 backdrop-blur">✔ {t}</li>
              ))}
            </ul>
          </div>
          <BookingForm vehicles={vehicles} />
        </div>
      </section>

      <section id="services" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12"><span className="section-tag">Services</span><h2 className="text-3xl sm:text-4xl font-bold">Rides for Every Occasion</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(([i, t, d]) => (
              <div key={t} className="card p-6"><div className="w-14 h-14 rounded-2xl bg-pink-100 grid place-items-center text-2xl mb-4">{i}</div><h3 className="font-semibold text-lg mb-1">{t}</h3><p className="text-gray-600 text-sm">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="section-tag">How it works</span><h2 className="text-3xl sm:text-4xl font-bold mb-12">Book in 3 Easy Steps</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(([n, t, d]) => (
              <div key={n} className="card p-6"><div className="w-12 h-12 mx-auto rounded-full btn-primary grid place-items-center mb-4">{n}</div><h3 className="font-bold text-lg mb-1">{t}</h3><p className="text-gray-600 text-sm">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="fleet" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12"><span className="section-tag">Fleet</span><h2 className="text-3xl sm:text-4xl font-bold">Choose Your Ride</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vehicles.map((v) => (
              <div key={v.id} className="card overflow-hidden">
                {v.imageUrl
                  ? <img src={v.imageUrl} alt={v.name} loading="lazy" className="h-40 w-full object-cover" />
                  : <div className="h-40 bg-gradient-to-br from-pink-50 to-pink-200 grid place-items-center text-6xl">🚗</div>}
                <div className="p-5">
                  <h3 className="font-bold">{v.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{v.category} · {v.seats} seats</p>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${v.ac ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>{v.ac ? "AC" : "Non-AC"}</span>
                  {v.specs && <p className="text-xs text-gray-500 mt-2">{v.specs}</p>}
                  <p className="text-[#c41e5b] font-bold mt-3">{inr(v.perKm)}/km</p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {v.hourly8 > 0 && <li>8hr local package: {inr(v.hourly8)}</li>}
                    {v.extraKm > 0 && <li>Extra km: {inr(v.extraKm)}/km</li>}
                    {v.waitingPerHr > 0 && <li>Waiting: {inr(v.waitingPerHr)}/hr</li>}
                    {v.nightCharge > 0 && <li>Night charge: {inr(v.nightCharge)}</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {routes.length > 0 && (
        <section id="routes" className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10"><span className="section-tag">Fixed fares</span><h2 className="text-3xl sm:text-4xl font-bold">Popular Routes</h2></div>
            <div className="grid sm:grid-cols-2 gap-4">
              {routes.map((r) => (
                <div key={r.id} className="card p-5">
                  <p className="font-bold">{r.from} → {r.to}{r.distanceKm ? <span className="text-xs text-gray-500 font-normal"> · {r.distanceKm} km</span> : null}</p>
                  <ul className="text-sm mt-2 space-y-1">
                    {r.fares.filter((f) => vname(f.vehicleId)).map((f) => (
                      <li key={f.id} className="flex justify-between"><span className="text-gray-600">{vname(f.vehicleId)}</span><b className="text-[#c41e5b]">{inr(f.fare)}</b></li>
                    ))}
                  </ul>
                  {r.note && <p className="text-xs text-gray-500 mt-2">{r.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {packages.length > 0 && (
        <section id="packages" className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12"><span className="section-tag">Packages</span><h2 className="text-3xl sm:text-4xl font-bold">Popular Tour Packages</h2></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((p) => (
                <div key={p.id} className="card overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-44 w-full object-cover" /> : <div className="h-44 bg-gradient-to-br from-[#9E1242] to-[#e44177]" />}
                  <div className="p-5">
                    <h3 className="font-bold text-lg">{p.title}</h3>
                    {p.duration && <p className="text-xs text-gray-500">{p.duration}</p>}
                    <p className="text-sm text-gray-600 my-2">{p.summary}</p>
                    {p.itinerary && (
                      <details className="text-sm mb-2"><summary className="cursor-pointer text-[#c41e5b] font-semibold">View itinerary</summary><p className="whitespace-pre-line text-gray-600 mt-2">{p.itinerary}</p></details>
                    )}
                    <p className="text-[#c41e5b] font-bold">From {inr(p.priceFrom)}</p>
                    <a href="#book" className="inline-block mt-3 text-sm font-semibold btn-primary rounded-full px-5 py-2">Request this package</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="py-16 sm:py-20 text-white" style={{ background: "linear-gradient(135deg,#0e0409,#1e0818,#0e0409)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">What Travellers Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6"><div className="text-yellow-400 mb-2">{"★".repeat(r.rating)}</div><p className="text-white/80 text-sm mb-3">“{r.text}”</p><p className="font-semibold text-sm">{r.name}</p></div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="faq" className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          {faqs.map(([q, a]) => (
            <details key={q} className="card mb-3 p-5"><summary className="font-semibold cursor-pointer">{q}</summary><p className="text-gray-600 text-sm mt-3">{a}</p></details>
          ))}
        </div>
      </section>

      <footer className="hero-bg text-white py-10 text-center text-sm px-4">
        <p className="font-bold text-lg mb-3">Ready to travel? Send a request in under 60 seconds.</p>
        <a href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hello, I would like to book a cab.")}`} className="inline-block bg-white text-[#8b1a2e] font-semibold rounded-full px-6 py-2">Chat on WhatsApp</a>
        <p className="mt-5 text-white/80">📞 +{s.phone}{s.email ? ` · ✉ ${s.email}` : ""}</p>
        {s.address && <p className="text-white/70">{s.address}</p>}
        <p className="mt-6 text-white/60">© {new Date().getFullYear()} {s.businessName}</p>
      </footer>

      <a href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hello, I would like to book a cab.")}`} aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-green-500 text-white grid place-items-center text-2xl shadow-lg">💬</a>
    </main>
  );
}
