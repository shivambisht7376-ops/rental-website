import { db } from "@/lib/db";
import { PageTitle, Field } from "@/components/admin-ui";
import ImageField from "@/components/ImageField";
import { savePackage, deletePackage } from "../actions";

export const dynamic = "force-dynamic";

function PackageForm({ p }) {
  return (
    <form action={savePackage} className="grid sm:grid-cols-2 gap-3">
      <input type="hidden" name="id" value={p?.id || ""} />
      <Field label="Package name *"><input name="title" required defaultValue={p?.title} className="form-field" /></Field>
      <Field label="Duration"><input name="duration" defaultValue={p?.duration || ""} className="form-field" placeholder="e.g. 2 days / 1 night" /></Field>
      <Field label="Starting price (₹)"><input name="priceFrom" type="number" min="0" defaultValue={p?.priceFrom ?? ""} className="form-field" /></Field>
      <Field label="Published on website?">
        <select name="published" defaultValue={p?.published === false ? "no" : "yes"} className="form-field"><option value="yes">Yes, published</option><option value="no">No, unpublished</option></select>
      </Field>
      <div className="sm:col-span-2"><Field label="Short description *"><input name="summary" required defaultValue={p?.summary} className="form-field" /></Field></div>
      <div className="sm:col-span-2"><Field label="Itinerary" hint="One line per day or stop"><textarea name="itinerary" rows={5} defaultValue={p?.itinerary || ""} className="form-field" /></Field></div>
      <div className="sm:col-span-2"><ImageField name="imageUrl" defaultValue={p?.imageUrl || ""} label="Package photo" /></div>
      <div className="sm:col-span-2"><button className="btn-primary rounded-xl px-6 py-2.5 text-sm">{p ? "Save changes" : "Add package"}</button></div>
    </form>
  );
}

export default async function Packages() {
  const list = await db.package.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
  return (
    <>
      <PageTitle title="Manage Tour Packages" hint="Unpublish a package to hide it from the website without losing it." />
      <details className="bg-white rounded-2xl border p-5 mb-5" open={list.length === 0}>
        <summary className="font-bold cursor-pointer">➕ Add a new package</summary>
        <div className="mt-4"><PackageForm /></div>
      </details>
      <div className="space-y-3">
        {list.map((p) => (
          <details key={p.id} className="bg-white rounded-2xl border p-4">
            <summary className="cursor-pointer flex items-center gap-3">
              {p.imageUrl && <img src={p.imageUrl} alt="" className="h-12 w-16 object-cover rounded-lg" />}
              <span className="font-semibold">{p.title}</span>
              <span className="text-sm text-gray-500">from ₹{p.priceFrom}</span>
              {!p.published && <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">Unpublished</span>}
            </summary>
            <div className="mt-4"><PackageForm p={p} /></div>
            <form action={deletePackage} className="mt-3"><input type="hidden" name="id" value={p.id} /><button className="text-sm text-red-600">Delete this package</button></form>
          </details>
        ))}
      </div>
    </>
  );
}
