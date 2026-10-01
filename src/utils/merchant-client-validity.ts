const WARNING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Trust validity is [valid_from, valid_until); it is not operational eligibility.
export function merchantClientValidity(
  validFrom: string,
  validUntil: string | null,
  now = Date.now()
) {
  const start = Date.parse(validFrom);
  const end = validUntil === null ? null : Date.parse(validUntil);
  if (!Number.isFinite(start) || (end !== null && (!Number.isFinite(end) || end <= start))) {
    return { label: 'Thời hạn không hợp lệ', color: 'error' } as const;
  }
  if (now < start) return { label: 'Chưa đến thời hạn', color: 'default' } as const;
  if (end === null) return { label: 'Không đặt hạn cuối', color: 'default' } as const;
  if (now >= end) return { label: 'Đã hết hạn', color: 'error' } as const;
  if (end - now <= WARNING_WINDOW_MS) return { label: 'Sắp hết hạn', color: 'warning' } as const;
  return { label: 'Trong thời hạn', color: 'success' } as const;
}
