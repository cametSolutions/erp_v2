// src/pages/party/PartyRegisterPage.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createParty,
  fetchPartyById,
  updateParty,
} from "../../api/client/partyApi";


import { fetchAccountGroups } from "../../api/client/accountGroupApi";
import { fetchSubGroups } from "../../api/client/subGroupApi";

const schema = z.object({
  partyName: z.string().min(1, "Party name is required"),
  partyType: z.enum(["party", "bank", "cash"]).optional(), // not compulsory
  accountGroup: z.string().min(1, "Account group is required"),
  subGroup: z.string().optional(),
  mobileNumber: z
    .string()
    .min(1, "Mobile number is required"),
  emailID: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  gstNo: z.string().optional(),
  panNo: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  creditPeriod: z.string().optional(),
  creditLimit: z.string().optional(),
  openingBalanceType: z.enum(["Dr", "Cr"]).optional(),
  openingBalanceAmount: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  pin: z.string().optional(),
});


const PartyRegisterPage = () => {
  const [searchParams] = useSearchParams();
  const partyId = searchParams.get("partyId");
  const isEdit = Boolean(partyId);
  const [loadingParty, setLoadingParty] = useState(false);
  const [accountGroups, setAccountGroups] = useState([]);
  const [subGroups, setSubGroups] = useState([]);
  const navigate = useNavigate();

  const cmp_id = localStorage.getItem("activeCompanyId");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      partyType: "party",
    },
  });

  const watchedAccountGroup = watch("accountGroup");

  // Load account groups
  useEffect(() => {
    const loadAccountGroups = async () => {
      if (!cmp_id) return;
      try {
        const res = await fetchAccountGroups(cmp_id);
        setAccountGroups(res.data || []);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Failed to load account groups";
        toast.error(msg);
      }
    };
    loadAccountGroups();
  }, [cmp_id]);

  // Load subgroups when accountGroup changes
  useEffect(() => {
    const loadSubGroups = async () => {
      if (!cmp_id || !watchedAccountGroup) {
        setSubGroups([]);
        return;
      }
      try {
        const res = await fetchSubGroups(cmp_id, watchedAccountGroup);
        setSubGroups(res.data || []);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Failed to load subgroups";
        toast.error(msg);
      }
    };
    loadSubGroups();
  }, [cmp_id, watchedAccountGroup]);

  // Load party for edit mode
  useEffect(() => {
    const loadParty = async () => {
      if (!partyId) return;
      try {
        setLoadingParty(true);
        const res = await fetchPartyById(partyId);
        const p = res.data;
        reset({
          partyName: p.partyName || "",
          partyType: p.partyType || "party",
          accountGroup: p.accountGroup || "",
          subGroup: p.subGroup || "",
          mobileNumber: p.mobileNumber || "",
          emailID: p.emailID || "",
          gstNo: p.gstNo || "",
          panNo: p.panNo || "",
          billingAddress: p.billingAddress || "",
          shippingAddress: p.shippingAddress || "",
          creditPeriod: p.creditPeriod || "",
          creditLimit: p.creditLimit || "",
          openingBalanceType: p.openingBalanceType || "",
          openingBalanceAmount:
            p.openingBalanceAmount != null ? String(p.openingBalanceAmount) : "",
          country: p.country || "",
          state: p.state || "",
          pin: p.pin || "",
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message || err.message || "Failed to load party";
        toast.error(msg);
      } finally {
        setLoadingParty(false);
      }
    };
    loadParty();
  }, [partyId, reset]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        cmp_id,
        openingBalanceAmount: values.openingBalanceAmount
          ? Number(values.openingBalanceAmount)
          : 0,
        subGroup: values.subGroup || "",
      };

      if (isEdit) {
        const res = await updateParty(partyId, payload);
        toast.success(res.data.message || "Party updated");
      } else {
        const res = await createParty(payload);
        toast.success(res.data.message || "Party added");
        reset({ partyType: "party" });
      }

      navigate("/party/list");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Save failed";
      toast.error(msg);
    }
  };

  return (
    <div className="font-[sans-serif] bg-[#f5f7fb] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white shadow-xl rounded-xl px-8 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "Edit Party" : "Party Registration"}
            </h2>
            <p className="text-sm text-gray-500">
              {isEdit
                ? "Update party details."
                : "Add a new party (customer / supplier)."}
            </p>
          </div>

          {loadingParty ? (
            <p className="text-sm text-gray-500">Loading party...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Party name + type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
  Party Name <span className="text-red-500">*</span>
</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("partyName")}
                  />
                  {errors.partyName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.partyName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("partyType")}
                  >
                    <option value="party">Party</option>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              {/* Account group + subgroup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
  Account Group <span className="text-red-500">*</span>
</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("accountGroup")}
                  >
                    <option value="">(Sundry Debtors)</option>
                    {accountGroups.map((ag) => (
                      <option key={ag._id} value={ag._id}>
                        {ag.accountGroup}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Group
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("subGroup")}
                  >
                    <option value="">None</option>
                    {subGroups.map((sg) => (
                      <option key={sg._id} value={sg._id}>
                        {sg.subGroup}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile / Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
  Mobile <span className="text-red-500">*</span>
</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("mobileNumber")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("emailID")}
                  />
                  {errors.emailID && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.emailID.message}
                    </p>
                  )}
                </div>
              </div>

              {/* GST / PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST No
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("gstNo")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN No
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("panNo")}
                  />
                </div>
              </div>

              {/* Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  {...register("billingAddress")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Address
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  {...register("shippingAddress")}
                />
              </div>

              {/* Credit + opening balance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Period
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("creditPeriod")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("creditLimit")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Bal Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("openingBalanceType")}
                  >
                    <option value="">Select</option>
                    <option value="Dr">Debit</option>
                    <option value="Cr">Credit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("openingBalanceAmount")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("country")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    {...register("state")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  {...register("pin")}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? isEdit
                      ? "Updating..."
                      : "Saving..."
                    : isEdit
                    ? "Update Party"
                    : "Add Party"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyRegisterPage;
