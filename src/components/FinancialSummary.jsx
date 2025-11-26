import React from "react";
import "./FinancialSummary.css";
import { formatCurrency } from "../utils/currency";

function FinancialSummary({ financials }) {
  const cards = [
    { title: "TOTAL SALES", value: financials.totalSales, color: "var(--color-success)" },
    { title: "TOTAL AD SPENDS", value: financials.totalAdSpends, color: "var(--color-warning)" },
    { title: "TOTAL DELIVERY CHARGES", value: financials.totalDeliveryCharges, color: "var(--color-accent)" },
  ];

  return (
    <div className="financial-summary row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-md-4" key={card.title}>
          <div className="fin-card shadow-sm">
            <div className="fin-title">{card.title}</div>
            <div className="fin-value" style={{ color: card.color }}>
              {formatCurrency(card.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FinancialSummary;
