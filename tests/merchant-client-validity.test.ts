import assert from 'node:assert/strict';
import { test } from 'node:test';

import { merchantClientValidity } from '../src/utils/merchant-client-validity.ts';

const start = '2026-09-01T00:00:00.000Z';
const end = '2026-10-01T00:00:00.000Z';
const at = (value: string) => Date.parse(value);

test('Thời hạn: tương lai trung tính, đang trong hạn xanh, 7 ngày cuối vàng', () => {
  assert.equal(merchantClientValidity(start, end, at('2026-08-31T23:59:59Z')).color, 'default');
  assert.equal(merchantClientValidity(start, end, at(start)).color, 'success');
  assert.equal(merchantClientValidity(start, end, at('2026-09-23T23:59:59.999Z')).color, 'success');
  assert.equal(merchantClientValidity(start, end, at('2026-09-24T00:00:00Z')).color, 'warning');
  assert.equal(merchantClientValidity(start, end, at(end) - 1).color, 'warning');
});

test('Hết hạn tại đúng valid_until, không đặt hạn cuối không được gắn xanh', () => {
  assert.equal(merchantClientValidity(start, end, at(end)).color, 'error');
  assert.equal(merchantClientValidity(start, end, at(end) + 1).color, 'error');
  assert.deepEqual(merchantClientValidity(start, null, at(end)), {
    label: 'Không đặt hạn cuối',
    color: 'default',
  });
});

test('Dữ liệu thời hạn sai không được kết luận có hiệu lực', () => {
  assert.equal(merchantClientValidity('invalid', end, at(start)).color, 'error');
  assert.equal(merchantClientValidity(start, 'invalid', at(start)).color, 'error');
  assert.equal(merchantClientValidity(start, start, at(start)).color, 'error');
});
