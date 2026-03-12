// src/pages/company/CompanyRegisterPage.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "../../api/client/apiClient";
import { FaRegBuilding } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import { useSearchParams } from "react-router-dom";
import { fetchCompanyById, updateCompany } from "../../api/client/companyApi";

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  flat: z.string().optional(),
  road: z.string().optional(),
  place: z.string().min(1, "Place is required"),
  landmark: z.string().optional(),
  pin: z.string().min(3, "PIN is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  email: z.string().email("Invalid email"),
  mobile: z
    .string()
    .min(7, "Mobile is required")
    .regex(/^\d+$/, "Mobile must be digits"),
  gstNum: z.string().optional(),
  pan: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().min(1, "Currency code is required"),
  currencyName: z.string().min(1, "Currency name is required"),
  logo: z.string().url("Logo must be a valid URL").optional(),
  type: z.enum(["integrated", "standalone"]).default("integrated"),
  financialYear: z.string().min(1, "Financial year is required"),
});

const CompanyRegisterPage = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("companyId");
  const isEdit = Boolean(companyId);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "integrated",
      country: "",
      state: "",
      currency: "",
      currencyName: "",
      financialYear: "",
    },
  });

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) return;
      try {
        setLoadingCompany(true);
        const res = await fetchCompanyById(companyId);
        const c = res.data;
        reset({
          name: c.name || "",
          flat: c.flat || "",
          road: c.road || "",
          place: c.place || "",
          landmark: c.landmark || "",
          pin: c.pin || "",
          country: c.country || "",
          state: c.state || "",
          email: c.email || "",
          mobile: c.mobile || "",
          gstNum: c.gstNum || "",
          pan: c.pan || "",
          website: c.website || "",
          logo: c.logo || "",
          type: c.type || "integrated",
          financialYear: c.financialYear || "",
          currency: c.currency || "",
          currencyName: c.currencyName || "",
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Failed to load company";
        toast.error(msg);
      } finally {
        setLoadingCompany(false);
      }
    };

    loadCompany();
  }, [companyId, reset]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        flat: values.flat?.trim(),
        road: values.road?.trim(),
        place: values.place.trim(),
        landmark: values.landmark?.trim(),
        pin: values.pin.trim(),
        country: values.country.trim(),
        state: values.state.trim(),
        email: values.email.trim(),
        mobile: values.mobile.trim(),
        gstNum: values.gstNum?.trim(),
        pan: values.pan?.trim(),
        website: values.website?.trim(),
        logo: values.logo?.trim(),
        type: values.type,
        financialYear: values.financialYear.trim(),
        currency: values.currency.trim(),
        currencyName: values.currencyName.trim(),
      };

      if (isEdit) {
        const res = await updateCompany(companyId, payload);
        toast.success(res.data.message || "Company updated");
      } else {
        const res = await api.post("/company/register", payload);
        toast.success(res.data.message || "Company registered");
        reset();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Save failed";
      toast.error(msg);
    }
  };

  return (
    <div className="font-[sans-serif] bg-[#f5f7fb] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white shadow-xl rounded-xl px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <FaRegBuilding />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? "Edit Company" : "Company Registration"}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit
                  ? "Update your company details."
                  : "Enter your company details to start using the ERP."}
              </p>
            </div>
          </div>
   {loadingCompany ? (
            <p className="text-sm text-gray-500">Loading company...</p>
          ) : (
           
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("type")}
                >
                  <option value="integrated">Integrated</option>
                  <option value="standalone">Standalone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  placeholder="2025-2026"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("financialYear")}
                />
                {errors.financialYear && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.financialYear.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flat / Building
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("flat")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("road")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Place / City
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("place")}
                />
                {errors.place && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.place.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("landmark")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN / ZIP
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("pin")}
                />
                {errors.pin && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.pin.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.country.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("state")}
                />
                {errors.state && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.state.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact + tax */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    {...register("email")}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <MdEmail />
                  </span>
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    {...register("mobile")}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <FaPhone />
                  </span>
                </div>
                {errors.mobile && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.mobile.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  placeholder="www.example.com"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("website")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("gstNum")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("pan")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("logo")}
                />
                {errors.logo && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.logo.message}
                  </p>
                )}
              </div>
            </div>

            {/* Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. INR"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("currency")}
                />
                {errors.currency && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currency.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indian Rupee"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("currencyName")}
                />
                {errors.currencyName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.currencyName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
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
    ? "Update Company"
    : "Register Company"}
</button>
            </div>
          </form>
             )}
        
        </div>
      </div>
    </div>
  );
};

export default CompanyRegisterPage;
