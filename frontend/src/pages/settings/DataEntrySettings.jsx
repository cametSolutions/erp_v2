import SettingsList from "@/features/settings/components/SettingsList";
import { dataEntrySettingsItems } from "@/features/settings/config/settingsSections";

const DataEntrySettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={dataEntrySettingsItems} />
    </div>
  );
};

export default DataEntrySettings;
