import request from "supertest";

import app from "../../app.js";
import Product from "../../Model/ProductSchema.js";
import TaxClassification from "../../Model/TaxClassificationSchema.js";
import { buildTaxClassificationPayload } from "../../services/taxClassification.service.js";
import { createTestCompany } from "../helpers/company.js";
import { loginAndGetToken } from "../helpers/user.js";

const onValueTax = {
  taxability_type: "Taxable",
  igst_rate: 18,
  cgst_rate: 9,
  sgst_utgst_rate: 9,
  cess_based_on_value: 0,
  cess_based_on_quantity: 0,
};

const rateSlab = (greater_than, upto, rate = 18) => ({
  greater_than,
  upto,
  taxability_type: "Taxable",
  igst_rate: rate,
  cgst_rate: rate / 2,
  sgst_utgst_rate: rate / 2,
  cess_based_on_value: 0,
  cess_based_on_quantity: 0,
});

const onValuePayload = (overrides = {}) => ({
  hsn_code: "8471",
  description: "Computers and related equipment",
  calculation_mode: "on_value",
  on_value: onValueTax,
  applicable_for_revised_charge: false,
  ...overrides,
});

const itemRatePayload = (overrides = {}) => ({
  hsn_code: "2710",
  description: "Petroleum oils",
  calculation_mode: "on_item_rate",
  rate_slabs: [rateSlab(0, 1000), rateSlab(1000, 5000, 12)],
  applicable_for_revised_charge: true,
  ...overrides,
});

async function createAuthenticatedCompany(userOverrides = {}) {
  const token = await loginAndGetToken({ userOverrides });
  const companyResponse = await createTestCompany(token);

  return { token, companyId: companyResponse.body.company._id };
}

describe("Tax classification routes", () => {
  it("creates an On Value classification and does not trust request ownership", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    const response = await request(app)
      .post(`/api/tax-classifications?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...onValuePayload(),
        cmp_id: "000000000000000000000000",
        Primary_user_id: "000000000000000000000000",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.hsn_code).toBe("8471");
    expect(response.body.data.rate_slabs).toEqual([]);
    expect(response.body.data.cmp_id).toBe(companyId);
  });

  it("creates an On Item Rate classification with adjacent slabs", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    const response = await request(app)
      .post(`/api/tax-classifications?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(itemRatePayload());

    expect(response.status).toBe(201);
    expect(response.body.data.on_value).toBeUndefined();
    expect(response.body.data.rate_slabs).toHaveLength(2);
  });

  it("rejects duplicate HSN/SAC codes in the same company", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    await request(app)
      .post(`/api/tax-classifications?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(onValuePayload());

    const duplicate = await request(app)
      .post(`/api/tax-classifications?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(onValuePayload({ hsn_code: "8471" }));

    expect(duplicate.status).toBe(409);
  });

  it("rejects invalid, overlapping, and invalid tax slab inputs", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    const send = (payload) =>
      request(app)
        .post(`/api/tax-classifications?cmp_id=${companyId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

    const invalidRange = await send(itemRatePayload({ rate_slabs: [rateSlab(1000, 1000)] }));
    expect(invalidRange.status).toBe(400);

    const overlap = await send(itemRatePayload({ rate_slabs: [rateSlab(0, 1000), rateSlab(900, 5000)] }));
    expect(overlap.status).toBe(400);

    const invalidTax = await send(onValuePayload({ on_value: { ...onValueTax, igst_rate: 101 } }));
    expect(invalidTax.status).toBe(400);
  });

  it("rejects NaN, Infinity, and numeric strings before Mongoose casts them", () => {
    expect(() =>
      buildTaxClassificationPayload(onValuePayload({ on_value: { ...onValueTax, igst_rate: Number.NaN } }))
    ).toThrow("finite number");
    expect(() =>
      buildTaxClassificationPayload(onValuePayload({ on_value: { ...onValueTax, igst_rate: Infinity } }))
    ).toThrow("finite number");
    expect(() =>
      buildTaxClassificationPayload(onValuePayload({ on_value: { ...onValueTax, igst_rate: "18" } }))
    ).toThrow("finite number");
  });

  it("isolates classifications by company and owner", async () => {
    const first = await createAuthenticatedCompany();
    const second = await createAuthenticatedCompany({
      userName: "Second Admin",
      mobileNumber: "9000000102",
      email: "second-admin@example.com",
    });

    await request(app)
      .post(`/api/tax-classifications?cmp_id=${first.companyId}`)
      .set("Authorization", `Bearer ${first.token}`)
      .send(onValuePayload());

    const list = await request(app)
      .get(`/api/tax-classifications?cmp_id=${second.companyId}`)
      .set("Authorization", `Bearer ${second.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([]);

    const denied = await request(app)
      .get(`/api/tax-classifications?cmp_id=${first.companyId}`)
      .set("Authorization", `Bearer ${second.token}`);
    expect(denied.status).toBe(403);
  });

  it("updates a classification and removes data from the unused calculation mode", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    const created = await request(app)
      .post(`/api/tax-classifications?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(onValuePayload());

    const classificationId = created.body.data._id;
    const toItemRate = await request(app)
      .put(`/api/tax-classifications/${classificationId}?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ calculation_mode: "on_item_rate", rate_slabs: [rateSlab(0, 1000)] });

    expect(toItemRate.status).toBe(200);
    expect(toItemRate.body.data.on_value).toBeUndefined();
    expect(toItemRate.body.data.rate_slabs).toHaveLength(1);

    const toOnValue = await request(app)
      .put(`/api/tax-classifications/${classificationId}?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ calculation_mode: "on_value", on_value: onValueTax, rate_slabs: [] });

    expect(toOnValue.status).toBe(200);
    expect(toOnValue.body.data.rate_slabs).toEqual([]);

    const persisted = await TaxClassification.findById(classificationId).lean();
    expect(persisted.on_value).toBeDefined();
    expect(persisted.rate_slabs).toEqual([]);
  });

  it("returns 400 for invalid ObjectIds", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    const response = await request(app)
      .get(`/api/tax-classifications/not-an-id?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("blocks deletion when a product stores the classification HSN/SAC code", async () => {
    const { token, companyId } = await createAuthenticatedCompany();
    const created = await request(app)
      .post(`/api/tax-classifications?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(onValuePayload());
    const classificationId = created.body.data._id;
    const classification = await TaxClassification.findById(classificationId);

    const product = await Product.create({
      product_name: "Tagged product",
      base_unit: "Nos",
      cmp_id: companyId,
      Primary_user_id: classification.Primary_user_id,
      hsn_code: "8471",
    });

    const blocked = await request(app)
      .delete(`/api/tax-classifications/${classificationId}?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(blocked.status).toBe(409);

    await Product.deleteOne({ _id: product._id });
    const deleted = await request(app)
      .delete(`/api/tax-classifications/${classificationId}?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(200);
  });
});
