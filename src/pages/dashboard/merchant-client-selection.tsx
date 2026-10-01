import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

const metadata = { title: `MerchantClient | Admin - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent maxWidth="xl">
        <Stack spacing={1}>
          <Typography variant="h4">MerchantClient</Typography>
          <Typography color="text.secondary">
            MerchantClient được hiển thị trong phạm vi của một Merchant.
          </Typography>
        </Stack>

        <Alert
          action={
            <Button component={RouterLink} href={paths.dashboard.merchants} size="small">
              Mở Merchant
            </Button>
          }
          severity="info"
          sx={{ mt: 3 }}
        >
          Hãy chọn một Merchant trước khi xem danh sách MerchantClient.
        </Alert>
      </DashboardContent>
    </>
  );
}
