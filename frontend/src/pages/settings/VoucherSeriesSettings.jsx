

import { IoFastFoodSharp } from "react-icons/io5";
import { GiStorkDelivery } from "react-icons/gi";
import {
  TbFileInvoice,
  TbShoppingCart,
  TbTruckDelivery,
  TbShoppingBag,
  TbArrowBigUpLines,
  TbArrowBigDownLines,
  TbArrowsExchange,
} from "react-icons/tb";
import { IoReceiptSharp } from "react-icons/io5";
import { MdReceipt } from "react-icons/md";
import { ROUTES } from "@/routes/paths";
import SettingsCard from "./SettingsCard";



const VoucherSeriesSettings = () => {
  const voucherOptions = [
    {
      title: "Sale Order",
      description: "Configure voucher series for Sale Orders",
      icon: <TbFileInvoice />,
     to: ROUTES.settingsVoucherSeriesList,
      active: true,
      from: "saleOrder",
    },
   
     {
      title: "Reciept",
      description: "Configure voucher series for Reciept",
      icon: <TbFileInvoice />,
     to: ROUTES.settingsVoucherSeriesList,
      active: true,
      from: "saleOrder",
    },
  ];

  return (
    <div className="bg-white">
     
      <div className={`space-y-4 bg-white p-4 mx-1`}>
        {voucherOptions.map((option, index) => (
          <SettingsCard key={index} option={option} index={index} />
        ))}
      </div>
    </div>
  );
};

export default VoucherSeriesSettings;
