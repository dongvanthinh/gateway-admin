import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  AdminApiError,
  type Merchant,
  createMerchant,
  type AdminResponse,
  type MerchantClient,
  createMerchantClient,
} from 'src/shared/api/admin-api';

import { Iconify } from 'src/components/iconify';

type FormState = {
  name: string;
  certificatePem: string;
  publicKey: string;
  validFrom: string;
  validUntil: string;
  webhookUrl: string;
  allowedIps: string;
};

const publicKeyPattern = /^[A-Za-z0-9_-]{43}$/;

function toDateTimeLocal(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function createInitialForm(): FormState {
  return {
    name: '',
    certificatePem: '',
    publicKey: '',
    validFrom: toDateTimeLocal(new Date()),
    validUntil: '',
    webhookUrl: '',
    allowedIps: '',
  };
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function splitAllowedIps(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatApiError(error: unknown) {
  if (!(error instanceof AdminApiError)) {
    return 'Không thể tạo dữ liệu. Vui lòng kiểm tra kết nối Admin API.';
  }

  const details = [error.message];
  if (error.status === 409) {
    details.push('Dữ liệu đã thay đổi hoặc bị xung đột; hãy đọc lại trước khi thử lại.');
  }
  if (error.status === 503 || error.retryAdvice === 'NO_AUTOMATIC_RETRY') {
    details.push('Không tự gửi lại yêu cầu; hãy kiểm tra lại trạng thái trên hệ thống.');
  }
  if (error.requestId) {
    details.push(`Mã yêu cầu: ${error.requestId}`);
  }
  return details.join(' ');
}

export function CreateDemoDialog({
  client = false,
  merchantId,
}: {
  client?: boolean;
  merchantId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(createInitialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const title = client ? 'Thêm MerchantClient' : 'Thêm Merchant';

  const mutation = useMutation<AdminResponse<Merchant | MerchantClient>, unknown, void>({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!client) {
        return createMerchant(name);
      }

      return createMerchantClient(merchantId!, {
        name,
        mtls_certificate_pem: form.certificatePem.trim(),
        request_public_key_base64url: form.publicKey.trim(),
        valid_from: toIso(form.validFrom),
        valid_until: form.validUntil ? toIso(form.validUntil) : null,
        ...(form.webhookUrl.trim() ? { webhook_url: form.webhookUrl.trim() } : {}),
        allowed_ips: splitAllowedIps(form.allowedIps).length
          ? splitAllowedIps(form.allowedIps)
          : null,
      });
    },
    retry: false,
    onSuccess: async (result) => {
      if (client) {
        const createdClient = result.data as MerchantClient;
        await queryClient.invalidateQueries({
          queryKey: ['admin', 'merchant-clients', merchantId],
        });
        setOpen(false);
        setForm(createInitialForm());
        router.push(paths.dashboard.merchantClientById(merchantId!, createdClient.id));
        return;
      }

      const createdMerchant = result.data as Merchant;
      await queryClient.invalidateQueries({ queryKey: ['admin', 'merchants'] });
      setOpen(false);
      setForm(createInitialForm());
      router.push(paths.dashboard.merchantById(createdMerchant.id));
    },
  });

  const close = () => {
    if (!mutation.isPending) {
      setOpen(false);
      setValidationError(null);
    }
  };

  const validate = () => {
    const name = form.name.trim();
    if (!name) return 'Tên là bắt buộc.';
    if (name.length > 256) return 'Tên không được dài quá 256 ký tự.';
    if (!client) return null;
    if (!merchantId) return 'Không xác định được Merchant sở hữu.';
    if (!form.certificatePem.trim()) return 'Chứng thư mTLS là bắt buộc.';
    if (form.certificatePem.includes('PRIVATE KEY')) {
      return 'Chỉ được nhập chứng thư public, không nhập private key.';
    }
    if (
      !form.certificatePem.includes('-----BEGIN CERTIFICATE-----') ||
      !form.certificatePem.includes('-----END CERTIFICATE-----')
    ) {
      return 'Chứng thư mTLS phải là PEM certificate hợp lệ.';
    }
    if (!publicKeyPattern.test(form.publicKey.trim())) {
      return 'Public key Ed25519 phải là base64url không padding, đúng 43 ký tự.';
    }
    const validFrom = new Date(form.validFrom);
    if (!form.validFrom || Number.isNaN(validFrom.getTime())) {
      return 'Bắt đầu hiệu lực không hợp lệ.';
    }
    if (form.validUntil) {
      const validUntil = new Date(form.validUntil);
      if (Number.isNaN(validUntil.getTime()) || validUntil <= validFrom) {
        return 'Kết thúc hiệu lực phải lớn hơn bắt đầu hiệu lực.';
      }
    }
    if (form.webhookUrl.trim()) {
      const webhookUrl = form.webhookUrl.trim();
      try {
        const parsed = new URL(webhookUrl);
        if (
          parsed.protocol !== 'https:' ||
          parsed.username ||
          parsed.password ||
          parsed.search ||
          parsed.hash
        ) {
          return 'URL callback phải là HTTPS tuyệt đối, không userinfo/query/fragment.';
        }
      } catch {
        return 'URL callback không hợp lệ.';
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    setValidationError(error);
    if (!error) mutation.mutate();
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => {
          setValidationError(null);
          setOpen(true);
        }}
        sx={{ flexShrink: 0 }}
      >
        {title}
      </Button>
      <Dialog open={open} onClose={close} fullWidth maxWidth={client ? 'lg' : 'sm'}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Alert severity="info">
              Dữ liệu sẽ được tạo trực tiếp qua Admin API local. ID do hệ thống sinh; sau khi tạo sẽ
              mở trang chi tiết.
            </Alert>
            {(validationError || mutation.error ? true : false) && (
              <Alert severity="error">{validationError ?? formatApiError(mutation.error)}</Alert>
            )}
            {client ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
                  gap: 3,
                }}
              >
                <TextField
                  label="Tên MerchantClient"
                  required
                  fullWidth
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  slotProps={{ htmlInput: { maxLength: 256 } }}
                  sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
                />
                <TextField
                  label="Chứng thư client mTLS (PEM)"
                  required
                  fullWidth
                  multiline
                  minRows={6}
                  value={form.certificatePem}
                  onChange={(event) => setForm({ ...form, certificatePem: event.target.value })}
                  helperText="Chứng thư public dùng để xác thực kết nối TLS; không nhập private key."
                />
                <TextField
                  label="Khóa công khai ký request Ed25519"
                  required
                  fullWidth
                  value={form.publicKey}
                  onChange={(event) => setForm({ ...form, publicKey: event.target.value })}
                  helperText="32 byte, base64url không padding (43 ký tự)."
                />
                <TextField
                  label="Bắt đầu hiệu lực"
                  required
                  fullWidth
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(event) => setForm({ ...form, validFrom: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Kết thúc hiệu lực"
                  fullWidth
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Không bắt buộc."
                />
                <TextField
                  label="URL callback webhook (HTTPS)"
                  fullWidth
                  value={form.webhookUrl}
                  onChange={(event) => setForm({ ...form, webhookUrl: event.target.value })}
                  helperText="Không bắt buộc khi tạo; cần có trước khi kích hoạt."
                />
                <TextField
                  label="IP được phép"
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.allowedIps}
                  onChange={(event) => setForm({ ...form, allowedIps: event.target.value })}
                  helperText="Không bắt buộc; phân tách nhiều IP/CIDR bằng dấu phẩy hoặc xuống dòng."
                />
              </Box>
            ) : (
              <TextField
                label="Tên Merchant"
                required
                fullWidth
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                slotProps={{ htmlInput: { maxLength: 256 } }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={mutation.isPending}>
            Đóng
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && <CircularProgress size={18} sx={{ mr: 1 }} />}
            Tạo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
