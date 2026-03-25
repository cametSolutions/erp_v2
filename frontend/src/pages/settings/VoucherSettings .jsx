import { ROUTES } from "@/routes/paths";
import { useEffect, useState } from "react";
import SettingsCard from "./SettingsCard";
import { SiSteelseries } from "react-icons/si";
const VoucherSettings = () => {

  const [loading, setLoading] = useState(false);

  const [settingsOptions, setSettingsOptions] = useState([{}]);


  useEffect(() => {
    setSettingsOptions([
      {
        title: "Voucher Series",
        description: "Configure series for your vouchers",
        icon: <SiSteelseries />,
        to: ROUTES.settingsVoucherSeries,
        active: true,
      },
    ]);
  }, );

  return (
    <div className="bg-white">
      
      <div
        className={`space-y-4 bg-white  mx-1 transition-opacity duration-300 ${
          loading ? "pointer-events-none opacity-70" : "opacity-100"
        }`}
      >
        {settingsOptions.map((option, index) => (
          <SettingsCard
            key={index}
            option={option}
            index={index}
           
          
          />
        ))}
      </div>
    </div>
  );
};

export default VoucherSettings;