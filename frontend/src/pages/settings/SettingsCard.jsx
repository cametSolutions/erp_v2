import SettingsItemCard from "@/features/settings/components/SettingsItemCard";

/**
 * Adapter between old option shape and new `SettingsItemCard` action contract.
 *
 * Accepts:
 * - `option`: settings config item that may be in legacy shape
 *   (`toggle` / `modal` / route fields) or already normalized with `action`.
 * - `modalHandler`: callback invoked when card requests modal open.
 * - `handleToggleChangeFromParent`: callback for toggle state changes.
 *
 * Returns:
 * - `SettingsItemCard` with guaranteed `action` structure so UI rendering logic
 *   remains consistent regardless of config source.
 */
function SettingsCard({
  option,
  modalHandler = () => {},
  handleToggleChangeFromParent = () => {},
}) {
  const normalizedOption =
    // If config already provides `action`, pass it through.
    option?.action
      ? option
      // Otherwise, derive the action type from legacy flags.
      : {
          ...option,
          action: option?.toggle
            ? {
                type: "toggle",
                checked: option?.toggleValue,
              }
            : option?.modal
              ? {
                  type: "modal",
                }
              : {
                  type: "route",
                  to: option?.to,
                  search: option?.search || "",
                  state: {
                    from: option?.from,
                    data: option?.data,
                  },
                },
        };

  return (
    <SettingsItemCard
      item={normalizedOption}
      onModal={() => modalHandler(true)}
      onToggle={(_, nextChecked) => handleToggleChangeFromParent(nextChecked)}
    />
  );
}

export default SettingsCard;
