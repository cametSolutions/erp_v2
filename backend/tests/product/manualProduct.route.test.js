import request from "supertest";

import app from "../../app.js";
import Product from "../../Model/ProductSchema.js";
import { Godown } from "../../Model/ProductSubDetails.js";
import PriceLevel from "../../Model/PriceLevel.js";
import TaxClassification from "../../Model/TaxClassificationSchema.js";
import { createTestCompany } from "../helpers/company.js";
import { loginAndGetAuthContext } from "../helpers/user.js";

const taxFields = {
  taxability_type: "Taxable",
  igst_rate: 18,
  cgst_rate: 9,
  sgst_utgst_rate: 9,
  cess_based_on_value: 0,
  cess_based_on_quantity: 0,
};

async function createContext() {
  const { user, token } = await loginAndGetAuthContext();
  const companyResponse = await createTestCompany(token);
  const companyId = companyResponse.body.company._id;
  const scope = { cmp_id: companyId, Primary_user_id: user._id };
  const godown = await Godown.create({
    ...scope,
    godown: "Main Store",
    godown_id: "manual-main-store",
    defaultGodown: true,
  });
  const classification = await TaxClassification.create({
    ...scope,
    hsn_code: "8471",
    description: "Computers",
    calculation_mode: "on_value",
    on_value: taxFields,
    rate_slabs: [],
  });

  return { token, companyId, scope, godown, classification };
}

const productPayload = (overrides = {}) => ({
  product_name: "Manual computer",
  base_unit: "Nos",
  hsn_code: "8471",
  saleable_stock: 12,
  ...overrides,
});

