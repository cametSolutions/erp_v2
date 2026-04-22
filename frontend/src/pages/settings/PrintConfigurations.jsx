import SettingsList from "@/features/settings/components/SettingsList";
import { getPrintConfigurationItems } from "@/features/settings/config/settingsSections";

/**
 * Print configuration category screen.
 *
 * Exposes per-voucher print layout/settings pages (sale order, receipt).
 */
function PrintConfigurations() {
  return (
    <section className="space-y-3  bg-white">
      

      <SettingsList items={getPrintConfigurationItems()} />
    </section>
  );
}

export default PrintConfigurations;
