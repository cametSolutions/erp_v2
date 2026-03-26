function SettingsSwitch({
  checked = false,
  disabled = false,
  onChange = () => {},
  ariaLabel = "Toggle setting",
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default SettingsSwitch;