describe("Manual Product creation", () => {
  it("creates a product with an HSN tax snapshot and a zero-stock placeholder row", async () => {
    const { token, companyId } = await createContext();
    const response = await request(app)
      .post(`/api/product?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(productPayload());

    expect(response.status).toBe(201);
    expect(response.body.hsn_code).toBe("8471");
    expect(response.body.igst).toBe(18);
    expect(response.body.cgst).toBe(9);
    expect(response.body.sgst).toBe(9);
    expect(response.body.saleable_stock).toBe(12);
    expect(response.body.GodownList).toHaveLength(1);
    expect(response.body.GodownList[0].balance_stock).toBe(0);
    expect(response.body.GodownList[0].is_placeholder).toBe(true);
    expect(response.body.product_master_id).toBeUndefined();

    const saleList = await request(app)
      .get(`/api/product?cmp_id=${companyId}&for_sale=true`)
      .set("Authorization", `Bearer ${token}`);
    expect(saleList.body.items.map((item) => item._id)).toContain(response.body._id);
  });

  it("keeps saleable stock separate from multiple Godown stock rows", async () => {
    const { token, companyId, scope, godown } = await createContext();
    const secondGodown = await Godown.create({
      ...scope,
      godown: "Branch Store",
      godown_id: "manual-branch-store",
    });
    const response = await request(app)
      .post(`/api/product?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(productPayload({
        saleable_stock: 100,
        GodownList: [
          { godown: String(godown._id), balance_stock: 20 },
          { godown: String(secondGodown._id), balance_stock: 30 },
        ],
      }));

    expect(response.status).toBe(201);
    expect(response.body.saleable_stock).toBe(100);
    expect(response.body.GodownList.map((row) => row.balance_stock)).toEqual([20, 30]);
    expect(response.body.GodownList.every((row) => row._id)).toBe(true);
  });

  it("creates alternate-unit and multiple price-level configurations", async () => {
    const { token, companyId, scope } = await createContext();
    const [retail, wholesale] = await PriceLevel.create([
      { ...scope, pricelevel: "Retail", pricelevel_id: "manual-retail" },
      { ...scope, pricelevel: "Wholesale", pricelevel_id: "manual-wholesale" },
    ]);
    const response = await request(app)
      .post(`/api/product?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(productPayload({
        alt_unit: "Box",
        base_denominator: 10,
        alt_conversion: 1,
        priceLevels: [
          { priceLevel: String(retail._id), priceRate: 100, priceDisc: 5 },
          { priceLevel: String(wholesale._id), priceRate: 80, priceDisc: 0 },
        ],
      }));

    expect(response.status).toBe(201);
    expect(response.body.alt_unit).toBe("Box");
    expect(response.body.priceLevels).toHaveLength(2);
  });

  it("allows multiple manual products without Tally product IDs and retains tax snapshots", async () => {
    const { token, companyId, classification } = await createContext();
    const first = await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload());
    await TaxClassification.updateOne({ _id: classification._id }, { $set: { "on_value.igst_rate": 12, "on_value.cgst_rate": 6, "on_value.sgst_utgst_rate": 6 } });
    const second = await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload({ product_name: "Second manual computer" }));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.igst).toBe(18);
    expect(second.body.igst).toBe(12);
    expect(await Product.countDocuments({ cmp_id: companyId, product_master_id: { $exists: false } })).toBe(2);
  });

  it("rejects duplicate names and HSN classifications that are not On Value", async () => {
    const { token, companyId, scope } = await createContext();
    await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload());
    const duplicate = await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload());
    expect(duplicate.status).toBe(409);

    await TaxClassification.create({
      ...scope,
      hsn_code: "2710",
      description: "Item rate only",
      calculation_mode: "on_item_rate",
      rate_slabs: [{ greater_than: 0, upto: 100, ...taxFields }],
    });
    const unsupported = await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload({ product_name: "Item rate product", hsn_code: "2710" }));
    expect(unsupported.status).toBe(400);
  });

  it("updates a manual product, refreshes its tax snapshot only when HSN changes, and keeps stock-row IDs", async () => {
    const { token, companyId, scope, godown } = await createContext();
    const alternateHsn = await TaxClassification.create({
      ...scope,
      hsn_code: "8504",
      description: "Electrical transformers",
      calculation_mode: "on_value",
      on_value: { ...taxFields, igst_rate: 12, cgst_rate: 6, sgst_utgst_rate: 6 },
      rate_slabs: [],
    });
    const created = await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload({
      saleable_stock: 0,
      GodownList: [{ godown: String(godown._id), balance_stock: 0 }],
    }));
    const sameHsn = await request(app).put(`/api/product/${created.body._id}?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send({
      ...productPayload({ product_name: "Renamed computer", saleable_stock: 0, GodownList: [{ _id: created.body.GodownList[0]._id, godown: String(godown._id), balance_stock: 0 }] }),
    });
    expect(sameHsn.status).toBe(200);
    expect(sameHsn.body.igst).toBe(18);
    expect(String(sameHsn.body.GodownList[0]._id)).toBe(String(created.body.GodownList[0]._id));

    const changedHsn = await request(app).put(`/api/product/${created.body._id}?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send({
      ...productPayload({ product_name: "Renamed computer", hsn_code: alternateHsn.hsn_code, saleable_stock: 0, GodownList: [{ _id: created.body.GodownList[0]._id, godown: String(godown._id), balance_stock: 0 }] }),
    });
    expect(changedHsn.status).toBe(200);
    expect(changedHsn.body.igst).toBe(12);
  });

  it("archives only eligible manual products and protects Tally products", async () => {
    const { token, companyId, scope } = await createContext();
    const manual = await request(app).post(`/api/product?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`).send(productPayload({ saleable_stock: 0 }));
    const archived = await request(app).delete(`/api/product/${manual.body._id}?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`);
    expect(archived.status).toBe(200);
    expect(await Product.findById(manual.body._id).lean()).toMatchObject({ is_deleted: true, product_source: "manual" });

    const tally = await Product.create({ ...scope, product_name: "Protected tally product", base_unit: "Nos", product_master_id: "TALLY-1", product_source: "tally" });
    const blocked = await request(app).delete(`/api/product/${tally._id}?cmp_id=${companyId}`).set("Authorization", `Bearer ${token}`);
    expect(blocked.status).toBe(404);
  });
});
