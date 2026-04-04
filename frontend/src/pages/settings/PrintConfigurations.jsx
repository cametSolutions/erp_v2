import SettingsList from "@/features/settings/components/SettingsList";
import { getPrintConfigurationItems } from "@/features/settings/config/settingsSections";

function PrintConfigurations() {
  return (
    <section className="space-y-3  bg-white">
      

      <SettingsList items={getPrintConfigurationItems()} />
    </section>
  );
}

export default PrintConfigurations;
