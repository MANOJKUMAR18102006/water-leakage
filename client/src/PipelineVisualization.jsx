import React from "react";
import { Droplets, AlertTriangle, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Gauge, Activity, ArrowRight } from "lucide-react";
import "./pipeline.css";

export default function PipelineVisualization({ data = {}, running = false, valveOpen = true, onToggleValve }) {
  const latest = data.latest || {};
  const status = latest.status || (running ? "NORMAL" : "STANDBY");
  const leakZone = latest.leakZone || "None";
  const scenario = data.scenario || latest.scenario || "normal";
  
  // Real-time sensor values
  const inletFlow = Number(latest.inletFlow ?? (running ? (valveOpen ? 30.0 : 0) : 0)).toFixed(1);
  const outletFlow = Number(latest.outletFlow ?? (running ? (valveOpen ? 30.0 : 0) : 0)).toFixed(1);
  const pressure = Number(latest.pressure ?? (running ? (valveOpen ? 3.2 : 0) : 0)).toFixed(2);
  const estimatedLoss = Number(latest.estimatedLoss ?? 0).toFixed(1);
  const zoneFlows = latest.zoneFlows || (running && valveOpen ? [10.0, 10.0, 10.0] : [0, 0, 0]);
  const z1 = Number(zoneFlows[0] ?? 0).toFixed(1);
  const z2 = Number(zoneFlows[1] ?? 0).toFixed(1);
  const z3 = Number(zoneFlows[2] ?? 0).toFixed(1);

  // States
  const isValveOpen = valveOpen && latest.valveOpen !== false;
  const isIsolated = status === "ISOLATED" || !isValveOpen;
  const isRunningAndFlowing = running && isValveOpen && Number(inletFlow) > 0;

  // Leakage states
  const hasZone2Damage = (scenario === "small" || leakZone === "Zone 2") && status !== "NORMAL" && status !== "STANDBY";
  const isSmallLeak = hasZone2Damage && isValveOpen;

  const hasZone3Damage = (scenario === "major" || leakZone === "Zone 3") && (status === "CRITICAL" || status === "ISOLATED");
  const isMajorLeak = hasZone3Damage && isValveOpen;

  // Pressure gauge angle: 0 bar = -120 deg, 5 bar = +120 deg
  const pVal = Math.min(5, Math.max(0, Number(pressure)));
  const needleAngle = -120 + (pVal / 5) * 240;

  // Flow animation speeds based on flow rate (faster when flow is higher)
  const getFlowDuration = (flow) => {
    const f = Number(flow);
    if (!isRunningAndFlowing || f <= 0.1) return "0s";
    if (f > 20) return "1.2s";
    if (f > 15) return "1.6s";
    if (f > 8) return "2.0s";
    if (f > 4) return "2.8s";
    return "4.0s";
  };

  const inletDuration = getFlowDuration(inletFlow);
  const z1Duration = getFlowDuration(z1);
  const z2Duration = getFlowDuration(z2);
  const z3Duration = getFlowDuration(z3);

  return (
    <section className={`panel pipeline-panel ${isIsolated ? "isolated-panel" : isMajorLeak ? "critical-panel" : isSmallLeak ? "warning-panel" : ""}`}>
      {/* Top Header Bar */}
      <div className="pipeline-header">
        <div className="pipeline-title-group">
          <div className="pipeline-badge-icon">
            <Droplets className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3>Live Animated Water Pipeline Simulation</h3>
            <p>Cutaway hydrodynamic view · Real-time sensor synchronization & valve isolation</p>
          </div>
        </div>

        <div className="pipeline-header-status">
          {isIsolated ? (
            <span className="pipe-status-pill isolated">
              <ShieldAlert size={14} /> PIPELINE ISOLATED
            </span>
          ) : isMajorLeak ? (
            <span className="pipe-status-pill critical">
              <AlertTriangle size={14} /> CRITICAL LEAK – ZONE 3
            </span>
          ) : isSmallLeak ? (
            <span className="pipe-status-pill warning">
              <AlertTriangle size={14} /> LEAK DETECTED – ZONE 2
            </span>
          ) : isRunningAndFlowing ? (
            <span className="pipe-status-pill normal">
              <CheckCircle2 size={14} /> NORMAL FLOW ACTIVE
            </span>
          ) : (
            <span className="pipe-status-pill standby">
              STANDBY / IDLE
            </span>
          )}

          <div className={`valve-indicator ${isValveOpen ? "open" : "closed"}`}>
            <span className="valve-dot" />
            <small>VALVE V-01:</small>
            <b>{isValveOpen ? "OPEN" : "CLOSED"}</b>
          </div>
        </div>
      </div>

      {/* SVG Pipeline Visualization Canvas */}
      <div className="pipeline-canvas-wrap">
        <svg
          viewBox="0 0 1020 370"
          className="pipeline-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Metallic pipe gradient - outer steel shell */}
            <linearGradient id="pipeMetalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="15%" stopColor="#475569" />
              <stop offset="35%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="65%" stopColor="#64748b" />
              <stop offset="85%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Industrial Flange metallic gradient */}
            <linearGradient id="flangeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="25%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="75%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Valve Bonnet Gradient */}
            <linearGradient id="valveHousingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="30%" stopColor="#14b8a6" />
              <stop offset="70%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>

            {/* Valve Closed Gradient (Red emergency) */}
            <linearGradient id="valveClosedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="30%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>

            {/* Water Core Gradient - Deep realistic blue with cyan surface highlight */}
            <linearGradient id="waterCoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
              <stop offset="20%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#0369a1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.98" />
            </linearGradient>

            {/* Glass Cutaway reflection highlight */}
            <linearGradient id="glassReflection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Water spray / droplet radial gradient */}
            <radialGradient id="sprayGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>

            {/* Warning pulse glow */}
            <filter id="warningGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Critical pulse glow */}
            <filter id="criticalGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Shadow filter for realistic depth */}
            <filter id="pipeShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.18" />
            </filter>

            {/* Bolt head pattern */}
            <radialGradient id="boltGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>
          </defs>

          {/* Background Grid & Foundation Piers */}
          <g className="pipe-foundations">
            {/* Structural pipe concrete support cradles */}
            <rect x="50" y="240" width="44" height="48" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="300" y="240" width="46" height="48" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="580" y="240" width="46" height="48" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="850" y="240" width="46" height="48" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Foundation floor line - edge to edge */}
            <line x1="0" y1="288" x2="1020" y2="288" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
          </g>

          {/* ============================================================== */}
          {/* MAIN PIPELINE CASING (Continuous Outer Industrial Shell)       */}
          {/* ============================================================== */}
          <g filter="url(#pipeShadow)">
            {/* Outer Pipe Top & Bottom Steel Shell - full width 0 to 1020 */}
            <rect x="0" y="152" width="1020" height="84" fill="url(#pipeMetalGrad)" stroke="#1e293b" strokeWidth="2" />
          </g>

          {/* ============================================================== */}
          {/* CUTAWAY GLASS CONDUITS (Inside View of Water Flow)            */}
          {/* ============================================================== */}
          
          {/* --- INLET WATER FEED (Before Valve: X 16 to 135) --- */}
          <g className="pipe-channel-inlet">
            {/* Inner Channel Backing */}
            <rect x="16" y="165" width="119" height="58" fill="#0c4a6e" />
            {/* Water Fill */}
            <rect
              x="16"
              y="165"
              width="119"
              height="58"
              fill="url(#waterCoreGrad)"
              opacity={running && isValveOpen ? 0.95 : running ? 0.8 : 0.4}
            />
            {/* Flowing Water Particles Before Valve */}
            {isRunningAndFlowing && (
              <g className="flow-particles" style={{ animationDuration: inletDuration }}>
                <line x1="18" y1="180" x2="132" y2="180" stroke="#bae6fd" strokeWidth="3" strokeDasharray="16 14" className="stream-line" />
                <line x1="22" y1="205" x2="130" y2="205" stroke="#7dd3fc" strokeWidth="2.5" strokeDasharray="12 16" className="stream-line-rev" />
                <circle cx="45" cy="192" r="3.5" fill="#ffffff" opacity="0.8" className="bubble-1" />
                <circle cx="85" cy="176" r="2.5" fill="#ffffff" opacity="0.7" className="bubble-2" />
              </g>
            )}
            {/* Glass Cutaway Gloss */}
            <rect x="16" y="165" width="119" height="58" fill="url(#glassReflection)" />
          </g>

          {/* --- ZONE 1: PRIMARY FEED (X 195 to 435) --- */}
          <g className={`pipe-zone-group zone-1 ${isIsolated ? "flow-stopped" : ""}`}>
            <rect x="195" y="165" width="240" height="58" fill="#082f49" />
            {/* Water Core */}
            <rect
              x="195"
              y="165"
              width="240"
              height="58"
              fill="url(#waterCoreGrad)"
              opacity={isIsolated ? 0.25 : isRunningAndFlowing ? 0.95 : 0.35}
              className="water-rect"
            />
            {/* Active Flow Elements */}
            {isRunningAndFlowing && !isIsolated && (
              <g className="flow-elements-z1" style={{ animationDuration: z1Duration }}>
                {/* Moving Flow Waves & Arrows */}
                <line x1="195" y1="180" x2="435" y2="180" stroke="#bae6fd" strokeWidth="3.5" strokeDasharray="20 18" className="stream-line" />
                <line x1="205" y1="194" x2="430" y2="194" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="14 16" className="stream-line-fast" />
                <line x1="195" y1="208" x2="435" y2="208" stroke="#7dd3fc" strokeWidth="3" strokeDasharray="18 16" className="stream-line" />
                {/* Flow Bubbles */}
                <circle cx="230" cy="176" r="3" fill="#ffffff" opacity="0.85" className="bubble-1" />
                <circle cx="280" cy="202" r="4" fill="#ffffff" opacity="0.75" className="bubble-2" />
                <circle cx="340" cy="186" r="2.5" fill="#ffffff" opacity="0.8" className="bubble-1" />
                <circle cx="395" cy="200" r="3.5" fill="#ffffff" opacity="0.9" className="bubble-2" />
                {/* Direction Chevron Indicators */}
                <path d="M 250 188 L 258 194 L 250 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.65" />
                <path d="M 320 188 L 328 194 L 320 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.65" />
                <path d="M 380 188 L 388 194 L 380 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.65" />
              </g>
            )}
            {/* Glass reflection */}
            <rect x="195" y="165" width="240" height="58" fill="url(#glassReflection)" />
          </g>

          {/* --- ZONE 2: MID-TRUNK & SMALL LEAK LOCATION (X 455 to 705) --- */}
          <g className={`pipe-zone-group zone-2 ${isSmallLeak ? "zone-warning" : ""} ${isIsolated ? "flow-stopped" : ""}`}>
            <rect x="455" y="165" width="250" height="58" fill="#082f49" />
            <rect
              x="455"
              y="165"
              width="250"
              height="58"
              fill="url(#waterCoreGrad)"
              opacity={isIsolated ? 0.25 : isRunningAndFlowing ? (isSmallLeak ? 0.8 : 0.95) : 0.35}
            />
            {/* Active Flow Elements */}
            {isRunningAndFlowing && !isIsolated && (
              <g className="flow-elements-z2" style={{ animationDuration: z2Duration }}>
                <line x1="455" y1="180" x2="705" y2="180" stroke="#bae6fd" strokeWidth="3" strokeDasharray="18 18" className="stream-line" />
                <line x1="465" y1="194" x2="700" y2="194" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="12 18" className="stream-line-fast" />
                <line x1="455" y1="208" x2="705" y2="208" stroke="#7dd3fc" strokeWidth="2.5" strokeDasharray="16 18" className="stream-line" />
                <circle cx="490" cy="180" r="3" fill="#ffffff" opacity="0.8" className="bubble-1" />
                <circle cx="530" cy="204" r="3.5" fill="#ffffff" opacity="0.75" className="bubble-2" />
                <circle cx="630" cy="178" r="2.5" fill="#ffffff" opacity="0.75" className="bubble-1" />
                <circle cx="675" cy="202" r="3" fill="#ffffff" opacity="0.8" className="bubble-2" />
                {/* Chevrons */}
                <path d="M 510 188 L 518 194 L 510 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
                <path d="M 645 188 L 653 194 L 645 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
              </g>
            )}
            {/* Glass reflection */}
            <rect x="455" y="165" width="250" height="58" fill="url(#glassReflection)" />

            {/* Small Leak Warning Highlight Ring */}
            {isSmallLeak && (
              <rect x="455" y="152" width="250" height="84" rx="4" fill="none" stroke="#f59e0b" strokeWidth="3" filter="url(#warningGlow)" className="leak-boundary-warning" />
            )}
          </g>

          {/* --- ZONE 3: TERMINAL & MAJOR LEAK LOCATION (X 725 to 940) --- */}
          <g className={`pipe-zone-group zone-3 ${isMajorLeak ? "zone-critical" : ""} ${isIsolated ? "flow-stopped" : ""}`}>
            <rect x="725" y="165" width="215" height="58" fill="#082f49" />
            <rect
              x="725"
              y="165"
              width="215"
              height="58"
              fill="url(#waterCoreGrad)"
              opacity={isIsolated ? 0.2 : isRunningAndFlowing ? (isMajorLeak ? 0.6 : 0.95) : 0.35}
            />
            {/* Active Flow Elements */}
            {isRunningAndFlowing && !isIsolated && (
              <g className="flow-elements-z3" style={{ animationDuration: z3Duration }}>
                <line x1="725" y1="180" x2="940" y2="180" stroke="#bae6fd" strokeWidth="2.5" strokeDasharray="16 20" className="stream-line" />
                <line x1="725" y1="208" x2="940" y2="208" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="14 20" className="stream-line" />
                <circle cx="750" cy="182" r="2.5" fill="#ffffff" opacity="0.75" className="bubble-1" />
                <circle cx="880" cy="202" r="3" fill="#ffffff" opacity="0.7" className="bubble-2" />
                {/* Chevrons */}
                <path d="M 765 188 L 773 194 L 765 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
                <path d="M 870 188 L 878 194 L 870 200" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
              </g>
            )}
            {/* Glass reflection */}
            <rect x="725" y="165" width="215" height="58" fill="url(#glassReflection)" />

            {/* Major Leak Critical Highlight Ring */}
            {isMajorLeak && (
              <rect x="725" y="152" width="215" height="84" rx="4" fill="none" stroke="#ef4444" strokeWidth="3.5" filter="url(#criticalGlow)" className="leak-boundary-critical" />
            )}
          </g>

          {/* --- OUTLET DISCHARGE SECTION (X 940 to 1004) --- */}
          <g className="pipe-outlet">
            <rect x="940" y="165" width="64" height="58" fill="#082f49" />
            <rect
              x="940"
              y="165"
              width="64"
              height="58"
              fill="url(#waterCoreGrad)"
              opacity={isIsolated ? 0.15 : isRunningAndFlowing ? (isMajorLeak ? 0.35 : isSmallLeak ? 0.75 : 0.95) : 0.3}
            />
            {isRunningAndFlowing && !isIsolated && (
              <line x1="940" y1="194" x2="1004" y2="194" stroke="#e0f2fe" strokeWidth="2.5" strokeDasharray="10 14" className="stream-line-fast" style={{ animationDuration: z3Duration }} />
            )}
            <rect x="940" y="165" width="64" height="58" fill="url(#glassReflection)" />
          </g>

          {/* ============================================================== */}
          {/* INDUSTRIAL FLANGES & COUPLINGS (Connections between sections)  */}
          {/* ============================================================== */}
          {/* Inlet End Cap / Intake Manifold Flange - Anchored flush to X=0 */}
          <g className="flange-intake">
            <rect x="0" y="142" width="16" height="104" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="8" cy="155" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="8" cy="180" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="8" cy="208" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="8" cy="232" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
          </g>

          {/* Valve Coupling Flanges (Before and After Valve V-01) */}
          <g className="flange-valve-left">
            <rect x="135" y="146" width="12" height="96" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="141" cy="160" r="3" fill="url(#boltGrad)" />
            <circle cx="141" cy="228" r="3" fill="url(#boltGrad)" />
          </g>
          <g className="flange-valve-right">
            <rect x="183" y="146" width="12" height="96" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="189" cy="160" r="3" fill="url(#boltGrad)" />
            <circle cx="189" cy="228" r="3" fill="url(#boltGrad)" />
          </g>

          {/* Flange Joint 1-2 (Between Zone 1 and Zone 2) */}
          <g className="flange-joint-1-2">
            <rect x="435" y="146" width="10" height="96" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="445" y="146" width="10" height="96" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="445" y1="146" x2="445" y2="242" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="440" cy="158" r="3" fill="url(#boltGrad)" />
            <circle cx="440" cy="180" r="3" fill="url(#boltGrad)" />
            <circle cx="440" cy="208" r="3" fill="url(#boltGrad)" />
            <circle cx="440" cy="230" r="3" fill="url(#boltGrad)" />
            <circle cx="450" cy="158" r="3" fill="url(#boltGrad)" />
            <circle cx="450" cy="180" r="3" fill="url(#boltGrad)" />
            <circle cx="450" cy="208" r="3" fill="url(#boltGrad)" />
            <circle cx="450" cy="230" r="3" fill="url(#boltGrad)" />
          </g>

          {/* Flange Joint 2-3 (Between Zone 2 and Zone 3) */}
          <g className="flange-joint-2-3">
            <rect x="705" y="146" width="10" height="96" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="715" y="146" width="10" height="96" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="715" y1="146" x2="715" y2="242" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="710" cy="158" r="3" fill="url(#boltGrad)" />
            <circle cx="710" cy="180" r="3" fill="url(#boltGrad)" />
            <circle cx="710" cy="208" r="3" fill="url(#boltGrad)" />
            <circle cx="710" cy="230" r="3" fill="url(#boltGrad)" />
            <circle cx="720" cy="158" r="3" fill="url(#boltGrad)" />
            <circle cx="720" cy="180" r="3" fill="url(#boltGrad)" />
            <circle cx="720" cy="208" r="3" fill="url(#boltGrad)" />
            <circle cx="720" cy="230" r="3" fill="url(#boltGrad)" />
          </g>

          {/* Outlet Flange & Discharge Nozzle - Anchored flush to X=1020 */}
          <g className="flange-discharge">
            <rect x="1004" y="142" width="16" height="104" rx="2" fill="url(#flangeGrad)" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="1012" cy="155" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="1012" cy="180" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="1012" cy="208" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="1012" cy="232" r="3.5" fill="url(#boltGrad)" stroke="#1e293b" strokeWidth="0.8" />
          </g>

          {/* ============================================================== */}
          {/* MOTORIZED ISOLATION VALVE V-01 (Animated Cutoff Gate)          */}
          {/* ============================================================== */}
          <g className="isolation-valve-assembly" onClick={onToggleValve} style={{ cursor: "pointer" }}>
            {/* Valve Cast Body */}
            <rect x="147" y="144" width="36" height="100" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="2" />

            {/* Valve Bonnet & Actuator Stand */}
            <rect x="151" y="96" width="28" height="48" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            {/* Actuator Head Housing */}
            <rect
              x="142"
              y="58"
              width="46"
              height="38"
              rx="5"
              fill={isValveOpen ? "url(#valveHousingGrad)" : "url(#valveClosedGrad)"}
              stroke="#0f172a"
              strokeWidth="2"
              className="actuator-head"
            />
            {/* Top Handwheel / Actuator Crown */}
            <ellipse cx="165" cy="56" rx="20" ry="7" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
            <circle cx="165" cy="56" r="4" fill="#0f172a" />

            {/* Actuator Status Beacon LED */}
            <circle
              cx="165"
              cy="74"
              r="6.5"
              fill={isValveOpen ? "#22c55e" : "#ef4444"}
              stroke="#ffffff"
              strokeWidth="1.5"
              className={isValveOpen ? "valve-led-open" : "valve-led-closed"}
            />

            {/* Sliding Gate Blade / Wedge (Slides down to seal pipe when closed) */}
            <g
              className="valve-gate-wedge"
              style={{
                transform: isValveOpen ? "translateY(0px)" : "translateY(66px)",
                transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Valve Stem (Connecting Rod) */}
              <line x1="165" y1="96" x2="165" y2="152" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
              {/* Heavy Gate Disc Wedge */}
              <rect x="150" y="150" width="30" height="24" rx="2" fill={isValveOpen ? "#64748b" : "#ef4444"} stroke="#0f172a" strokeWidth="2" />
              {/* Red Resilient Seal Line */}
              <rect x="150" y="172" width="30" height="5" fill="#b91c1c" />
            </g>

            {/* Valve Label Tag */}
            <rect x="135" y="250" width="60" height="20" rx="4" fill="#0f172a" />
            <text x="165" y="264" textAnchor="middle" fill={isValveOpen ? "#4ade80" : "#f87171"} fontSize="10" fontWeight="bold" fontFamily="monospace">
              {isValveOpen ? "V-01: OPEN" : "V-01: SHUT"}
            </text>
          </g>

          {/* ============================================================== */}
          {/* ANALOG PRESSURE GAUGE (Mounted on Zone 1 tap)                  */}
          {/* ============================================================== */}
          <g className="pressure-gauge-assembly" transform="translate(265, 52)">
            {/* Brass Tap Stem */}
            <rect x="17" y="52" width="6" height="42" fill="#d97706" stroke="#92400e" strokeWidth="1" />
            {/* Hex Nut */}
            <rect x="14" y="80" width="12" height="8" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            {/* Gauge Outer Bezel */}
            <circle cx="20" cy="28" r="28" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
            {/* Gauge Dial Face */}
            <circle cx="20" cy="28" r="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            {/* Gauge Ticks */}
            <path d="M 5 28 A 15 15 0 0 1 35 28" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="3 4" />
            {/* Red Warning Zone (Over 4 bar) */}
            <path d="M 31 18 A 15 15 0 0 1 35 28" fill="none" stroke="#ef4444" strokeWidth="3" />
            {/* Rotating Gauge Needle */}
            <line
              x1="20"
              y1="28"
              x2="20"
              y2="10"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                transformOrigin: "20px 28px",
                transform: `rotate(${needleAngle}deg)`,
                transition: "transform 0.6s ease-out",
              }}
            />
            <circle cx="20" cy="28" r="3.5" fill="#0f172a" />
            {/* Gauge Digital readout */}
            <rect x="2" y="36" width="36" height="12" rx="2" fill="#0f172a" />
            <text x="20" y="45" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
              {pressure} bar
            </text>
          </g>

          {/* ============================================================== */}
          {/* SMALL LEAK VISUALIZATION – ZONE 2                              */}
          {/* ============================================================== */}
          {hasZone2Damage && (
            <g className="leak-zone2-effects">
              {/* Pipe Stress Fissure / Crack Graphic on bottom wall */}
              <path d="M 570 223 L 575 227 L 572 231 L 580 236 L 577 240 L 584 243" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              <path d="M 572 227 L 578 229" fill="none" stroke="#ef4444" strokeWidth="2" />

              {/* Leaking Escaping Water Droplets & Spray (Only when valve is open) */}
              {isSmallLeak && (
                <>
                  <g className="escaping-droplets">
                    <circle cx="578" cy="242" r="3.5" fill="#38bdf8" className="drip drip-1" />
                    <circle cx="576" cy="248" r="3" fill="#0284c7" className="drip drip-2" />
                    <circle cx="581" cy="254" r="2.5" fill="#7dd3fc" className="drip drip-3" />
                    <circle cx="575" cy="262" r="3" fill="#38bdf8" className="drip drip-4" />
                    <circle cx="580" cy="272" r="2" fill="#bae6fd" className="drip drip-5" />
                  </g>

                  {/* Fine water mist spray jet leaking from crack */}
                  <path
                    d="M 577 236 Q 565 255 560 270"
                    fill="none"
                    stroke="url(#sprayGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="mist-spray"
                  />

                  {/* Water Splash Puddle on Catch Basin */}
                  <ellipse cx="578" cy="286" rx="22" ry="6" fill="#0284c7" opacity="0.45" />
                  <ellipse cx="578" cy="286" rx="14" ry="4" fill="#38bdf8" opacity="0.65" className="puddle-ripple" />

                  {/* Leak Detected Warning Badge Callout */}
                  <g className="leak-badge-z2" transform="translate(510, 298)">
                    <rect x="0" y="0" width="145" height="34" rx="6" fill="#78350f" stroke="#f59e0b" strokeWidth="2" filter="url(#warningGlow)" />
                    <text x="72" y="15" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="bold">
                      ⚠️ LEAK DETECTED – ZONE 2
                    </text>
                    <text x="72" y="27" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="600">
                      Loss: ~{estimatedLoss} L/min · P: {pressure} bar
                    </text>
                  </g>
                </>
              )}
            </g>
          )}

          {/* ============================================================== */}
          {/* MAJOR LEAK VISUALIZATION – ZONE 3                              */}
          {/* ============================================================== */}
          {hasZone3Damage && (
            <g className="leak-zone3-effects">
              {/* Severe Pipe Rupture on Upper Wall */}
              <path
                d="M 816 154 L 824 146 L 828 152 L 836 144 L 840 152 L 848 147"
                fill="none"
                stroke="#dc2626"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <polygon points="820,152 825,142 832,148 838,140 844,148 840,154" fill="#ef4444" opacity="0.85" />

              {/* Violent High-Pressure Water Spray Geyser (Only when Valve is OPEN) */}
              {isMajorLeak && (
                <g className="geyser-spray-group">
                  {/* Main Upward High-Velocity Plumes */}
                  <path d="M 825 146 Q 815 105 795 70" fill="none" stroke="#bae6fd" strokeWidth="6" strokeLinecap="round" className="geyser-jet jet-left" />
                  <path d="M 832 144 Q 832 90 832 54" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" className="geyser-jet jet-center" />
                  <path d="M 838 146 Q 848 105 870 72" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" className="geyser-jet jet-right" />

                  {/* Turbulent Spray Cloud */}
                  <circle cx="832" cy="55" r="18" fill="url(#sprayGrad)" className="spray-cloud cloud-1" />
                  <circle cx="810" cy="72" r="14" fill="url(#sprayGrad)" className="spray-cloud cloud-2" />
                  <circle cx="855" cy="74" r="15" fill="url(#sprayGrad)" className="spray-cloud cloud-3" />

                  {/* Flying Spray Droplets */}
                  <circle cx="800" cy="62" r="3.5" fill="#e0f2fe" className="spray-drop drop-1" />
                  <circle cx="820" cy="48" r="4.5" fill="#ffffff" className="spray-drop drop-2" />
                  <circle cx="844" cy="46" r="4" fill="#ffffff" className="spray-drop drop-3" />
                  <circle cx="868" cy="65" r="3.5" fill="#e0f2fe" className="spray-drop drop-4" />
                  <circle cx="788" cy="85" r="3" fill="#7dd3fc" className="spray-drop drop-5" />
                  <circle cx="882" cy="90" r="3" fill="#7dd3fc" className="spray-drop drop-6" />

                  {/* Water Cascading Down to Basin */}
                  <ellipse cx="832" cy="286" rx="34" ry="8" fill="#0369a1" opacity="0.5" />
                  <ellipse cx="832" cy="286" rx="24" ry="5" fill="#38bdf8" opacity="0.75" className="puddle-ripple-fast" />

                  {/* Critical Alert Callout Banner */}
                  <g className="leak-badge-z3" transform="translate(755, 12)">
                    <rect x="0" y="0" width="165" height="36" rx="6" fill="#991b1b" stroke="#ef4444" strokeWidth="2.5" filter="url(#criticalGlow)" />
                    <text x="82" y="16" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      🚨 CRITICAL LEAK – ZONE 3
                    </text>
                    <text x="82" y="29" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="600">
                      Loss: -{estimatedLoss} L/min · SYSTEM FAILURE
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* ============================================================== */}
          {/* PIPELINE ZONE LABELS & METRIC CARDS (Above each section)       */}
          {/* ============================================================== */}

          {/* Inlet Intake Callout */}
          <g transform="translate(25, 116)">
            <rect x="0" y="0" width="80" height="26" rx="4" fill="#0f172a" opacity="0.9" stroke="#334155" strokeWidth="1" />
            <text x="40" y="12" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">INLET INTAKE</text>
            <text x="40" y="22" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">{inletFlow} L/m</text>
          </g>

          {/* Zone 1 Label Card */}
          <g transform="translate(260, 114)">
            <rect x="0" y="0" width="115" height="30" rx="5" fill="#0f172a" opacity="0.9" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="57" y="13" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" letterSpacing="0.5">
              ZONE 1 · PRIMARY
            </text>
            <text x="57" y="24" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">
              Flow: {z1} L/min
            </text>
          </g>

          {/* Zone 2 Label Card */}
          <g transform="translate(525, 114)">
            <rect
              x="0"
              y="0"
              width="115"
              height="30"
              rx="5"
              fill="#0f172a"
              opacity="0.9"
              stroke={isSmallLeak ? "#f59e0b" : "#38bdf8"}
              strokeWidth={isSmallLeak ? 2 : 1.5}
            />
            <text x="57" y="13" textAnchor="middle" fill={isSmallLeak ? "#fde047" : "#ffffff"} fontSize="9" fontWeight="800" letterSpacing="0.5">
              ZONE 2 · MID-TRUNK
            </text>
            <text x="57" y="24" textAnchor="middle" fill={isSmallLeak ? "#f97316" : "#4ade80"} fontSize="9" fontWeight="bold" fontFamily="monospace">
              Flow: {z2} L/min
            </text>
          </g>

          {/* Zone 3 Label Card */}
          <g transform="translate(775, 114)">
            <rect
              x="0"
              y="0"
              width="115"
              height="30"
              rx="5"
              fill="#0f172a"
              opacity="0.9"
              stroke={isMajorLeak ? "#ef4444" : "#38bdf8"}
              strokeWidth={isMajorLeak ? 2.5 : 1.5}
            />
            <text x="57" y="13" textAnchor="middle" fill={isMajorLeak ? "#fca5a5" : "#ffffff"} fontSize="9" fontWeight="800" letterSpacing="0.5">
              ZONE 3 · TERMINAL
            </text>
            <text x="57" y="24" textAnchor="middle" fill={isMajorLeak ? "#ef4444" : "#4ade80"} fontSize="9" fontWeight="bold" fontFamily="monospace">
              Flow: {z3} L/min
            </text>
          </g>

          {/* Outlet Discharge Callout */}
          <g transform="translate(920, 116)">
            <rect x="0" y="0" width="78" height="26" rx="4" fill="#0f172a" opacity="0.9" stroke="#334155" strokeWidth="1" />
            <text x="39" y="12" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">OUTLET GRID</text>
            <text x="39" y="22" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">{outletFlow} L/m</text>
          </g>

          {/* ============================================================== */}
          {/* EMERGENCY ISOLATION OVERLAY (When Valve is Closed)            */}
          {/* ============================================================== */}
          {isIsolated && (
            <g className="isolation-overlay-banner" transform="translate(320, 168)">
              <rect x="0" y="0" width="380" height="52" rx="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2.5" filter="url(#criticalGlow)" opacity="0.96" />
              <text x="190" y="22" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="1">
                🛡️ PIPELINE ISOLATED
              </text>
              <text x="190" y="40" textAnchor="middle" fill="#fee2e2" fontSize="9.5" fontWeight="600">
                Valve V-01 Closed · Flow Cutoff Engaged · Downstream Depressurized
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Real-time Pipeline Hydraulic Indicators Strip */}
      <div className="pipeline-telemetry-bar">
        <div className="telemetry-item">
          <span className="telemetry-label">Mass Balance Status</span>
          <span className="telemetry-value">
            {isIsolated ? (
              <span className="text-red-600 font-bold">FLOW ISOLATED (0.0 L/min)</span>
            ) : isMajorLeak ? (
              <span className="text-red-600 font-bold">SEVERE IMBALANCE ({estimatedLoss} L/min loss)</span>
            ) : isSmallLeak ? (
              <span className="text-amber-600 font-bold">ANOMALY DETECTED ({estimatedLoss} L/min loss)</span>
            ) : isRunningAndFlowing ? (
              <span className="text-emerald-600 font-bold">BALANCED HYDRAULIC FLOW</span>
            ) : (
              <span className="text-slate-500 font-bold">STANDBY</span>
            )}
          </span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Active Flow Direction</span>
          <span className="telemetry-value flex-center">
            Inlet <ArrowRight size={13} className="mx-1" /> Zone 1 <ArrowRight size={13} className="mx-1" /> Zone 2 <ArrowRight size={13} className="mx-1" /> Zone 3 <ArrowRight size={13} className="mx-1" /> Outlet
          </span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-label">Isolation Actuator</span>
          <span className="telemetry-value">
            <button
              className={`telemetry-valve-btn ${isValveOpen ? "btn-open" : "btn-closed"}`}
              onClick={onToggleValve}
              title="Click to toggle isolation valve manually"
            >
              {isValveOpen ? "Close Valve V-01" : "Re-Open Valve V-01"}
            </button>
          </span>
        </div>
      </div>
    </section>
  );
}

