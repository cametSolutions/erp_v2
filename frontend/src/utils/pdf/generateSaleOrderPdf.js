import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();

  return `${day}-${month}-${year}`;
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2);
}

function formatCompactAmount(value) {
  const numeric = Number(value || 0);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
}

function getCompanyAddress(org = {}) {
  return [
    org?.flat,
    org?.road,
    org?.place,
    org?.landmark,
    org?.state,
    org?.country,
    org?.pin,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeConfigurations(configurations = {}) {
  return {
    printTitle: configurations?.printTitle || configurations?.print_title || "Sale Order",
    showPrintTitle:
      configurations?.showPrintTitle ??
      configurations?.show_print_title ??
      true,
    showCompanyDetails:
      configurations?.enable_company_details ??
      true,
    showDiscountColumn:
      configurations?.enable_discount_column ??
      true,
    showHsn:
      configurations?.enable_hsn ??
      true,
    showTaxPercentage:
      configurations?.enable_tax_percentage ??
      true,
    showStockWiseTaxAmount:
      configurations?.enable_stock_wise_tax_amount ??
      true,
    showTaxAmount:
      configurations?.enable_tax_amount ??
      true,
    showNetAmount:
      configurations?.enable_net_amount ??
      true,
    showRate:
      configurations?.enable_rate ??
      true,
    showQuantity:
      configurations?.enable_quantity ??
      true,
    showStockWiseAmount:
      configurations?.enable_stock_wise_amount ??
      true,
    showBankDetails:
      configurations?.enable_bank_details ??
      false,
    showTeamsAndConditions:
      configurations?.enable_terms_conditions ??
      false,
  };
}

function integerToWords(num) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const toWordsBelowThousand = (value) => {
    if (value === 0) return "";
    if (value < 20) return ones[value];
    if (value < 100) {
      return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`;
    }

    return `${ones[Math.floor(value / 100)]} Hundred${
      value % 100 ? ` ${toWordsBelowThousand(value % 100)}` : ""
    }`;
  };

  if (!num) return "Zero";

  const parts = [];
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;

  if (crores) parts.push(`${toWordsBelowThousand(crores)} Crore`);
  if (lakhs) parts.push(`${toWordsBelowThousand(lakhs)} Lakh`);
  if (thousands) parts.push(`${toWordsBelowThousand(thousands)} Thousand`);
  if (hundreds) parts.push(toWordsBelowThousand(hundreds));

  return parts.join(" ").trim();
}

function amountToWords(value) {
  const numericValue = Number(value || 0);
  const rupees = Math.floor(numericValue);
  const paise = Math.round((numericValue - rupees) * 100);

  const rupeeWords = `${integerToWords(rupees)} Rupees`;
  const paiseWords = paise ? ` and ${integerToWords(paise)} Paise` : "";

  return `${rupeeWords}${paiseWords} Only`;
}

function ensureSpace(doc, currentY, requiredHeight) {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (currentY + requiredHeight <= pageHeight - 16) {
    return currentY;
  }

  doc.addPage();
  return 18;
}

function drawLabelValue(doc, label, value, x, y, width) {
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, x, y);
  doc.setFont("helvetica", "normal");
  doc.text(String(value || "--"), x + width, y);
}

function drawRightAlignedLabelValue(doc, label, value, x, y, width) {
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, x, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(String(value || "--"), x + width, y, { align: "right" });
}

function getItemCessRate(item = {}) {
  return Number(
    item?.cess ??
      item?.cess_rate ??
      item?.cess_percentage ??
      0
  );
}

function getItemAddlCessRate(item = {}) {
  return Number(
    item?.addl_cess ??
      item?.addlCess ??
      item?.addl_cess_rate ??
      item?.addl_cess_percentage ??
      0
  );
}

function getItemCessAmount(item = {}) {
  return Number(item?.cess_amount ?? 0);
}

function getItemAddlCessAmount(item = {}) {
  return Number(item?.addl_cess_amount ?? item?.addlCessAmount ?? 0);
}

export async function generateSaleOrderPdf({
  saleOrder,
  org,
  configurations,
  bankDetails,
  partyConfig,
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const resolvedConfigurations = normalizeConfigurations(configurations);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 14;

  if (resolvedConfigurations.showPrintTitle && resolvedConfigurations.printTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      resolvedConfigurations.printTitle || "Sale Order",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 8;
  }

  if (resolvedConfigurations.showCompanyDetails) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(org?.name || "Company", margin, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const companyLines = [
      getCompanyAddress(org),
      org?.gstNum ? `GST: ${org.gstNum}` : null,
      org?.pan ? `PAN: ${org.pan}` : null,
      org?.mobile ? `Mobile: ${org.mobile}` : null,
      org?.email ? `Email: ${org.email}` : null,
      org?.pan ? `PAN: ${org.pan}` : null,
      org?.gstNum ? `GST: ${org.gstNum}` : null,
    ].filter(Boolean);

    companyLines.forEach((line) => {
      const wrappedLines = doc.splitTextToSize(line, 110);
      doc.text(wrappedLines, margin, currentY);
      currentY += wrappedLines.length * 4.2;
    });

    currentY += 2;
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    `No: ${saleOrder?.voucher_number || "--"}`,
    margin + 3,
    currentY + 6.5
  );
  doc.text(
    `Date: ${formatDate(saleOrder?.date)}`,
    pageWidth - margin - 3,
    currentY + 6.5,
    { align: "right" }
  );
  currentY += 16;

  const billToLines = [
    saleOrder?.party_snapshot?.name,
    saleOrder?.party_snapshot?.billing_address,
    saleOrder?.party_snapshot?.gst_no
      ? `GST: ${saleOrder.party_snapshot.gst_no}`
      : null,
    saleOrder?.party_snapshot?.mobile
      ? `Mobile: ${saleOrder.party_snapshot.mobile}`
      : null,
  ].filter(Boolean);
  const shipToLines = [
    saleOrder?.party_snapshot?.name,
    saleOrder?.party_snapshot?.shipping_address ||
      saleOrder?.party_snapshot?.billing_address,
    saleOrder?.party_snapshot?.state
      ? `State: ${saleOrder.party_snapshot.state}`
      : null,
    partyConfig?.shippingNote || null,
  ].filter(Boolean);

  const billBoxHeight = Math.max(billToLines.length, shipToLines.length) * 4.5 + 10;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, 88, billBoxHeight, 1.5, 1.5);
  doc.roundedRect(pageWidth - margin - 88, currentY, 88, billBoxHeight, 1.5, 1.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To", margin + 3, currentY + 5.5);
  doc.text("Ship To", pageWidth - margin - 85, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  billToLines.forEach((line, index) => {
    doc.text(String(line), margin + 3, currentY + 11 + index * 4.5);
  });
  shipToLines.forEach((line, index) => {
    doc.text(String(line), pageWidth - margin - 85, currentY + 11 + index * 4.5);
  });
  currentY += billBoxHeight + 8;

  const itemColumns = [
    {
      key: "no",
      header: "No",
      value: (_, index) => index + 1,
      style: { cellWidth: 7, halign: "center" },
    },
    {
      key: "items",
      header: "Items",
      value: (item) => item?.item_name || "--",
      style: { cellWidth: 34, halign: "left" },
    },
    resolvedConfigurations.showHsn
      ? {
          key: "hsn",
          header: "HSN",
          value: (item) => item?.hsn || "--",
          style: { cellWidth: 14, halign: "center" },
        }
      : null,
    resolvedConfigurations.showTaxPercentage
      ? {
          key: "tax_rate",
          header: "Tax %",
          value: (item) => formatCompactAmount(item?.tax_rate),
          style: { cellWidth: 10, halign: "right" },
        }
      : null,
    resolvedConfigurations.showTaxPercentage
      ? {
          key: "cess_rate",
          header: "Cess %",
          value: (item) => formatCompactAmount(getItemCessRate(item)),
          style: { cellWidth: 10, halign: "right" },
        }
      : null,
    resolvedConfigurations.showTaxPercentage
      ? {
          key: "addl_cess_rate",
          header: "Addl Cess",
          value: (item) => formatCompactAmount(getItemAddlCessRate(item)),
          style: { cellWidth: 11, halign: "right" },
        }
      : null,
    resolvedConfigurations.showQuantity
      ? {
          key: "qty",
          header: "Qty",
          value: (item) =>
            `${formatCompactAmount(item?.billed_qty)} ${item?.unit || ""}`.trim(),
          style: { cellWidth: 11, halign: "right" },
        }
      : null,
    resolvedConfigurations.showRate
      ? {
          key: "rate",
          header: "Rate",
          value: (item) => formatCompactAmount(item?.rate),
          style: { cellWidth: 13, halign: "right" },
        }
      : null,
    resolvedConfigurations.showDiscountColumn
      ? {
          key: "discount",
          header: "Disc",
          value: (item) => formatCompactAmount(item?.discount_amount),
          style: { cellWidth: 11, halign: "right" },
        }
      : null,
    resolvedConfigurations.showStockWiseAmount
      ? {
          key: "amount",
          header: "Amt",
          value: (item) =>
            formatCompactAmount(item?.taxable_amount ?? item?.base_price),
          style: { cellWidth: 13, halign: "right" },
        }
      : null,
    resolvedConfigurations.showStockWiseTaxAmount
      ? {
          key: "tax_amount",
          header: "Tax Amt",
          value: (item) => formatCompactAmount(item?.tax_amount || 0),
          style: { cellWidth: 12, halign: "right" },
        }
      : null,
    resolvedConfigurations.showStockWiseTaxAmount
      ? {
          key: "cess_amount",
          header: "Cess Amt",
          value: (item) => formatCompactAmount(getItemCessAmount(item)),
          style: { cellWidth: 12, halign: "right" },
        }
      : null,
    resolvedConfigurations.showStockWiseTaxAmount
      ? {
          key: "addl_cess_amount",
          header: "Addl Amt",
          value: (item) => formatCompactAmount(getItemAddlCessAmount(item)),
          style: { cellWidth: 12, halign: "right" },
        }
      : null,
    resolvedConfigurations.showNetAmount
      ? {
          key: "net_amount",
          header: "Net Amt",
          value: (item) => formatCompactAmount(item?.total_amount),
          style: { cellWidth: 12, halign: "right" },
        }
      : null,
  ].filter(Boolean);

  const availableTableWidth = pageWidth - margin * 2;
  const totalBaseWidth = itemColumns.reduce(
    (sum, column) => sum + (Number(column?.style?.cellWidth) || 0),
    0
  );
  const widthScale = totalBaseWidth > 0 ? availableTableWidth / totalBaseWidth : 1;

  const columnStyles = itemColumns.reduce((accumulator, column, index) => {
    accumulator[index] = {
      ...column.style,
      cellWidth: (Number(column?.style?.cellWidth) || 0) * widthScale,
    };
    return accumulator;
  }, {});

  const footerRow = itemColumns.map((column) => {
    switch (column.key) {
      case "items":
        return "Subtotal";
      case "amount":
        return formatCompactAmount(
          saleOrder?.totals?.taxable_amount ?? saleOrder?.totals?.sub_total
        );
      case "tax_amount":
        return formatCompactAmount(saleOrder?.totals?.total_tax_amount);
      case "cess_amount":
        return formatCompactAmount(saleOrder?.totals?.total_cess_amt);
      case "addl_cess_amount":
        return formatCompactAmount(saleOrder?.totals?.total_addl_cess_amt);
      case "net_amount":
        return formatCompactAmount(saleOrder?.totals?.final_amount);
      default:
        return "";
    }
  });

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    styles: {
      fontSize: 7.2,
      cellPadding: 1.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: "top",
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [51, 65, 85],
    },
    columnStyles,
    head: [itemColumns.map((column) => column.header)],
    body: (saleOrder?.items || []).map((item, index) =>
      itemColumns.map((column) => column.value(item, index))
    ),
    foot: [footerRow],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      halign: "right",
    },
  });

  currentY = doc.lastAutoTable?.finalY + 8 || currentY + 8;

  const summaryLabelX = pageWidth - margin - 28;
  const summaryValueX = pageWidth - margin;
  const summaryRows = [
    ["Subtotal", formatAmount(saleOrder?.totals?.sub_total)],
  ];

  if (resolvedConfigurations.showTaxAmount) {
    summaryRows.push(["Total Tax", formatAmount(saleOrder?.totals?.total_tax_amount)]);
    if (Number(saleOrder?.totals?.total_cess_amt || 0) > 0) {
      summaryRows.push(["Cess", formatAmount(saleOrder?.totals?.total_cess_amt)]);
    }
    if (Number(saleOrder?.totals?.total_addl_cess_amt || 0) > 0) {
      summaryRows.push([
        "Additional Cess",
        formatAmount(saleOrder?.totals?.total_addl_cess_amt),
      ]);
    }
    if (Number(saleOrder?.totals?.total_igst_amt || 0) > 0) {
      summaryRows.push(["IGST", formatAmount(saleOrder?.totals?.total_igst_amt)]);
    }
    if (Number(saleOrder?.totals?.total_cgst_amt || 0) > 0) {
      summaryRows.push(["CGST", formatAmount(saleOrder?.totals?.total_cgst_amt)]);
    }
    if (Number(saleOrder?.totals?.total_sgst_amt || 0) > 0) {
      summaryRows.push(["SGST", formatAmount(saleOrder?.totals?.total_sgst_amt)]);
    }
  }

  if (resolvedConfigurations.showNetAmount) {
    summaryRows.push(["Grand Total", formatAmount(saleOrder?.totals?.final_amount)]);
  }

  doc.setFontSize(9);
  summaryRows.forEach(([label, value], index) => {
    const rowY = currentY + index * 5;
    drawRightAlignedLabelValue(doc, label, value, summaryLabelX, rowY, 28);
  });
  currentY += summaryRows.length * 5 + 8;

  if (resolvedConfigurations.showNetAmount) {
    currentY = ensureSpace(doc, currentY, 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const amountInWords = `Net Amount (in words): ${amountToWords(
      saleOrder?.totals?.final_amount
    ).toUpperCase()}`;
    const amountWordsWidth = 90;
    const amountWordsX = pageWidth - margin;
    const amountLines = doc.splitTextToSize(amountInWords, amountWordsWidth);
    doc.text(amountLines, amountWordsX, currentY, { align: "right" });
    currentY += amountLines.length * 4.5 + 4;
  }

  if (resolvedConfigurations.showBankDetails) {
    const bankInfo = bankDetails || org || {};
    const bankLines = [
      bankInfo?.bankName ? `Bank: ${bankInfo.bankName}` : null,
      bankInfo?.accountNumber ? `A/C No: ${bankInfo.accountNumber}` : null,
      bankInfo?.account ? `A/C No: ${bankInfo.account}` : null,
      bankInfo?.ifsc ? `IFSC: ${bankInfo.ifsc}` : null,
    ].filter(Boolean);

    if (bankLines.length) {
      currentY = ensureSpace(doc, currentY, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Bank Details", margin, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      bankLines.forEach((line) => {
        doc.text(line, margin, currentY);
        currentY += 4.5;
      });
      currentY += 2;
    }
  }

  if (resolvedConfigurations.showTeamsAndConditions) {
    const terms = Array.isArray(org?.termsAndConditions)
      ? org.termsAndConditions
      : Array.isArray(configurations?.termsAndConditions)
        ? configurations.termsAndConditions
        : typeof configurations?.termsAndConditions === "string"
          ? configurations.termsAndConditions
              .split("\n")
              .map((term) => term.trim())
              .filter(Boolean)
          : [];

    if (terms.length) {
      currentY = ensureSpace(doc, currentY, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Terms & Conditions", margin, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      terms.forEach((term, index) => {
        const lines = doc.splitTextToSize(
          `${index + 1}. ${term}`,
          pageWidth - margin * 2
        );
        doc.text(lines, margin, currentY);
        currentY += lines.length * 4.5;
      });
    }
  }

  const fileName = `SaleOrder-${saleOrder?.voucher_number || "document"}.pdf`;
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank");
  doc.save(fileName);
}
