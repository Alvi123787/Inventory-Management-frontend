import React, { useEffect, useState } from "react";
import SettingsService from "../services/settingsService";
import "./TaxDiscountSettings.css";

export default function TaxDiscountSettings() {
  const [form, setForm] = useState({ tax_inclusive: false, default_tax_rate: 0, default_discount_rate: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await SettingsService.getSettings();
        if (res.success && res.data) {
          setForm({
            tax_inclusive: !!res.data.tax_inclusive,
            default_tax_rate: Number(res.data.default_tax_rate || 0),
            default_discount_rate: Number(res.data.default_discount_rate || 0)
          });
        }
      } catch (e) {
        setMessage("Failed to load settings");
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e) => {
    setForm((prev) => ({ ...prev, tax_inclusive: e.target.checked }));
  };

  const save = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        tax_inclusive: !!form.tax_inclusive,
        default_tax_rate: Number(form.default_tax_rate || 0),
        default_discount_rate: Number(form.default_discount_rate || 0)
      };
      const res = await SettingsService.updateSettings(payload);
      if (res.success) setMessage("Settings saved successfully");
      else setMessage(res.message || "Failed to save settings");
    } catch (e) {
      setMessage("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const resetDefaults = () => setForm({ tax_inclusive: false, default_tax_rate: 0, default_discount_rate: 0 });

  return (
    <div className="tax-discount-settings">
      <div className="tax-discount-settings__header">
        <h2 className="tax-discount-settings__title">Tax & Discount Settings</h2>
        <p className="tax-discount-settings__subtitle">Configure defaults for manual orders and tax-inclusive pricing.</p>
      </div>

      <div className="tax-discount-settings__form">
        <div className="tax-discount-settings__checkbox">
          <input 
            type="checkbox" 
            id="taxInclusive" 
            className="tax-discount-settings__checkbox-input"
            checked={!!form.tax_inclusive} 
            onChange={handleToggle} 
          />
          <label htmlFor="taxInclusive" className="tax-discount-settings__checkbox-label">
            Prices are tax-inclusive
          </label>
        </div>

        <div className="tax-discount-settings__row">
          <div className="tax-discount-settings__field">
            <label className="tax-discount-settings__label">Default Tax Rate (%)</label>
            <input
              className="tax-discount-settings__input"
              name="default_tax_rate"
              type="number"
              min="0"
              step="0.01"
              value={form.default_tax_rate}
              onChange={handleChange}
              placeholder="e.g., 10"
            />
          </div>
          <div className="tax-discount-settings__field">
            <label className="tax-discount-settings__label">Default Discount Rate (%)</label>
            <input
              className="tax-discount-settings__input"
              name="default_discount_rate"
              type="number"
              min="0"
              step="0.01"
              value={form.default_discount_rate}
              onChange={handleChange}
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <div className="tax-discount-settings__actions">
          <button 
            className="tax-discount-settings__btn tax-discount-settings__btn--primary" 
            onClick={save} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
          <button 
            className="tax-discount-settings__btn tax-discount-settings__btn--secondary" 
            onClick={resetDefaults} 
            disabled={loading}
          >
            Reset
          </button>
        </div>
        
        {message && (
          <div className={`tax-discount-settings__alert ${message.includes("Failed") ? 'tax-discount-settings__alert--error' : 'tax-discount-settings__alert--success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}