import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Toast, Loading } from '../components/ui';
import Modal from '../components/modals/Modal';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import { AccessDenied } from '../components/ui';

const AnalyticsPage = () => {
  const { user: currentUser } = useAuth();
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(''); // 'collections' or 'reports'
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [exportStartDate, setExportStartDate] = useState(firstDayOfMonth);
  const [exportEndDate, setExportEndDate] = useState(today);
  const [exporting, setExporting] = useState(false);
  
  // Analytics data from backend
  const [overview, setOverview] = useState(null);
  const [collectionStats, setCollectionStats] = useState(null);
  const [routePerformance, setRoutePerformance] = useState([]);
  const [reportAnalytics, setReportAnalytics] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [userStats, setUserStats] = useState({ totalUsers: 0, businessmen: 0, purokLeaders: 0 });
  const [reportStats, setReportStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [wasteReportRanking, setWasteReportRanking] = useState([]);
  const [activeReporters, setActiveReporters] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);

  // Handle Export
  const handleExport = async () => {
    if (!exportType) {
      setToast({ show: true, message: 'Please select an export type.', variant: 'error' });
      return;
    }
    try {
      setExporting(true);
      const params = { start_date: exportStartDate, end_date: exportEndDate };
      const res = exportType === 'collections'
        ? await api.exports.collections(params)
        : await api.exports.reports(params);

      const fileUrl = res?.data?.url;
      const filename = res?.data?.filename;
      if (fileUrl && filename) {
        // Auto-download the file
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setToast({ show: true, message: res.message || 'Export successful!', variant: 'success' });
        setShowExportModal(false);

        // Delete file from server after download is triggered
        setTimeout(async () => {
          try {
            await api.exports.deleteFile(filename);
          } catch (err) {
            console.warn('Could not delete export file from server:', err);
          }
        }, 3000); // 3 second delay to ensure browser has started downloading
      } else {
        setToast({ show: true, message: 'Export failed: No file URL returned.', variant: 'error' });
      }
    } catch (error) {
      console.error('Export error:', error);
      setToast({ show: true, message: error.message || 'Export failed. Please try again.', variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // Load analytics data from backend
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Determine period based on timeFilter
      const period = timeFilter === 'This Week' ? 'week' : 
                     timeFilter === 'This Month' ? 'month' : 'year';
      
      // Fetch all analytics data
      const [overviewRes, collectionRes, routeRes, reportRes, userRes, usersListRes, reportsListRes, rankingRes] = await Promise.all([
        api.analytics.getOverview(),
        api.analytics.getCollectionStats({ period }),
        api.analytics.getRoutePerformance(),
        api.analytics.getReportAnalytics({ period }),
        api.analytics.getUserActivity(),
        api.users.getAll(),
        api.reports.getStatistics(),
        api.reports.getRanking({ period, group_by: 'purok' }),
      ]);

      // Set data
      setOverview(overviewRes.data || overviewRes);
      setCollectionStats(collectionRes.data || collectionRes);
      setRoutePerformance(routeRes.data || routeRes);
      setUserActivity(userRes.data || userRes);

      // Set report analytics and build chart data from it
      const reportAnalyticsData = reportRes.data || reportRes;
      setReportAnalytics(reportAnalyticsData);

      // --- Waste Watch Bar Chart (from /reports/ranking) ---
      const rankingData = rankingRes?.data?.ranking || [];
      setWasteReportRanking(rankingData);

      // --- Most Active Reporters Pie Chart (from report analytics by_reporter_role) ---
      const byRole = reportAnalyticsData?.by_reporter_role || {};
      const purokLeaderCount = byRole.purok_leader || 0;
      const businessOwnerCount = byRole.business_owner || 0;
      const totalRoleCount = purokLeaderCount + businessOwnerCount || 1;
      setActiveReporters([
        { name: 'Purok Leaders', value: Math.round((purokLeaderCount / totalRoleCount) * 100), color: '#22c55e' },
        { name: 'Business Owners', value: Math.round((businessOwnerCount / totalRoleCount) * 100), color: '#86efac' },
      ]);

      // --- Monthly Reports Line Chart (from report analytics by_reporter_role per period) ---
      // We use available data to build a simple current-period data point
      setMonthlyReports([
        { month: 'This Period', purokLeaders: purokLeaderCount, business: businessOwnerCount },
      ]);

      // Compute user stats from users list (returns plain array)
      const usersList = Array.isArray(usersListRes.data) ? usersListRes.data : (Array.isArray(usersListRes) ? usersListRes : []);
      setUserStats({
        totalUsers: usersList.length,
        businessmen: usersList.filter(u => u.role === 'business_owner').length,
        purokLeaders: usersList.filter(u => u.role === 'purok_leader').length,
      });

      // Use report statistics endpoint (already computed counts from backend)
      const reportStatsData = reportsListRes.data || reportsListRes || {};
      setReportStats({
        total: reportStatsData.total || 0,
        pending: reportStatsData.by_status?.pending || 0,
        inProgress: reportStatsData.by_status?.in_progress || 0,
        resolved: reportStatsData.by_status?.resolved || 0,
      });
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      setToast({ show: true, message: 'Failed to load analytics data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when timeFilter changes
  useEffect(() => {
    loadAnalytics();
  }, [timeFilter]);

  if (loading) {
    return <Loading message="Loading analytics data..." />;
  }

  if (!hasPermission(currentUser, 'view_analytics_module')) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">System statistics and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasPermission(currentUser, 'export_analytics_report') && (
            <Button variant="outline" size="xs" onClick={() => { setExportType(''); setShowExportModal(true); }}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </Button>
          )}
          {hasPermission(currentUser, 'configure_analytics_settings') && (
          <Button variant="primary" size="xs">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {hasPermission(currentUser, 'view_statistics_cards') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding={false} className="bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold mt-2">{userStats.totalUsers}</p>
                <div className="flex items-center space-x-2 mt-3">
                  <p className="text-green-100 text-xs mt-3">
                  Businessmen: {userStats.businessmen} | Purok: {userStats.purokLeaders}
                  </p>
                 
                </div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card padding={false} className="bg-gradient-to-br from-green-500 to-green-600">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Reports</p>
                <p className="text-4xl font-bold mt-2">{reportStats.total}</p>
                <div className="flex items-center space-x-2 mt-3">
                  <p className="text-green-100 text-xs mt-3">
                  Resolved: {reportStats.resolved} | Pending: {reportStats.pending}
                </p>
                 
                </div>
                
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card padding={false} className="bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Announcements</p>
                <p className="text-4xl font-bold mt-2">{overview?.total_announcements || 0}</p>
               

                <div className="flex items-center space-x-2 mt-3">
                  <p className="text-purple-100 text-xs mt-3">
                  Total: {overview?.total_announcements || 0} | Expired: 2
                </p>
                 
                </div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Card padding={false} className="bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Collection Routes</p>
                <p className="text-4xl font-bold mt-2">{overview?.completed_collections || 0}</p>
             
                <div className="flex items-center space-x-2 mt-3">
                  <p className="text-orange-100 text-xs mt-3">
                    Active Days: {overview?.completed_collections || 0}
                  </p>
                </div>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Charts Row 1 — Waste Watch (always visible if module accessible) + Most Active Reporters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waste Watch Report Ranking */}
        <Card title="Waste Watch: Report Ranking" subtitle="Reports by area" className="lg:col-span-2">
          <div className="flex items-center justify-end space-x-2 mb-4">
            {['Today', 'This Week', 'This Month'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${timeFilter === filter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {filter}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wasteReportRanking}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="reports" radius={[8, 8, 0, 0]}>
                {wasteReportRanking.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Most Active Reporters */}
        {hasPermission(currentUser, 'view_active_reporters_chart') && (
        <Card title="Most Active Reporters" subtitle="By area distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activeReporters}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {activeReporters.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {activeReporters.map((reporter, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reporter.color }}></div>
                  <span className="text-sm text-gray-700">{reporter.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{reporter.value}%</span>
              </div>
            ))}
          </div>
        </Card>
        )}
      </div>

      {/* Infographics Reports */}
      {hasPermission(currentUser, 'view_infographics_chart') && (
      <Card title="Infographics Reports" subtitle="Monthly report trends">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyReports}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="purokLeaders"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Purok Leaders"
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="business"
              stroke="#ef4444"
              strokeWidth={3}
              name="Business"
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      )}

      {/* Quick Stats Grid */}
      {hasPermission(currentUser, 'view_quick_stats') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900">{reportAnalytics?.resolution_metrics?.resolution_rate || 0}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">2.4h</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Resolution</p>
              <p className="text-2xl font-bold text-gray-900">{reportAnalytics?.resolution_metrics?.average_resolution_days?.toFixed(1) || 0}d</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{userActivity?.active_users || 0}</p>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Report"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowExportModal(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleExport} disabled={exporting || !exportType}>
              {exporting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Exporting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </span>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Export Type Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select what to export:</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Collections Option */}
              <button
                onClick={() => setExportType('collections')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  exportType === 'collections'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-sm font-semibold">Collections</span>
                <span className="text-xs mt-1 text-center opacity-70">Collection routes & schedules</span>
              </button>

              {/* Reports Option */}
              <button
                onClick={() => setExportType('reports')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  exportType === 'reports'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-semibold">Reports</span>
                <span className="text-xs mt-1 text-center opacity-70">Waste reports summary</span>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select date range:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  max={exportEndDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  min={exportStartDate}
                  max={today}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Default range: start of current month to today.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AnalyticsPage;
