import React, { useState, useEffect } from 'react';
import { Card, Badge, Loading } from '../components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { hasPermission } from '../utils/permissions';
import api from '../services/api';

const Dashboard = ({ user, onNavigate }) => {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [dashboardData, setDashboardData] = useState(null);
  const [wasteWatchData, setWasteWatchData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [useCustomDate, setUseCustomDate] = useState(false);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Map timeFilter to API period
        const period = timeFilter === 'Today' ? 'week' : timeFilter === 'This Week' ? 'week' : 'month';
        
        // Prepare ranking params
        const rankingParams = {
          group_by: 'purok'
        };
        
        // Add custom date range if applicable
        if (useCustomDate && dateRange.startDate && dateRange.endDate) {
          rankingParams.start_date = dateRange.startDate;
          rankingParams.end_date = dateRange.endDate;
        } else {
          rankingParams.period = period === 'week' ? 'week' : 'month';
        }
        
        // Fetch dashboard analytics, waste watch ranking, and recent activity
        const [analyticsResponse, rankingResponse, activityResponse] = await Promise.all([
          api.analytics.getDashboard({ period }),
          api.reports.getRanking(rankingParams),
          api.settings.getRecentActivity()
        ]);
        
        // Handle analytics response
        if (analyticsResponse && analyticsResponse.success && analyticsResponse.data) {
          // console.log('📊 Dashboard - Analytics Response:', analyticsResponse.data);
          setDashboardData(analyticsResponse.data);
        } else {
          console.warn('⚠️ Dashboard - Analytics API failed:', analyticsResponse);
          setError('Failed to load dashboard statistics');
        }

        // Handle ranking response
        if (rankingResponse && rankingResponse.success && rankingResponse.data) {
          const rankingData = rankingResponse.data.ranking || [];
          // console.log('📊 Dashboard - Ranking Response:', rankingResponse.data);
          setWasteWatchData(rankingData);
        } else {
          // console.warn('⚠️ Dashboard - Ranking API failed or returned no data:', rankingResponse);
          setWasteWatchData([]);
        }

        // Handle activity response
        if (activityResponse && activityResponse.success && activityResponse.data) {
          setRecentActivities(activityResponse.data);
        } else {
          console.warn('⚠️ Dashboard - Activity API failed:', activityResponse);
          setRecentActivities([]);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('An error occurred while loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (hasPermission(user, 'view_dashboard')) {
      fetchDashboardData();
    }
  }, [timeFilter, user, dateRange.startDate, dateRange.endDate, useCustomDate]);

  // Check if user has permission to view dashboard
  if (!hasPermission(user, 'view_dashboard')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view the dashboard.</p>
        </div>
      </div>
    );
  }

  const handleQuickAction = (action) => {
    console.log('Quick action:', action);
    if (onNavigate) {
      onNavigate(action);
    }
  };

  // Loading state
  if (loading) {
    return <Loading message="Loading dashboard data..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Build stats based on permissions and API data
  const stats = [];
  
  if (hasPermission(user, 'view_total_users_widget') && dashboardData?.users) {
    stats.push({ 
      label: 'Total Users', 
      value: dashboardData.users.total.toString(), 
      subtext: `Active: ${dashboardData.users.active} | Pending: ${dashboardData.users.pending}`, 
      color: 'primary' 
    });
  }
  
  if (hasPermission(user, 'view_total_reports_widget') && dashboardData?.reports) {
    stats.push({ 
      label: 'Total Reports', 
      value: dashboardData.reports.total.toString(), 
      subtext: `Resolved: ${dashboardData.reports.resolved} | Pending: ${dashboardData.reports.pending}`, 
      color: 'blue' 
    });
  }
  
  if (hasPermission(user, 'view_announcements_widget') && dashboardData?.announcements) {
    stats.push({ 
      label: 'Announcements', 
      value: dashboardData.announcements.total.toString(), 
      subtext: `Active: ${dashboardData.announcements.active}`, 
      color: 'green' 
    });
  }
  
  if (hasPermission(user, 'view_pending_approvals_widget') && dashboardData?.users) {
    stats.push({ 
      label: 'Pending Approvals', 
      value: dashboardData.users.pending.toString(), 
      subtext: 'Requires attention', 
      color: 'yellow' 
    });
  }

  // Use real data from backend or empty array if not loaded yet
  const wasteReportRanking = wasteWatchData.length > 0 ? wasteWatchData : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your waste management system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding={false} hover className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{stat.subtext}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`h-1 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600`}></div>
          </Card>
        ))}
      </div>

      {/* Waste Watch Chart - Permission Based */}
      {hasPermission(user, 'view_waste_watch_chart') && (
        <Card 
          title="Waste Watch: Report Ranking" 
          subtitle="Reports submitted by area"
        >
          {hasPermission(user, 'filter_waste_watch_chart') && (
            <div className="space-y-3 mb-4">
              {/* Time Filter Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {['Today', 'This Week', 'This Month'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setTimeFilter(filter);
                        setUseCustomDate(false);
                      }}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                        ${timeFilter === filter && !useCustomDate
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {filter}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustomDate(!useCustomDate)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                      ${useCustomDate
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    Custom Date
                  </button>
                </div>
              </div>

              {/* Custom Date Range Picker */}
              {useCustomDate && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      // Trigger refetch with custom dates
                      if (dateRange.startDate && dateRange.endDate) {
                        setTimeFilter('Custom');
                      }
                    }}
                    disabled={!dateRange.startDate || !dateRange.endDate}
                    className="px-3 py-1 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setDateRange({ startDate: '', endDate: '' });
                      setUseCustomDate(false);
                      setTimeFilter('This Month');
                    }}
                    className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
          
          {wasteReportRanking.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-medium text-gray-700 mb-1">No reports found</p>
                <p className="text-sm text-gray-500">Try selecting a different date range</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Recent Activity - Permission Based */}
      {hasPermission(user, 'view_recent_activity') && (
        <Card title="Recent Activity" subtitle="Latest updates from your system">
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
                    {activity.user?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                      <Badge variant="default" size="xs">{activity.role}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                  <Badge variant={activity.badge} size="xs">
                    {activity.badge}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No recent activity</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions - Permission Based */}
      {hasPermission(user, 'view_quick_actions') && (
        <Card title="Quick Actions" subtitle="Frequently used features">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPermission(user, 'use_quick_action_approve_users') && (
              <button 
                onClick={() => handleQuickAction('users')}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Approve Users</h3>
                <p className="text-sm text-gray-600 mt-1">Review pending accounts</p>
                <div className="flex items-center text-xs text-primary-600 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to Users <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}

            {hasPermission(user, 'use_quick_action_create_announcement') && (
              <button 
                onClick={() => handleQuickAction('announcements')}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Create Announcement</h3>
                <p className="text-sm text-gray-600 mt-1">Post new update</p>
                <div className="flex items-center text-xs text-green-600 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to Announcements <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}

            {hasPermission(user, 'use_quick_action_view_analytics') && (
              <button 
                onClick={() => handleQuickAction('analytics')}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">System reports & stats</p>
                <div className="flex items-center text-xs text-blue-600 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to Analytics <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
