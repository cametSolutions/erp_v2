import SettingsList from "@/features/settings/components/SettingsList";
import { settingsRootItems } from "@/features/settings/config/settingsSections";

/**
 * Root Settings landing page.
 *
 * Role in flow:
 * - Renders first-level settings navigation cards from static config.
 * - Delegates navigation behavior to shared `SettingsList` renderer.
 */
const Settings = () => {
  return (
    <div className="bg-white">
      <SettingsList items={settingsRootItems} />
    </div>
  );
};

export default Settings;
