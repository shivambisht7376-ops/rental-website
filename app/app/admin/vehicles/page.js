import { db } from "@/lib/db";
import { PageTitle, Field } from "@/components/admin-ui";
import ImageField from "@/components/ImageField";
import { saveVehicle, deleteVehicle, saveDriver, deleteDriver } from "../actions";

export const dynamic = "force-dynamic";

function VehicleForm({ v }) {
  return (
    <form action={saveVehicle} className="grid sm:grid-cols-3 gap-3">
      <input type="hidden" name="id" value={v?.id || ""} />
      <Field label="Vehicle name *"><input name="name" required defaultValue={v?.name} className="form-field" placeholder="e.g. Swift Dzire" /></Field>
      <Field label="Type"><input name="category" defaultValue={v?.category || "Sedan"} className="form-field" placeholder="Sedan / SUV / Tempo" /></Field>
      <Field label="Seats"><input name="seats" type="number" min="1" defaultValue={v?.seats || 4} className="form-field" /></Field>
      <Field label="AC / Non-AC">
        <select name="ac" defaultValue={v?.ac === false ? "no" : "yes"} className="form-field"><option value="yes">AC</option><option value="no">Non-AC</option></select>
      </Field>
      <Field label="Rate per km (₹)"><input name="perKm" type="number" min="0" defaultValue={v?.perKm ?? ""} className="form-field" /></Field>
      <Field label="8hr / 80km local package (₹)"><input name="hourly8" type="number" min="0" defaultValue={v?.hourly8 ?? ""} className="form-field" /></Field>
      <Field label="Extra km charge (₹/km)"><input name="extraKm" type="number" min="0" defaultValue={v?.extraKm ?? ""} className="form-field" /></Field>
      <Field label="Waiting charge (₹/hour)"><input name="waitingPerHr" type="number" min="0" defaultValue={v?.waitingPerHr ?? ""} className="form-field" /></Field>
      <Field label="Night charge (₹)"><input name="nightCharge" type="number" min="0" defaultValue={v?.nightCharge ?? ""} className="form-field" /></Field>
      <div className="sm:col-span-2"><Field label="Specifications"><input name="specs" defaultValue={v?.specs || ""} className="form-field" placeholder="e.g. 2 bags, music system, charging point" /></Field></div>
      <Field label="Show on website?">
        <select name="active" defaultValue={v?.active === false ? "no" : "yes"} className="form-field"><option value="yes">Yes, show</option><option value="no">No, hide</option></select>
      </Field>
      <div className="sm:col-span-3"><ImageField name="imageUrl" defaultValue={v?.imageUrl || ""} label="Vehicle photo" /></div>
      <div className="sm:col-span-3"><button className="btn-primary rounded-xl px-6 py-2.5 text-sm">{v ? "Save changes" : "Add vehicle"}</button></div>
    </form>
  );
}

export default async function Vehicles() {
  const [vehicles, drivers] = await Promise.all([
    db.vehicle.findMany({ orderBy: [{ sortOrder: "asc" }, { perKm: "asc" }] }),
    db.driver.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageTitle title="Manage Vehicles" hint="Changes appear on the website immediately. A vehicle used in old bookings is hidden instead of deleted so history stays intact." />
      <details className="bg-white rounded-2xl border p-5 mb-5" open={vehicles.length === 0}>
        <summary className="font-bold cursor-pointer">➕ Add a new vehicle</summary>
        <div className="mt-4"><VehicleForm /></div>
      </details>
      <div className="space-y-3">
        {vehicles.map((v) => (
          <details key={v.id} className="bg-white rounded-2xl border p-4">
            <summary className="cursor-pointer flex items-center gap-3">
              {v.imageUrl ? <img src={v.imageUrl} alt="" className="h-12 w-16 object-cover rounded-lg" /> : <span className="h-12 w-16 grid place-items-center bg-pink-50 rounded-lg">🚗</span>}
              <span className="font-semibold">{v.name}</span>
              <span className="text-sm text-gray-500">{v.seats} seats · {v.ac ? "AC" : "Non-AC"} · ₹{v.perKm}/km</span>
              {!v.active && <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">Hidden</span>}
            </summary>
            <div className="mt-4"><VehicleForm v={v} /></div>
            <form action={deleteVehicle} className="mt-3"><input type="hidden" name="id" value={v.id} /><button className="text-sm text-red-600">Remove this vehicle</button></form>
          </details>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-10 mb-1">Drivers</h2>
      <p className="text-sm text-gray-500 mb-3">Add your drivers here, then assign them to bookings.</p>
      <form action={saveDriver} className="flex flex-wrap gap-2 mb-4 items-end">
        <input type="hidden" name="id" value="" />
        <div className="flex-1 min-w-[160px]"><Field label="Driver name"><input name="name" required className="form-field" /></Field></div>
        <div className="flex-1 min-w-[160px]"><Field label="Driver phone"><input name="phone" className="form-field" /></Field></div>
        <button className="btn-primary rounded-xl px-5 py-2.5 text-sm">Add driver</button>
      </form>
      <div className="space-y-2">
        {drivers.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border p-3 flex flex-wrap gap-2 items-end">
            <form action={saveDriver} className="flex flex-wrap gap-2 items-end flex-1">
              <input type="hidden" name="id" value={d.id} />
              <input name="name" defaultValue={d.name} className="form-field !w-44" />
              <input name="phone" defaultValue={d.phone || ""} className="form-field !w-44" />
              <button className="border rounded-xl px-4 py-2 text-sm">Save</button>
            </form>
            <form action={deleteDriver}><input type="hidden" name="id" value={d.id} /><button className="text-sm text-red-600 px-2 py-2">Remove</button></form>
          </div>
        ))}
      </div>
    </>
  );
}
