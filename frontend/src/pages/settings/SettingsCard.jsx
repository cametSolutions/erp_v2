import SettingsItemCard from "@/features/settings/components/SettingsItemCard";

function SettingsCard({
  option,
  modalHandler = () => {},
  handleToggleChangeFromParent = () => {},
}) {
  const normalizedOption =
    option?.action
      ? option
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
