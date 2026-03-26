import SettingsItemCard from "./SettingsItemCard";

function SettingsList({
  items = [],
  onToggle = () => {},
  onModal = () => {},
  onAction = () => {},
}) {
  return (
    <div className="space-y-4 mx-1 bg-white">
      {items.map((item, index) => (
        <SettingsItemCard
          key={item.id || item.title || index}
          item={item}
          onToggle={onToggle}
          onModal={onModal}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

export default SettingsList;
