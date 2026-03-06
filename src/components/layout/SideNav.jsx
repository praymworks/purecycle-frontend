import React, { useState } from 'react';

const SideNav = ({ user, currentPage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // All menu items with role-based access (using role slugs from roles.json)
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard', roles: ['admin', 'staff', 'purok_leader', 'business_owner'] },
    { id: 'users', label: 'Manage Accounts', icon: 'users', path: '/users', roles: ['admin'] },
    { id: 'reports', label: 'View Reports', icon: 'clipboard', path: '/reports', roles: ['admin', 'staff'] },
    { id: 'announcements', label: 'Announcements', icon: 'megaphone', path: '/announcements', roles: ['admin', 'staff'] },
    { id: 'routes', label: 'Routes', icon: 'map', path: '/routes', roles: ['admin', 'staff'] },
    { id: 'schedules', label: 'Schedules', icon: 'calendar', path: '/schedules', roles: ['admin', 'staff'] },
    { id: 'analytics', label: 'Analytics', icon: 'chart', path: '/analytics', roles: ['admin'] },
    { id: 'divider-1', label: '', icon: 'divider', path: '', roles: ['admin'] },
    { id: 'roles', label: 'Roles', icon: 'shield', path: '/roles', roles: ['admin'] },
    { id: 'permissions', label: 'Permissions', icon: 'key', path: '/permissions', roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: 'cog', path: '/settings', roles: ['admin'] },
    { id: 'divider-2', label: '', icon: 'divider', path: '', roles: ['admin', 'staff'] },
    { id: 'profile', label: 'Profile', icon: 'user', path: '/profile', roles: ['admin', 'staff', 'purok_leader', 'business_owner'] },
  ];

  // Filter menu items based on user roleSlug (matches roles.json slug)
  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.roleSlug || 'admin'));

  const icons = {
    home: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    clipboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    megaphone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    map: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    chart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    shield: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    key: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    cog: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 z-20
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            if (item.icon === 'divider') {
              return (
                <div key={item.id} className="my-2 border-t border-gray-200"></div>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${currentPage === item.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <span className={currentPage === item.id ? 'text-primary-700' : 'text-gray-500'}>
                  {icons[item.icon]}
                </span>
                {!isCollapsed && <span className="flex-1 text-left text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Spacer */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}></div>
    </>
  );
};

export default SideNav;
