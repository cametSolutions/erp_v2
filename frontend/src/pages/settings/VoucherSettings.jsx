import SettingsList from "@/features/settings/components/SettingsList";
import { voucherSettingsItems } from "@/features/settings/config/settingsSections";

/**
 * Voucher Settings index screen.
 *
 * Displays configuration entry points related to voucher behavior
 * (for example series and numbering-related pages).
 */
const VoucherSettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={voucherSettingsItems} />
    </div>
  );
};

export default VoucherSettings;
