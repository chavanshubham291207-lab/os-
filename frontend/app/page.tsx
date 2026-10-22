"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { InvestigationForm } from "@/components/InvestigationForm";
import { LoadingTelemetry } from "@/components/LoadingTelemetry";
import { DraftReport, InvestigationData } from "@/components/DraftReport";
import { FinalReport } from "@/components/FinalReport";
import { VoiceAgent } from "@/components/VoiceAgent";
import { API_BASE_URL } from "@/lib/config";
import { AlertCircle, FileText, Mic, Sparkles, Sliders } from "lucide-react";

type ViewState = "form" | "investigating" | "draft" | "final";
type Mode = "manual" | "voice";

export default function Home() {
  const [activeMode, setActiveMode] = useState<Mode>("manual");
  const [view, setView] = useState<ViewState>("form");
  const [investigationData, setInvestigationData] = useState<InvestigationData | null>(null);
  const [caseReference, setCaseReference] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Manual Form Submission -> /api/investigate
  const handleInvestigate = async (formData: {
    message_text: string;
    link: string;
    user_action: string;
  }) => {
    setError(null);
    setView("investigating");

    try {
      const res = await fetch(`${API_BASE_URL}/api/investigate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errDetail = await res.json().catch(() => ({}));
        throw new Error(errDetail.detail || `Server responded with status ${res.status}`);
      }

      const data: InvestigationData = await res.json();
      setInvestigationData(data);
      setView("draft");
    } catch (err: any) {
      console.error("Investigation error:", err);
      setError(
        err.message || "Failed to reach inspection sandbox. Please ensure the backend is running."
      );
      setView("form");
    }
  };

  // Handle Human Approval -> /api/approve/{case_id}
  const handleApprove = async () => {
    if (!investigationData) return;
    setIsApproving(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/approve/${investigationData.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errDetail = await res.json().catch(() => ({}));
        throw new Error(errDetail.detail || "Failed to approve and transmit report.");
      }

      const approvalResult = await res.json();
      setCaseReference(approvalResult.case_reference);
      setView("final");
    } catch (err: any) {
      console.error("Approval error:", err);
      setError(err.message || "Approval transmission failed. Please retry.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReset = () => {
    setInvestigationData(null);
    setCaseReference("");
    setError(null);
    setView("form");
  };

  // Called from VoiceAgent "View Full Report" button
  const handleVoiceViewFullReport = (data: InvestigationData, ref: string) => {
    setInvestigationData(data);
    setCaseReference(ref);
    setView("final");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-10">
        {/* Error notification banner if any */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white font-mono text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex items-center space-x-1.5 backdrop-blur-xl">
            <button
              onClick={() => {
                setActiveMode("manual");
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                activeMode === "manual"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Manual Form</span>
            </button>

            <button
              onClick={() => {
                setActiveMode("voice");
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all relative ${
                activeMode === "voice"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>AI Voice Agent</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                New
              </span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* MODE 1: MANUAL FORM PIPELINE                         */}
        {/* ==================================================== */}
        {activeMode === "manual" && (
          <>
            {view === "form" && (
              <InvestigationForm onSubmit={handleInvestigate} isLoading={false} />
            )}

            {view === "investigating" && <LoadingTelemetry />}

            {view === "draft" && investigationData && (
              <DraftReport
                data={investigationData}
                onApprove={handleApprove}
                onReset={handleReset}
                isApproving={isApproving}
              />
            )}

            {view === "final" && investigationData && (
              <FinalReport
                data={investigationData}
                caseReference={caseReference}
                onReset={handleReset}
              />
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* MODE 2: AI VOICE AGENT MODE                          */}
        {/* ==================================================== */}
        {activeMode === "voice" && (
          <>
            {view === "final" && investigationData ? (
              <FinalReport
                data={investigationData}
                caseReference={caseReference}
                onReset={handleReset}
              />
            ) : (
              <VoiceAgent onViewFullReport={handleVoiceViewFullReport} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Suspicious Link & SMS Investigator • Dual-Mode Cyber AI</span>
          <span>FastAPI • Playwright Sandbox • Web Speech API • n8n Webhook</span>
        </div>
      </footer>
    </div>
  );
}
