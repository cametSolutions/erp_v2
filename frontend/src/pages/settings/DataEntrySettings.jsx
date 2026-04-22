import SettingsList from "@/features/settings/components/SettingsList";
import { dataEntrySettingsItems } from "@/features/settings/config/settingsSections";

/**
 * Data Entry Settings index.
 *
 * Parent menu for entry-time defaults and behavior (order, voucher, receipt).
 */
const DataEntrySettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={dataEntrySettingsItems} />
    </div>
  );
};

export default DataEntrySettings;
