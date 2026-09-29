import request from "supertest";

import app from "../../app.js";
import { createTestCompany } from "../helpers/company.js";
import { loginAndGetToken } from "../helpers/user.js";

describe("Company settings routes", () => {
  it("stores Sale and Sale Order terms independently", async () => {
    const token = await loginAndGetToken({
      userOverrides: {
        userName: "Settings Admin",
        mobileNumber: "9000000101",
        email: "settings-admin@example.com",
      },
    });
    const companyResponse = await createTestCompany(token);
    const companyId = companyResponse.body.company._id;

    const orderResponse = await request(app)
      .put(`/api/company-settings?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        dataEntry: {
          order: {
            termsAndConditions: [" Order term ", ""],
          },
        },
      });

    expect(orderResponse.status).toBe(200);
    expect(orderResponse.body.dataEntry.order.termsAndConditions).toEqual([
      "Order term",
    ]);

    const saleResponse = await request(app)
      .put(`/api/company-settings?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        dataEntry: {
          sale: {
            termsAndConditions: [" Sale term ", "Second sale term"],
          },
        },
      });

    expect(saleResponse.status).toBe(200);
    expect(saleResponse.body.dataEntry.sale.termsAndConditions).toEqual([
      "Sale term",
      "Second sale term",
    ]);
    expect(saleResponse.body.dataEntry.order.termsAndConditions).toEqual([
      "Order term",
    ]);

    const getResponse = await request(app)
      .get(`/api/company-settings?cmp_id=${companyId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.dataEntry.sale.termsAndConditions).toEqual([
      "Sale term",
      "Second sale term",
    ]);
    expect(getResponse.body.dataEntry.order.termsAndConditions).toEqual([
      "Order term",
    ]);
  });
});
