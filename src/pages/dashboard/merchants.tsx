import type { ChangeEvent } from 'react';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  merchantLifecycleColors,
  merchantLifecycleLabels,
  merchantLifecycleOptions,
} from 'src/_mock';
import {
  AdminApiError,
  listMerchants,
  type Merchant,
  listAllMerchants,
  type MerchantListQuery,
} from 'src/shared/api/admin-api';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CopyableText } from 'src/components/copyable-text/copyable-text';
import { ListExport, type ListExportColumn } from 'src/components/list-export';
import { CreateDemoDialog } from 'src/components/merchant-detail/create-demo-dialog';

// ----------------------------------------------------------------------

const metadata = { title: `Merchant | Admin - ${CONFIG.appName}` };

type MerchantLifecycleState = Merchant['lifecycle_state'];
type LifecycleFilter = 'ALL' | MerchantLifecycleState;
type SortField = NonNullable<MerchantListQuery['sort_by']>;
type SortDirection = NonNullable<MerchantListQuery['sort_order']>;

const ALL_LIFECYCLE_FILTER: LifecycleFilter = 'ALL';

const exportColumns: ListExportColumn<Merchant>[] = [
  { header: 'Tên Merchant', value: (merchant) => merchant.display_name },
  { header: 'Mã Merchant', value: (merchant) => merchant.id },
  {
    header: 'Trạng thái',
    value: (merchant) => merchantLifecycleLabels[merchant.lifecycle_state],
  },
  {
    header: 'Cập nhật lần cuối',
    value: (merchant) => fDateTime(merchant.updated_at, 'DD/MM/YYYY HH:mm'),
  },
];

function LifecycleCell({ state }: { state: MerchantLifecycleState }) {
  return <Label color={merchantLifecycleColors[state]}>{merchantLifecycleLabels[state]}</Label>;
}

function TimestampCell({ value }: { value: string }) {
  return (
    <Typography component="span" variant="body2" noWrap>
      {fDateTime(value, 'DD/MM/YYYY HH:mm')}
    </Typography>
  );
}

export default function Page() {
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>(ALL_LIFECYCLE_FILTER);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');

  const lifecycleQuery: Pick<MerchantListQuery, 'lifecycle_state'> =
    lifecycleFilter === ALL_LIFECYCLE_FILTER
      ? {}
      : { lifecycle_state: [lifecycleFilter as MerchantLifecycleState] };
  const query: MerchantListQuery = {
    limit: rowsPerPage,
    ...(cursor ? { cursor } : {}),
    ...lifecycleQuery,
    ...(search.trim() ? { search: search.trim() } : {}),
    sort_by: sortField,
    sort_order: sortOrder,
  };

  const listQuery = useQuery({
    queryKey: ['admin', 'merchants', query],
    queryFn: ({ signal }) => listMerchants(query, signal),
    placeholderData: keepPreviousData,
  });

  const rows = listQuery.data?.data.items ?? [];
  const nextCursor = listQuery.data?.data.next_cursor ?? undefined;
  const apiError = listQuery.error;

  const resetPaging = () => {
    setPage(0);
    setCursor(undefined);
    setCursorHistory([]);
  };

  const handleLifecycleFilterChange = (_event: ChangeEvent<{}>, value: LifecycleFilter) => {
    setLifecycleFilter(value);
    resetPaging();
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

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(event.target.value));
    resetPaging();
  };

  const { cursor: _cursor, ...exportQuery } = query;

  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent maxWidth="xl">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Typography variant="h4">Danh sách Merchant</Typography>
          <CreateDemoDialog />
        </Stack>

        <Card sx={{ mt: 3, overflow: 'hidden' }}>
          <Tabs
            value={lifecycleFilter}
            onChange={handleLifecycleFilterChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Lọc theo trạng thái Merchant"
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value={ALL_LIFECYCLE_FILTER} label="Tất cả" />
            {merchantLifecycleOptions.map((option) => (
              <Tab key={option.value} value={option.value} label={option.label} />
            ))}
          </Tabs>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ p: 2, alignItems: { sm: 'center' } }}
          >
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={handleSearchChange}
              placeholder="Tìm tên hoặc mã Merchant..."
              slotProps={{
                htmlInput: { 'aria-label': 'Tìm tên hoặc mã Merchant' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
              <ListExport
                rows={rows}
                columns={exportColumns}
                fileName="merchant-list"
                loadRows={() => listAllMerchants(exportQuery)}
              />
            </Box>
          </Stack>

          {apiError && (
            <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
              {apiError instanceof AdminApiError
                ? `${apiError.message}${apiError.requestId ? ` Mã yêu cầu: ${apiError.requestId}` : ''}`
                : 'Không đọc được danh sách Merchant.'}
            </Alert>
          )}

          <TableContainer>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '30%' }}>
                    <TableSortLabel
                      active={sortField === 'display_name'}
                      direction={sortField === 'display_name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('display_name')}
                    >
                      Tên Merchant
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: '28%' }}>Mã Merchant</TableCell>
                  <TableCell sx={{ width: '22%' }}>Trạng thái</TableCell>
                  <TableCell sx={{ width: '20%' }}>
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
                {listQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center' }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}
                {!listQuery.isLoading &&
                  rows.map((merchant) => (
                    <TableRow hover key={merchant.id}>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          href={paths.dashboard.merchantById(merchant.id)}
                          color="primary.main"
                          underline="hover"
                          aria-label={`Mở chi tiết Merchant ${merchant.display_name}`}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontWeight: 500,
                            transition: (theme) => theme.transitions.create(['color', 'transform']),
                            '&:hover': { transform: 'translateX(2px)' },
                          }}
                        >
                          {merchant.display_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <CopyableText label="mã Merchant" value={merchant.id} />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'middle' }}>
                        <LifecycleCell state={merchant.lifecycle_state} />
                      </TableCell>
                      <TableCell>
                        <TimestampCell value={merchant.updated_at} />
                      </TableCell>
                    </TableRow>
                  ))}

                {!listQuery.isLoading && !rows.length && !apiError && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center' }}>
                      <Typography color="text.secondary">Không có Merchant phù hợp.</Typography>
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
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Số dòng:"
            labelDisplayedRows={({ from, to }) => `${from}–${to}${nextCursor ? ' trở lên' : ''}`}
          />
        </Card>
      </DashboardContent>
    </>
  );
}
