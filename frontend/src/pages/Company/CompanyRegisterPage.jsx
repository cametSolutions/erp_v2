import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import api from "../../api/client/apiClient";
import { fetchCompanyById, updateCompany } from "../../api/client/companyApi";
import companyIcon from "../../assets/icons/company.png";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";
import { INDUSTRIES } from "../../constants/industries";

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
  industry: z.string().min(1, "Industry is required"),
  financialYear: z.string().min(1, "Financial year is required"),
});

const inputClass =
  "h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";
const errorClass = "mt-1 text-xs text-rose-500";

const CompanyRegisterPage = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("companyId");
  const isEdit = Boolean(companyId);
  const [loadingCompany, setLoadingCompany] = useState(false);

 const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
     setValue, 
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "integrated",
      country: "",
      state: "",
      currency: "",
      currencyName: "",
      financialYear: "",
       industry: "",
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
           
              industry: c.industry || "",
        });
          setLogoPreview(c.logo || "");
      } catch (err) {
        const msg =
          err?.response?.data?.message || err.message || "Failed to load company";
        toast.error(msg);
      } finally {
        setLoadingCompany(false);
      }
    };

    loadCompany();
  }, [companyId, reset]);

const getFinancialYearOptions = (start = 2010, end = 2040) => {
  const years = [];
  for (let y = start; y <= end; y++) {
    const next = y + 1;
    years.push(`${y}-${next}`);
  }
  return years;
};

const FIN_YEAR_OPTIONS = getFinancialYearOptions(2010, 2040);


  const handleLogoFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    toast.error("Please select a valid image (JPEG, PNG, WebP)");
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error("Image size should be less than 5MB");
    return;
  }

  setLogoFile(file);

  const reader = new FileReader();
  reader.onloadend = () => {
    setLogoPreview(reader.result);
  };
  reader.readAsDataURL(file);
};

const handleLogoUpload = async () => {
  if (!logoFile) {
    toast.error("Please select a logo image first");
    return;
  }
  try {
    setLogoUploading(true);
    const url = await uploadImageToCloudinary(logoFile);
    setValue("logo", url, { shouldValidate: true });
    setLogoPreview(url);
    setLogoFile(null);
    toast.success("Logo uploaded");
  } catch (err) {
    toast.error(err.message || "Logo upload failed");
  } finally {
    setLogoUploading(false);
  }
};

const handleRemoveLogo = () => {
  setLogoFile(null);
  setLogoPreview("");
  setValue("logo", "", { shouldValidate: true });
};

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
          industry: values.industry.trim(),
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
      const msg = err?.response?.data?.message || err.message || "Save failed";
      toast.error(msg);
    }
  };

  return (
    <div className="w-full font-[sans-serif]">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-sm  bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <img src={companyIcon} alt="Company" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 md:text-lg">
                {isEdit ? "Edit Company" : "Create Company"}
              </h2>
              <p className="text-xs text-slate-500 md:text-sm">
                {isEdit
                  ? "Update your company details"
                  : "Fill the details to register your company"}
              </p>
            </div>
          </div>

          {loadingCompany ? (
            <p className="text-sm text-slate-500">Loading company...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Company Name</label>
                  <input type="text" className={inputClass} {...register("name")} />
                  {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </div>

                {/* <div>
                  <label className={labelClass}>Type</label>
                  <select className={inputClass} {...register("type")}>
                    <option value="integrated">Integrated</option>
                    <option value="standalone">Standalone</option>
                  </select>
                </div> */}

               <div>
  <label className={labelClass}>Financial Year</label>
  <select
    className={inputClass}
    {...register("financialYear")}
  >
    <option value="">Select financial year</option>
    {FIN_YEAR_OPTIONS.map((fy) => (
      <option key={fy} value={fy}>
        {fy}
      </option>
    ))}
  </select>
  {errors.financialYear && (
    <p className={errorClass}>{errors.financialYear.message}</p>
  )}
</div>
 <div>
    <label className={labelClass}>Industry</label>
    <select className={inputClass} {...register("industry")}>
      <option value="">Select industry</option>
      {INDUSTRIES.map((ind) => (
        <option key={ind} value={ind}>
          {ind}
        </option>
      ))}
    </select>
    {errors.industry && (
      <p className={errorClass}>{errors.industry.message}</p>
    )}
  </div>

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Flat / Building</label>
                  <input type="text" className={inputClass} {...register("flat")} />
                </div>

                <div>
                  <label className={labelClass}>Road</label>
                  <input type="text" className={inputClass} {...register("road")} />
                </div>

                <div>
                  <label className={labelClass}>Place / City</label>
                  <input type="text" className={inputClass} {...register("place")} />
                  {errors.place && <p className={errorClass}>{errors.place.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Landmark</label>
                  <input type="text" className={inputClass} {...register("landmark")} />
                </div>

                <div>
                  <label className={labelClass}>PIN / ZIP</label>
                  <input type="text" className={inputClass} {...register("pin")} />
                  {errors.pin && <p className={errorClass}>{errors.pin.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" className={inputClass} {...register("country")} />
                  {errors.country && <p className={errorClass}>{errors.country.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" className={inputClass} {...register("state")} />
                  {errors.state && <p className={errorClass}>{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} {...register("email")} />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Mobile</label>
                  <input type="text" className={inputClass} {...register("mobile")} />
                  {errors.mobile && <p className={errorClass}>{errors.mobile.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="text"
                    placeholder="www.example.com"
                    className={inputClass}
                    {...register("website")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>GST Number</label>
                  <input type="text" className={inputClass} {...register("gstNum")} />
                </div>

                <div>
                  <label className={labelClass}>PAN</label>
                  <input type="text" className={inputClass} {...register("pan")} />
                </div>

                <div>
                <label className={labelClass}>Company Logo</label>
                  {logoPreview && (
      <div className="mb-2 relative inline-block">
        <img
          src={logoPreview}
          alt="Logo preview"
          className="h-12 w-12 object-contain border border-slate-200 rounded"
        />
        <button
          type="button"
          onClick={handleRemoveLogo}
          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center"
        >
          ×
        </button>
      </div>
    )}

    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleLogoFileChange}
        className="text-xs"
      />
      {logoFile && (
        <button
          type="button"
          onClick={handleLogoUpload}
          disabled={logoUploading}
          className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:bg-blue-300"
        >
          {logoUploading ? "Uploading..." : "Upload"}
        </button>
      )}
    </div>

                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Currency Code</label>
                  <input
                    type="text"
                    placeholder="e.g. INR"
                    className={inputClass}
                    {...register("currency")}
                  />
                  {errors.currency && <p className={errorClass}>{errors.currency.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Currency Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Rupee"
                    className={inputClass}
                    {...register("currencyName")}
                  />
                  {errors.currencyName && (
                    <p className={errorClass}>{errors.currencyName.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-sm bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? isEdit
                      ? "Updating..."
                      : "Saving..."
                    : isEdit
                      ? "Update Company"
                      : "Create Company"}
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
