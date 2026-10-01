import { useBlocker } from 'react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';
import { merchantClientValidity } from 'src/utils/merchant-client-validity';
import { validateClientEdit, type ClientEditValues } from 'src/utils/merchant-client-edit';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { merchantClientLifecycleColors, merchantClientLifecycleLabels } from 'src/_mock';
import {
  getMerchant,
  AdminApiError,
  getMerchantClient,
  type MerchantClient,
  revokeMerchantClient,
  resumeMerchantClient,
  updateMerchantClient,
  suspendMerchantClient,
  activateMerchantClient,
  type UpdateMerchantClientInput,
} from 'src/shared/api/admin-api';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CopyableText } from 'src/components/copyable-text/copyable-text';

const DATE_FORMAT = 'DD/MM/YYYY HH:mm';

type MerchantClientView = {
  id: string;
  merchantId: string;
  name: string;
  lifecycleState: MerchantClient['lifecycle_state'];
  mtlsFingerprintSha256: string;
  requestKeyFingerprintSha256: string;
  requestPublicKeyBase64url: string;
  validFrom: string;
  validUntil: string | null;
  allowedIps: string[] | null;
  webhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientAction = 'activate' | 'suspend' | 'resume' | 'revoke';

function toMerchantClientView(value: MerchantClient): MerchantClientView {
  return {
    id: value.id,
    merchantId: value.merchant_id,
    name: value.name,
    lifecycleState: value.lifecycle_state,
    mtlsFingerprintSha256: value.mtls_fingerprint_sha256,
    requestKeyFingerprintSha256: value.request_key_fingerprint_sha256,
    requestPublicKeyBase64url: value.request_public_key_base64url,
    validFrom: value.valid_from,
    validUntil: value.valid_until,
    allowedIps: value.allowed_ips,
    webhookUrl: value.webhook_url,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function Field({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0, ...(fullWidth && { gridColumn: '1 / -1' }) }}>
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

function formatMutationError(error: unknown) {
  if (!(error instanceof AdminApiError)) {
    return 'Không thể lưu thay đổi. Vui lòng kiểm tra kết nối Admin API.';
  }
  const details = [error.message];
  if (error.status === 409) {
    details.push('Dữ liệu đã thay đổi; hãy tải lại rồi chỉnh sửa lại từ version mới nhất.');
  }
  if (error.status === 503 || error.retryAdvice === 'NO_AUTOMATIC_RETRY') {
    details.push('Không tự gửi lại yêu cầu; hãy đọc lại resource để xác định kết quả.');
  }
  if (error.requestId) details.push(`Mã yêu cầu: ${error.requestId}`);
  return details.join(' ');
}

export default function Page() {
  const { merchantId, clientId } = useParams();
  const merchantQuery = useQuery({
    queryKey: ['admin', 'merchant', merchantId],
    queryFn: ({ signal }) => getMerchant(merchantId!, signal),
    enabled: Boolean(merchantId),
  });
  const clientQuery = useQuery({
    queryKey: ['admin', 'merchant-client', clientId],
    queryFn: ({ signal }) => getMerchantClient(clientId!, signal),
    enabled: Boolean(clientId),
  });
  const merchant = merchantQuery.data?.data;
  const remoteClient = clientQuery.data?.data;
  // Always scope the client lookup to its parent, including direct URL access.
  const parentMismatch = Boolean(
    remoteClient && merchant && remoteClient.merchant_id !== merchant.id
  );
  const fixture = remoteClient && !parentMismatch ? toMerchantClientView(remoteClient) : undefined;
  const apiError = merchantQuery.error ?? clientQuery.error;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientEditValues>({
    name: '',
    allowedIps: null,
    webhookUrl: '',
  });
  const [ipInput, setIpInput] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const baseline = {
    name: fixture?.name ?? '',
    allowedIps: fixture?.allowedIps ?? null,
    webhookUrl: fixture?.webhookUrl ?? '',
  };
  const dirty =
    editing && (JSON.stringify(draft) !== JSON.stringify(baseline) || Boolean(ipInput.trim()));
  const errors = validateClientEdit(
    draft,
    fixture?.lifecycleState === 'ACTIVE',
    fixture?.webhookUrl ?? null
  );
  const updateMutation = useMutation({
    mutationFn: () => {
      const body: UpdateMerchantClientInput = {
        expected_version: remoteClient!.version,
        name: draft.name.trim(),
        allowed_ips: draft.allowedIps,
        ...(draft.webhookUrl.trim() ? { webhook_url: draft.webhookUrl.trim() } : {}),
      };
      return updateMerchantClient(clientId!, body);
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'merchant-client', clientId] }),
        queryClient.invalidateQueries({
          queryKey: ['admin', 'merchant-clients', merchantId],
        }),
      ]);
      setEditing(false);
      setSaved(true);
      setIpInput('');
    },
  });
  const [pendingAction, setPendingAction] = useState<ClientAction | null>(null);
  const actionMutation = useMutation({
    mutationFn: () => {
      if (!pendingAction || !clientId || !remoteClient) {
        throw new Error('Thiếu thông tin để thực hiện action MerchantClient.');
      }
      const input = { id: clientId, expectedVersion: remoteClient.version };
      if (pendingAction === 'activate')
        return activateMerchantClient(input.id, input.expectedVersion);
      if (pendingAction === 'suspend')
        return suspendMerchantClient(input.id, input.expectedVersion);
      if (pendingAction === 'resume') return resumeMerchantClient(input.id, input.expectedVersion);
      return revokeMerchantClient(input.id, input.expectedVersion);
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'merchant-client', clientId] }),
        queryClient.invalidateQueries({
          queryKey: ['admin', 'merchant-clients', merchantId],
        }),
      ]);
      setPendingAction(null);
    },
  });
  const openAction = (action: ClientAction) => {
    updateMutation.reset();
    actionMutation.reset();
    setPendingAction(action);
  };
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
  const cancelEdit = () => {
    updateMutation.reset();
    setEditing(false);
    setCancelOpen(false);
    setIpInput('');
  };
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const back = merchant
    ? paths.dashboard.merchantClientsByMerchant(merchant.id)
    : paths.dashboard.merchants;

  if (
    !merchantId ||
    !clientId ||
    (!merchantQuery.isLoading && !clientQuery.isLoading && (!merchant || !fixture))
  )
    return (
      <DashboardContent maxWidth="xl">
        <Stack spacing={2}>
          <Typography variant="h4">Không tìm thấy MerchantClient</Typography>
          <Typography color="text.secondary">
            {parentMismatch
              ? 'MerchantClient không thuộc Merchant trong đường dẫn hiện tại.'
              : apiError instanceof AdminApiError
                ? `${apiError.message}${apiError.requestId ? ` Mã yêu cầu: ${apiError.requestId}` : ''}`
                : 'Không tồn tại hoặc chưa đọc được dữ liệu MerchantClient.'}
          </Typography>
          <Button component={RouterLink} href={back} sx={{ alignSelf: 'flex-start' }}>
            Quay lại danh sách
          </Button>
        </Stack>
      </DashboardContent>
    );

  if (merchantQuery.isLoading || clientQuery.isLoading || !merchant || !fixture) {
    return (
      <DashboardContent maxWidth="xl">
        <Stack sx={{ alignItems: 'center', py: 10 }}>
          <CircularProgress size={28} />
        </Stack>
      </DashboardContent>
    );
  }

  const client = fixture;
  const validity = merchantClientValidity(client.validFrom, client.validUntil, now);
  const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 };
  const actionLabels: Record<ClientAction, string> = {
    activate: 'kích hoạt',
    suspend: 'tạm dừng',
    resume: 'tiếp tục',
    revoke: 'thu hồi vĩnh viễn',
  };

  return (
    <>
      <title>{`${client.name} | MerchantClient - ${CONFIG.appName}`}</title>
      <DashboardContent maxWidth="xl">
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Button
                component={RouterLink}
                href={back}
                aria-label="Quay lại danh sách MerchantClient"
                sx={{ minWidth: 0, p: 0.5 }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" />
              </Button>
              <Typography variant="h4">{client.name}</Typography>
            </Stack>
            <Breadcrumbs aria-label="Điều hướng MerchantClient">
              <Link
                component={RouterLink}
                href={paths.dashboard.merchants}
                color="inherit"
                underline="hover"
              >
                Merchant
              </Link>
              <Link
                component={RouterLink}
                href={paths.dashboard.merchantById(merchant.id)}
                color="inherit"
                underline="hover"
              >
                {merchant.display_name}
              </Link>
              <Link component={RouterLink} href={back} color="inherit" underline="hover">
                MerchantClient
              </Link>
              <Typography variant="body2" color="text.disabled">
                {client.name}
              </Typography>
            </Breadcrumbs>
          </Stack>
          <Card>
            <Stack spacing={3} sx={{ p: { xs: 3, md: 5 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
              >
                <Typography variant="h6">Thông tin và cấu hình</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {client.lifecycleState !== 'REVOKED' && (
                    <>
                      {client.lifecycleState === 'PENDING' && (
                        <Button
                          variant="outlined"
                          onClick={() => openAction('activate')}
                          disabled={actionMutation.isPending}
                        >
                          Kích hoạt
                        </Button>
                      )}
                      {client.lifecycleState === 'ACTIVE' && (
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => openAction('suspend')}
                          disabled={actionMutation.isPending}
                        >
                          Tạm dừng
                        </Button>
                      )}
                      {client.lifecycleState === 'SUSPENDED' && (
                        <Button
                          variant="outlined"
                          onClick={() => openAction('resume')}
                          disabled={actionMutation.isPending}
                        >
                          Tiếp tục
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => openAction('revoke')}
                        disabled={actionMutation.isPending}
                      >
                        Thu hồi
                      </Button>
                    </>
                  )}
                  {editing ? (
                    <Stack direction="row" spacing={1}>
                      <Button onClick={() => (dirty ? setCancelOpen(true) : cancelEdit())}>
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        disabled={
                          !dirty ||
                          updateMutation.isPending ||
                          Boolean(ipInput.trim()) ||
                          Object.keys(errors).length > 0
                        }
                        onClick={() => {
                          setSaved(false);
                          actionMutation.reset();
                          updateMutation.mutate();
                        }}
                      >
                        Lưu thay đổi
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="solar:pen-bold" />}
                      onClick={() => {
                        updateMutation.reset();
                        actionMutation.reset();
                        setDraft(baseline);
                        setIpInput('');
                        setEditing(true);
                        setSaved(false);
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </Stack>
              </Stack>
              {editing && (
                <Alert severity="info">
                  Chỉ các trường tên, IP được phép và URL webhook được phép thay đổi. Hệ thống sẽ
                  gửi version hiện tại để kiểm tra CAS.
                </Alert>
              )}
              {updateMutation.error && (
                <Alert severity="error">{formatMutationError(updateMutation.error)}</Alert>
              )}
              {actionMutation.error && (
                <Alert severity="error">{formatMutationError(actionMutation.error)}</Alert>
              )}
              {saved && <Alert severity="success">Đã lưu thay đổi vào Admin API.</Alert>}
              <Box sx={grid}>
                <Field label={editing ? '' : 'Tên MerchantClient'}>
                  {editing ? (
                    <TextField
                      fullWidth
                      label="Tên MerchantClient"
                      required
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      error={Boolean(errors.name)}
                      helperText={errors.name}
                    />
                  ) : (
                    <Typography variant="subtitle2">{client.name}</Typography>
                  )}
                </Field>
                <Field label="Mã MerchantClient">
                  <CopyableText value={client.id} label="mã MerchantClient" wrap />
                </Field>
                <Field label="Trạng thái" fullWidth>
                  <Label color={merchantClientLifecycleColors[client.lifecycleState]}>
                    {merchantClientLifecycleLabels[client.lifecycleState]}
                  </Label>
                </Field>
                <Field label="Ngày tạo">
                  <Typography variant="body2">
                    {fDateTime(client.createdAt, DATE_FORMAT)}
                  </Typography>
                </Field>
                <Field label="Cập nhật lần cuối">
                  <Typography variant="body2">
                    {fDateTime(client.updatedAt, DATE_FORMAT)}
                  </Typography>
                </Field>
              </Box>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Typography variant="h6">Cấu hình kết nối</Typography>
              <Box sx={grid}>
                <Field label="Bắt đầu hiệu lực">
                  <Tooltip title={editing ? 'Không sửa thời hạn qua luồng cập nhật này.' : ''}>
                    <Typography component="span" variant="body2" tabIndex={editing ? 0 : undefined}>
                      {fDateTime(client.validFrom, DATE_FORMAT)}
                    </Typography>
                  </Tooltip>
                </Field>
                <Field label="Kết thúc hiệu lực">
                  <Tooltip
                    title={
                      editing
                        ? `${validity.label}. Không sửa thời hạn qua luồng cập nhật này.`
                        : client.validUntil
                          ? validity.label
                          : ''
                    }
                  >
                    <Typography
                      component="span"
                      variant="body2"
                      tabIndex={client.validUntil || editing ? 0 : undefined}
                      sx={{
                        color:
                          validity.color === 'warning'
                            ? 'warning.main'
                            : validity.color === 'error'
                              ? 'error.main'
                              : 'text.primary',
                      }}
                    >
                      {client.validUntil
                        ? fDateTime(client.validUntil, DATE_FORMAT)
                        : 'Không đặt hạn cuối'}
                    </Typography>
                  </Tooltip>
                </Field>
                <Field label="IP được phép">
                  {editing ? (
                    <Stack spacing={1}>
                      <FormControlLabel
                        label="Giới hạn IP"
                        control={
                          <Switch
                            checked={draft.allowedIps !== null}
                            disabled={client.lifecycleState === 'ACTIVE'}
                            onChange={(_, checked) => {
                              setDraft({ ...draft, allowedIps: checked ? [] : null });
                              setIpInput('');
                            }}
                          />
                        }
                      />
                      {draft.allowedIps !== null && (
                        <Autocomplete
                          multiple
                          freeSolo
                          options={[]}
                          value={draft.allowedIps}
                          inputValue={ipInput}
                          onInputChange={(_, value) => setIpInput(value)}
                          onChange={(_, values) =>
                            setDraft({ ...draft, allowedIps: [...new Set(values)] })
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="IP/CIDR"
                              error={Boolean(errors.allowedIps)}
                              helperText={
                                errors.allowedIps ||
                                (ipInput.trim()
                                  ? 'Nhấn Enter để thêm IP trước khi lưu.'
                                  : 'Nhập IPv4/IPv6 hoặc CIDR, nhấn Enter để thêm.')
                              }
                            />
                          )}
                        />
                      )}
                      {client.lifecycleState === 'ACTIVE' && (
                        <Typography variant="caption" color="text.secondary">
                          Client đang hoạt động không được tắt giới hạn IP.
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {client.allowedIps ? (
                        client.allowedIps.map((ip) => (
                          <Typography key={ip} variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {ip}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2">Không bật giới hạn IP</Typography>
                      )}
                    </Stack>
                  )}
                </Field>
                <Field label={editing ? '' : 'URL webhook'}>
                  {editing ? (
                    <TextField
                      fullWidth
                      label="URL webhook"
                      value={draft.webhookUrl}
                      onChange={(event) => setDraft({ ...draft, webhookUrl: event.target.value })}
                      error={Boolean(errors.webhookUrl)}
                      helperText={
                        errors.webhookUrl || 'HTTPS; không có credential, query hoặc fragment.'
                      }
                    />
                  ) : client.webhookUrl ? (
                    <CopyableText value={client.webhookUrl} label="URL webhook" wrap />
                  ) : (
                    <Typography variant="body2">Chưa cấu hình</Typography>
                  )}
                </Field>
              </Box>
            </Stack>
          </Card>
          <Card>
            <Stack spacing={3} sx={{ p: { xs: 3, md: 5 } }}>
              <Typography variant="h6">Bảo mật</Typography>
              <Alert severity="info">
                Để thay đổi chứng thư, khóa hoặc bộ cấu hình bảo mật, cần tạo MerchantClient mới.
                Client cũ không tự bị thu hồi.
              </Alert>
              <Box sx={grid}>
                <Field label="Fingerprint chứng thư mTLS (SHA-256)" fullWidth>
                  <CopyableText
                    value={client.mtlsFingerprintSha256}
                    label="fingerprint chứng thư mTLS"
                    wrap
                  />
                </Field>
                <Field label="Public key Ed25519 (base64url)" fullWidth>
                  <CopyableText
                    value={client.requestPublicKeyBase64url}
                    label="public key Ed25519"
                    wrap
                  />
                </Field>
                <Field label="Fingerprint public key (SHA-256)" fullWidth>
                  <CopyableText
                    value={client.requestKeyFingerprintSha256}
                    label="fingerprint public key"
                    wrap
                  />
                </Field>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Dữ liệu đọc và cập nhật qua Admin API. Ngày giờ hiển thị theo múi giờ trình duyệt.
              </Typography>
            </Stack>
          </Card>
        </Stack>
        <Dialog
          open={Boolean(pendingAction)}
          onClose={() => {
            if (!actionMutation.isPending) setPendingAction(null);
          }}
        >
          <DialogTitle>Xác nhận action MerchantClient</DialogTitle>
          <DialogContent>
            Bạn có chắc muốn {pendingAction ? actionLabels[pendingAction] : ''} MerchantClient này?
            Hệ thống sẽ kiểm tra version hiện tại trước khi ghi.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingAction(null)} disabled={actionMutation.isPending}>
              Hủy
            </Button>
            <Button
              variant="contained"
              color={pendingAction === 'revoke' ? 'error' : 'primary'}
              onClick={() => actionMutation.mutate()}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending && <CircularProgress size={18} sx={{ mr: 1 }} />}
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={cancelOpen || blocker.state === 'blocked'}
          onClose={() => {
            setCancelOpen(false);
            if (blocker.state === 'blocked') blocker.reset();
          }}
        >
          <DialogTitle>Bỏ thay đổi chưa lưu?</DialogTitle>
          <DialogContent>
            Các thay đổi trên form sẽ bị bỏ. Dữ liệu hệ thống chưa thay đổi.
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCancelOpen(false);
                if (blocker.state === 'blocked') blocker.reset();
              }}
            >
              Tiếp tục sửa
            </Button>
            <Button
              color="warning"
              variant="contained"
              onClick={() => {
                cancelEdit();
                if (blocker.state === 'blocked') blocker.proceed();
              }}
            >
              Bỏ thay đổi
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardContent>
    </>
  );
}
