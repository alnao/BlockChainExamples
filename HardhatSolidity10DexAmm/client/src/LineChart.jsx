import { useRef, useState, useEffect } from 'react';

const HEIGHT = 190;
const M = { top: 12, right: 18, bottom: 26, left: 58 };

// Tick "puliti" (1, 2, 5 × 10^n) che coprono l'intervallo dei dati
function niceScale(min, max, count = 4) {
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const rough = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(12)));
  const digits = Math.min(6, Math.max(0, -Math.floor(Math.log10(step))));
  return { lo, hi, ticks, digits };
}

function formatNumber(value, digits) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

// Grafico a linea singola in SVG con crosshair; il valore puntato compare nell'intestazione.
// points: [{ label, value, detail }]; hoverIndex/onHover permettono di sincronizzare più grafici.
export default function LineChart({ title, unit, color, points, hoverIndex, onHover, valueDigits = 4, zeroBased = true, wide = false }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = points.length;
  const last = n > 0 ? points[n - 1] : null;
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;

  const values = points.map((p) => p.value);
  const floor = zeroBased ? [0] : [];
  const { lo, hi, ticks, digits } = niceScale(Math.min(...values, ...floor), Math.max(...values, ...floor));
  const x = (i) => M.left + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v) => M.top + plotH - ((v - lo) / (hi - lo)) * plotH;

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');

  const xTickCount = Math.min(n, 6);
  const xTicks = n === 0 ? [] : [...new Set(
    Array.from({ length: xTickCount }, (_, k) => (xTickCount === 1 ? 0 : Math.round((k * (n - 1)) / (xTickCount - 1))))
  )];

  const indexFromPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - M.left;
    return n === 1 ? 0 : Math.min(n - 1, Math.max(0, Math.round((px / plotW) * (n - 1))));
  };

  const handleKey = (e) => {
    if (n === 0) return;
    const current = hoverIndex ?? n - 1;
    if (e.key === 'ArrowLeft') onHover(Math.max(0, current - 1));
    else if (e.key === 'ArrowRight') onHover(Math.min(n - 1, current + 1));
    else return;
    e.preventDefault();
  };

  const active = hoverIndex != null && hoverIndex < n ? points[hoverIndex] : null;
  const shown = active ?? last;

  return (
    <div className={wide ? 'chart-card wide' : 'chart-card'}>
      {/* Lettura del valore: l'ultimo, oppure quello sotto il crosshair (non copre mai la linea) */}
      <div className="chart-header">
        <h3>{title}</h3>
        {shown && (
          <span className="chart-last">
            <span className="line-key" style={{ background: color }} />
            {formatNumber(shown.value, valueDigits)} <span className="symbol">{unit}</span>
          </span>
        )}
      </div>
      <div className="chart-detail">
        {active ? `${active.label} · ${active.detail}` : last ? `Ultimo valore · ${last.label}` : '\u00a0'}
      </div>

      <div className="chart-wrap" ref={wrapRef}>
        {n === 0 ? (
          <div className="chart-empty">Nessuna transazione</div>
        ) : width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${title}: ultimo valore ${formatNumber(last.value, valueDigits)} ${unit}`}
            tabIndex={0}
            onKeyDown={handleKey}
            onFocus={() => onHover(n - 1)}
            onBlur={() => onHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line className="chart-grid" x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} />
                <text className="chart-axis" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                  {formatNumber(t, digits)}
                </text>
              </g>
            ))}
            <line className="chart-baseline" x1={M.left} x2={M.left + plotW} y1={M.top + plotH} y2={M.top + plotH} />
            {xTicks.map((i) => (
              <text key={i} className="chart-axis" x={x(i)} y={HEIGHT - 6} textAnchor="middle">
                {points[i].label}
              </text>
            ))}

            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {active && (
              <line className="chart-crosshair" x1={x(hoverIndex)} x2={x(hoverIndex)} y1={M.top} y2={M.top + plotH} />
            )}
            {(active ? [hoverIndex] : [n - 1]).map((i) => (
              <circle key={i} className="chart-dot" cx={x(i)} cy={y(points[i].value)} r="4" fill={color} />
            ))}

            {/* Area di hover: tutto il riquadro del grafico, non solo la linea */}
            <rect
              x={0}
              y={0}
              width={width}
              height={HEIGHT}
              fill="transparent"
              onPointerMove={(e) => onHover(indexFromPointer(e))}
              onPointerLeave={() => onHover(null)}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
