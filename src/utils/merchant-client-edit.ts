import { z } from 'zod';

export type ClientEditValues = { name: string; allowedIps: string[] | null; webhookUrl: string };

export function validateClientEdit(
  values: ClientEditValues,
  active: boolean,
  originalWebhook: string | null
) {
  const errors: Partial<Record<keyof ClientEditValues, string>> = {};
  if (
    !values.name ||
    [...values.name].length > 256 ||
    values.name.trim() !== values.name ||
    [...values.name].some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    )
  ) {
    errors.name = 'Tên cần từ 1–256 ký tự, không có ký tự điều khiển hoặc khoảng trắng ở đầu/cuối.';
  }
  if (active && !values.allowedIps?.length)
    errors.allowedIps = 'Client đang hoạt động cần ít nhất một IP/CIDR.';
  if (values.allowedIps !== null) {
    if (!values.allowedIps.length)
      errors.allowedIps = 'Nhập ít nhất một IP/CIDR hoặc tắt giới hạn IP khi được phép.';
    for (const entry of values.allowedIps) {
      const [ip, prefix, extra] = entry.split('/');
      const ipv4 = z.ipv4().safeParse(ip).success;
      const ipv6 = z.ipv6().safeParse(ip).success;
      if (
        (!ipv4 && !ipv6) ||
        extra !== undefined ||
        entry.trim() !== entry ||
        (prefix !== undefined &&
          (!/^\d+$/.test(prefix) || Number(prefix) <= 0 || Number(prefix) > (ipv4 ? 32 : 128)))
      ) {
        errors.allowedIps = 'IP/CIDR không hợp lệ; không cho phép dải Internet-wide /0.';
      }
    }
  }
  if (!values.webhookUrl) {
    if (originalWebhook !== null || active)
      errors.webhookUrl = 'Không được xóa URL webhook đã có; client đang hoạt động cần webhook.';
  } else {
    try {
      const url = new URL(values.webhookUrl);
      if (
        values.webhookUrl.trim() !== values.webhookUrl ||
        !values.webhookUrl.startsWith('https://') ||
        url.protocol !== 'https:' ||
        !url.hostname ||
        url.username ||
        url.password ||
        url.search ||
        values.webhookUrl.includes('#')
      )
        throw new Error('invalid');
    } catch {
      errors.webhookUrl = 'Dùng URL HTTPS tuyệt đối, không có credential, query hoặc fragment.';
    }
  }
  return errors;
}
