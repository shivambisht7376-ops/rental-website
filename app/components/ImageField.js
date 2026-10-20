"use client";
import { useState } from "react";

// Picks a photo, shrinks it in the browser, uploads it, and stores the URL in a hidden input.
export default function ImageField({ name, defaultValue = "", label = "Photo" }) {
  const [url, setUrl] = useState(defaultValue || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload failed");
      setUrl(j.url);
    } catch (x) {
      setErr(x.message || "Could not upload photo");
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input type="hidden" name={name} value={url} />
      {url && <img src={url} alt="" className="h-28 w-full max-w-xs object-cover rounded-xl border mb-2" />}
      <input type="file" accept="image/*" onChange={onFile} className="text-sm w-full" />
      {busy && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
      {url && <button type="button" onClick={() => setUrl("")} className="text-xs text-red-600 mt-1">Remove photo</button>}
    </div>
  );
}
