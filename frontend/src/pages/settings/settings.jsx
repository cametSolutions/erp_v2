

import { HiTemplate } from "react-icons/hi";
import { IoPersonSharp, IoPrint } from "react-icons/io5";
import { MdDataSaverOff } from "react-icons/md";
import { TbMoneybag } from "react-icons/tb";
import { MdHomeRepairService } from "react-icons/md";

import { useSelector } from "react-redux";
import { ROUTES } from "@/routes/paths";
import SettingsCard from "./SettingsCard";

const Settings = () => {
   

  const settingsOptions = [

    {
      title: "DATA ENTRY",
      description: "Data entry settings",
      icon: <MdDataSaverOff />,
       to: ROUTES.settingsDataEntry,
      active: true,

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

export default Settings;
