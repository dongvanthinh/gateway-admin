import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type CopyableTextProps = {
  value: string;
  label: string;
  wrap?: boolean;
};

export function CopyableText({ value, label, wrap = false }: CopyableTextProps) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Typography
        component="span"
        variant="body2"
        sx={{ fontFamily: 'monospace', ...(wrap && { minWidth: 0, overflowWrap: 'anywhere' }) }}
      >
        {value}
      </Typography>
      <Tooltip title="Sao chép mã">
        <IconButton
          aria-label={`Sao chép ${label}`}
          size="small"
          sx={{ flexShrink: 0 }}
          onClick={(event) => {
            event.stopPropagation();
            void navigator.clipboard?.writeText(value);
          }}
        >
          <Iconify icon="solar:copy-bold" width={16} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
