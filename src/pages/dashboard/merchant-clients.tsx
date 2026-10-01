import type { ChangeEvent } from 'react';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  merchantClientLifecycleColors,
  merchantClientLifecycleLabels,
  merchantClientLifecycleOptions,
} from 'src/_mock';
import {
  getMerchant,
  AdminApiError,
  listMerchantClients,
  type MerchantClient,
  listAllMerchantClients,
  type MerchantClientListItem,
  type MerchantClientListQuery,
} from 'src/shared/api/admin-api';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { MerchantDetailShell } from 'src/components/merchant-detail';
import { CopyableText } from 'src/components/copyable-text/copyable-text';
import { ListExport, type ListExportColumn } from 'src/components/list-export';
import { CreateDemoDialog } from 'src/components/merchant-detail/create-demo-dialog';

// ----------------------------------------------------------------------

const metadata = { title: `MerchantClient | Admin - ${CONFIG.appName}` };

type MerchantClientLifecycleState = MerchantClient['lifecycle_state'];
type SortField = NonNullable<MerchantClientListQuery['sort_by']>;
type SortDirection = NonNullable<MerchantClientListQuery['sort_order']>;

const exportColumns: ListExportColumn<MerchantClientListItem>[] = [
  { header: 'Tên MerchantClient', value: (item) => item.name },
  { header: 'Mã MerchantClient', value: (item) => item.id },
  { header: 'Trạng thái', value: (item) => merchantClientLifecycleLabels[item.lifecycle_state] },
  {
    header: 'Cập nhật lần cuối',
    value: (item) => fDateTime(item.updated_at, 'DD/MM/YYYY HH:mm'),
  },
];

export default function Page() {
  const { merchantId } = useParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | MerchantClientLifecycleState>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');

  const merchantQuery = useQuery({
    queryKey: ['admin', 'merchant', merchantId],
    queryFn: ({ signal }) => getMerchant(merchantId!, signal),
    enabled: Boolean(merchantId),
  });

  const query: MerchantClientListQuery = {
    limit: rowsPerPage,
    ...(cursor ? { cursor } : {}),
    ...(status !== 'ALL' ? { lifecycle_state: [status] } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    sort_by: sortField,
    sort_order: sortOrder,
  };

  const listQuery = useQuery({
    queryKey: ['admin', 'merchant-clients', merchantId, query],
    queryFn: ({ signal }) => listMerchantClients(merchantId!, query, signal),
    enabled: Boolean(merchantId),
    placeholderData: keepPreviousData,
  });

  const rows = listQuery.data?.data.items ?? [];
  const nextCursor = listQuery.data?.data.next_cursor ?? undefined;
  const apiError = merchantQuery.error ?? listQuery.error;

  const resetPaging = () => {
    setPage(0);
    setCursor(undefined);
    setCursorHistory([]);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    resetPaging();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'updated_at' ? 'desc' : 'asc');
    }
    resetPaging();
  };

  const handlePageChange = (_event: unknown, nextPage: number) => {
    if (nextPage > page && nextCursor) {
      setCursorHistory((current) => [...current, cursor]);
      setCursor(nextCursor);
      setPage(nextPage);
      return;
    }
    if (nextPage < page) {
      const previousCursor = cursorHistory[page - 1];
      setCursor(previousCursor);
      setCursorHistory((current) => current.slice(0, -1));
      setPage(nextPage);
    }
  };

  const { cursor: _cursor, ...exportQuery } = query;

  if (!merchantId || (!merchantQuery.isLoading && !merchantQuery.data)) {
    return (
      <>
        <title>{metadata.title}</title>
        <DashboardContent maxWidth="xl">
          <Stack spacing={2}>
            <Typography variant="h4">Không tìm thấy Merchant</Typography>
            <Typography color="text.secondary">
              {apiError instanceof AdminApiError
                ? `${apiError.message}${apiError.requestId ? ` Mã yêu cầu: ${apiError.requestId}` : ''}`
                : 'Không đọc được Merchant sở hữu MerchantClient.'}
            </Typography>
            <Button
              component={RouterLink}
              href={paths.dashboard.merchants}
              size="small"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Quay lại danh sách
            </Button>
          </Stack>
        </DashboardContent>
      </>
    );
  }

  if (merchantQuery.isLoading || !merchantQuery.data) {
    return (
      <DashboardContent maxWidth="xl">
        <Stack sx={{ alignItems: 'center', py: 10 }}>
          <CircularProgress size={28} />
        </Stack>
      </DashboardContent>
    );
  }

  const merchant = {
    id: merchantQuery.data.data.id,
    displayName: merchantQuery.data.data.display_name,
  };

  return (
    <>
      <title>{metadata.title}</title>

      <MerchantDetailShell merchant={merchant} activeTab="clients">
        <Card sx={{ boxShadow: 'none', borderRadius: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ p: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Typography variant="h6">Danh sách MerchantClient</Typography>
            <CreateDemoDialog client merchantId={merchant.id} />
          </Stack>
          <Tabs
            value={status}
            onChange={(_, value: 'ALL' | MerchantClientLifecycleState) => {
              setStatus(value);
              resetPaging();
            }}
            variant="scrollable"
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="ALL" label="Tất cả" />
            {merchantClientLifecycleOptions.map((option) => (
              <Tab key={option.value} value={option.value} label={option.label} />
            ))}
          </Tabs>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm tên hoặc mã MerchantClient..."
              slotProps={{
                htmlInput: { 'aria-label': 'Tìm tên hoặc mã MerchantClient' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              value={search}
              onChange={handleSearchChange}
            />
            <ListExport
              rows={rows}
              columns={exportColumns}
              fileName="merchant-client-list"
              loadRows={() => listAllMerchantClients(merchant.id, exportQuery)}
            />
          </Stack>

          {apiError && (
            <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
              {apiError instanceof AdminApiError
                ? `${apiError.message}${apiError.requestId ? ` Mã yêu cầu: ${apiError.requestId}` : ''}`
                : 'Không đọc được danh sách MerchantClient.'}
            </Alert>
          )}

          <TableContainer>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Tên MerchantClient
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Mã MerchantClient</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'updated_at'}
                      direction={sortField === 'updated_at' ? sortOrder : 'desc'}
                      onClick={() => handleSort('updated_at')}
                    >
                      Cập nhật lần cuối
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(listQuery.isLoading || merchantQuery.isLoading) && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center' }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}
                {!listQuery.isLoading &&
                  rows.map((item) => (
                    <TableRow hover key={item.id}>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          color="primary.main"
                          underline="hover"
                          href={paths.dashboard.merchantClientById(merchant.id, item.id)}
                          sx={{
                            textAlign: 'left',
                            fontWeight: 500,
                            transition: (theme) => theme.transitions.create(['color', 'transform']),
                            '&:hover': { transform: 'translateX(2px)' },
                          }}
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <CopyableText label="mã MerchantClient" value={item.id} />
                      </TableCell>
                      <TableCell>
                        <Label color={merchantClientLifecycleColors[item.lifecycle_state]}>
                          {merchantClientLifecycleLabels[item.lifecycle_state]}
                        </Label>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {fDateTime(item.updated_at, 'DD/MM/YYYY HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                {!listQuery.isLoading && !rows.length && !apiError && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center' }}>
                      Không có MerchantClient phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={-1}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              resetPaging();
            }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Số dòng:"
            labelDisplayedRows={({ from, to }) => `${from}–${to}${nextCursor ? ' trở lên' : ''}`}
          />
        </Card>
      </MerchantDetailShell>
    </>
  );
}
