function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function endOfWeek(date) {
  return endOfDay(addDays(startOfWeek(date), 6));
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(value) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function buildDateRangePresetOptions(baseDate = new Date()) {
  const today = startOfDay(baseDate);
  const yesterday = addDays(today, -1);
  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today) > endOfDay(today) ? endOfDay(today) : endOfWeek(today);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = endOfDay(addDays(thisWeekStart, -1));
  const lastSevenDaysStart = addDays(today, -6);
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const lastMonthBase = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStart = startOfMonth(lastMonthBase);
  const lastMonthEnd = endOfMonth(lastMonthBase);

  return [
    {
      id: "today",
      label: "Today",
      from: formatDateInput(today),
      to: formatDateInput(today),
    },
    {
      id: "yesterday",
      label: "Yesterday",
      from: formatDateInput(yesterday),
      to: formatDateInput(yesterday),
    },
    {
      id: "this-week",
      label: "This Week",
      from: formatDateInput(thisWeekStart),
      to: formatDateInput(thisWeekEnd),
    },
    {
      id: "last-week",
      label: "Last Week",
      from: formatDateInput(lastWeekStart),
      to: formatDateInput(lastWeekEnd),
    },
    {
      id: "last-7-days",
      label: "Last 7 Days",
      from: formatDateInput(lastSevenDaysStart),
      to: formatDateInput(today),
    },
    {
      id: "this-month",
      label: "This Month",
      from: formatDateInput(thisMonthStart),
      to: formatDateInput(thisMonthEnd),
    },
    {
      id: "last-month",
      label: "Last Month",
      from: formatDateInput(lastMonthStart),
      to: formatDateInput(lastMonthEnd),
    },
  ];
}

export function findMatchingDatePreset(from, to, presets) {
  return presets.find((preset) => preset.from === from && preset.to === to) || null;
}
