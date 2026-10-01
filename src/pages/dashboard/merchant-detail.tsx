import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { merchantLifecycleColors, merchantLifecycleLabels } from 'src/_mock';
import {
  getMerchant,
  AdminApiError,
  updateMerchant,
  resumeMerchant,
  suspendMerchant,
  activateMerchant,
  listMerchantClients,
} from 'src/shared/api/admin-api';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { MerchantDetailShell } from 'src/components/merchant-detail';
import { CopyableText } from 'src/components/copyable-text/copyable-text';

// ----------------------------------------------------------------------

const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm';

type MerchantAction = 'activate' | 'suspend' | 'resume';

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0, flex: '1 1 240px' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

function formatMutationError(error: unknown) {
  if (!(error instanceof AdminApiError)) {
    return 'Không thể cập nhật Merchant. Vui lòng kiểm tra kết nối Admin API.';
  }
  const details = [error.message];
  if (error.status === 409) {
    details.push('Dữ liệu đã thay đổi; hãy tải lại rồi thử lại từ version mới nhất.');
  }
  if (error.status === 503 || error.retryAdvice === 'NO_AUTOMATIC_RETRY') {
    details.push('Không tự gửi lại yêu cầu; hãy đọc lại resource để xác định kết quả.');
  }
  if (error.requestId) details.push(`Mã yêu cầu: ${error.requestId}`);
  return details.join(' ');
}

