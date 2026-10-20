"use client";
import { useState } from "react";

// Lets the owner pick a template, edit the text, then open WhatsApp with it pre-filled.
// WhatsApp opening is NOT treated as "sent"; the owner confirms with a separate button.
export default function WhatsAppBox({ bookingId, phone, messages, labels, defaultKey, sentLog, markSent }) {
  const [key, setKey] = useState(defaultKey);
  const [text, setText] = useState(messages[defaultKey]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Message type</label>
        <select
          value={key}
          onChange={(e) => { setKey(e.target.value); setText(messages[e.target.value]); }}
          className="form-field"
        >
          {Object.entries(labels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Message (you can edit it)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="form-field" />
      </div>
      <a
        href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noreferrer"
        className="block text-center rounded-xl bg-green-600 text-white font-semibold py-3"
      >
        Open WhatsApp with this message
      </a>
      <p className="text-xs text-gray-500">
        This only opens WhatsApp. You must press Send there yourself. Afterwards, tap the button below to record it.
      </p>
      <form action={markSent}>
        <input type="hidden" name="id" value={bookingId} />
        <input type="hidden" name="template" value={labels[key]} />
        <button className="w-full border rounded-xl py-2 text-sm">I sent this message. Record it</button>
      </form>
      {sentLog.length > 0 && (
        <ul className="text-xs text-gray-500 space-y-0.5">
          {sentLog.map((m) => <li key={m.id}>✔ {m.template} · marked sent {m.when}</li>)}
        </ul>
      )}
    </div>
  );
}
