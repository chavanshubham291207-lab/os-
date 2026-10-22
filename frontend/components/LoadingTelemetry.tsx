"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Search, Globe, Cpu, AlertTriangle } from "lucide-react";

const STAGES = [
  { text: "Spawning isolated Playwright Chromium instance...", icon: Globe },
  { text: "Enforcing zero-interaction sandbox policy (No form fills / No clicks)...", icon: ShieldCheck },
  { text: "Scanning DOM tree for OTP & credential input harvesters...", icon: Search },
  { text: "Querying domain WHOIS & registry threat indicators...", icon: AlertTriangle },
  { text: "Synthesizing AI cybercrime risk summary & containment plan...", icon: Cpu },
];

export function LoadingTelemetry() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-8 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 relative overflow-hidden backdrop-blur-xl">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center space-x-3 mb-6">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <h3 className="text-lg font-semibold text-white tracking-tight">
          Investigating Suspicious Submission
        </h3>
      </div>

      <div className="space-y-4 font-mono text-xs">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          const Icon = stage.icon;

          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 transition-all duration-300 ${
                isCurrent
                  ? "text-cyan-300 font-semibold translate-x-1"
                  : isDone
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                  isDone
                    ? "bg-emerald-950/80 border-emerald-600 text-emerald-400"
                    : isCurrent
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-500"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{stage.text}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>SECURITY LOCK: ISOLATED WORKER</span>
        <span>HEADLESS BROWSER ACTIVE</span>
      </div>
    </div>
  );
}
