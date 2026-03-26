import SettingsList from "@/features/settings/components/SettingsList";
import { getVoucherSeriesSettingsItems } from "@/features/settings/config/settingsSections";

const VoucherSeriesSettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={getVoucherSeriesSettingsItems()} />
    </div>
  );
};

export default VoucherSeriesSettings;
