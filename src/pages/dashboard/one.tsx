import { CONFIG } from 'src/global-config';

import { BlankView } from 'src/sections/blank/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tổng quan | Admin - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <BlankView title="Tổng quan" description="Khu vực tổng quan Admin đang được chuẩn bị." />
    </>
  );
}
