import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type MerchantDetailTab = 'overview' | 'clients' | 'payments';

type MerchantDetailShellProps = {
  merchant: { id: string; displayName: string };
  activeTab: MerchantDetailTab;
  children: React.ReactNode;
};

export function MerchantDetailShell({ merchant, activeTab, children }: MerchantDetailShellProps) {
  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
            >
              <Button
                component={RouterLink}
                href={paths.dashboard.merchants}
                aria-label="Quay lại danh sách Merchant"
                sx={{ minWidth: 0, p: 0.5 }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" />
              </Button>
              <Typography variant="h4">{merchant.displayName}</Typography>
            </Stack>
            <Breadcrumbs aria-label="Điều hướng Merchant">
              <Link
                component={RouterLink}
                href={paths.dashboard.root}
                color="inherit"
                underline="hover"
              >
                Tổng quan
              </Link>
              <Link
                component={RouterLink}
                href={paths.dashboard.merchants}
                color="inherit"
                underline="hover"
              >
                Merchant
              </Link>
              <Typography variant="body2" color="text.disabled">
                {merchant.displayName}
              </Typography>
            </Breadcrumbs>
          </Stack>
        </Stack>

        <Card sx={{ overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            aria-label="Các khu vực của Merchant"
            variant="scrollable"
            sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              value="overview"
              label="Tổng quan"
              component={RouterLink}
              href={paths.dashboard.merchantById(merchant.id)}
            />
            <Tab
              value="clients"
              label="MerchantClient"
              component={RouterLink}
              href={paths.dashboard.merchantClientsByMerchant(merchant.id)}
            />
            <Tab
              value="payments"
              label="Payment"
              component={RouterLink}
              href={paths.dashboard.merchantPaymentsByMerchant(merchant.id)}
            />
          </Tabs>

          {children}
        </Card>
      </Stack>
    </DashboardContent>
  );
}
