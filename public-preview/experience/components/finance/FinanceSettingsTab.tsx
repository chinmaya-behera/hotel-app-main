'use client';

import {useDemo} from '@/lib/store';
import { useState } from 'react';
import {
  Settings,
  DollarSign,
  CreditCard,
  Receipt,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Save,
  HelpCircle,
  Database
} from 'lucide-react';

export function FinanceSettingsTab() {
  const {state,account,savePreferences}=useDemo();
  const prefs=(state as any).preferences?.[account?.username||'']?.finance||{};
  const [currency] = useState('INR (₹)');
  const [taxRate, setTaxRate] = useState(prefs.taxRate??18);
  const [invoicePrefix, setInvoicePrefix] = useState(prefs.invoicePrefix??'INV-2026-');
  const [autoReconcile, setAutoReconcile] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences('finance',{currency,taxRate,invoicePrefix,autoReconcile:false});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary-400" />
          Financial Workspace Settings
        </h2>
        <p className="text-xs text-mist-400">
          Save invoice display preferences. Reconciliation requires an independent reviewer; no bank is connected.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Taxation & Currency Settings */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary-400" />
            Currency & Hospitality Taxation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-mist-300 mb-1">Accounting Currency</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-mist-400 cursor-not-allowed font-medium"
              />
              <p className="text-[10px] text-mist-500 mt-1">Standardized to Indian Rupee (₹) across all folios.</p>
            </div>

            <div>
              <label className="block font-semibold text-mist-300 mb-1">Standard Luxury GST Rate (%)</label>
              <input
                type="number"
                min="0"
                max="28"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-white font-medium focus:border-primary-500 focus:outline-none"
              />
              <p className="text-[10px] text-mist-500 mt-1">Default 18% (9% Central GST + 9% State GST).</p>
            </div>
          </div>
        </div>

        {/* Invoice & Billing Configuration */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary-400" />
            Folio & Tax Invoice Sequences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-mist-300 mb-1">Invoice Reference Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-white font-mono focus:border-primary-500 focus:outline-none"
              />
              <p className="text-[10px] text-mist-500 mt-1">Used when generating new guest room folios.</p>
            </div>

            <div>
              <label className="block font-semibold text-mist-300 mb-1">Payment Settlement Terms</label>
              <select className="w-full px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-mist-200 focus:border-primary-500 focus:outline-none">
                <option value="immediate">Due Upon Room Checkout (Standard)</option>
                <option value="net7">Corporate Net 7 Days</option>
                <option value="net15">Corporate Net 15 Days</option>
              </select>
              <p className="text-[10px] text-mist-500 mt-1">Standard folio payment window for guest departures.</p>
            </div>
          </div>
        </div>

        {/* Reconciliation Automation Rules */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Gateway Reconciliation Automation
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-ink-950/60 border border-white/5 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Auto-Match Bank Settlement Batches</p>
                <p className="text-[10px] text-mist-400">Automatically flag transactions as reconciled when reference UTR and amount match</p>
              </div>
              <input
                type="checkbox"
                checked={autoReconcile}
                disabled title="Independent review is required"
                className="rounded bg-ink-900 border-white/20 text-primary-600 h-4 w-4 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-ink-900 border border-white/10 shadow-lg">
          <div className="text-xs text-mist-400">
            {saved ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Preferences updated successfully for this session.
              </span>
            ) : (
              <span>Changes apply immediately to your active financial console view.</span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Preferences
          </button>
        </div>

      </form>

      {/* Simulated Mode Disclaimer Box */}
      <div className="p-4 rounded-2xl bg-ink-950 border border-blue-500/20 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
          <HelpCircle className="h-4 w-4" />
          Simulated Frontend Accounting Environment
        </div>
        <p className="text-xs text-mist-400 leading-relaxed">
          This Financial Operations module operates entirely within the frontend client application state using mock hotel ledger data. Real money transfers, banking clearing houses (NEFT/RTGS), payment gateway APIs (Razorpay/Stripe), and backend accounting ERP databases are not called.
        </p>
      </div>

    </div>
  );
}
