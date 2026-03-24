import { capitalizeFirstLetter } from "../../../../../shared/utils/string.js";

import CompanySelector from "./CompanySelector";

export default function UserIdentityBlock({
  displayName,
  selectedCompany,
  onCompanyClick,
  tone = "light",
}) {
  const isDarkTone = tone === "dark";

  return (
    <div className="min-w-0">
      <p
        className={`truncate text-sm font-semibold leading-tight ${
          isDarkTone ? "text-white" : "text-slate-900"
        }`}
      >
        {capitalizeFirstLetter(displayName)}
      </p>
      <CompanySelector
        selectedCompany={selectedCompany}
        onClick={onCompanyClick}
        tone={tone}
      />
    </div>
  );
}
