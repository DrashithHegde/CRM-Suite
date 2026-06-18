import React, { useRef, useEffect } from 'react';

const CRMCharts = () => null;

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

const STATUS_COLORS = {
  New: { hex: '#3B82F6', dot: 'bg-blue-500' },
  Contacted: { hex: '#F59E0B', dot: 'bg-amber-500' },
  Qualified: { hex: '#8B5CF6', dot: 'bg-purple-500' },
  Converted: { hex: '#10B981', dot: 'bg-emerald-500' },
  Lost: { hex: '#EF4444', dot: 'bg-red-500' },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
// FIX: normalizes status casing so "new" / "NEW" / "New" all match correctly
const countLeadsByStatus = (leads = []) => {
  const counts = {};
  STATUSES.forEach((s) => {
    counts[s] = 0;
  });
  leads.forEach((lead) => {
    if (!lead.status) return;
    const normalized = lead.status.charAt(0).toUpperCase() + lead.status.slice(1).toLowerCase();
    if (counts[normalized] !== undefined) counts[normalized]++;
  });
  return counts;
};

// ─── Chart.js CDN loader — loads once, never duplicates the script tag ────────
function loadChartJs(cb) {
  if (window.Chart) {
    cb();
    return;
  }
  let script = document.querySelector('script[data-chartjs]');
  if (!script) {
    script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.setAttribute('data-chartjs', 'true');
    document.head.appendChild(script);
  }
  script.addEventListener('load', cb, { once: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DONUT CHART
// ═══════════════════════════════════════════════════════════════════════════════
export const LeadDonutChart = ({ leads = [] }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    function buildChart() {
      if (!canvasRef.current) return;

      const counts = countLeadsByStatus(leads);
      const totalLeads = leads.length;

      // FIX: destroy always before recreating — prevents "Canvas already in use"
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      chartInstance.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'doughnut',
        data: {
          // FIX: labels array is the SAME STATUSES array used for data
          // so index 0 of labels always matches index 0 of data
          labels: [...STATUSES],
          datasets: [
            {
              data: STATUSES.map((s) => counts[s]),
              backgroundColor: STATUSES.map((s) => STATUS_COLORS[s].hex),
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 10,
              hoverBorderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: { animateRotate: true, animateScale: true },
          plugins: {
            // FIX: built-in legend is OFF — we use our own HTML legend below
            // so labels don't depend on Chart.js rendering them
            legend: { display: false },
            tooltip: {
              callbacks: {
                // FIX: explicit title callback — always shows the status name
                title: (items) => items[0]?.label ?? '',
                label: (ctx) => {
                  const value = ctx.parsed ?? 0;
                  const percentage =
                    totalLeads > 0 ? ((value / totalLeads) * 100).toFixed(1) : '0.0';
                  return `  ${value} lead${value !== 1 ? 's' : ''} (${percentage}%)`;
                },
              },
              backgroundColor: 'rgba(17,24,39,0.92)',
              titleColor: '#f9fafb',
              bodyColor: '#d1d5db',
              padding: 12,
              cornerRadius: 8,
              displayColors: true,
              boxWidth: 10,
              boxHeight: 10,
              boxPadding: 4,
            },
          },
        },
      });
    }

    loadChartJs(buildChart);

    // cleanup on unmount only
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [leads]); // re-runs whenever leads array reference changes

  const counts = countLeadsByStatus(leads);
  const totalLeads = leads.length;

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Distribution</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Percentage breakdown by status
        </p>
      </div>

      {/* Canvas */}
      <div className="relative h-64 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full" />
        {/* Centre label — total count, always visible in DOM */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalLeads}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Leads</p>
          </div>
        </div>
      </div>

      {/*
        FIX: Custom HTML legend replaces Chart.js legend entirely.
        Every status name is rendered as a real DOM text node —
        it is NEVER dependent on Chart.js label rendering.
        Shows all 5 statuses including those with 0 leads.
      */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STATUSES.map((status) => {
          const count = counts[status] ?? 0;
          const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : '0.0';
          return (
            <div
              key={status}
              className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[status].dot}`}
                />
                {/* Status name — plain DOM text, always visible */}
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                  {status}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white pl-4">
                {count}
                <span className="text-xs font-normal text-gray-400 ml-1">({percentage}%)</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BAR CHART
// ═══════════════════════════════════════════════════════════════════════════════
export const LeadBarChart = ({ leads = [] }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    function buildChart() {
      if (!canvasRef.current) return;

      const counts = countLeadsByStatus(leads);

      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      chartInstance.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          // FIX: labels is the authoritative STATUSES array
          labels: [...STATUSES],
          datasets: [
            {
              label: 'Leads',
              data: STATUSES.map((s) => counts[s]),
              backgroundColor: STATUSES.map((s) => STATUS_COLORS[s].hex),
              borderRadius: 8,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.75,
              maxBarThickness: 60,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                // FIX: title explicitly reads from labels so status name shows
                title: (items) => items[0]?.label ?? '',
                label: (ctx) => {
                  const v = ctx.parsed.y ?? 0;
                  return `  ${v} lead${v !== 1 ? 's' : ''}`;
                },
              },
              backgroundColor: 'rgba(17,24,39,0.92)',
              titleColor: '#f9fafb',
              bodyColor: '#d1d5db',
              padding: 12,
              cornerRadius: 8,
              displayColors: true,
              boxWidth: 10,
              boxHeight: 10,
              boxPadding: 4,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#6B7280',
                font: { size: 12, weight: '600' },
                padding: 4,
                // FIX: never skip or rotate labels — all 5 always visible
                autoSkip: false,
                maxRotation: 0,
              },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(203,213,225,0.25)',
                drawBorder: false,
              },
              ticks: {
                color: '#6B7280',
                font: { size: 11 },
                stepSize: 1,
                // FIX: only integer ticks — no 0.5, 1.5 etc.
                callback: (val) => (Number.isInteger(val) ? val : null),
              },
              title: {
                display: true,
                text: 'Number of Leads',
                color: '#9CA3AF',
                font: { size: 11, weight: '500' },
              },
              border: { display: false },
            },
          },
          layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
        },
      });
    }

    loadChartJs(buildChart);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [leads]);

  const counts = countLeadsByStatus(leads);
  // FIX: floor maxCount at 1 so width% never becomes NaN when all counts are 0
  const maxCount = Math.max(...STATUSES.map((s) => counts[s]), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lead Status Breakdown
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Exact lead count by pipeline stage
        </p>
      </div>

      {/* Canvas */}
      <div className="h-72">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/*
        FIX: Custom HTML progress-bar legend.
        Status names are real DOM text — never dependent on Chart.js.
        Count number shown OUTSIDE the bar so it's visible even when bar is thin.
        minWidth guard ensures the bar has at least 2rem width when count > 0
        so the white count label inside never gets clipped.
      */}
      <div className="mt-6 space-y-2.5">
        {STATUSES.map((status) => {
          const count = counts[status] ?? 0;
          const widthPct = ((count / maxCount) * 100).toFixed(1);
          const cfg = STATUS_COLORS[status];
          return (
            <div key={status} className="flex items-center gap-3">
              {/* Status label — always in DOM */}
              <div className="w-24 flex items-center gap-2 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center justify-end px-2.5 transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: cfg.hex,
                    minWidth: count > 0 ? '2rem' : '0',
                  }}
                >
                  {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                </div>
              </div>

              {/* Count outside bar — always visible even if bar is too thin */}
              <span className="w-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Combined Section ─────────────────────────────────────────────────────────
export const LeadChartsSection = ({ leads = [] }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LeadDonutChart leads={leads} />
      <LeadBarChart leads={leads} />
    </div>
  );
};

export default CRMCharts;
