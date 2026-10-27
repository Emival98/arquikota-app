import { Panel, PanelHead, STATUS_COLOR, cn } from "./ui";
import { fmtDateShort } from "@/lib/format";
import type { AlertCounts, HealthStatus, HistoryPoint } from "@/lib/types";

const WIDTH = 360;
const HEIGHT = 150;
const PAD = { top: 14, right: 10, bottom: 22, left: 28 };

export default function HistoryCard({
  history,
  score,
  status,
  counts,
  className,
}: {
  history: HistoryPoint[];
  score: number;
  status: HealthStatus;
  counts: AlertCounts;
  className?: string;
}) {
  const scores = history.map((point) => point.score);
  const lowest = Math.min(...scores);
  const highest = Math.max(...scores);
  const min = Math.max(0, Math.min(lowest - 8, highest - 25));
  const max = Math.min(100, Math.max(highest + 8, min + 30));
  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + chartHeight;

  const points = history.map((point, index) => ({
    ...point,
    x:
      history.length === 1
        ? PAD.left + chartWidth / 2
        : PAD.left + (index / (history.length - 1)) * chartWidth,
    y: PAD.top + (1 - (point.score - min) / (max - min)) * chartHeight,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const area =
    points.length > 1
      ? `${line} L${points[points.length - 1].x.toFixed(1)} ${baseline} L${points[0].x.toFixed(
          1,
        )} ${baseline} Z`
      : "";
  const threshold =
    min <= 75 && max >= 75
      ? { y: PAD.top + (1 - (75 - min) / (max - min)) * chartHeight, value: 75 }
      : null;
  const middle = Math.round((min + max) / 2);
  const lastPoint = points[points.length - 1];
  const delta = history.length > 1 ? score - history[0].score : null;

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        kicker="04 · Evolução"
        title="Score ao longo do tempo"
        subtitle="As leituras agendadas constroem o histórico. Resolver um alerta atualiza o ponto de hoje."
        aside={
          <span
            className={cn(
              "chip",
              delta === null
                ? ""
                : delta > 0
                  ? "chip-mint"
                  : delta < 0
                    ? "chip-coral"
                    : "",
            )}
          >
            {delta === null
              ? "primeira leitura"
              : delta === 0
                ? "estável"
                : `${delta > 0 ? "+" : ""}${delta} pts`}
          </span>
        }
      />

      <div className="mt-4 px-3 sm:px-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`Evolução do índice de manutenção: ${history
            .map((point) => `${point.score} em ${fmtDateShort(point.date)}`)
            .join(", ")}.`}
        >
          <defs>
            <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[max, middle, min].map((value) => {
            const y = PAD.top + (1 - (value - min) / (max - min)) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                <text x={2} y={y + 2.5} fill="#64748b" fontSize="7" fontFamily="monospace">
                  {value}
                </text>
              </g>
            );
          })}

          {threshold ? (
            <g>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={threshold.y}
                y2={threshold.y}
                stroke="#1d4ed8"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
              <text
                x={WIDTH - PAD.right}
                y={threshold.y - 3}
                textAnchor="end"
                fill="#1d4ed8"
                fillOpacity="0.7"
                fontSize="6.5"
                fontFamily="monospace"
              >
                meta 75
              </text>
            </g>
          ) : null}

          {area ? <path d={area} fill="url(#history-area)" /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {points.map((point, index) => (
            <circle
              key={`${point.date}-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 3.2 : 1.8}
              fill={index === points.length - 1 ? STATUS_COLOR[status] : "#1d4ed8"}
              fillOpacity={index === points.length - 1 ? 1 : 0.55}
              stroke={index === points.length - 1 ? "#ffffff" : "none"}
              strokeWidth={index === points.length - 1 ? 1.6 : 0}
            />
          ))}

          <text
            x={PAD.left}
            y={HEIGHT - 6}
            fill="#64748b"
            fontSize="6.8"
            fontFamily="monospace"
          >
            {fmtDateShort(history[0]?.date)}
          </text>
          {history.length > 1 ? (
            <text
              x={WIDTH - PAD.right}
              y={HEIGHT - 6}
              textAnchor="end"
              fill="#64748b"
              fontSize="6.8"
              fontFamily="monospace"
            >
              {fmtDateShort(history[history.length - 1]?.date)}
            </text>
          ) : (
            <text
              x={lastPoint.x}
              y={lastPoint.y - 9}
              textAnchor="middle"
              fill="#475569"
              fontSize="7"
              fontFamily="monospace"
            >
              hoje
            </text>
          )}
        </svg>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-slate-200 px-5 py-3.5 sm:px-6">
        <div>
          <span className="kicker">Leituras</span>
          <p className="mt-1 font-mono text-[13px] text-slate-900">{history.length}</p>
        </div>
        <div>
          <span className="kicker">Críticos agora</span>
          <p className="mt-1 font-mono text-[13px] text-slate-900">{counts.critical}</p>
        </div>
        <div>
          <span className="kicker">Score atual</span>
          <p className="mt-1 font-mono text-[13px] text-slate-900">{score}</p>
        </div>
      </div>
    </Panel>
  );
}
