import SettingsList from "@/features/settings/components/SettingsList";
import { voucherSettingsItems } from "@/features/settings/config/settingsSections";

const VoucherSettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={voucherSettingsItems} />
    </div>
  );
};

export default VoucherSettings;
