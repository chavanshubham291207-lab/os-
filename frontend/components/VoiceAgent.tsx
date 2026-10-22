"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  AlertTriangle,
  FileText,
  ExternalLink,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle,
  Camera,
  ArrowRight,
  RefreshCw,
  Terminal,
  AlertCircle
} from "lucide-react";
import { N8N_WEBHOOK_URL, API_BASE_URL } from "@/lib/config";
import { InvestigationData } from "./DraftReport";

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  timestamp: string;
  text?: string;
  isVoice?: boolean;
  isError?: boolean;
  // Specific n8n response fields
  risk_summary?: string;
  evidence?: string | any;
  playwright_evidence?: string | any;
  evidence_link?: string;
  case_id?: string;
  risk_level?: string;
  next_steps?: string[];
  extracted_url?: string;
}

interface VoiceAgentProps {
  onViewFullReport: (data: InvestigationData, caseReference: string) => void;
}

export function VoiceAgent({ onViewFullReport }: VoiceAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: "Hello! I am your AI Cybercrime Voice Agent. Click the microphone button below or click a demo voice prompt to describe the suspicious SMS or link. I will trigger the automated threat investigation and report the forensic findings.",
    },
  ]);

  const [inputVoiceText, setInputVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          const cleanText = final.trim();
          setInputVoiceText(cleanText);
          setInterimTranscript("");
          // Auto submit when user finishes speaking
          handleVoiceSubmit(cleanText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech recognition initialization failed:", err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isInvestigating, interimTranscript]);

  // Toggle Voice Recognition
  const toggleListening = () => {
    if (!speechSupported) {
      alert(
        "Web Speech API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or type your message below."
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        setInputVoiceText("");
        setInterimTranscript("");
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Text-to-Speech playback helper
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Extract URLs from text
  const extractUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const matches = text.match(urlRegex);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    const domainRegex = /([a-zA-Z0-9-]+\.(xyz|com|net|org|top|online|vip|live)[^\s]*)/gi;
    const domainMatches = text.match(domainRegex);
    if (domainMatches && domainMatches.length > 0) {
      return `http://${domainMatches[0]}`;
    }
    return null;
  };

  // Dispatch request to hardcoded n8n Webhook Test URL
  const handleVoiceSubmit = async (transcribedText: string) => {
    if (!transcribedText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: transcribedText,
      isVoice: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVoiceText("");
    setInterimTranscript("");
    setIsInvestigating(true);

    const extractedUrl = extractUrl(transcribedText) || "http://127.0.0.1:8000/mock-scam/bank-otp";

    try {
      console.log(`[n8n Webhook] POST -> ${N8N_WEBHOOK_URL}`);
      let responseData: any = null;

      // 1. Direct fetch to n8n webhook
      try {
        const res = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voice_text: transcribedText,
          }),
        });

        if (res.ok) {
          const rawData = await res.json();
          responseData = Array.isArray(rawData) ? rawData[0] : rawData;
          if (responseData && responseData.json) {
            responseData = responseData.json;
          }
        }
      } catch (directErr) {
        console.warn("Direct fetch error (checking proxy for CORS support):", directErr);
      }

      // 2. Fallback via Next.js proxy if browser CORS blocked direct fetch
      if (!responseData) {
        const proxyRes = await fetch("/api/n8n-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            webhook_url: N8N_WEBHOOK_URL,
            voice_text: transcribedText,
          }),
        });

        if (proxyRes.ok) {
          const rawData = await proxyRes.json();
          responseData = Array.isArray(rawData) ? rawData[0] : rawData;
          if (responseData && responseData.json) {
            responseData = responseData.json;
          }
        } else {
          throw new Error(`n8n webhook error ${proxyRes.status}`);
        }
      }

      if (!responseData) {
        throw new Error("Empty response received from n8n webhook");
      }

      // Parse JSON response data
      const riskSummary =
        responseData.risk_summary ||
        responseData.summary ||
        responseData.riskSummary ||
        "Threat investigation completed.";

      const rawEvidence =
        responseData.evidence ||
        responseData.playwright_evidence ||
        responseData.screenshot_url ||
        responseData.extracted_text ||
        "";

      let evidenceLink: string | undefined = undefined;
      if (typeof rawEvidence === "string") {
        if (rawEvidence.startsWith("http://") || rawEvidence.startsWith("https://")) {
          evidenceLink = rawEvidence;
        } else if (rawEvidence.includes("/static/")) {
          evidenceLink = `${API_BASE_URL}${rawEvidence}`;
        }
      } else if (typeof rawEvidence === "object" && rawEvidence !== null) {
        if (rawEvidence.screenshot_url) {
          evidenceLink = rawEvidence.screenshot_url.startsWith("http")
            ? rawEvidence.screenshot_url
            : `${API_BASE_URL}${rawEvidence.screenshot_url}`;
        }
      }

      const caseId =
        responseData.case_id ||
        responseData.case_reference ||
        responseData.caseId ||
        (responseData.id ? `CYB-2026-X${responseData.id}` : `CYB-2026-X${Math.floor(10 + Math.random() * 89)}`);

      const riskLevel =
        responseData.risk_level ||
        responseData.riskLevel ||
        (riskSummary.toLowerCase().includes("high")
          ? "High"
          : riskSummary.toLowerCase().includes("low")
          ? "Low"
          : "Medium");

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        risk_summary: riskSummary,
        evidence: rawEvidence,
        playwright_evidence: rawEvidence,
        evidence_link: evidenceLink,
        case_id: caseId,
        risk_level: riskLevel,
        next_steps: responseData.next_steps || responseData.nextSteps || [
          "Do not provide one-time passcodes, passwords, or personal banking credentials.",
          "Report the suspect communication to your financial institution and anti-fraud cell.",
          "Block the sender number and preserve forensic screenshots.",
        ],
        extracted_url: extractedUrl,
      };

      setMessages((prev) => [...prev, agentMessage]);

      // Read summary aloud if audio enabled
      if (agentMessage.risk_summary) {
        speakText(agentMessage.risk_summary);
      }
    } catch (err: any) {
      console.error("n8n Webhook error:", err);

      // Red bubble error notification
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "agent",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
          text: "Connection to n8n failed. Please check if the n8n webhook is listening (Test Event) and CORS is enabled.",
        },
      ]);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Build the InvestigationData docket for "View Full Report"
  const handleOpenFullReport = (msg: ChatMessage) => {
    const evidenceStr =
      typeof msg.evidence === "string"
        ? msg.evidence
        : typeof msg.playwright_evidence === "string"
        ? msg.playwright_evidence
        : JSON.stringify(msg.evidence || msg.playwright_evidence || "");

    const isAborted =
      evidenceStr.toLowerCase().includes("abort") ||
      evidenceStr.toLowerCase().includes("fake otp") ||
      (typeof msg.evidence === "object" && msg.evidence?.status === "aborted");

    const screenshotUrl =
      msg.evidence_link ||
      (typeof msg.evidence === "object" && msg.evidence?.screenshot_url
        ? msg.evidence.screenshot_url
        : typeof msg.playwright_evidence === "object" && msg.playwright_evidence?.screenshot_url
        ? msg.playwright_evidence.screenshot_url
        : typeof msg.evidence === "string" && msg.evidence.includes("/static/")
        ? msg.evidence
        : undefined);

    const fullData: InvestigationData = {
      id: Math.floor(100 + Math.random() * 900),
      message_text:
        messages.find((m) => m.sender === "user" && m.id < msg.id)?.text ||
        "Voice Reported Incident via AI Voice Investigator",
      link: msg.extracted_url || "http://127.0.0.1:8000/mock-scam/bank-otp",
      user_action: "Reported via AI Voice Agent",
      risk_summary: msg.risk_summary || "Automated cybercrime risk evaluation.",
      risk_level: msg.risk_level || "High",
      next_steps: msg.next_steps || [
        "Immediately contact bank to invalidate any exposed OTP or tokens.",
        "File an official docket reference with cybercrime law enforcement.",
        "Block malicious communication sender number.",
      ],
      status: "Approved",
      playwright_status: isAborted ? "aborted" : "inspected",
      playwright_reason: isAborted ? evidenceStr : undefined,
      screenshot_url: screenshotUrl,
      extracted_text:
        typeof msg.evidence === "object"
          ? msg.evidence.text
          : typeof msg.playwright_evidence === "object"
          ? msg.playwright_evidence.text
          : evidenceStr,
    };

    onViewFullReport(fullData, msg.case_id || "CYB-2026-X89");
  };

  // Sample quick voice prompts for demo convenience
  const samplePrompts = [
    {
      title: "Bank OTP Phishing",
      text: "I received an SMS: Your bank account is locked due to KYC. Verify now at http://127.0.0.1:8000/mock-scam/bank-otp",
    },
    {
      title: "Lottery Reward Scam",
      text: "Someone messaged me that I won a 250,000 dollar prize claim at http://127.0.0.1:8000/mock-scam/lottery-claim",
    },
    {
      title: "Suspicious Package SMS",
      text: "Urgent: Your delivery address has an unpaid fee. Re-confirm at http://suspicious-delivery-fee.xyz/pay",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner - Cleaned up for final demo */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30">
              <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI Voice Threat Investigator
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Speech Ready</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Web Speech API • Automated Voice Threat Sandbox & Forensic Triage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setTtsEnabled(!ttsEnabled);
              }}
              title={ttsEnabled ? "Mute Voice Feedback" : "Enable Voice Feedback"}
              className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center space-x-1.5 ${
                ttsEnabled
                  ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{ttsEnabled ? "Audio On" : "Audio Muted"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col h-[520px] overflow-hidden backdrop-blur-xl">
        {/* Chat History Messages */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950"
                    : msg.isError
                    ? "bg-red-600 text-white shadow-red-900/50"
                    : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-900/50"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-4 h-4 font-bold" />
                ) : msg.isError ? (
                  <AlertCircle className="w-4 h-4 font-bold" />
                ) : (
                  <Bot className="w-4 h-4 font-bold" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-cyan-950/70 border border-cyan-800/80 text-cyan-100 rounded-tr-none shadow-lg shadow-cyan-950/30"
                    : msg.isError
                    ? "bg-red-950/90 border border-red-700 text-red-100 rounded-tl-none shadow-xl shadow-red-950/40"
                    : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl"
                }`}
              >
                {/* Header row: Sender name & timestamp */}
                <div className="flex items-center justify-between gap-3 text-[10px] font-mono mb-2 opacity-80">
                  <span className="font-semibold uppercase tracking-wider">
                    {msg.sender === "user"
                      ? "You (Voice Input)"
                      : msg.isError
                      ? "Connection Status"
                      : "AI Cybercrime Agent"}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* RED ERROR BUBBLE */}
                {msg.isError ? (
                  <div className="p-4 rounded-2xl bg-red-950/90 border border-red-700 text-red-100 shadow-xl shadow-red-950/40">
                    <div className="flex items-start space-x-2.5">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="font-semibold text-red-200 text-xs sm:text-sm leading-relaxed">
                        {msg.text ||
                          "Connection to n8n failed. Please check if the n8n webhook is listening (Test Event) and CORS is enabled."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Plain text if greeting or user speech */}
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* STRUCTURED SECURITY REPORT (Risk Summary, Evidence, View Full Report) */}
                    {msg.risk_summary && (
                      <div className="space-y-3.5 mt-2">
                        {/* Status Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full border font-mono font-bold text-[11px] flex items-center space-x-1.5 shadow-sm ${
                              msg.risk_level?.toLowerCase() === "low"
                                ? "bg-emerald-950/90 border-emerald-700 text-emerald-400"
                                : msg.risk_level?.toLowerCase() === "medium"
                                ? "bg-amber-950/90 border-amber-700 text-amber-400"
                                : "bg-red-950/90 border-red-700 text-red-400"
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>RISK: {msg.risk_level?.toUpperCase() || "HIGH"}</span>
                          </span>

                          {msg.case_id && (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-600/70 text-cyan-300 font-mono font-bold text-[11px] flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-cyan-400" />
                              <span>CASE ID: {msg.case_id}</span>
                            </span>
                          )}
                        </div>

                        {/* 1. Risk Summary Box */}
                        <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-800 space-y-1.5 shadow-inner">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5 font-bold">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Risk Summary</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                            {msg.risk_summary}
                          </p>
                        </div>

                        {/* 2. Evidence Box */}
                        {(msg.evidence || msg.playwright_evidence || msg.evidence_link) && (
                          <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-800 space-y-2 shadow-inner">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 flex items-center justify-between font-bold">
                              <span className="flex items-center space-x-1.5">
                                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Evidence</span>
                              </span>
                              {msg.evidence_link && (
                                <a
                                  href={msg.evidence_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                                >
                                  <span>View Evidence Link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <p className="text-xs font-mono text-cyan-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 break-words leading-relaxed">
                              {typeof msg.evidence === "string"
                                ? msg.evidence
                                : typeof msg.playwright_evidence === "string"
                                ? msg.playwright_evidence
                                : JSON.stringify(msg.evidence || msg.playwright_evidence, null, 2)}
                            </p>

                            {/* Clickable Evidence link / button */}
                            {msg.evidence_link && (
                              <div className="pt-1">
                                <a
                                  href={msg.evidence_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-300 transition-colors"
                                >
                                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Open Evidence Screenshot</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. View Full Report Button */}
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenFullReport(msg)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center space-x-2"
                          >
                            <span>View Full Report</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-950 font-bold" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Loading Animation: "Agent is investigating threat..." */}
          {isInvestigating && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md text-white">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
              </div>

              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-950/90 border border-indigo-500/40 text-slate-200 shadow-xl space-y-2.5 min-w-[280px]">
                <div className="flex items-center space-x-2 text-xs font-mono text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-semibold text-cyan-300">Agent is investigating threat...</span>
                </div>

                <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Sending request to n8n Webhook</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span>Executing isolated sandbox security scan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span>Synthesizing cybercrime risk report</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interim speech transcript preview if listening */}
          {isListening && interimTranscript && (
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shrink-0 text-white animate-pulse">
                <Mic className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl rounded-tr-none bg-red-950/50 border border-red-700/60 text-red-200 text-xs italic font-mono">
                Listening: &ldquo;{interimTranscript}&rdquo;
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Listening Status Bar */}
        {isListening && (
          <div className="px-4 py-2 bg-red-950/60 border-t border-b border-red-800/80 flex items-center justify-between text-xs text-red-200 font-mono animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
              <span className="font-semibold">Microphone Live • Speak your suspicious message or URL now...</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-[11px] underline text-red-300 hover:text-white"
            >
              Stop Listening
            </button>
          </div>
        )}

        {/* Voice Agent Control & Input Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-3">
          {/* Prominent Center Mic Button & Controls */}
          <div className="flex items-center justify-between gap-3">
            {/* Quick Demo Voice Prompt Chips */}
            <div className="hidden sm:flex items-center space-x-2 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-500 uppercase text-[10px] shrink-0">Try demo prompt:</span>
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVoiceSubmit(sample.text)}
                  disabled={isInvestigating || isListening}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors shrink-0 truncate max-w-[160px]"
                  title={sample.text}
                >
                  {sample.title}
                </button>
              ))}
            </div>

            {/* Prominent Glowing Mic Button */}
            <div className="flex items-center justify-center mx-auto sm:mx-0">
              <button
                type="button"
                onClick={toggleListening}
                disabled={isInvestigating}
                className={`relative group px-5 py-3 rounded-2xl font-mono text-xs font-bold transition-all flex items-center space-x-2.5 shadow-2xl ${
                  isListening
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/50 ring-4 ring-red-500/40 animate-pulse"
                    : "bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:opacity-95 text-white shadow-indigo-500/30"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 text-white animate-bounce" />
                    <span>Listening... (Click to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 text-white" />
                    <span>Hold / Click Mic to Speak</span>
                  </>
                )}

                {/* Animated sound ripples */}
                {isListening && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Text input fallback for typing */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVoiceSubmit(inputVoiceText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVoiceText}
              onChange={(e) => setInputVoiceText(e.target.value)}
              placeholder="Or type/paste suspicious message text & link here..."
              disabled={isInvestigating || isListening}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
            <button
              type="submit"
              disabled={isInvestigating || isListening || !inputVoiceText.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center space-x-1"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
