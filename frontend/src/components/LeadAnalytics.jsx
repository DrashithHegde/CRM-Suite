import React, { useRef, useEffect } from 'react';

// Helper function to count leads by source
const countLeadsBySource = (leads) => {
  const sources = {
    website_form: 0,
    referral: 0,
    social_media: 0,
    email_campaign: 0,
    other: 0,
  };

  leads.forEach((lead) => {
    const source = lead.source || 'other';
    if (sources[source] !== undefined) {
      sources[source]++;
    } else {
      sources.other++;
    }
  });

  return sources;
};

// Helper function to get monthly trend data
const getMonthlyTrend = (leads) => {
  const months = {};
  const last6Months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthName = date.toLocaleString('default', { month: 'short' });
    months[monthKey] = { name: monthName, leads: 0, conversions: 0 };
    last6Months.push(monthKey);
  }

  leads.forEach((lead) => {
    const leadDate = new Date(lead.createdAt);
    const monthKey = `${leadDate.getFullYear()}-${leadDate.getMonth() + 1}`;

    if (months[monthKey]) {
      months[monthKey].leads++;
      if (lead.status === 'converted') {
        months[monthKey].conversions++;
      }
    }
  });

  return last6Months.map((key) => months[key]);
};

// Helper function to calculate average response time
const getAverageResponseTime = (leads) => {
  let totalResponseTime = 0;
  let contactedLeads = 0;

  leads.forEach((lead) => {
    if (lead.status === 'contacted' || lead.status === 'converted' || lead.status === 'qualified') {
      const createdAt = new Date(lead.createdAt);
      const updatedAt = new Date(lead.updatedAt);
      const responseHours = (updatedAt - createdAt) / (1000 * 60 * 60);
      if (responseHours > 0 && responseHours < 720) {
        // Less than 30 days
        totalResponseTime += responseHours;
        contactedLeads++;
      }
    }
  });

  if (contactedLeads === 0) return null;
  const avgHours = totalResponseTime / contactedLeads;

  if (avgHours < 24) return `${Math.round(avgHours)} hours`;
  if (avgHours < 168) return `${Math.round(avgHours / 24)} days`;
  return `${Math.round(avgHours / 168)} weeks`;
};

// Helper function for funnel data
const getFunnelData = (leads) => {
  const total = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const contacted = leads.filter((l) => l.status === 'contacted').length;
  const qualified = leads.filter((l) => l.status === 'qualified').length;
  const converted = leads.filter((l) => l.status === 'converted').length;

  return {
    new: total > 0 ? Math.round((newLeads / total) * 100) : 0,
    contacted: total > 0 ? Math.round((contacted / total) * 100) : 0,
    qualified: total > 0 ? Math.round((qualified / total) * 100) : 0,
    converted: total > 0 ? Math.round((converted / total) * 100) : 0,
  };
};

// Component 1: Lead Source Breakdown Chart
export const LeadSourceChart = ({ leads }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!leads || leads.length === 0 || !window.Chart) return;

    const sourceCounts = countLeadsBySource(leads);

    const data = {
      labels: ['Website', 'Referral', 'Social Media', 'Email', 'Other'],
      datasets: [
        {
          data: [
            sourceCounts.website_form,
            sourceCounts.referral,
            sourceCounts.social_media,
            sourceCounts.email_campaign,
            sourceCounts.other,
          ],
          backgroundColor: ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#6B7280'],
          borderColor: 'transparent',
          hoverOffset: 10,
          cutout: '60%',
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = leads.length;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} leads (${percentage}%)`;
            },
          },
        },
        legend: { display: false },
      },
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: options,
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [leads]);

  const sourceCounts = countLeadsBySource(leads);
  const sources = [
    {
      name: 'Website',
      key: 'website_form',
      color: 'bg-blue-500',
      count: sourceCounts.website_form,
    },
    { name: 'Referral', key: 'referral', color: 'bg-green-500', count: sourceCounts.referral },
    {
      name: 'Social Media',
      key: 'social_media',
      color: 'bg-pink-500',
      count: sourceCounts.social_media,
    },
    {
      name: 'Email',
      key: 'email_campaign',
      color: 'bg-purple-500',
      count: sourceCounts.email_campaign,
    },
    { name: 'Other', key: 'other', color: 'bg-gray-500', count: sourceCounts.other },
  ];

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Sources</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown by acquisition channel</p>
      </div>
      <div className="h-48">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {sources.map((source) => (
          <div key={source.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{source.name}</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {source.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component 2: Monthly Trend Chart
export const MonthlyTrendChart = ({ leads }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!leads || leads.length === 0 || !window.Chart) return;

    const trendData = getMonthlyTrend(leads);

    const data = {
      labels: trendData.map((d) => d.name),
      datasets: [
        {
          label: 'New Leads',
          data: trendData.map((d) => d.leads),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Conversions',
          data: trendData.map((d) => d.conversions),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw} leads`;
            },
          },
        },
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 8 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(203, 213, 225, 0.3)' },
          ticks: { stepSize: 1, precision: 0 },
        },
        x: {
          grid: { display: false },
        },
      },
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: data,
      options: options,
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [leads]);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Trend</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Leads & conversions over time</p>
      </div>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

// Component 3: Average Response Time Card
export const ResponseTimeCard = ({ leads }) => {
  const avgResponseTime = getAverageResponseTime(leads);
  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.status !== 'new').length;
  const responseRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response Time</h3>
        <span className="text-2xl">⏱️</span>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {avgResponseTime || 'N/A'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">average response time</p>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
          <span className="font-semibold text-gray-900 dark:text-white">{responseRate}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${responseRate}%` }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {contactedLeads} out of {totalLeads} leads contacted
        </p>
      </div>
    </div>
  );
};

// Component 4: Conversion Funnel
export const ConversionFunnel = ({ leads }) => {
  const funnel = getFunnelData(leads);
  const totalLeads = leads.length;

  const stages = [
    { name: 'New', percentage: funnel.new, color: 'bg-blue-500', icon: '🆕' },
    { name: 'Contacted', percentage: funnel.contacted, color: 'bg-amber-500', icon: '📞' },
    { name: 'Qualified', percentage: funnel.qualified, color: 'bg-purple-500', icon: '⭐' },
    { name: 'Converted', percentage: funnel.converted, color: 'bg-emerald-500', icon: '✅' },
  ];

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Funnel</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Lead progression through stages</p>
      </div>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const prevPercentage = index > 0 ? stages[index - 1].percentage : 100;
          const dropOff = prevPercentage - stage.percentage;

          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{stage.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {stage.percentage}%
                  </span>
                  {index > 0 && dropOff > 0 && (
                    <span className="text-xs text-red-500">-{dropOff}%</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`${stage.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${stage.percentage}%` }}
                ></div>
              </div>
              {index === 0 && (
                <p className="text-xs text-gray-400 mt-1">Based on {totalLeads} total leads</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Combined Analytics Section
export const LeadAnalyticsSection = ({ leads }) => {
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500">Add leads to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Source Chart + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadSourceChart leads={leads} />
        <MonthlyTrendChart leads={leads} />
      </div>

      {/* Row 2: Response Time + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponseTimeCard leads={leads} />
        <ConversionFunnel leads={leads} />
      </div>
    </div>
  );
};

export default LeadAnalyticsSection;
