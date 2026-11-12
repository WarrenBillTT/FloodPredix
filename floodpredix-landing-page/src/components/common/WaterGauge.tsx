import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { WaterLevel } from "../../types";

const TOP = 100;
const PX = 18;
const MIN_GAP = 0.5;
const MAX_GAP = 19.5;
const CH_L = 60;
const CH_R = 228;
const BOTTOM = 480;

function classify(gap: number): WaterLevel {
  if (gap < 5) return "critical";
  if (gap < 10) return "warning";
  return "normal";
}

const COLORS: Record<WaterLevel, string> = {
  normal: "var(--safe)",
  warning: "var(--caution)",
  critical: "var(--danger)",
};

const RESPONSES: Record<WaterLevel, string> = {
  normal: "Reading logged. Nothing to report.",
  warning: "The server raises a warning alert on the dashboard.",
  critical: "The buzzer sounds on site and a critical alert is raised.",
};

const wavePath = (() => {
  let d = "M0 0 Q14 -6 28 0";
  for (let x = 56; x <= 280; x += 28) d += ` T${x} 0`;
  return `${d} L280 420 L0 420 Z`;
})();

export function WaterGauge() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [gap, setGap] = useState(reduced ? 7.4 : 15);
  const [auto, setAuto] = useState(!reduced);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const g = 11.5 + 7.5 * Math.sin(t * 0.42 + 1.1);
      setGap(Math.round(g * 10) / 10);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  const fromPointer = useCallback((e: PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const y = ((e.clientY - box.top) / box.height) * 520;
    const g = (y - TOP) / PX;
    setGap(Math.round(Math.min(MAX_GAP, Math.max(MIN_GAP, g)) * 10) / 10);
  }, []);

  const onDown = (e: PointerEvent<SVGRectElement>) => {
    dragging.current = true;
    setAuto(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    fromPointer(e);
  };

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    if (dragging.current) fromPointer(e);
  };

  const onUp = () => {
    dragging.current = false;
  };

  const level = classify(gap);
  const color = COLORS[level];
  const surface = TOP + gap * PX;
  const meters = (gap / 100).toFixed(3);
  const statusName = level === "normal" ? "normal" : level;

  const ticks = [];
  for (let i = 0; i <= 20; i++) {
    const y = TOP + i * PX;
    const len = i % 5 === 0 ? 18 : i % 2 === 0 ? 10 : 6;
    ticks.push(
      <g key={i}>
        <line x1={240} x2={240 + len} y1={y} y2={y} stroke="var(--ink)" strokeWidth={i % 5 === 0 ? 1.5 : 1} />
        {i % 5 === 0 && (
          <text x={264} y={y + 4} fontSize={11} fill="var(--ink)">
            {i}
          </text>
        )}
      </g>,
    );
  }

  const zones: { label: string; from: number; to: number; lvl: WaterLevel }[] = [
    { label: "DANGER", from: 0, to: 5, lvl: "critical" },
    { label: "CAUTION", from: 5, to: 10, lvl: "warning" },
    { label: "SAFE", from: 10, to: 20, lvl: "normal" },
  ];

  return (
    <div className="plate">
      <div className="plate-head">
        <b>Station 01 · water gauge</b>
        <span className="sim">Simulation</span>
      </div>

      <div className="plate-body">
        <svg
          ref={svgRef}
          className="gauge-svg"
          viewBox="0 0 372 520"
          role="img"
          aria-label={`Simulated water gauge. Gap between sensor and water is ${gap.toFixed(1)} centimetres. Status ${level}.`}
        >
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" strokeWidth="1.2" />
            </pattern>
            <clipPath id="gauge-channel">
              <rect x={CH_L} y={TOP} width={CH_R - CH_L} height={BOTTOM - TOP} />
            </clipPath>
          </defs>

          {zones.map((z) => (
            <g key={z.label}>
              <rect
                x={CH_L}
                y={TOP + z.from * PX}
                width={CH_R - CH_L}
                height={(z.to - z.from) * PX}
                fill={COLORS[z.lvl]}
                opacity={z.lvl === level ? 0.14 : 0.05}
              />
              <rect
                x={292}
                y={TOP + z.from * PX}
                width={8}
                height={(z.to - z.from) * PX}
                fill={COLORS[z.lvl]}
                opacity={z.lvl === level ? 1 : 0.35}
              />
              <text
                x={308}
                y={TOP + z.from * PX + 14}
                fontSize={10}
                letterSpacing="0.08em"
                fill={COLORS[z.lvl]}
                opacity={z.lvl === level ? 1 : 0.55}
                fontWeight={z.lvl === level ? 500 : 400}
              >
                {z.label}
              </text>
            </g>
          ))}

          <g clipPath="url(#gauge-channel)">
            <g transform={`translate(${CH_L - 56} ${surface - 2})`}>
              <g className="wave-b">
                <path d={wavePath} fill="var(--water-light)" opacity={0.55} transform="translate(-20 -4)" />
              </g>
            </g>
            <g transform={`translate(${CH_L - 56} ${surface})`}>
              <g className="wave-a">
                <path d={wavePath} fill="var(--water)" opacity={0.92} />
              </g>
            </g>
          </g>

          {[114, 174].map((x) => (
            <line
              key={x}
              className="beam"
              x1={x}
              x2={x}
              y1={TOP}
              y2={surface - 2}
              stroke={color}
              strokeWidth={1.5}
            />
          ))}

          <rect x={48} y={TOP} width={12} height={BOTTOM - TOP + 16} fill="url(#hatch)" opacity={0.7} />
          <rect x={CH_R} y={TOP} width={12} height={BOTTOM - TOP + 16} fill="url(#hatch)" opacity={0.7} />
          <line x1={CH_L} x2={CH_L} y1={TOP} y2={BOTTOM} stroke="var(--ink)" strokeWidth={2.5} />
          <line x1={CH_R} x2={CH_R} y1={TOP} y2={BOTTOM} stroke="var(--ink)" strokeWidth={2.5} />
          <line x1={48} x2={240} y1={BOTTOM + 16} y2={BOTTOM + 16} stroke="var(--ink)" strokeWidth={2.5} />

          <rect x={84} y={34} width={120} height={66} rx={3} fill="var(--ink)" />
          {[114, 174].map((x) => (
            <g key={x}>
              <circle cx={x} cy={68} r={17} fill="var(--paper-3)" />
              <circle cx={x} cy={68} r={11} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
              <circle cx={x} cy={68} r={4} fill="var(--ink)" />
            </g>
          ))}
          <circle cx={194} cy={46} r={3} fill={color} />
          <text x={144} y={22} fontSize={10} letterSpacing="0.1em" textAnchor="middle" fill="var(--ink)">
            ESP32 + ULTRASONIC
          </text>

          <g transform={`translate(0 ${surface})`}>
            <polygon points="0,-12 44,-12 60,0 44,12 0,12" fill={color} />
            <text x={22} y={4} fontSize={12} fontWeight={500} textAnchor="middle" fill="#fff">
              {gap.toFixed(1)}
            </text>
          </g>

          <text x={240} y={TOP - 10} fontSize={10} letterSpacing="0.08em" fill="var(--ink-soft)">
            CM FROM SENSOR
          </text>

          <rect
            className="gauge-hit"
            x={0}
            y={TOP}
            width={372}
            height={BOTTOM - TOP}
            fill="transparent"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </svg>
      </div>

      <div className="readout" aria-live="polite">
        <div className="readout-value">
          {gap.toFixed(1).padStart(4, "0")}
          <small>cm</small>
        </div>
        <span className={`state ${level}`}>{level === "normal" ? "Safe" : level === "warning" ? "Caution" : "Danger"}</span>
        <p className="response">{RESPONSES[level]}</p>
      </div>

      <div className="slider-row">
        <label htmlFor="gap-range">Gap</label>
        <input
          id="gap-range"
          className="gauge-range"
          type="range"
          min={MIN_GAP}
          max={MAX_GAP}
          step={0.1}
          value={gap}
          onChange={(e) => {
            setAuto(false);
            setGap(parseFloat(e.target.value));
          }}
        />
        <button className="auto-btn" type="button" aria-pressed={auto} onClick={() => setAuto((a) => !a)}>
          Auto
        </button>
      </div>

      <div className="plate-foot">
        Drag the water. Same thresholds as the firmware:
        <br />
        <code>
          POST waterLevel: {gap.toFixed(1)} → {meters} m → {statusName}
        </code>
      </div>
    </div>
  );
}
