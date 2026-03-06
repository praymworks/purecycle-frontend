/**
 * Application Routes Configuration
 * Defines all available routes in the application with their paths and metadata
 */

export const appRoutes = [
  {
    id: 'dashboard',
    path: '/',
    name: 'Dashboard',
    component: 'Dashboard',
    permission: 'view_dashboard',
    icon: 'home',
    showInSidebar: true,
    order: 1
  },
  {
    id: 'users',
    path: '/manage_accounts',
    name: 'Manage Accounts',
    component: 'UsersPage',
    permission: 'view_user_management_module',
    icon: 'users',
    showInSidebar: true,
    order: 2
  },
  {
    id: 'reports',
    path: '/reports',
    name: 'View Reports',
    component: 'ReportsPage',
    permission: 'view_reports_management_module',
    icon: 'flag',
    showInSidebar: true,
    order: 3
  },
  {
    id: 'announcements',
    path: '/announcements',
    name: 'Announcements',
    component: 'AnnouncementsPage',
    permission: 'view_announcements_module',
    icon: 'megaphone',
    showInSidebar: true,
    order: 4
  },
  {
    id: 'routes',
    path: '/routes',
    name: 'Routes',
    component: 'RoutesPage',
    permission: 'view_routes_module',
    icon: 'map',
    showInSidebar: true,
    order: 5
  },
  {
    id: 'schedules',
    path: '/schedules',
    name: 'Schedules',
    component: 'SchedulesPage',
    permission: 'view_schedules_module',
    icon: 'calendar',
    showInSidebar: true,
    order: 6
  },
  {
    id: 'analytics',
    path: '/analytics',
    name: 'Analytics',
    component: 'AnalyticsPage',
    permission: 'view_analytics_module',
    icon: 'chart',
    showInSidebar: true,
    order: 7
  },
  {
    id: 'roles',
    path: '/roles',
    name: 'Roles',
    component: 'RolesPage',
    permission: 'view_roles_management_module',
    icon: 'shield',
    showInSidebar: true,
    order: 8
  },
  {
    id: 'permissions',
    path: '/permissions',
    name: 'Permissions',
    component: 'PermissionsPage',
    permission: 'view_permissions_management_module',
    icon: 'key',
    showInSidebar: true,
    order: 9
  },
  {
    id: 'settings',
    path: '/settings',
    name: 'Settings',
    component: 'SettingsPage',
    permission: 'view_system_settings_module',
    icon: 'settings',
    showInSidebar: true,
    order: 10
  },
  {
    id: 'profile',
    path: '/profile',
    name: 'Profile',
    component: 'ProfilePage',
    permission: 'view_profile',
    icon: 'user',
    showInSidebar: false,
    order: 11
  },
  {
    id: 'notifications',
    path: '/notifications',
    name: 'Notifications',
    component: 'NotificationsPage',
    permission: 'view_notifications_module',
    icon: 'bell',
    showInSidebar: false,
    order: 12
  }
];

/**
 * Get route by ID
 * @param {string} id - Route ID
 * @returns {object|null} Route object or null if not found
 */
export const getRouteById = (id) => {
  return appRoutes.find(route => route.id === id) || null;
};

/**
 * Get route by path
 * @param {string} path - Route path
 * @returns {object|null} Route object or null if not found
 */
export const getRouteByPath = (path) => {
  return appRoutes.find(route => route.path === path) || null;
};

/**
 * Get all routes that should appear in sidebar
 * @returns {array} Array of routes
 */
export const getSidebarRoutes = () => {
  return appRoutes.filter(route => route.showInSidebar).sort((a, b) => a.order - b.order);
};

/**
 * Get routes accessible by user based on permissions
 * @param {object} user - User object with role
 * @param {function} hasPermission - Permission checking function
 * @returns {array} Array of accessible routes
 */
export const getAccessibleRoutes = (user, hasPermission) => {
  if (!user || !hasPermission) return [];
  
  return appRoutes.filter(route => {
    // If no permission required, route is accessible
    if (!route.permission) return true;
    
    // Check if user has required permission
    return hasPermission(user, route.permission);
  });
};

/**
 * Get accessible sidebar routes for user
 * @param {object} user - User object with role
 * @param {function} hasPermission - Permission checking function
 * @returns {array} Array of accessible sidebar routes
 */
export const getAccessibleSidebarRoutes = (user, hasPermission) => {
  return getAccessibleRoutes(user, hasPermission)
    .filter(route => route.showInSidebar)
    .sort((a, b) => a.order - b.order);
};

/**
 * Check if user can access a specific route
 * @param {object} user - User object with role
 * @param {string} routeId - Route ID to check
 * @param {function} hasPermission - Permission checking function
 * @returns {boolean} True if user can access route
 */
export const canAccessRoute = (user, routeId, hasPermission) => {
  const route = getRouteById(routeId);
  if (!route) return false;
  
  // If no permission required, route is accessible
  if (!route.permission) return true;
  
  // Check if user has required permission
  return hasPermission(user, route.permission);
};

/**
 * Get default route for user (first accessible route)
 * @param {object} user - User object with role
 * @param {function} hasPermission - Permission checking function
 * @returns {object|null} First accessible route or null
 */
export const getDefaultRoute = (user, hasPermission) => {
  const accessibleRoutes = getAccessibleRoutes(user, hasPermission);
  return accessibleRoutes.length > 0 ? accessibleRoutes[0] : null;
};
