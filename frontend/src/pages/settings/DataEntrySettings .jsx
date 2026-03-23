


import { FiFileText, FiShoppingCart, FiUser } from 'react-icons/fi';
import { ROUTES } from "@/routes/paths";
import SettingsCard from './SettingsCard';

const DateEntrySettings = () => {
  const settingsOptions = [
    {
        title: "Vouchers",
        description: "Configure fields you would like to show in your voucher entry",
        icon: <FiFileText />,
        to: ROUTES.settingsVoucher,
        active: true
      },
     
  ];

  return (
    <div className="bg-white">
     
      <div className="space-y-4 b-white p-4   mx-1">
        {settingsOptions.map((option, index) => (
          <SettingsCard option={option} index={index} />
        ))}
      </div>
    </div>
  );
};

export default DateEntrySettings;
