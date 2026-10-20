import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getTemplates, TEMPLATE_KEYS, VARIABLES } from "@/lib/templates";
import { PageTitle, Field } from "@/components/admin-ui";
import ImageField from "@/components/ImageField";
import { saveSettings, saveTemplate, changePassword } from "../actions";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const [s, templates, custom] = await Promise.all([getSettings(), getTemplates(), db.messageTemplate.findMany()]);
  const customKeys = new Set(custom.map((c) => c.key));
  return (
    <div className="max-w-3xl space-y-8">
      <PageTitle title="Website & Settings" hint="Change what customers see on your website. Changes go live immediately." />

      <form action={saveSettings} className="bg-white rounded-2xl border p-5 grid sm:grid-cols-2 gap-3">
        <h2 className="font-bold sm:col-span-2">Website content and contact details</h2>
        <Field label="Business name"><input name="businessName" defaultValue={s.businessName} className="form-field" /></Field>
        <Field label="Tagline (big heading)"><input name="tagline" defaultValue={s.tagline} className="form-field" /></Field>
        <div className="sm:col-span-2"><Field label="Intro text under the heading"><textarea name="heroText" rows={2} defaultValue={s.heroText} className="form-field" /></Field></div>
        <div className="sm:col-span-2"><Field label="Offer / notice bar (optional)" hint="Shown at the top of the website, e.g. “Diwali offer: 10% off outstation trips”. Leave empty to hide."><input name="bannerNotice" defaultValue={s.bannerNotice} className="form-field" /></Field></div>
        <div className="sm:col-span-2"><ImageField name="bannerImage" defaultValue={s.bannerImage} label="Banner photo (shown behind the heading)" /></div>
        <Field label="Phone number" hint="10 digits. 91 is added automatically."><input name="phone" defaultValue={s.phone} className="form-field" /></Field>
        <Field label="WhatsApp number" hint="Customers use this to message you"><input name="whatsapp" defaultValue={s.whatsapp} className="form-field" /></Field>
        <Field label="Email"><input name="email" defaultValue={s.email} className="form-field" /></Field>
        <Field label="Address"><input name="address" defaultValue={s.address} className="form-field" /></Field>
        <div className="sm:col-span-2"><button className="btn-primary rounded-xl px-6 py-2.5 text-sm">Save website settings</button></div>
      </form>

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-bold mb-1">WhatsApp message templates</h2>
        <p className="text-sm text-gray-500 mb-4">
          These pre-fill the WhatsApp message. You can still edit each message before sending. Words in curly brackets are replaced automatically:
          {" "}{VARIABLES.map((v) => <code key={v} className="bg-gray-100 rounded px-1 mx-0.5 text-xs">{`{${v}}`}</code>)}
        </p>
        <div className="space-y-5">
          {Object.entries(TEMPLATE_KEYS).map(([k, label]) => (
            <form key={k} action={saveTemplate} className="space-y-2">
              <input type="hidden" name="key" value={k} />
              <Field label={label + (customKeys.has(k) ? " (customised)" : "")}><textarea name="body" rows={5} defaultValue={templates[k]} className="form-field" /></Field>
              <div className="flex gap-2">
                <button className="btn-primary rounded-xl px-5 py-2 text-sm">Save</button>
                {customKeys.has(k) && <button name="reset" value="1" className="border rounded-xl px-5 py-2 text-sm">Restore original</button>}
              </div>
            </form>
          ))}
        </div>
      </section>

      <form action={changePassword} className="bg-white rounded-2xl border p-5 grid sm:grid-cols-2 gap-3">
        <h2 className="font-bold sm:col-span-2">Change my password</h2>
        <Field label="New password (8+ characters)"><input name="password" type="password" minLength={8} required className="form-field" /></Field>
        <Field label="Repeat new password"><input name="confirm" type="password" minLength={8} required className="form-field" /></Field>
        <div className="sm:col-span-2"><button className="btn-primary rounded-xl px-6 py-2.5 text-sm">Change password</button></div>
      </form>
    </div>
  );
}
