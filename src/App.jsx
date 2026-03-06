import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import ReportsPage from './pages/ReportsPage'
import RolesPage from './pages/RolesPage'
import PermissionsPage from './pages/PermissionsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import SchedulesPage from './pages/SchedulesPage'
import RoutesPage from './pages/RoutesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import { MainLayout } from './components/layout'
import { appRoutes, getRouteById, canAccessRoute } from './config/appRoutes'
import { hasPermission } from './utils/permissions'
import { getCurrentUser, logout as authLogout, isAuthenticated } from './services/authService'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize auth on mount - check if user is already logged in and restore current page from URL
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = await getCurrentUser()
          if (currentUser) {
            setUser(currentUser)
            
            // Restore current page from URL path
            const currentPath = window.location.pathname
            const route = appRoutes.find(r => r.path === currentPath)
            if (route && canAccessRoute(currentUser, route.id, hasPermission)) {
              setCurrentPage(route.id)
            } else {
              // If route not found or no access, default to dashboard
              setCurrentPage('dashboard')
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeAuth()
  }, [])

  // Update URL when page changes
  useEffect(() => {
    if (user && currentPage) {
      const route = getRouteById(currentPage)
      if (route) {
        // Update browser URL without page reload
        window.history.pushState({}, '', route.path)
        // Update page title
        document.title = `${route.name} - PureCycle Admin`
      }
    }
  }, [currentPage, user])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (user) {
        const currentPath = window.location.pathname
        const route = appRoutes.find(r => r.path === currentPath)
        if (route && canAccessRoute(user, route.id, hasPermission)) {
          setCurrentPage(route.id)
        } else {
          setCurrentPage('dashboard')
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user])

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentPage('dashboard')
  }

  const handleLogout = async () => {
    try {
      await authLogout() // Clear localStorage and JWT token
      setUser(null)
      setCurrentPage('dashboard')
      window.history.pushState({}, '', '/')
      document.title = 'PureCycle Admin - Login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout anyway
      setUser(null)
    }
  }

  // Handle page navigation with permission check
  const handlePageChange = (pageId) => {
    if (!user) return
    
    // Check if user has permission to access this route
    if (canAccessRoute(user, pageId, hasPermission)) {
      setCurrentPage(pageId)
    } else {
      console.warn(`User does not have permission to access: ${pageId}`)
      // Could show a toast/alert here
      alert('You do not have permission to access this page.')
    }
  }

  // Show loading spinner while initializing auth
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-green-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setCurrentPage} />
      case 'users':
        return <UsersPage />
      case 'reports':
        return <ReportsPage />
      case 'announcements':
        return <AnnouncementsPage />
      case 'schedules':
        return <SchedulesPage />
      case 'routes':
        return <RoutesPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'roles':
        return <RolesPage />
      case 'permissions':
        return <PermissionsPage />
      case 'settings':
        return <SettingsPage />
      case 'profile':
        return <ProfilePage user={user} />
      case 'notifications':
        return <NotificationsPage />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <MainLayout user={user} onLogout={handleLogout} currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </MainLayout>
  )
}

export default App