export default function Page({ activeTab = 'overview' }: { activeTab?: 'overview' | 'payments' }) {
  const { merchantId } = useParams();
  const merchantQuery = useQuery({
    queryKey: ['admin', 'merchant', merchantId],
    queryFn: ({ signal }) => getMerchant(merchantId!, signal),
    enabled: Boolean(merchantId),
  });
  const merchant = merchantQuery.data?.data;
  const apiError = merchantQuery.error;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saved, setSaved] = useState(false);
  const [pendingAction, setPendingAction] = useState<MerchantAction | null>(null);
  const activeClientsQuery = useQuery({
    queryKey: ['admin', 'merchant-clients', merchantId, 'active-for-activation'],
    queryFn: ({ signal }) =>
      listMerchantClients(
        merchantId!,
        { limit: 1, lifecycle_state: ['ACTIVE'], sort_by: 'updated_at', sort_order: 'desc' },
        signal
      ),
    enabled: Boolean(merchant && merchant.lifecycle_state === 'ONBOARDING'),
  });
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!merchant) throw new Error('Không có Merchant để cập nhật.');
      return updateMerchant(merchant.id, {
        expected_version: merchant.version,
        display_name: draftName.trim(),
      });
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'merchant', merchantId] });
      setEditing(false);
      setSaved(true);
    },
  });
  const actionMutation = useMutation({
    mutationFn: () => {
      if (!merchant || !pendingAction) throw new Error('Thiếu action Merchant.');
      if (pendingAction === 'suspend') return suspendMerchant(merchant.id, merchant.version);
      if (pendingAction === 'resume') return resumeMerchant(merchant.id, merchant.version);
      const activeClientId = activeClientsQuery.data?.data.items[0]?.id;
      if (!activeClientId) throw new Error('Merchant chưa có MerchantClient ACTIVE để kích hoạt.');
      return activateMerchant(merchant.id, merchant.version, activeClientId);
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'merchant', merchantId] });
      setPendingAction(null);
    },
  });
  const openAction = (action: MerchantAction) => {
    updateMutation.reset();
    actionMutation.reset();
    setPendingAction(action);
  };

  if (!merchantId || (!merchantQuery.isLoading && !merchant)) {
    return (
      <>
        <title>{`Merchant | Admin - ${CONFIG.appName}`}</title>

        <DashboardContent maxWidth="xl">
          <Stack spacing={3}>
            <Typography variant="h4">Không tìm thấy Merchant</Typography>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography color="text.secondary">
                    {apiError instanceof AdminApiError
                      ? `${apiError.message}${apiError.requestId ? ` Mã yêu cầu: ${apiError.requestId}` : ''}`
                      : `Merchant ${merchantId ?? 'không xác định'} không tồn tại hoặc chưa đọc được.`}
                  </Typography>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.merchants}
                    startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Quay lại danh sách
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </DashboardContent>
      </>
    );
  }

  if (merchantQuery.isLoading || !merchant) {
    return (
      <DashboardContent maxWidth="xl">
        <Stack sx={{ alignItems: 'center', py: 10 }}>
          <CircularProgress size={28} />
        </Stack>
      </DashboardContent>
    );
  }

  const shellMerchant = { id: merchant.id, displayName: merchant.display_name };
  const activeClientId = activeClientsQuery.data?.data.items[0]?.id;
  const actionLabels: Record<MerchantAction, string> = {
    activate: 'kích hoạt',
    suspend: 'tạm dừng',
    resume: 'tiếp tục',
  };
  const canEdit = merchant.lifecycle_state !== 'CLOSED';

  return (
    <>
      <title>{`${merchant.display_name} | Merchant | Admin - ${CONFIG.appName}`}</title>

      <MerchantDetailShell merchant={shellMerchant} activeTab={activeTab}>
        {activeTab === 'payments' ? (
          <Card>
            <Stack
              spacing={1}
              sx={{ p: { xs: 3, md: 5 }, py: 8, alignItems: 'center', textAlign: 'center' }}
            >
              <Typography variant="h6">Đang phát triển</Typography>
              <Typography color="text.secondary">
                Chức năng Payment đang được phát triển.
              </Typography>
            </Stack>
          </Card>
        ) : (
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title="Thông tin Merchant"
                action={
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    {merchant.lifecycle_state === 'ACTIVE' && (
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => openAction('suspend')}
                        disabled={actionMutation.isPending}
                      >
                        Tạm dừng
                      </Button>
                    )}
                    {merchant.lifecycle_state === 'SUSPENDED' && (
                      <Button
                        variant="outlined"
                        onClick={() => openAction('resume')}
                        disabled={actionMutation.isPending}
                      >
                        Tiếp tục
                      </Button>
                    )}
                    {merchant.lifecycle_state === 'ONBOARDING' && (
                      <Button
                        variant="outlined"
                        onClick={() => openAction('activate')}
                        disabled={actionMutation.isPending || !activeClientId}
                      >
                        Kích hoạt
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="solar:pen-bold" />}
                      disabled={!canEdit || updateMutation.isPending}
                      onClick={() => {
                        updateMutation.reset();
                        actionMutation.reset();
                        setDraftName(merchant.display_name);
                        setEditing(true);
                        setSaved(false);
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  </Stack>
                }
                sx={{ p: { xs: 3, md: 5 }, pb: { xs: 0, md: 0 } }}
              />
              <CardContent sx={{ p: { xs: 3, md: 5 }, '&:last-child': { pb: { xs: 3, md: 5 } } }}>
                <Stack spacing={3}>
                  {updateMutation.error && (
                    <Alert severity="error">{formatMutationError(updateMutation.error)}</Alert>
                  )}
                  {actionMutation.error && (
                    <Alert severity="error">{formatMutationError(actionMutation.error)}</Alert>
                  )}
                  {saved && <Alert severity="success">Đã lưu thay đổi vào Admin API.</Alert>}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <DetailField label="Tên Merchant">
                      {editing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          error={!draftName.trim()}
                          helperText={!draftName.trim() ? 'Tên là bắt buộc.' : undefined}
                        />
                      ) : (
                        <Typography variant="subtitle1">{merchant.display_name}</Typography>
                      )}
                    </DetailField>
                    <DetailField label="Mã Merchant">
                      <CopyableText label="mã Merchant" value={merchant.id} />
                    </DetailField>
                  </Stack>

                  {editing && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={() => {
                          updateMutation.reset();
                          setEditing(false);
                          setDraftName(merchant.display_name);
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setSaved(false);
                          actionMutation.reset();
                          updateMutation.mutate();
                        }}
                        disabled={updateMutation.isPending || !draftName.trim()}
                      >
                        {updateMutation.isPending && <CircularProgress size={18} sx={{ mr: 1 }} />}
                        Lưu thay đổi
                      </Button>
                    </Stack>
                  )}

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <DetailField label="Trạng thái">
                      <Label
                        color={merchantLifecycleColors[merchant.lifecycle_state]}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {merchantLifecycleLabels[merchant.lifecycle_state]}
                      </Label>
                    </DetailField>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <DetailField label="Ngày tạo">
                      <Typography variant="subtitle1">
                        {fDateTime(merchant.created_at, DATE_TIME_FORMAT)}
                      </Typography>
                    </DetailField>
                    <DetailField label="Cập nhật lần cuối">
                      <Typography variant="subtitle1">
                        {fDateTime(merchant.updated_at, DATE_TIME_FORMAT)}
                      </Typography>
                    </DetailField>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
        <Dialog
          open={Boolean(pendingAction)}
          onClose={() => {
            if (!actionMutation.isPending) setPendingAction(null);
          }}
        >
          <DialogTitle>Xác nhận action Merchant</DialogTitle>
          <DialogContent>
            Bạn có chắc muốn {pendingAction ? actionLabels[pendingAction] : ''} Merchant này? Hệ
            thống sẽ kiểm tra version hiện tại trước khi ghi.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingAction(null)} disabled={actionMutation.isPending}>
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={() => actionMutation.mutate()}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending && <CircularProgress size={18} sx={{ mr: 1 }} />}
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>
      </MerchantDetailShell>
    </>
  );
}
