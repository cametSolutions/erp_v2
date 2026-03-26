import { MdDataSaverOff } from "react-icons/md";
import { FiFileText } from "react-icons/fi";
import { SiSteelseries } from "react-icons/si";
import { TbFileInvoice } from "react-icons/tb";

import { ROUTES } from "@/routes/paths";

export const settingsRootItems = [
  {
    id: "settings-data-entry",
    title: "DATA ENTRY",
    description: "Data entry settings",
    icon: MdDataSaverOff,
    action: {
      type: "route",
      to: ROUTES.settingsDataEntry,
    },
    active: true,
  },
];

export const dataEntrySettingsItems = [
  {
    id: "data-entry-vouchers",
    title: "Vouchers",
    description: "Configure fields you would like to show in your voucher entry",
    icon: FiFileText,
    action: {
      type: "route",
      to: ROUTES.settingsVoucher,
    },
    active: true,
  },
];

export const voucherSettingsItems = [
  {
    id: "voucher-series",
    title: "Voucher Series",
    description: "Configure series for your vouchers",
    icon: SiSteelseries,
    action: {
      type: "route",
      to: ROUTES.settingsVoucherSeries,
    },
    active: true,
  },
];

export const getVoucherSeriesSettingsItems = () => [
  {
    id: "voucher-series-sale-order",
    title: "Sale Order",
    description: "Configure voucher series for Sale Orders",
    icon: TbFileInvoice,
    action: {
      type: "route",
      to: ROUTES.settingsVoucherSeriesList,
      search: "?voucherType=saleOrder",
      state: { from: "saleOrder" },
    },
    active: true,
  },
  {
    id: "voucher-series-receipt",
    title: "Receipt",
    description: "Configure voucher series for Receipt",
    icon: TbFileInvoice,
    action: {
      type: "route",
      to: ROUTES.settingsVoucherSeriesList,
      search: "?voucherType=receipt",
      state: { from: "receipt" },
    },
    active: true,
  },
];
