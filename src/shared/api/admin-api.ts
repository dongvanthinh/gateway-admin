import type { paths, components, operations } from './generated/admin-v1';

import createClient from 'openapi-fetch';

import { CONFIG } from 'src/global-config';

const client = createClient<paths>({ baseUrl: CONFIG.serverUrl });

export type Merchant = components['schemas']['Merchant'];
export type MerchantClient = components['schemas']['MerchantClient'];
export type MerchantClientListItem = components['schemas']['MerchantClientListItem'];
export type MerchantListQuery = NonNullable<operations['listMerchants']['parameters']['query']>;
export type MerchantClientListQuery = NonNullable<
  operations['listMerchantClients']['parameters']['query']
>;
export type CreateMerchantClientInput = components['schemas']['CreateMerchantClient'];
export type UpdateMerchantInput = components['schemas']['UpdateMerchant'];
export type UpdateMerchantClientInput = components['schemas']['UpdateMerchantClient'];

export type AdminResponse<T> = {
  data: T;
  requestId: string | null;
};

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly requestId: string | null;
  readonly retryAdvice: string | null;

  constructor(
    message: string,
    details: {
      status: number;
      code: string | null;
      requestId: string | null;
      retryAdvice: string | null;
    }
  ) {
    super(message);
    this.name = 'AdminApiError';
    this.status = details.status;
    this.code = details.code;
    this.requestId = details.requestId;
    this.retryAdvice = details.retryAdvice;
  }
}

type ProblemLike = Partial<components['schemas']['Problem']> & { title?: string };

async function unwrap<T>(request: Promise<{ data?: T; error?: unknown; response: Response }>) {
  const result = await request;
  const requestId = result.response.headers.get('Request-Id');

  if (result.error !== undefined || !result.response.ok || result.data === undefined) {
    const problem = (result.error ?? {}) as ProblemLike;
    throw new AdminApiError(problem.title ?? 'Admin API không phản hồi hợp lệ.', {
      status: result.response.status,
      code: problem.code ?? null,
      requestId: problem.request_id ?? requestId,
      retryAdvice: problem.retry_advice ?? null,
    });
  }

  return { data: result.data, requestId } satisfies AdminResponse<T>;
}

export async function listMerchants(
  query: MerchantListQuery,
  signal?: AbortSignal
): Promise<AdminResponse<components['schemas']['MerchantList']>> {
  return unwrap(client.GET('/admin/v1/merchants', { params: { query }, signal }));
}

export async function listAllMerchants(
  query: Omit<MerchantListQuery, 'cursor'>,
  signal?: AbortSignal
): Promise<Merchant[]> {
  const items: Merchant[] = [];
  let cursor: string | undefined;

  do {
    const page = await listMerchants({ ...query, ...(cursor ? { cursor } : {}) }, signal);
    items.push(...page.data.items);
    cursor = page.data.next_cursor ?? undefined;
    if (items.length > 10_000) {
      throw new AdminApiError('Danh sách xuất vượt quá giới hạn 10.000 dòng.', {
        status: 413,
        code: 'export_limit_exceeded',
        requestId: page.requestId,
        retryAdvice: null,
      });
    }
  } while (cursor);

  return items;
}

export async function getMerchant(
  id: string,
  signal?: AbortSignal
): Promise<AdminResponse<Merchant>> {
  return unwrap(client.GET('/admin/v1/merchants/{id}', { params: { path: { id } }, signal }));
}

export async function createMerchant(displayName: string): Promise<AdminResponse<Merchant>> {
  return unwrap(
    client.POST('/admin/v1/merchants', {
      body: { display_name: displayName },
    })
  );
}

export async function updateMerchant(
  id: string,
  body: UpdateMerchantInput
): Promise<AdminResponse<Merchant>> {
  return unwrap(
    client.PATCH('/admin/v1/merchants/{id}', {
      params: { path: { id } },
      body,
    })
  );
}

export async function activateMerchant(
  id: string,
  expectedVersion: number,
  merchantClientId: string
): Promise<AdminResponse<Merchant>> {
  return unwrap(
    client.POST('/admin/v1/merchants/{id}/activate', {
      params: { path: { id } },
      body: { expected_version: expectedVersion, merchant_client_id: merchantClientId },
    })
  );
}

export async function suspendMerchant(
  id: string,
  expectedVersion: number
): Promise<AdminResponse<Merchant>> {
  return unwrap(
    client.POST('/admin/v1/merchants/{id}/suspend', {
      params: { path: { id } },
      body: { expected_version: expectedVersion },
    })
  );
}

export async function resumeMerchant(
  id: string,
  expectedVersion: number
): Promise<AdminResponse<Merchant>> {
  return unwrap(
    client.POST('/admin/v1/merchants/{id}/resume', {
      params: { path: { id } },
      body: { expected_version: expectedVersion },
    })
  );
}

export async function createMerchantClient(
  merchantId: string,
  body: CreateMerchantClientInput
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.POST('/admin/v1/merchants/{id}/clients', {
      params: { path: { id: merchantId } },
      body,
    })
  );
}

export async function listMerchantClients(
  merchantId: string,
  query: MerchantClientListQuery,
  signal?: AbortSignal
): Promise<AdminResponse<components['schemas']['MerchantClientList']>> {
  return unwrap(
    client.GET('/admin/v1/merchants/{id}/clients', {
      params: { path: { id: merchantId }, query },
      signal,
    })
  );
}

export async function listAllMerchantClients(
  merchantId: string,
  query: Omit<MerchantClientListQuery, 'cursor'>,
  signal?: AbortSignal
): Promise<MerchantClientListItem[]> {
  const items: MerchantClientListItem[] = [];
  let cursor: string | undefined;

  do {
    const page = await listMerchantClients(
      merchantId,
      { ...query, ...(cursor ? { cursor } : {}) },
      signal
    );
    items.push(...page.data.items);
    cursor = page.data.next_cursor ?? undefined;
    if (items.length > 10_000) {
      throw new AdminApiError('Danh sách xuất vượt quá giới hạn 10.000 dòng.', {
        status: 413,
        code: 'export_limit_exceeded',
        requestId: page.requestId,
        retryAdvice: null,
      });
    }
  } while (cursor);

  return items;
}

export async function getMerchantClient(
  id: string,
  signal?: AbortSignal
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.GET('/admin/v1/merchant-clients/{id}', { params: { path: { id } }, signal })
  );
}

export async function updateMerchantClient(
  id: string,
  body: UpdateMerchantClientInput
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.PATCH('/admin/v1/merchant-clients/{id}', {
      params: { path: { id } },
      body,
    })
  );
}

export async function activateMerchantClient(
  id: string,
  expectedVersion: number
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.POST('/admin/v1/merchant-clients/{id}/activate', {
      params: { path: { id } },
      body: { expected_version: expectedVersion },
    })
  );
}

export async function suspendMerchantClient(
  id: string,
  expectedVersion: number
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.POST('/admin/v1/merchant-clients/{id}/suspend', {
      params: { path: { id } },
      body: { expected_version: expectedVersion },
    })
  );
}

export async function resumeMerchantClient(
  id: string,
  expectedVersion: number
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.POST('/admin/v1/merchant-clients/{id}/resume', {
      params: { path: { id } },
      body: { expected_version: expectedVersion },
    })
  );
}

export async function revokeMerchantClient(
  id: string,
  expectedVersion: number
): Promise<AdminResponse<MerchantClient>> {
  return unwrap(
    client.POST('/admin/v1/merchant-clients/{id}/revoke', {
      params: { path: { id } },
      body: { expected_version: expectedVersion },
    })
  );
}
