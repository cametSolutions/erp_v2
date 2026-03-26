import SettingsList from "@/features/settings/components/SettingsList";
import { dataEntrySettingsItems } from "@/features/settings/config/settingsSections";

const DateEntrySettings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={dataEntrySettingsItems} />
    </div>
  );
};

export default DateEntrySettings;
