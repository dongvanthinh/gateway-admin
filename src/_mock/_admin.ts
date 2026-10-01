export type MerchantLifecycleState = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export type MerchantDemo = {
  id: string;
  displayName: string;
  lifecycleState: MerchantLifecycleState;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export const merchantLifecycleOptions = [
  { value: 'ONBOARDING', label: 'Đang khởi tạo' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'SUSPENDED', label: 'Tạm dừng' },
  { value: 'CLOSED', label: 'Đã đóng' },
] as const;

export const merchantLifecycleLabels: Record<MerchantLifecycleState, string> = {
  ONBOARDING: 'Đang khởi tạo',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm dừng',
  CLOSED: 'Đã đóng',
};

export const merchantLifecycleColors = {
  ONBOARDING: 'info',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CLOSED: 'default',
} as const;

export const _adminMerchants: MerchantDemo[] = [
  {
    id: 'mrc_demo_0001',
    displayName: 'An Nhiên',
    lifecycleState: 'ACTIVE',
    version: 3,
    createdAt: '2026-07-01T02:00:00.000Z',
    updatedAt: '2026-09-01T03:00:00.000Z',
  },
  {
    id: 'mrc_demo_0002',
    displayName: 'Bách Hóa Xanh',
    lifecycleState: 'ONBOARDING',
    version: 1,
    createdAt: '2026-07-04T02:00:00.000Z',
    updatedAt: '2026-09-03T04:30:00.000Z',
  },
  {
    id: 'mrc_demo_0003',
    displayName: 'Cà Phê Việt',
    lifecycleState: 'SUSPENDED',
    version: 5,
    createdAt: '2026-07-08T02:00:00.000Z',
    updatedAt: '2026-09-05T01:15:00.000Z',
  },
  {
    id: 'mrc_demo_0004',
    displayName: 'Minh An',
    lifecycleState: 'CLOSED',
    version: 7,
    createdAt: '2026-07-12T02:00:00.000Z',
    updatedAt: '2026-09-08T05:45:00.000Z',
  },
  {
    id: 'mrc_demo_0005',
    displayName: 'Phương Nam',
    lifecycleState: 'ACTIVE',
    version: 2,
    createdAt: '2026-07-16T02:00:00.000Z',
    updatedAt: '2026-09-10T02:20:00.000Z',
  },
  {
    id: 'mrc_demo_0006',
    displayName: 'Thanh Bình',
    lifecycleState: 'ACTIVE',
    version: 4,
    createdAt: '2026-07-20T02:00:00.000Z',
    updatedAt: '2026-09-12T06:10:00.000Z',
  },
];

export type MerchantClientLifecycleState = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export type MerchantClientDemo = {
  id: string;
  merchantId: string;
  name: string;
  lifecycleState: MerchantClientLifecycleState;
  mtlsFingerprintSha256: string;
  requestKeyFingerprintSha256: string;
  profileVersion: 'P0_MERCHANT_API_V1';
  validFrom: string;
  validUntil: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export const merchantClientLifecycleOptions = [
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'SUSPENDED', label: 'Tạm dừng' },
  { value: 'REVOKED', label: 'Đã thu hồi' },
] as const;

export const merchantClientLifecycleLabels: Record<MerchantClientLifecycleState, string> = {
  PENDING: 'Đang chờ',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm dừng',
  REVOKED: 'Đã thu hồi',
};

export const merchantClientLifecycleColors = {
  PENDING: 'info',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  REVOKED: 'default',
} as const;

export const _adminMerchantClients: MerchantClientDemo[] = [
  {
    id: 'mcl_demo_0001',
    merchantId: 'mrc_demo_0001',
    name: 'Kênh thanh toán cửa hàng',
    lifecycleState: 'ACTIVE',
    mtlsFingerprintSha256: 'a'.repeat(64),
    requestKeyFingerprintSha256: 'b'.repeat(64),
    profileVersion: 'P0_MERCHANT_API_V1',
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: null,
    version: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T03:00:00.000Z',
  },
  {
    id: 'mcl_demo_0002',
    merchantId: 'mrc_demo_0001',
    name: 'POS chuỗi cửa hàng',
    lifecycleState: 'ACTIVE',
    mtlsFingerprintSha256: 'c'.repeat(64),
    requestKeyFingerprintSha256: 'd'.repeat(64),
    profileVersion: 'P0_MERCHANT_API_V1',
    validFrom: '2026-07-01T00:00:00.000Z',
    validUntil: '2027-07-01T00:00:00.000Z',
    version: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-08-19T04:30:00.000Z',
  },
  {
    id: 'mcl_demo_0003',
    merchantId: 'mrc_demo_0001',
    name: 'Kết nối môi trường thử nghiệm',
    lifecycleState: 'PENDING',
    mtlsFingerprintSha256: 'e'.repeat(64),
    requestKeyFingerprintSha256: 'f'.repeat(64),
    profileVersion: 'P0_MERCHANT_API_V1',
    validFrom: '2026-10-01T00:00:00.000Z',
    validUntil: '2027-10-01T00:00:00.000Z',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-18T02:15:00.000Z',
  },
  {
    id: 'mcl_demo_0004',
    merchantId: 'mrc_demo_0001',
    name: 'Kênh báo cáo nội bộ',
    lifecycleState: 'SUSPENDED',
    mtlsFingerprintSha256: '1'.repeat(64),
    requestKeyFingerprintSha256: '2'.repeat(64),
    profileVersion: 'P0_MERCHANT_API_V1',
    validFrom: '2026-02-01T00:00:00.000Z',
    validUntil: '2026-10-05T00:00:00.000Z',
    version: 4,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-09-12T01:00:00.000Z',
  },
  {
    id: 'mcl_demo_0005',
    merchantId: 'mrc_demo_0001',
    name: 'Tích hợp phiên bản cũ',
    lifecycleState: 'REVOKED',
    mtlsFingerprintSha256: '3'.repeat(64),
    requestKeyFingerprintSha256: '4'.repeat(64),
    profileVersion: 'P0_MERCHANT_API_V1',
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-05-01T00:00:00.000Z',
    version: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-02T05:00:00.000Z',
  },
  {
    id: 'mcl_demo_0006',
    merchantId: 'mrc_demo_0002',
    name: 'Kênh bán hàng chính',
    lifecycleState: 'ACTIVE',
    mtlsFingerprintSha256: '5'.repeat(64),
    requestKeyFingerprintSha256: '6'.repeat(64),
    profileVersion: 'P0_MERCHANT_API_V1',
    validFrom: '2026-03-01T00:00:00.000Z',
    validUntil: null,
    version: 2,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-09-03T05:45:00.000Z',
  },
];

// Public, synthetic detail-only data. No certificate/private key or real endpoint.
export const _adminMerchantClientDetails = _adminMerchantClients.map((client) => ({
  ...client,
  requestPublicKeyBase64url: 'A'.repeat(43),
  allowedIps: client.lifecycleState === 'ACTIVE' ? ['192.0.2.10/32', '198.51.100.0/24'] : null,
  webhookUrl:
    client.lifecycleState === 'PENDING'
      ? null
      : 'https://merchant.example.invalid/webhooks/payments',
}));
