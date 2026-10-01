import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  dashboard: icon('ic-dashboard'),
  merchant: icon('ic-user'),
  payment: icon('ic-banking'),
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Quản trị',
    items: [
      {
        title: 'Tổng quan',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
      {
        title: 'Merchant',
        path: paths.dashboard.merchants,
        icon: ICONS.merchant,
        children: [{ title: 'Danh sách Merchant', path: paths.dashboard.merchants }],
      },
      {
        title: 'Payment',
        path: paths.dashboard.payments,
        icon: ICONS.payment,
        disabled: true,
        info: <Label color="warning">Đang phát triển</Label>,
      },
    ],
  },
];
