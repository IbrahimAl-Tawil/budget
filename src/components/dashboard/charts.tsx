"use client";

import { fmtShort } from "@/lib/format";

interface DonutData {
  amount: number;
  color: string;
  name: string;
}

export function DonutChart({ data, size = 160, stroke = 22 }: { data: DonutData[]; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.amount, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(92% 0.01 80)" strokeWidth={stroke} />
      {total > 0 && data.map((d, i) => {
        const pct = d.amount / total;
        const len = pct * circ;
        const gap = circ - len;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontFamily="var(--font-serif)" fontSize="18" fill="oklch(16% 0.012 260)">
        {fmtShort(total)}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill="oklch(54% 0.014 260)" fontFamily="var(--font-sans)">
        this month
      </text>
    </svg>
  );
}

export function LineChart({
  incomeData,
  expenseData,
  labels,
  width = 560,
  height = 120,
}: {
  incomeData: number[];
  expenseData: number[];
  labels: string[];
  width?: number;
  height?: number;
}) {
  const padL = 10, padR = 10, padT = 10, padB = 20;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const allVals = [...incomeData, ...expenseData];
  const minV = Math.min(...allVals) * 0.95;
  const maxV = Math.max(...allVals) * 1.05;
  const rangeV = maxV - minV || 1;
  const xStep = w / (incomeData.length - 1 || 1);
  const yScale = (v: number) => h - ((v - minV) / rangeV) * h;
  const pts = (arr: number[]) => arr.map((v, i) => `${padL + i * xStep},${padT + yScale(v)}`).join(" ");
  const pathD = (arr: number[]) => {
    const p = arr.map((v, i) => [padL + i * xStep, padT + yScale(v)]);
    return p.map((pt, i) => (i === 0 ? `M ${pt[0]} ${pt[1]}` : `L ${pt[0]} ${pt[1]}`)).join(" ");
  };

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(60% 0.09 155)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="oklch(60% 0.09 155)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(63% 0.1 38)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="oklch(63% 0.1 38)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathD(incomeData) + ` L ${padL + (incomeData.length - 1) * xStep} ${padT + h} L ${padL} ${padT + h} Z`} fill="url(#incGrad)" />
      <path d={pathD(expenseData) + ` L ${padL + (expenseData.length - 1) * xStep} ${padT + h} L ${padL} ${padT + h} Z`} fill="url(#expGrad)" />
      <polyline points={pts(incomeData)} fill="none" stroke="oklch(60% 0.09 155)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts(expenseData)} fill="none" stroke="oklch(63% 0.1 38)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {incomeData.map((v, i) => (
        <circle key={`i${i}`} cx={padL + i * xStep} cy={padT + yScale(v)} r="3.5" fill="oklch(60% 0.09 155)" stroke="white" strokeWidth="2" />
      ))}
      {expenseData.map((v, i) => (
        <circle key={`e${i}`} cx={padL + i * xStep} cy={padT + yScale(v)} r="3.5" fill="oklch(63% 0.1 38)" stroke="white" strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={padL + i * xStep} y={height - 3} textAnchor="middle" fontSize="9" fill="oklch(54% 0.014 260)" fontFamily="var(--font-sans)">
          {l}
        </text>
      ))}
    </svg>
  );
}

export function NWChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data) * 0.995;
  const max = Math.max(...data) * 1.001;
  const range = max - min || 1;
  const w = 380, h = 60, pL = 8, pR = 8, pT = 6, pB = 4;
  const xS = (w - pL - pR) / (data.length - 1);
  const yS = (v: number) => h - pT - pB - ((v - min) / range) * (h - pT - pB);
  const pts = data.map((v, i) => `${pL + i * xS},${pT + yS(v)}`).join(" ");
  const fillD =
    `M ${pL} ${pT + yS(data[0])} ` +
    data.map((v, i) => `L ${pL + i * xS} ${pT + yS(v)}`).join(" ") +
    ` L ${pL + (data.length - 1) * xS} ${h} L ${pL} ${h} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3">
      <defs>
        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(60% 0.09 155)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(60% 0.09 155)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#nwGrad)" />
      <polyline points={pts} fill="none" stroke="oklch(60% 0.09 155)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pL + (data.length - 1) * xS} cy={pT + yS(data[data.length - 1])} r="4" fill="oklch(60% 0.09 155)" stroke="white" strokeWidth="2" />
    </svg>
  );
}
