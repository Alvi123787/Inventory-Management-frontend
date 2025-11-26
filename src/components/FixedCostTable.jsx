import React from "react";
import "./FixedCostTable.css";
import { formatCurrency } from "../utils/currency";

function FixedCostTable({ items }) {
  const total = items.reduce((sum, it) => sum + it.amount, 0);

  return (
    <div className="fixed-cost card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h5 className="m-0 fw-bold text-primary">Fixed Costs</h5>
      </div>

      <div className="card-body p-0">
        <table className="table table-striped mb-0">
          <thead className="table-header">
            <tr>
              <th>Item</th>
              <th className="text-end">Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it.name}>
                <td>{it.name}</td>
                <td className="text-end">{formatCurrency(it.amount)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot className="table-footer">
            <tr>
              <td><strong>Total</strong></td>
              <td className="text-end"><strong>{formatCurrency(total)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default FixedCostTable;
