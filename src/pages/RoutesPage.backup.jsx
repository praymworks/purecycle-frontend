import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
// import { Card, Button, Badge, Input, Toast, Loading, AccessDenied } from '../components/ui';
import { Card, Button, Badge, Input, Toast, Loading } from '../components/ui';
import { FormModal, AlertModal } from '../components/modals';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import routesData from '../data/routes.json';
import LeafletRoutesMap, { MAP_STYLES, ROUTES_MAP_DEFAULT_CENTER } from '../components/routes/LeafletRoutesMap';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const ROUTES_PAGE_LOG_PREFIX = '[RoutesPage]';

const logRoutesPage = (message, payload) => {
  if (payload === undefined) {
    console.log(`${ROUTES_PAGE_LOG_PREFIX} ${message}`);
    return;
  }

  console.log(`${ROUTES_PAGE_LOG_PREFIX} ${message}`, payload);
};

const toFiniteNumber = (value) => {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeWaypoint = (waypoint, index) => {
  const lat = toFiniteNumber(waypoint?.lat);
  const lng = toFiniteNumber(waypoint?.lng);

  return {
    id: waypoint?.id || `WP-${index + 1}`,
    name: waypoint?.name || `Waypoint ${index + 1}`,
    barangay: waypoint?.barangay || '',
    address: waypoint?.address || '',
    type: waypoint?.type || (index === 0 ? 'start' : 'pickup'),
    order: Number.isFinite(Number(waypoint?.order)) ? Number(waypoint.order) : index + 1,
    lat: lat ?? 0,
    lng: lng ?? 0,
  };
};

const normalizeRoute = (route, index) => {
  const routeIdentifier = String(route?.route_id || route?.id || `route-${index + 1}`);
  const waypoints = Array.isArray(route?.waypoints)
    ? route.waypoints.map(normalizeWaypoint).sort((first, second) => first.order - second.order)
    : [];

  return {
    ...route,
    id: routeIdentifier,
    route_id: route?.route_id || routeIdentifier,
    name: route?.name || `Route ${index + 1}`,
    description: route?.description || 'No description provided.',
    municipality: route?.municipality || 'Trinidad',
    province: route?.province || 'Bohol',
    status: route?.status || 'active',
    color: route?.color || '#3B82F6',
    waypoints,
    distance: route?.distance || 'N/A',
    estimatedDuration: route?.estimated_duration || route?.estimatedDuration || 'N/A',
    createdAt: route?.created_at || route?.createdAt || null,
    updatedAt: route?.updated_at || route?.updatedAt || null,
  };
};

const buildFallbackGeometry = (route) => ({
  coordinates: route.waypoints.map((waypoint) => [waypoint.lat, waypoint.lng]),
  distance: route.distance || 'N/A',
  duration: route.estimatedDuration || 'N/A',
  source: 'straight-line',
});

const extractRoutesFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.routes)) return response.routes;
  return [];
};

