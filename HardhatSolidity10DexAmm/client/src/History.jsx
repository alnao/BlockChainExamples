import { useState } from 'react';
import { ethers } from 'ethers';
import LineChart from './LineChart.jsx';

// Colori per entità, uguali in tutti i grafici (validati sulla superficie scura delle card)
const COLOR_NAO = '#3987e5';
const COLOR_ETH = '#d95926';
const COLOR_PRICE = '#199e70';

const toNumber = (wei) => parseFloat(ethers.formatEther(wei));

function fmt(value, digits = 4) {
  return toNumber(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtDelta(value, digits = 4) {
  if (value === 0n) return '0';
  return (value > 0n ? '+' : '−') + fmt(value > 0n ? value : -value, digits);
}

function fmtTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function downloadCsv(rows) {
  const header = [
    'n', 'block', 'timestamp', 'type', 'account', 'delta_nao_pool', 'delta_eth_pool',
    'reserve_nao', 'reserve_eth', 'price_nao_per_eth', 'fee_nao', 'fee_eth', 'tx_hash'
  ];
  const lines = rows.map((r) => [
    r.n, r.blockNumber, new Date(r.timestamp * 1000).toISOString(), r.type, r.user,
    ethers.formatEther(r.deltaA), ethers.formatEther(r.deltaETH),
    ethers.formatEther(r.reserveA), ethers.formatEther(r.reserveETH), ethers.formatEther(r.price),
    ethers.formatEther(r.feeA), ethers.formatEther(r.feeETH), r.hash
  ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','));

  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nao-dex-report-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Report delle transazioni del DEX e grafici di riserve e prezzo
export default function History({ rows, account }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const swaps = rows.filter((r) => r.isSwap);
  const feesA = swaps.reduce((sum, r) => sum + r.feeA, 0n);
  const feesETH = swaps.reduce((sum, r) => sum + r.feeETH, 0n);
  const volumeA = swaps.reduce((sum, r) => sum + (r.deltaA > 0n ? r.deltaA : -r.deltaA), 0n);

  const detail = (r) => `${r.type} · ${fmtTime(r.timestamp)}`;
  const series = (pick) => rows.map((r) => ({ label: `#${r.n}`, value: toNumber(pick(r)), detail: detail(r) }));

  const isMine = (r) => r.user.toLowerCase() === account.toLowerCase();
  const tableRows = (onlyMine ? rows.filter(isMine) : rows).slice().reverse();

  return (
    <section className="history">
      <div className="section-header">
        <h2>Report del pool</h2>
        <p className="hint">Ricostruito dagli eventi LiquidityAdded, LiquidityRemoved e Swap del contratto</p>
      </div>

      <div className="stats-row">
        <div className="stat">
          <span className="stat-label">Transazioni</span>
          <span className="stat-value">{rows.length}</span>
          <span className="stat-detail">di cui {swaps.length} swap</span>
        </div>
        <div className="stat">
          <span className="stat-label">Volume swap</span>
          <span className="stat-value">{fmt(volumeA, 2)} <span className="symbol">NAO</span></span>
          <span className="stat-detail">NAO scambiati nei due sensi</span>
        </div>
        <div className="stat">
          <span className="stat-label">Fee per gli LP (0.3%)</span>
          <span className="stat-value">{fmt(feesA, 4)} <span className="symbol">NAO</span></span>
          <span className="stat-detail">+ {fmt(feesETH, 6)} ETH</span>
        </div>
      </div>

      <div className="charts-grid">
        <LineChart
          wide
          title="Prezzo (NAO per 1 ETH)"
          unit="NAO"
          color={COLOR_PRICE}
          points={series((r) => r.price)}
          hoverIndex={hoverIndex}
          onHover={setHoverIndex}
          zeroBased={false}
        />
        <LineChart
          title="Riserva NAO"
          unit="NAO"
          color={COLOR_NAO}
          points={series((r) => r.reserveA)}
          hoverIndex={hoverIndex}
          onHover={setHoverIndex}
          valueDigits={2}
        />
        <LineChart
          title="Riserva ETH"
          unit="ETH"
          color={COLOR_ETH}
          points={series((r) => r.reserveETH)}
          hoverIndex={hoverIndex}
          onHover={setHoverIndex}
        />
      </div>

      <div className="table-box">
        <div className="table-toolbar">
          <h3>Transazioni</h3>
          <div className="toolbar-actions">
            <label className="check">
              <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
              Solo le mie
            </label>
            <button className="max-btn" onClick={() => downloadCsv(tableRows.slice().reverse())} disabled={tableRows.length === 0}>
              Esporta CSV
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="tx-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data/ora</th>
                <th>Tipo</th>
                <th>Account</th>
                <th className="num">Δ NAO pool</th>
                <th className="num">Δ ETH pool</th>
                <th className="num">Riserva NAO</th>
                <th className="num">Riserva ETH</th>
                <th className="num">Prezzo</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr><td colSpan={10} className="empty">Nessuna transazione</td></tr>
              ) : tableRows.map((r) => (
                <tr
                  key={r.n}
                  className={hoverIndex === r.n - 1 ? 'highlight' : ''}
                  onPointerEnter={() => setHoverIndex(r.n - 1)}
                  onPointerLeave={() => setHoverIndex(null)}
                >
                  <td>{r.n}</td>
                  <td>{fmtTime(r.timestamp)}</td>
                  <td>{r.type}</td>
                  <td className="mono" title={r.user}>{shortAddress(r.user)}{isMine(r) && ' (tu)'}</td>
                  <td className="num">{fmtDelta(r.deltaA, 2)}</td>
                  <td className="num">{fmtDelta(r.deltaETH, 6)}</td>
                  <td className="num">{fmt(r.reserveA, 2)}</td>
                  <td className="num">{fmt(r.reserveETH, 6)}</td>
                  <td className="num">{fmt(r.price, 4)}</td>
                  <td className="mono" title={r.hash}>{r.hash.slice(0, 10)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
