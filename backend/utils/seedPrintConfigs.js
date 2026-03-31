import PrintConfiguration from "../Model/PrintConfiguration.js";

export const seedDefaultPrintConfigs = async (cmp_id) => {
  try {
    await PrintConfiguration.insertMany(
      [
        {
          cmp_id,
          voucher_type: "sale_order",
          config: {
            print_title: "Sale Order",
            show_print_title: true,
            enable_company_details: true,
            enable_discount_column: true,
            enable_discount_amount: true,
            enable_hsn: true,
            enable_tax_percentage: true,
            enable_incl_tax_rate: false,
            enable_tax_analysis: false,
            enable_stock_wise_tax_amount: true,
            enable_tax_amount: true,
            enable_terms_conditions: false,
            enable_bank_details: true,
            enable_rate: true,
            enable_quantity: true,
            enable_stock_wise_amount: true,
            enable_net_amount: true,
          },
        },
        {
          cmp_id,
          voucher_type: "receipt",
          config: {
            print_title: "Receipt",
            show_print_title: true,
            enable_company_details: true,
            enable_party_details: true,
            enable_payment_mode: true,
            enable_received_amount: true,
            enable_balance_due: true,
            enable_narration: true,
            enable_terms_conditions: false,
            enable_bank_details: false,
            enable_authorized_signature: true,
          },
        },
      ],
      { ordered: false }
    );

    console.log(`Print configs seeded for cmp_id: ${cmp_id}`);
  } catch (error) {
    if (error?.code === 11000) {
      return;
    }

    throw error;
  }
};
