// components/ChartPlaceholder.jsx
import React from "react";
import "./ChartPlaceholder.css";

function ChartPlaceholder({ title }) {
  return (
    <div className="chart-card card shadow-sm mb-4">
      <div className="chart-header card-header">
        <h6 className="m-0 fw-bold">{title}</h6>
      </div>
      <div className="chart-body card-body">
        <span className="text-muted">[ {title} Chart Here ]</span>
      </div>
    </div>
  );
}

export default ChartPlaceholder;
