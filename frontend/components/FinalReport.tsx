"use client";

import React, { useState } from "react";
import { 
  CheckCircle, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  PlusCircle, 
  ExternalLink,
  Lock,
  Clock,
  Building2
} from "lucide-react";
import { InvestigationData } from "./DraftReport";

interface FinalReportProps {
  data: InvestigationData;
  caseReference: string;
  onReset: () => void;
}

export function FinalReport({ data, caseReference, onReset }: FinalReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(caseReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>OFFICIALLY REGISTERED & TRANSMITTED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cybercrime Case Reference Docket
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              This incident has been cataloged into the Central Cybercrime Incident Repository for tactical domain takedown and forensic attribution.
            </p>
          </div>

          {/* Prominent Case ID Card */}
          <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-inner flex flex-col items-center justify-center min-w-[220px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Official Case Reference
            </span>
            <div className="text-2xl font-mono font-black text-emerald-400 tracking-wider my-1.5 flex items-center space-x-2">
              <span>{caseReference}</span>
            </div>
            <button
              onClick={handleCopy}
              className="mt-1 flex items-center space-x-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Reference ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CRITICAL STATUTORY WARNING REQUIRED BY SPECIFICATION */}
        <div className="mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-600/70 flex items-center space-x-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold tracking-wide">
            Note: This does not guarantee money recovery.
          </p>
        </div>
      </div>

      {/* Case Details Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filing Status</span>
          </div>
          <span className="text-emerald-400 font-bold">APPROVED & SUBMITTED</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1 mb-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Jurisdiction</span>
          </div>
          <span className="text-slate-200">National Cyber Cell (CFIR)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px] flex items-center space-x-1 mb-1">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Assigned Triage Cell</span>
          </div>
          <span className="text-slate-200">Financial Phishing Incident Unit</span>
        </div>
      </div>

      {/* Recommended Next Actions Checklist */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Immediate Protective Protocol For Victim</span>
        </h3>
        
        <div className="space-y-3">
          {data.next_steps.map((step, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600/60 text-cyan-300 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Forensic Fact Sheet */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
          Evidence Summary Log
        </h3>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-slate-300">
          <div><strong className="text-slate-400">Suspect URL:</strong> {data.link}</div>
          <div><strong className="text-slate-400">Message Body:</strong> {data.message_text}</div>
          <div><strong className="text-slate-400">User Action:</strong> {data.user_action}</div>
          <div><strong className="text-slate-400">Playwright Sandbox:</strong> {data.playwright_status === "aborted" ? "ABORTED (Fake OTP Detected - Zero interaction)" : "INSPECTED (Full-page evidence logged)"}</div>
          <div><strong className="text-slate-400">Threat Assessment:</strong> {data.risk_level} Risk</div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono transition-all flex items-center justify-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF Docket</span>
        </button>

        <button
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Investigate Another Incident</span>
        </button>
      </div>
    </div>
  );
}
