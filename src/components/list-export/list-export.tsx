import { useState } from 'react';

import Menu from '@mui/material/Menu';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type ListExportColumn<Row> = {
  header: string;
  value: (row: Row) => string | number;
};

type ListExportProps<Row> = {
  rows: Row[];
  columns: ListExportColumn<Row>[];
  fileName: string;
  loadRows?: () => Promise<Row[]>;
};

function escapeCsvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function ListExport<Row>({ rows, columns, fileName, loadRows }: ListExportProps<Row>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCsvExport = async () => {
    setExporting(true);
    try {
      const exportRows = loadRows ? await loadRows() : rows;
      const headerRow = columns.map((column) => escapeCsvValue(column.header));
      const dataRows = exportRows.map((row) =>
        columns.map((column) => escapeCsvValue(column.value(row)))
      );
      const csv = [headerRow, ...dataRows].map((row) => row.join(',')).join('\r\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `${fileName}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      handleClose();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Không thể xuất danh sách.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    handleClose();
    window.print();
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Iconify icon="solar:download-bold" width={18} />}
        endIcon={<Iconify icon="eva:arrow-downward-fill" width={16} />}
        onClick={handleOpen}
        aria-haspopup="menu"
        aria-expanded={menuOpen ? 'true' : undefined}
        disabled={exporting}
      >
        Xuất
      </Button>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
        <MenuItem onClick={handleCsvExport} disabled={exporting}>
          <Iconify icon="solar:download-bold" width={18} sx={{ mr: 1 }} />
          Xuất CSV
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <Iconify icon="solar:printer-minimalistic-bold" width={18} sx={{ mr: 1 }} />
          In danh sách
        </MenuItem>
      </Menu>
      <Snackbar
        open={Boolean(exportError)}
        autoHideDuration={6000}
        onClose={() => setExportError(null)}
      >
        <Alert onClose={() => setExportError(null)} severity="error" variant="filled">
          {exportError}
        </Alert>
      </Snackbar>
    </>
  );
}
