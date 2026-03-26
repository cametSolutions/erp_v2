import SettingsList from "@/features/settings/components/SettingsList";
import { settingsRootItems } from "@/features/settings/config/settingsSections";

const Settings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={settingsRootItems} />
    </div>
  );
};

export default Settings;