const getOSRMRoute = async (route) => {
  const waypoints = route?.waypoints || [];

  if (waypoints.length < 2) {
    logRoutesPage('Routing skipped: not enough waypoints', {
      routeId: route?.route_id || route?.id,
      routeName: route?.name,
      waypointCount: waypoints.length,
    });
    return null;
  }

  const coordinates = waypoints.map((waypoint) => `${waypoint.lng},${waypoint.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

  logRoutesPage('Loading route waypoints', {
    routeId: route?.route_id || route?.id,
    routeName: route?.name,
    waypoints: waypoints.map((waypoint) => ({
      id: waypoint.id,
      name: waypoint.name,
      order: waypoint.order,
      lat: waypoint.lat,
      lng: waypoint.lng,
      type: waypoint.type,
    })),
  });
  logRoutesPage('Routing API request', { routeId: route?.route_id || route?.id, url });

  try {
    const response = await fetch(url);
    const data = await response.json();

    logRoutesPage('Routing API response', {
      routeId: route?.route_id || route?.id,
      code: data?.code,
      routesReturned: data?.routes?.length || 0,
      waypointsReturned: data?.waypoints?.length || 0,
    });

    if (data?.code !== 'Ok' || !data?.routes?.length) {
      return null;
    }

    const selectedRoute = data.routes[0];

    return {
      coordinates: selectedRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: `${(selectedRoute.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(selectedRoute.duration / 60)} minutes`,
      source: 'osrm',
    };
  } catch (error) {
    console.error(`${ROUTES_PAGE_LOG_PREFIX} OSRM routing error`, {
      routeId: route?.route_id || route?.id,
      routeName: route?.name,
      message: error?.message,
    });
    return null;
  }
};

// Fix for default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RoutesPage = () => {
  const { user: currentUser } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeGeometries, setRouteGeometries] = useState({});
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingGeometries, setLoadingGeometries] = useState(false);
  const [selectedMapStyle, setSelectedMapStyle] = useState(0);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deleteRouteData, setDeleteRouteData] = useState(null);

  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [newRouteWaypoints, setNewRouteWaypoints] = useState([]);
  const [newRouteData, setNewRouteData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const [waypointForm, setWaypointForm] = useState({
    name: '',
    barangay: '',
    type: 'pickup',
    lat: 0,
    lng: 0,
  });
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const loadRoutes = useCallback(async () => {
    setLoadingRoutes(true);
    logRoutesPage('Fetching routes from backend');

    try {
      const response = await api.routes.getAll();
      const normalizedRoutes = extractRoutesFromResponse(response)
        .map(normalizeRoute)
        .filter((route) => route.waypoints.length > 0);

      logRoutesPage('Routes loaded from API', normalizedRoutes.map((route) => ({
        routeId: route.route_id,
        name: route.name,
        waypointCount: route.waypoints.length,
      })));

      setRoutes(normalizedRoutes);
      setSelectedRoute((currentSelectedRoute) => normalizedRoutes.find((route) => route.id === currentSelectedRoute?.id) || normalizedRoutes[0] || null);
    } catch (error) {
      console.error(`${ROUTES_PAGE_LOG_PREFIX} Error loading routes from API`, error);
      const fallbackRoutes = routesData.map(normalizeRoute);
      logRoutesPage('Using local fallback routes data', fallbackRoutes.map((route) => ({
        routeId: route.route_id,
        name: route.name,
        waypointCount: route.waypoints.length,
      })));
      setRoutes(fallbackRoutes);
      setSelectedRoute((currentSelectedRoute) => fallbackRoutes.find((route) => route.id === currentSelectedRoute?.id) || fallbackRoutes[0] || null);
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    if (!routes.length) {
      setRouteGeometries({});
      return;
    }

    let isCancelled = false;

    const fetchAllRoutes = async () => {
      setLoadingGeometries(true);
      logRoutesPage('Calculating map geometries for routes', routes.map((route) => ({
        routeId: route.route_id,
        name: route.name,
        waypointCount: route.waypoints.length,
      })));

      try {
        const geometryEntries = await Promise.all(
          routes.map(async (route) => {
            const osrmRoute = await getOSRMRoute(route);
            return [route.id, osrmRoute || buildFallbackGeometry(route)];
          })
        );

        if (!isCancelled) {
          setRouteGeometries(Object.fromEntries(geometryEntries));
        }
      } catch (error) {
        console.error(`${ROUTES_PAGE_LOG_PREFIX} Error loading route geometries`, error);

        if (!isCancelled) {
          setRouteGeometries(Object.fromEntries(routes.map((route) => [route.id, buildFallbackGeometry(route)])));
        }
      } finally {
        if (!isCancelled) {
          setLoadingGeometries(false);
        }
      }
    };

    fetchAllRoutes();

    return () => {
      isCancelled = true;
    };
  }, [routes]);

  const handleSelectRoute = useCallback((route, meta = {}) => {
    if (!route) return;

    logRoutesPage('Route clicked', {
      routeId: route.route_id,
      routeName: route.name,
      source: meta.source || 'unknown',
      waypointCount: route.waypoints.length,
    });

    setSelectedRoute(route);

    if (meta.clearWaypoint !== false) {
      setSelectedWaypoint(null);
    }
  }, []);

  const handleSelectWaypoint = useCallback((payload) => {
    if (!payload?.route || !payload?.waypoint) return;

    setSelectedRoute(payload.route);
    setSelectedWaypoint({
      routeId: payload.route.id,
      waypointId: payload.waypoint.id,
      route: payload.route,
      waypoint: payload.waypoint,
    });
  }, []);

  const selectedRouteGeometry = selectedRoute ? routeGeometries[selectedRoute.id] : null;

  const selectedRouteSummary = useMemo(() => {
    if (!selectedRoute) return null;

    const firstWaypoint = selectedRoute.waypoints[0] || null;
    const lastWaypoint = selectedRoute.waypoints[selectedRoute.waypoints.length - 1] || null;

    return {
      firstWaypoint,
      lastWaypoint,
      distance: selectedRouteGeometry?.distance || selectedRoute.distance || 'N/A',
      duration: selectedRouteGeometry?.duration || selectedRoute.estimatedDuration || 'N/A',
      source: selectedRouteGeometry?.source || 'straight-line',
    };
  }, [selectedRoute, selectedRouteGeometry]);

  const handleMapClick = useCallback((latlng) => {
    if (!isCreatingRoute) return;

    logRoutesPage('Map click received for new waypoint', latlng);

    setWaypointForm((currentWaypointForm) => ({
      ...currentWaypointForm,
      lat: latlng.lat,
      lng: latlng.lng,
      type: newRouteWaypoints.length === 0 ? 'start' : 'pickup',
    }));
    setShowWaypointModal(true);
  }, [isCreatingRoute, newRouteWaypoints.length]);
  
  // Add waypoint to new route
  const handleAddWaypoint = (e) => {
    e.preventDefault();
    
    const newWaypoint = {
      id: `WP-${Date.now()}`,
      name: waypointForm.name,
      barangay: waypointForm.barangay,
      lat: waypointForm.lat,
      lng: waypointForm.lng,
      type: waypointForm.type,
      order: newRouteWaypoints.length + 1
    };
    
    setNewRouteWaypoints([...newRouteWaypoints, newWaypoint]);
    setShowWaypointModal(false);
    setWaypointForm({ name: '', barangay: '', type: 'pickup', lat: 0, lng: 0 });
  };
  
  // Cancel waypoint modal
  const handleCancelWaypoint = () => {
    setShowWaypointModal(false);
    setWaypointForm({ name: '', barangay: '', type: 'pickup', lat: 0, lng: 0 });
  };
  
  // Start creating a route
  const handleStartCreateRoute = () => {
    setIsCreatingRoute(true);
    setNewRouteWaypoints([]);
    setNewRouteData({ name: '', description: '', color: '#3B82F6' });
  };
  
  // Cancel route creation
  const handleCancelCreateRoute = () => {
    setIsCreatingRoute(false);
    setNewRouteWaypoints([]);
    setShowCreateModal(false);
  };
  
  // Finish creating route
  const handleFinishCreateRoute = async (e) => {
    e.preventDefault();
    
    if (newRouteWaypoints.length < 2) {
      setToast({ show: true, message: 'Please add at least 2 waypoints (start and end)', variant: 'error' });
      return;
    }
    
    // Mark last waypoint as 'end'
    const updatedWaypoints = newRouteWaypoints.map((wp, idx) => ({
      ...wp,
      type: idx === 0 ? 'start' : idx === newRouteWaypoints.length - 1 ? 'end' : 'pickup'
    }));
    
    // Get OSRM route
    const osrmRoute = await getOSRMRoute({
      route_id: 'new-route-preview',
      name: newRouteData.name || 'New route preview',
      waypoints: updatedWaypoints,
    });
    
    const routePayload = {
      name: newRouteData.name,
      description: newRouteData.description,
      municipality: 'Trinidad',
      province: 'Bohol',
      status: 'active',
      color: newRouteData.color,
      waypoints: updatedWaypoints,
      distance: osrmRoute?.distance || 'N/A',
      estimatedDuration: osrmRoute?.duration || 'N/A',
    };

    try {
      // Create route via API
      const response = await api.routes.create(routePayload);
      const createdRoute = response.data || response;
      
      // Update local state with route geometry
      if (osrmRoute) {
        setRouteGeometries({
          ...routeGeometries,
          [createdRoute.id]: {
            coordinates: osrmRoute.coordinates,
            distance: osrmRoute.distance,
            duration: osrmRoute.duration
          }
        });
      }
      
      // Reload routes from backend
      await loadRoutes();
      
      setIsCreatingRoute(false);
      setNewRouteWaypoints([]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating route:', error);
      setToast({ show: true, message: 'Failed to create route. Please try again.', variant: 'error' });
    }
  };
  
  // Handle edit route
  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setShowEditModal(true);
  };
  
  // Update route
  const handleUpdateRoute = async (e) => {
    e.preventDefault();
    
    try {
      const updatePayload = {
        name: editingRoute.name,
        description: editingRoute.description,
        color: editingRoute.color,
        status: editingRoute.status,
        municipality: editingRoute.municipality,
        province: editingRoute.province,
      };

      await api.routes.update(editingRoute.id, updatePayload);
      
      // Reload routes from backend
      await loadRoutes();
      
      // Update selected route if it was the one being edited
      if (selectedRoute?.id === editingRoute.id) {
        const updatedRoute = routes.find(r => r.id === editingRoute.id);
        if (updatedRoute) setSelectedRoute(updatedRoute);
      }
      
      setShowEditModal(false);
      setEditingRoute(null);
    } catch (error) {
      console.error('Error updating route:', error);
      setToast({ show: true, message: 'Failed to update route. Please try again.', variant: 'error' });
    }
  };
  
  // Handle delete route
  const handleDeleteRoute = (route) => {
    setDeleteRouteData(route);
    setShowDeleteModal(true);
  };
  
  // Confirm delete route
  const handleConfirmDelete = async () => {
    try {
      await api.routes.delete(deleteRouteData.id);
      
      // Remove from geometries
      const newGeometries = { ...routeGeometries };
      delete newGeometries[deleteRouteData.id];
      setRouteGeometries(newGeometries);
      
      // Reload routes from backend
      await loadRoutes();
      
      // Update selected route if it was the one being deleted
      if (selectedRoute?.id === deleteRouteData.id) {
        const remainingRoutes = routes.filter(r => r.id !== deleteRouteData.id);
        setSelectedRoute(remainingRoutes.length > 0 ? remainingRoutes[0] : null);
      }
      
      setShowDeleteModal(false);
      setDeleteRouteData(null);
    } catch (error) {
      console.error('Error deleting route:', error);
      setToast({ show: true, message: 'Failed to delete route. Please try again.', variant: 'error' });
    }
  };
  
  // Loading state
  if (loadingRoutes) {
    return <Loading message="Loading routes..." />;
  }

  // // Permission check
  // if (!hasPermission(currentUser, 'view_routes_module')) {
  //   return <AccessDenied message="You don't have permission to view Routes Management." />;
  // }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
          <p className="text-gray-600 mt-1">Manage collection routes and waypoints for Trinidad, Bohol</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Map Style Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Map Style:</span>
            <select
              value={selectedMapStyle}
              onChange={(e) => setSelectedMapStyle(parseInt(e.target.value))}
              className="block rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              style={{ minWidth: '160px' }}
            >
              {MAP_STYLES.map((style, index) => (
                <option key={index} value={index}>{style.name}</option>
              ))}
            </select>
          </div>
          {!isCreatingRoute ? (
            <Button onClick={handleStartCreateRoute}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Route
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowCreateModal(true)} variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finish ({newRouteWaypoints.length} waypoints)
              </Button>
              <Button onClick={handleCancelCreateRoute} variant="outline">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Map and Routes List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Map</h2>
              <LeafletRoutesMap
                routes={routes}
                selectedRoute={selectedRoute}
                selectedWaypoint={selectedWaypoint}
                routeGeometries={routeGeometries}
                selectedMapStyle={selectedMapStyle}
                loadingGeometries={loadingGeometries}
                isCreatingRoute={isCreatingRoute}
                newRouteWaypoints={newRouteWaypoints}
                newRouteColor={newRouteData.color}
                showWaypointModal={showWaypointModal}
                showCreateModal={showCreateModal}
                onMapClick={handleMapClick}
                onSelectRoute={handleSelectRoute}
                onSelectWaypoint={handleSelectWaypoint}
              />
            </div>
          </Card>

          <Card>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Selected Route Details</h2>
                  <p className="text-sm text-gray-600">Click a route line or marker to inspect its road-following geometry and waypoint details.</p>
                </div>
                {selectedRouteSummary && (
                  <Badge variant={selectedRouteSummary.source === 'osrm' ? 'success' : 'secondary'}>
                    {selectedRouteSummary.source === 'osrm' ? 'Road-following route' : 'Fallback line'}
                  </Badge>
                )}
              </div>

              {selectedRoute ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Route</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedRoute.name}</p>
                      <p className="text-sm text-gray-600">ID: {selectedRoute.route_id}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Distance</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedRouteSummary?.distance}</p>
                      <p className="text-sm text-gray-600">Duration: {selectedRouteSummary?.duration}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Origin</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedRouteSummary?.firstWaypoint?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedRouteSummary?.firstWaypoint?.barangay || 'No barangay set'}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Destination</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedRouteSummary?.lastWaypoint?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedRouteSummary?.lastWaypoint?.barangay || 'No barangay set'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Route Description</h3>
                        <p className="text-sm text-gray-600">{selectedRoute.description}</p>
                      </div>
                      <Badge variant={selectedRoute.status === 'active' ? 'success' : 'secondary'} size="sm">
                        {selectedRoute.status}
                      </Badge>
                    </div>

                    {selectedWaypoint?.routeId === selectedRoute.id && selectedWaypoint?.waypoint && (
                      <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-primary-700">Selected Marker</p>
                        <p className="mt-1 font-semibold text-primary-900">{selectedWaypoint.waypoint.name}</p>
                        <p className="text-sm text-primary-800">Stop #{selectedWaypoint.waypoint.order} • {selectedWaypoint.waypoint.type}</p>
                        <p className="text-sm text-primary-800">{selectedWaypoint.waypoint.barangay || 'No barangay set'}</p>
                        <p className="text-xs text-primary-700 mt-1">
                          Lat: {Number(selectedWaypoint.waypoint.lat).toFixed(5)}, Lng: {Number(selectedWaypoint.waypoint.lng).toFixed(5)}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  Select a route from the map or the list to inspect its details.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Routes List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Routes List</h2>
              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {Array.isArray(routes) && routes.map((route) => (
                  <div
                    key={route.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRoute?.id === route.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectRoute(route, { source: 'list' })}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: route.color }}
                        ></div>
                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      </div>
                      <Badge variant={route.status === 'active' ? 'success' : 'secondary'} size="sm">
                        {route.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{route.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>📍 {route.waypoints.length} waypoints</span>
                      <span>📏 {routeGeometries[route.id]?.distance || route.distance}</span>
                      <span>⏱️ {routeGeometries[route.id]?.duration || route.estimatedDuration}</span>
                    </div>
                    
                    {loadingGeometries && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                        <span>Calculating road-following route...</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRoute(route, { source: 'view-button' });
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoute(route);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoute(route);
                        }}
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Waypoint Modal with Map */}
      <FormModal
        isOpen={showWaypointModal}
        onClose={handleCancelWaypoint}
        onSubmit={handleAddWaypoint}
        title="Add Waypoint"
        submitText="Add Waypoint"
        size="lg"
      >
        <div className="space-y-4">
          {/* Mini Map Preview */}
          <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '250px' }}>
            <MapContainer
              center={waypointForm.lat && waypointForm.lng ? [waypointForm.lat, waypointForm.lng] : ROUTES_MAP_DEFAULT_CENTER}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              dragging={false}
              zoomControl={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
            >
              <TileLayer
                attribution={(MAP_STYLES[selectedMapStyle] || MAP_STYLES[0]).attribution}
                url={(MAP_STYLES[selectedMapStyle] || MAP_STYLES[0]).url}
              />
              <Marker position={[waypointForm.lat, waypointForm.lng]}>
                <Popup>
                  Selected Location
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Coordinates:</strong> Lat: {waypointForm.lat.toFixed(6)}, Lng: {waypointForm.lng.toFixed(6)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Municipal Hall, Barangay Hall"
              value={waypointForm.name}
              onChange={(e) => setWaypointForm({ ...waypointForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barangay *
            </label>
            <Input
              type="text"
              placeholder="e.g., Poblacion, Caigangan"
              value={waypointForm.barangay}
              onChange={(e) => setWaypointForm({ ...waypointForm, barangay: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={waypointForm.type}
              onChange={(e) => setWaypointForm({ ...waypointForm, type: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="start">Start Point</option>
              <option value="pickup">Pickup Point</option>
              <option value="end">End Point</option>
            </select>
          </div>
        </div>
      </FormModal>

      {/* Finish Create Route Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleFinishCreateRoute}
        title="Finish Creating Route"
        submitText="Create Route"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>{newRouteWaypoints.length} waypoints</strong> added to this route
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Trinidad Central Route"
              value={newRouteData.name}
              onChange={(e) => setNewRouteData({ ...newRouteData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              placeholder="e.g., Main route covering central Trinidad barangays"
              value={newRouteData.description}
              onChange={(e) => setNewRouteData({ ...newRouteData, description: e.target.value })}
              required
              rows="3"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Color
            </label>
            <input
              type="color"
              value={newRouteData.color}
              onChange={(e) => setNewRouteData({ ...newRouteData, color: e.target.value })}
              className="block w-20 h-10 rounded border border-gray-300 cursor-pointer"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Waypoints:</p>
            <div className="space-y-1">
              {newRouteWaypoints.map((wp, idx) => (
                <div key={wp.id} className="text-sm text-gray-600">
                  {idx + 1}. {wp.name} ({wp.barangay})
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormModal>

      {/* Edit Route Modal */}
      {editingRoute && (
        <FormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateRoute}
          title="Edit Route"
          submitText="Update Route"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Name *
              </label>
              <Input
                type="text"
                value={editingRoute.name}
                onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={editingRoute.description}
                onChange={(e) => setEditingRoute({ ...editingRoute, description: e.target.value })}
                required
                rows="3"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Color
              </label>
              <input
                type="color"
                value={editingRoute.color}
                onChange={(e) => setEditingRoute({ ...editingRoute, color: e.target.value })}
                className="block w-20 h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={editingRoute.status}
                onChange={(e) => setEditingRoute({ ...editingRoute, status: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </FormModal>
      )}

      {/* Delete Route Modal */}
      {deleteRouteData && (
        <AlertModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Route"
          message={`Are you sure you want to delete "${deleteRouteData.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}

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

export default RoutesPage;
