import api from "../client/apiClient";

export const getPrintConfig = (cmp_id, voucherType) =>
  api.get(`/print-config/${cmp_id}/${voucherType}`).then((res) => res.data);

export const patchPrintConfig = (cmp_id, voucherType, partial) =>
  api
    .patch(`/print-config/${cmp_id}/${voucherType}`, partial)
    .then((res) => res.data);

export const printConfigService = {
  getPrintConfig,
  patchPrintConfig,
};
