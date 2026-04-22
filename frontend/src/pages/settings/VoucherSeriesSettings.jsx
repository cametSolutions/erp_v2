import SettingsList from "@/features/settings/components/SettingsList";
import { getVoucherSeriesSettingsItems } from "@/features/settings/config/settingsSections";

/**
 * Voucher Series Settings index.
 *
 * This screen groups series settings by voucher family
 * (sale order, receipt, etc.) and lets user drill down into list/create pages.
 */
const VoucherSeriesSettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={getVoucherSeriesSettingsItems()} />
    </div>
  );
};

export default VoucherSeriesSettings;
