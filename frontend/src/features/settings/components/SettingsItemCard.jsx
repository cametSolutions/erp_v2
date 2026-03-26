import { IoSettings } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import SettingsSwitch from "./SettingsSwitch";

function SettingsItemCard({
  item,
  onToggle = () => {},
  onModal = () => {},
  onAction = () => {},
}) {
  const navigate = useNavigate();
  const isDisabled = item?.active === false || item?.disabled === true;
  const actionType = item?.action?.type || "route";
  const Icon = item?.icon;

  const handleClick = () => {
    if (isDisabled) return;

    if (actionType === "toggle") return;

    if (actionType === "route") {
      navigate(
        {
          pathname: item?.action?.to,
          search: item?.action?.search || "",
        },
        {
          state: item?.action?.state || {},
        },
      );
      return;
    }

    if (actionType === "modal") {
      onModal(item);
      return;
    }

    if (actionType === "custom") {
      onAction(item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between rounded-sm p-4 shadow-md transition ${
        isDisabled
          ? "pointer-events-none opacity-50"
          : "cursor-pointer hover:bg-slate-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-xl">{Icon ? <Icon /> : null}</div>
        <div>
          <h3 className="text-xs font-bold">{item?.title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{item?.description}</p>
        </div>
      </div>

      {actionType === "toggle" ? (
        <SettingsSwitch
          checked={Boolean(item?.action?.checked)}
          disabled={isDisabled}
          ariaLabel={item?.title || "Toggle setting"}
          onChange={(nextChecked) => onToggle(item, nextChecked)}
        />
      ) : (
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="rounded-lg px-4 py-2 text-xs font-bold"
          aria-hidden="true"
          tabIndex={-1}
        >
          <IoSettings size={15} />
        </button>
      )}
    </div>
  );
}

export default SettingsItemCard;
