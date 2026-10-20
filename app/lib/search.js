export function searchWhere(q) {
  if (!q) return {};
  const digits = q.replace(/\D/g, "");
  const or = [
    { customerName: { contains: q, mode: "insensitive" } },
    { bookingId: { contains: q, mode: "insensitive" } },
  ];
  if (digits.length >= 3) or.push({ phone: { contains: digits } });
  return { OR: or };
}
