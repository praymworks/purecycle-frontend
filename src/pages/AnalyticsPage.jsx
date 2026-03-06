import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Toast } from '../components/ui';
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
import { users, reports } from '../data';
import api from '../services/api';

const AnalyticsPage = () => {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  
  // Analytics data from backend
  const [overview, setOverview] = useState(null);
  const [collectionStats, setCollectionStats] = useState(null);
  const [routePerformance, setRoutePerformance] = useState([]);
  const [reportAnalytics, setReportAnalytics] = useState(null);
  const [userActivity, setUserActivity] = useState(null);

  // Load analytics data from backend
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Determine period based on timeFilter
      const period = timeFilter === 'This Week' ? 'week' : 
                     timeFilter === 'This Month' ? 'month' : 'year';
      
      // Fetch all analytics data
      const [overviewRes, collectionRes, routeRes, reportRes, userRes] = await Promise.all([
        api.analytics.getOverview(),
        api.analytics.getCollectionStats({ period }),
        api.analytics.getRoutePerformance(),
        api.analytics.getReportAnalytics({ period }),
        api.analytics.getUserActivity(),
      ]);


   
      
      
      // Set data
      setOverview(overviewRes.data || overviewRes);
      setCollectionStats(collectionRes.data || collectionRes);
      setRoutePerformance(routeRes.data || routeRes);
      setReportAnalytics(reportRes.data || reportRes);
      setUserActivity(userRes.data || userRes);
      
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

  // Waste Watch Report Ranking Data
  const wasteReportRanking = [
    { area: 'YL', reports: 15, color: '#f87171' },
    { area: 'Carenderia', reports: 13, color: '#fbbf24' },
    { area: 'Purok 1', reports: 12, color: '#fbbf24' },
    { area: 'Purok 3', reports: 10, color: '#fde047' },
    { area: 'Shoppers', reports: 8, color: '#fde047' },
    { area: 'Purok 2', reports: 6, color: '#93c5fd' },
    { area: 'Purok 5', reports: 5, color: '#86efac' },
  ];

  console.log(overview);
  

  // Infographics Reports (Line Chart Data)
  const monthlyReports = [
    { month: 'June', purokLeaders: 12, business: 8 },
    { month: 'July', purokLeaders: 18, business: 15 },
    { month: 'Aug', purokLeaders: 8, business: 20 },
    { month: 'Sept', purokLeaders: 15, business: 12 },
    { month: 'Oct', purokLeaders: 5, business: 18 },
    { month: 'Nov', purokLeaders: 22, business: 25 },
  ];

  // Most Active Reporters (Pie Chart Data)
  const activeReporters = [
    { name: 'Purok 5', value: 35, color: '#22c55e' },
    { name: 'Shoppers', value: 40, color: '#86efac' },
    { name: 'Purok 1', value: 25, color: '#dcfce7' },
  ];

  // User Statistics
  const userStats = {
    totalUsers: users.length,
    businessmen: users.filter(u => u.role === 'business_owner').length,
    purokLeaders: users.filter(u => u.role === 'purok_leader').length,
  };

  

  // Report Statistics  
  const reportStats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    inProgress: reports.filter(r => r.status === 'In Progress').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">System statistics and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="xs">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </Button>
          <Button variant="primary" size="xs">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Charts Row 1 */}
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
      </div>

      {/* Infographics Reports */}
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

      {/* Quick Stats Grid */}
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

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AnalyticsPage;
