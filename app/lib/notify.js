// Owner notifications. Uses Resend (https://resend.com) if RESEND_API_KEY and
// OWNER_EMAIL are set; otherwise logs to the server console. The dashboard also
// shows a live "new requests" counter either way.
export async function sendEmail(to, subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) {
    console.log(`[email:dry-run] to=${to} subject=${subject}\n${text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "onboarding@resend.dev", to, subject, text }),
    });
    return res.ok;
  } catch (e) {
    console.error("email failed", e);
    return false;
  }
}

export const notifyOwner = (subject, text) => sendEmail(process.env.OWNER_EMAIL, subject, text);
