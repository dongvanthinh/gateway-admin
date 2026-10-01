import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateClientEdit } from '../src/utils/merchant-client-edit.ts';

const valid = {
  name: 'Kênh cửa hàng',
  allowedIps: ['192.0.2.10/32', '2001:db8::/64'],
  webhookUrl: 'https://merchant.example.invalid/webhooks/payments',
};
test('Ba trường mutable hợp lệ; ACTIVE cần IP và webhook', () => {
  assert.deepEqual(validateClientEdit(valid, true, valid.webhookUrl), {});
  assert.ok(validateClientEdit({ ...valid, allowedIps: null }, true, valid.webhookUrl).allowedIps);
  assert.ok(validateClientEdit({ ...valid, allowedIps: [] }, true, valid.webhookUrl).allowedIps);
  assert.ok(validateClientEdit({ ...valid, webhookUrl: '' }, true, valid.webhookUrl).webhookUrl);
});
test('Client chưa có webhook có thể giữ nguyên null; URL đã có không được xóa', () => {
  assert.deepEqual(
    validateClientEdit({ ...valid, allowedIps: null, webhookUrl: '' }, false, null),
    {}
  );
  assert.ok(validateClientEdit({ ...valid, webhookUrl: '' }, false, valid.webhookUrl).webhookUrl);
});
test('Từ chối tên sai, IP sai hoặc CIDR /0', () => {
  for (const name of ['', ' tên', 'tên ', 'a'.repeat(257), 'tên\nclient'])
    assert.ok(validateClientEdit({ ...valid, name }, false, null).name);
  for (const ip of [
    '999.1.1.1',
    '192.0.2.1/0',
    '::/0',
    '192.0.2.1/33',
    '2001:db8::/129',
    '192.0.2.1/24/2',
  ])
    assert.ok(validateClientEdit({ ...valid, allowedIps: [ip] }, false, null).allowedIps);
});
test('Webhook HTTPS không userinfo/query/fragment', () => {
  for (const webhookUrl of [
    'http://example.invalid',
    'https://user:pass@example.invalid',
    'https://example.invalid?a=b',
    'https://example.invalid#anchor',
  ])
    assert.ok(validateClientEdit({ ...valid, webhookUrl }, false, null).webhookUrl);
});
