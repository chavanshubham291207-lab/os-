"use client";

import React, { useState } from "react";
import { Send, ShieldAlert, Sparkles, AlertCircle, Link2, MessageSquare, UserCheck } from "lucide-react";

interface FormProps {
  onSubmit: (data: { message_text: string; link: string; user_action: string }) => void;
  isLoading: boolean;
}

export function InvestigationForm({ onSubmit, isLoading }: FormProps) {
  const [messageText, setMessageText] = useState("");
  const [link, setLink] = useState("");
  const [userAction, setUserAction] = useState("Just received");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !link.trim()) return;
    onSubmit({
      message_text: messageText.trim(),
      link: link.trim(),
      user_action: userAction,
    });
  };

  const loadPreset = (scenario: "bank_otp" | "lottery" | "courier") => {
    if (scenario === "bank_otp") {
      setMessageText("URGENT from STATE-BANK: Your account is temporarily blocked due to pending KYC. Click http://127.0.0.1:8000/mock-scam/bank-otp to verify immediately.");
      setLink("http://127.0.0.1:8000/mock-scam/bank-otp");
      setUserAction("Entered OTP");
    } else if (scenario === "lottery") {
      setMessageText("CONGRATULATIONS! Your mobile number won $250,000 in the Jubilee Draw. Claim at http://127.0.0.1:8000/mock-scam/lottery-claim before midnight.");
      setLink("http://127.0.0.1:8000/mock-scam/lottery-claim");
      setUserAction("Clicked link");
    } else {
      setMessageText("FedEx Express: Parcel #US-98124 failed delivery due to missing apartment unit. Update details here: http://suspicious-delivery-portal.xyz/track");
      setLink("http://suspicious-delivery-portal.xyz/track");
      setUserAction("Just received");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Preset Test Scenarios */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider">Quick Hackathon Test Scenarios</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">1-Click Test Harness</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => loadPreset("bank_otp")}
            className="p-3 text-left rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 hover:border-red-600 transition-all text-xs group"
          >
            <div className="font-semibold text-red-300 flex items-center justify-between">
              <span>TC2: Fake OTP Page</span>
              <span className="text-[10px] bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded">ABORT</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Tests OTP detection killswitch & zero data entry.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset("lottery")}
            className="p-3 text-left rounded-lg bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-800/40 hover:border-emerald-600 transition-all text-xs group"
          >
            <div className="font-semibold text-emerald-300 flex items-center justify-between">
              <span>TC1: Suspicious Prize</span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded">INSPECT</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Tests safe page inspection & evidence screenshot.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset("courier")}
            className="p-3 text-left rounded-lg bg-blue-950/20 hover:bg-blue-950/40 border border-blue-800/40 hover:border-blue-600 transition-all text-xs group"
          >
            <div className="font-semibold text-blue-300 flex items-center justify-between">
              <span>Phishing SMS Alert</span>
              <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded">GENERAL</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Simulates spoofed courier parcel phishing lure.
            </p>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>Submit Suspicious Incident</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Input the deceptive SMS message and link. Our isolated Playwright sandbox will inspect the target under strict zero-interaction protocols.
          </p>
        </div>

        {/* Message Text Input */}
        <div className="mb-5">
          <label htmlFor="message_text" className="block text-xs font-mono font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Message Text / SMS Body *</span>
          </label>
          <textarea
            id="message_text"
            rows={3}
            required
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Paste the suspicious SMS, WhatsApp message, or email body received..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all resize-none"
          />
        </div>

        {/* Suspicious Link Input */}
        <div className="mb-5">
          <label htmlFor="link" className="block text-xs font-mono font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suspicious Link / URL *</span>
          </label>
          <input
            id="link"
            type="text"
            required
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="e.g. http://127.0.0.1:8000/mock-scam/bank-otp or https://verify-kyc-alert.xyz"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all font-mono"
          />
        </div>

        {/* What Did You Do Dropdown */}
        <div className="mb-6">
          <label htmlFor="user_action" className="block text-xs font-mono font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>What did you do? *</span>
          </label>
          <div className="relative">
            <select
              id="user_action"
              value={userAction}
              onChange={(e) => setUserAction(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Just received">Just received (No link opened)</option>
              <option value="Clicked link">Clicked link (Viewed page only)</option>
              <option value="Entered OTP">Entered OTP (Submitted credentials / PIN / OTP)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Crucial for tailoring remediation steps and determining emergency financial exposure.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !messageText.trim() || !link.trim()}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4 text-slate-950" />
          <span>Launch Sandbox Investigation</span>
        </button>
      </form>
    </div>
  );
}
