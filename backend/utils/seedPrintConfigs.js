import PrintConfiguration from "../Model/PrintConfiguration.js";
import { getDefaultPrintConfigDocuments } from "./printConfigDefaults.js";

export const seedDefaultPrintConfigs = async (cmp_id) => {
  try {
    await PrintConfiguration.insertMany(
      getDefaultPrintConfigDocuments(cmp_id),
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
