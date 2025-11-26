export const getCurrencyCode = () => {
  try {
    return localStorage.getItem("currencyCode") || "PKR";
  } catch {
    return "PKR";
  }
};

export const formatCurrency = (value) => {
  const code = getCurrencyCode();
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(Number(value || 0));
  } catch {
    return `${code} ${Number(value || 0).toLocaleString()}`;
  }
};

export default formatCurrency;