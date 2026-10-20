import { db } from "@/lib/db";
import { PageTitle, Field, Empty } from "@/components/admin-ui";
import { saveRoute, deleteRoute } from "../actions";

export const dynamic = "force-dynamic";

function RouteForm({ r, vehicles }) {
  const fareOf = (vid) => r?.fares.find((f) => f.vehicleId === vid)?.fare ?? "";
  return (
    <form action={saveRoute} className="space-y-3">
      <input type="hidden" name="id" value={r?.id || ""} />
      <div className="grid sm:grid-cols-4 gap-3">
        <Field label="From *"><input name="from" required defaultValue={r?.from} className="form-field" placeholder="Pune" /></Field>
        <Field label="To *"><input name="to" required defaultValue={r?.to} className="form-field" placeholder="Mumbai" /></Field>
        <Field label="Distance (km)"><input name="distanceKm" type="number" min="0" defaultValue={r?.distanceKm ?? ""} className="form-field" /></Field>
        <Field label="Show on website?">
          <select name="active" defaultValue={r?.active === false ? "no" : "yes"} className="form-field"><option value="yes">Yes</option><option value="no">No</option></select>
        </Field>
      </div>
      <Field label="Note (tolls, stops, etc.)"><input name="note" defaultValue={r?.note || ""} className="form-field" /></Field>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Fixed fare per vehicle (₹). Leave empty if not offered.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {vehicles.map((v) => (
            <Field key={v.id} label={v.name}><input name={`fare_${v.id}`} type="number" min="0" defaultValue={fareOf(v.id)} className="form-field" /></Field>
          ))}
        </div>
      </div>
      <button className="btn-primary rounded-xl px-6 py-2.5 text-sm">{r ? "Save changes" : "Add route"}</button>
    </form>
  );
}

export default async function Routes() {
  const [routes, vehicles] = await Promise.all([
    db.route.findMany({ orderBy: { from: "asc" }, include: { fares: true } }),
    db.vehicle.findMany({ where: { active: true }, orderBy: { perKm: "asc" } }),
  ]);
  return (
    <>
      <PageTitle title="Manage Routes and Prices" hint="Set a fixed fare for each route and vehicle. Per-km rates and extra charges are in Vehicles. Changing prices here never changes old bookings." />
      {vehicles.length === 0 && <Empty>Add a vehicle first, then you can set route fares.</Empty>}
      <details className="bg-white rounded-2xl border p-5 mb-5" open={routes.length === 0}>
        <summary className="font-bold cursor-pointer">➕ Add a new route</summary>
        <div className="mt-4"><RouteForm vehicles={vehicles} /></div>
      </details>
      <div className="space-y-3">
        {routes.map((r) => (
          <details key={r.id} className="bg-white rounded-2xl border p-4">
            <summary className="cursor-pointer flex flex-wrap items-center gap-3">
              <span className="font-semibold">{r.from} → {r.to}</span>
              <span className="text-sm text-gray-500">{r.fares.length} fare{r.fares.length === 1 ? "" : "s"} set{r.distanceKm ? ` · ${r.distanceKm} km` : ""}</span>
              {!r.active && <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">Hidden</span>}
            </summary>
            <div className="mt-4"><RouteForm r={r} vehicles={vehicles} /></div>
            <form action={deleteRoute} className="mt-3"><input type="hidden" name="id" value={r.id} /><button className="text-sm text-red-600">Delete this route</button></form>
          </details>
        ))}
      </div>
    </>
  );
}
