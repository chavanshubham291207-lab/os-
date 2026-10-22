"use client";

import React from "react";
import { 
  AlertOctagon, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  Camera, 
  FileText, 
  Globe, 
  ExternalLink, 
  ArrowRight, 
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export interface InvestigationData {
  id: number;
  message_text: string;
  link: string;
  user_action: string;
  domain_info?: string;
  domain_data?: {
    hostname?: string;
    resolved_ip?: string;
    domain_age?: string;
    registrar?: string;
    threat_score?: number;
    flags?: Record<string, boolean>;
  };
  screenshot_path?: string;
  screenshot_url?: string;
  risk_summary: string;
  risk_level: string;
  next_steps: string[];
  status: string;
  playwright_status?: string;
  playwright_reason?: string;
  extracted_text?: string;
}

interface DraftReportProps {
  data: InvestigationData;
  onApprove: () => void;
  onReset: () => void;
  isApproving: boolean;
}

export function DraftReport({ data, onApprove, onReset, isApproving }: DraftReportProps) {
  const isAborted = data.playwright_status === "aborted";
  const screenshotSrc = data.screenshot_url 
    ? (data.screenshot_url.startsWith("http") ? data.screenshot_url : `${API_BASE_URL}${data.screenshot_url}`)
    : null;

  const riskBadgeColor = {
    High: "bg-red-950/80 text-red-400 border-red-700/60 shadow-red-900/30",
    Medium: "bg-amber-950/80 text-amber-400 border-amber-700/60 shadow-amber-900/30",
    Med: "bg-amber-950/80 text-amber-400 border-amber-700/60 shadow-amber-900/30",
    Low: "bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-emerald-900/30",
  }[data.risk_level] || "bg-red-950/80 text-red-400 border-red-700/60";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Investigation Draft Case #{data.id}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Pending Human Approval
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Forensic Incident Analysis & Triage Draft
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-4 py-1.5 rounded-full border shadow-lg font-mono font-bold text-sm flex items-center space-x-2 ${riskBadgeColor}`}>
            <AlertOctagon className="w-4 h-4" />
            <span>RISK LEVEL: {data.risk_level.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Zero-Interaction / Playwright Status Banner */}
      {isAborted ? (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/80 flex items-start space-x-3 text-red-200">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-red-300 uppercase tracking-wide">
              CRITICAL SAFETY TRIGGER: {data.playwright_reason || "Fake OTP page detected. No data entered."}
            </p>
            <p className="text-slate-300">
              The automated sandbox detected password or OTP input harvesters on the destination page. In accordance with strict cybersecurity zero-interaction rules, the browser process was terminated immediately. <strong className="text-emerald-400 font-mono">No credentials were entered.</strong>
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start space-x-3 text-cyan-200">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-cyan-300 uppercase tracking-wide">
              ISOLATED SANDBOX INSPECTION COMPLETED
            </p>
            <p className="text-slate-300">
              The page was safely rendered in an isolated headless browser. Form inputs were scanned for credential harvesting. Full-page forensic screenshot evidence was captured.
            </p>
          </div>
        </div>
      )}

      {/* User Facts & Incident Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Target URL</div>
          <p className="text-xs font-mono text-cyan-300 break-all select-all font-semibold">
            {data.link}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">User Reported Action</div>
          <p className="text-xs text-amber-300 font-semibold">
            {data.user_action}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Domain Registrar & Age</div>
          <p className="text-xs text-slate-300">
            {data.domain_data?.domain_age || "3 days old (High Risk)"}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {data.domain_data?.registrar || "Privacy Protected"}
          </p>
        </div>
      </div>

      {/* AI Risk Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>AI Threat Analysis & Risk Summary</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-sans">
          {data.risk_summary}
        </p>

        {/* Immediate Next Steps */}
        {data.next_steps && data.next_steps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Recommended Protective Actions:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {data.next_steps.map((step, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-mono font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Extracted Text & Screenshot Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Extracted Page Text */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-300 flex items-center space-x-1.5 font-semibold">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Extracted Page Text</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">DOM Body</span>
          </div>
          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-y-auto max-h-64 whitespace-pre-wrap leading-relaxed">
            {data.extracted_text || (isAborted ? "Inspection aborted immediately prior to body extraction to prevent script execution on credential harvester." : "No body text extracted.")}
          </div>
        </div>

        {/* Screenshot Evidence */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-300 flex items-center space-x-1.5 font-semibold">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Forensic Screenshot Evidence</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">1280x800 Viewport</span>
          </div>
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[220px] max-h-64 relative group">
            {screenshotSrc ? (
              <img
                src={screenshotSrc}
                alt="Forensic Evidence Capture"
                className="w-full h-full object-contain object-top group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500/60 mx-auto" />
                <p>Screenshot suppressed by safety killswitch (Aborted prior to capture to prevent credential exposure).</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Approval Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Human-in-the-Loop Review</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirm these findings are accurate before formally registering this incident into the Cybercrime National Database.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onReset}
            disabled={isApproving}
            className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all flex items-center justify-center space-x-1.5 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={isApproving}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>Approve & Submit Report</span>
            <ArrowRight className="w-4 h-4 text-slate-950 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
