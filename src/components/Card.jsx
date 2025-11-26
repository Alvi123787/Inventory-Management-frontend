// components/Card.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDollarSign,
  faShoppingCart,
  faChartLine,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import "./Card.css"; // ✅ external CSS import

// Dynamic icon mapping
const icons = {
  "fa-dollar-sign": faDollarSign,
  "fa-shopping-cart": faShoppingCart,
  "fa-chart-line": faChartLine,
  "fa-exclamation-triangle": faExclamationTriangle,
};

function Card({ title, value, icon, color }) {
  return (
    <div className="col-md-3 mb-3">
      <div className={`custom-card ${color}`}>
        <div className="icon-wrapper">
          <FontAwesomeIcon icon={icons[icon]} size="lg" />
        </div>
        <div className="card-text">
          <h6 className="card-title">{title}</h6>
          <h4 className="card-value">{value}</h4>
        </div>
      </div>
    </div>
  );
}

export default Card;
