import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// exportService functions removed; using in-file export to avoid unused import warnings
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { LeadChartsSection } from '../components/CRMCharts';
import { LeadAnalyticsSection } from '../components/LeadAnalytics';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentLeads, setRecentLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const allLeadsRes = await api.get('/leads?limit=1000');
      if (allLeadsRes.data && allLeadsRes.data.data) {
        setAllLeads(allLeadsRes.data.data);
      }

      const analyticsRes = await api.get('/leads/analytics');
      if (analyticsRes.data && analyticsRes.data.data) {
        setAnalytics(analyticsRes.data.data);
      }

      const recentRes = await api.get('/leads?page=1&limit=5');
      if (recentRes.data && recentRes.data.data) {
        setRecentLeads(recentRes.data.data);
      }
    } catch (error) {
      console.error('Dashboard Error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/leads?limit=1000');
      const leads = response.data.data;
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Created Date'];
      const rows = leads.map((lead) => [
        lead.id,
        lead.name,
        lead.email,
        lead.phone || 'N/A',
        lead.source?.replace('_', ' ') || 'N/A',
        lead.status,
        format(new Date(lead.createdAt), 'MMM dd, yyyy'),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const stats = [
    {
      title: 'Total Leads',
      value: analytics.totalLeads,
      icon: Users,
      change: '+12%',
      trend: 'up',
      color: 'blue',
    },
    {
      title: 'New Leads',
      value: analytics.newLeads,
      icon: UserPlus,
      change: '+8%',
      trend: 'up',
      color: 'amber',
    },
    {
      title: 'Contacted',
      value: analytics.contactedLeads,
      icon: PhoneCall,
      change: '-3%',
      trend: 'down',
      color: 'purple',
    },
    {
      title: 'Converted',
      value: analytics.convertedLeads,
      icon: CheckCircle,
      change: '+23%',
      trend: 'up',
      color: 'emerald',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', iconBg: 'bg-blue-100' },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600',
        iconBg: 'bg-amber-100',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600',
        iconBg: 'bg-purple-100',
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
      },
    };
    return colors[color];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="subtle mt-1">Welcome back, {user?.username}!</p>
          </div>
          <button onClick={handleExport} className="btn btn-primary">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => {
            const colors = getColorClasses(stat.color);
            return (
              <div
                key={i}
                className="card"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-3 rounded-lg ${colors.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                  >
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion Rate Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Rate</h2>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.conversionRate || 0}%
          </p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.conversionRate || 0)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">of total leads converted to clients</p>
        </div>

        {/* NEW: Lead Analytics Section */}
        <LeadAnalyticsSection leads={allLeads} />

        {/* Charts Section */}
        <LeadChartsSection leads={allLeads} />

        {/* Recent Leads Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="card-heading">Recent Leads</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${lead.status === 'new'
                          ? 'badge-new'
                          : lead.status === 'contacted'
                            ? 'badge-contacted'
                            : lead.status === 'qualified'
                              ? 'badge-qualified'
                              : lead.status === 'converted'
                                ? 'badge-converted'
                                : 'badge-lost'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
