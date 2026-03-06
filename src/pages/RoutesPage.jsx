import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card, Button, Badge, Input, Select, Toast, Loading, AccessDenied } from '../components/ui';
import { FormModal, AlertModal, ViewModal } from '../components/modals';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// OSRM Routing Service (FREE - follows actual roads!)
const getOSRMRoute = async (waypoints) => {
  try {
    // Build coordinates string for OSRM: lng,lat;lng,lat;...
    const coordinates = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    
    // OSRM API endpoint (free public server)
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      
      return {
        coordinates,
        distance: (route.distance / 1000).toFixed(2) + ' km', // meters to km
        duration: Math.round(route.duration / 60) + ' minutes' // seconds to minutes
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
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

// Map click handler component
const MapClickHandler = ({ onMapClick, isEnabled }) => {
  const map = useMap();

  useEffect(() => {
    if (!isEnabled) return;

    const handleClick = (e) => {
      onMapClick(e.latlng);
    };

    map.on('click', handleClick);
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, onMapClick, isEnabled]);

  return null;
};

// Custom marker icons with numbers
const createCustomIcon = (color, type, number) => {
  const iconHtml = type === 'start' 
    ? `<div style="background-color: ${color}; width: 35px; height: 35px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);"><div style="transform: rotate(45deg); margin-top: 6px; margin-left: 10px; color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${number}</div></div>`
    : type === 'end'
    ? `<div style="background-color: ${color}; width: 35px; height: 35px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);"><div style="transform: rotate(45deg); margin-top: 6px; margin-left: 10px; color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${number}</div></div>`
    : `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${number}</div>`;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [35, 35],
    iconAnchor: [17.5, 35],
  });
};

// Available FREE map styles
const mapStyles = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  {
    name: 'Topo Map',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  },
  {
    name: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  {
    name: 'Light Mode',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  {
    name: 'Street (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
];

const RoutesPage = () => {
  const { user: currentUser } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRoute, setViewRoute] = useState(null);
  const [routeGeometries, setRouteGeometries] = useState({});
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [selectedMapStyle, setSelectedMapStyle] = useState(0);
  
  // Route creation state
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [newRouteWaypoints, setNewRouteWaypoints] = useState([]);
  const [newRouteData, setNewRouteData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  
  // Waypoint form state
  const [waypointForm, setWaypointForm] = useState({
    name: '',
    barangay: '',
    type: 'pickup',
    lat: 0,
    lng: 0
  });
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  // Load routes from backend API
  const loadRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const response = await api.routes.getAll();
      // API response logged
      
      // Handle different response structures
      let fetchedRoutes = [];
      if (Array.isArray(response)) {
        // Direct array: [route1, route2, ...]
        fetchedRoutes = response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Laravel paginated: { data: { data: [...] } }
        fetchedRoutes = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Laravel resource: { data: [...] }
        fetchedRoutes = response.data;
      } else if (response.routes && Array.isArray(response.routes)) {
        // Custom wrapper: { routes: [...] }
        fetchedRoutes = response.routes;
      }
      
      
      // Transform backend data to match frontend format
      fetchedRoutes = fetchedRoutes.map(route => ({
        ...route,
        id: route.route_id || route.id, // Use route_id if available
        estimatedDuration: route.estimated_duration || route.estimatedDuration,
        createdAt: route.created_at || route.createdAt,
        updatedAt: route.updated_at || route.updatedAt,
      }));
      // Routes fetched successfully
      setRoutes(fetchedRoutes);
      if (fetchedRoutes.length > 0 && !selectedRoute) {
        setSelectedRoute(fetchedRoutes[0]);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      // Fallback to local data if API fails
      setRoutes(routesData || []);
      if (routesData && routesData.length > 0 && !selectedRoute) {
        setSelectedRoute(routesData[0]);
      }
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Load routes on component mount
  useEffect(() => {
    loadRoutes();
  }, []);
  
  // Edit/Delete state
  const [editingRoute, setEditingRoute] = useState(null);
  const [deleteRouteData, setDeleteRouteData] = useState(null);
  
  // Trinidad, Bohol default center
  const trinidadCenter = [10.0806, 124.3436];
  
  // Fetch OSRM routes for all routes on component mount
  useEffect(() => {
    const fetchAllRoutes = async () => {
      setLoadingRoutes(true);
      const geometries = {};
      
      for (const route of routes) {
        const osrmRoute = await getOSRMRoute(route.waypoints);
        if (osrmRoute) {
          geometries[route.id] = {
            coordinates: osrmRoute.coordinates,
            distance: osrmRoute.distance,
            duration: osrmRoute.duration
          };
        } else {
          // Fallback to straight lines if OSRM fails
          geometries[route.id] = {
            coordinates: route.waypoints.map(wp => [wp.lat, wp.lng]),
            distance: route.distance,
            duration: route.estimatedDuration
          };
        }
      }
      
      setRouteGeometries(geometries);
      setLoadingRoutes(false);
    };
    
    fetchAllRoutes();
  }, [routes]);
  
  // Handle map click to add waypoint
  const handleMapClick = (latlng) => {
    if (!isCreatingRoute) return;
    
    setWaypointForm({
      ...waypointForm,
      lat: latlng.lat,
      lng: latlng.lng,
      type: newRouteWaypoints.length === 0 ? 'start' : 'pickup'
    });
    setShowWaypointModal(true);
  };
  
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
    const osrmRoute = await getOSRMRoute(updatedWaypoints);
    
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

  // Permission check
  if (!hasPermission(currentUser, 'view_routes_module')) {
    return <AccessDenied message="You don't have permission to view Routes Management." />;
  }

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
              {mapStyles.map((style, index) => (
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
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Map</h2>
              <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
                <MapContainer
                  center={trinidadCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  key={selectedMapStyle} // Force re-render on style change
                >
                  <TileLayer
                    attribution={mapStyles[selectedMapStyle].attribution}
                    url={mapStyles[selectedMapStyle].url}
                  />
                  
                  {/* Map click handler for creating routes - disabled when modal is open */}
                  <MapClickHandler onMapClick={handleMapClick} isEnabled={isCreatingRoute && !showWaypointModal && !showCreateModal} />
                  
                  {/* Creating route indicator */}
                  {isCreatingRoute && (
                    <div className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Click on map to add waypoints ({newRouteWaypoints.length} added)</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Preview new route waypoints */}
                  {isCreatingRoute && newRouteWaypoints.length > 0 && (
                    <>
                      {newRouteWaypoints.length > 1 && (
                        <Polyline
                          positions={newRouteWaypoints.map(wp => [wp.lat, wp.lng])}
                          color={newRouteData.color}
                          weight={4}
                          dashArray="5, 10"
                        />
                      )}
                      {newRouteWaypoints.map((waypoint, idx) => (
                        <Marker
                          key={waypoint.id}
                          position={[waypoint.lat, waypoint.lng]}
                          icon={createCustomIcon(newRouteData.color, waypoint.type, waypoint.order)}
                        >
                          <Popup>
                            <div className="text-sm">
                              <p className="font-semibold text-primary-600">New Stop #{waypoint.order}</p>
                              <p className="font-semibold mt-1">{waypoint.name}</p>
                              <p className="text-gray-600">{waypoint.barangay}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </>
                  )}
                  
                  {/* Loading indicator */}
                  {loadingRoutes && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="text-sm font-medium">Loading routes...</span>
                      </div>
                    </div>
                  )}

                  {/* Render ONLY selected route */}
                  {!loadingRoutes && selectedRoute && routeGeometries[selectedRoute.id] && (
                    <React.Fragment key={selectedRoute.id}>
                        {/* Route polyline following roads */}
                        <Polyline
                          positions={routeGeometries[selectedRoute.id].coordinates}
                          color={selectedRoute.color}
                          weight={5}
                          opacity={1}
                        />
                        
                        {/* Waypoint markers with numbers */}
                        {Array.isArray(selectedRoute.waypoints) && selectedRoute.waypoints.map((waypoint, idx) => (
                          <Marker
                            key={waypoint.id}
                            position={[waypoint.lat, waypoint.lng]}
                            icon={createCustomIcon(selectedRoute.color, waypoint.type, waypoint.order)}
                            opacity={1}
                            zIndexOffset={waypoint.type === 'start' ? 1000 : waypoint.type === 'end' ? 999 : 100}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold text-primary-600">Stop #{waypoint.order}</p>
                                <p className="font-semibold mt-1">{waypoint.name}</p>
                                <p className="text-gray-600">{waypoint.barangay}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    waypoint.type === 'start' ? 'bg-green-100 text-green-800' :
                                    waypoint.type === 'end' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {waypoint.type === 'start' ? '🚩 Start' : 
                                     waypoint.type === 'end' ? '🏁 End' : '📍 Pickup'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Lat: {waypoint.lat.toFixed(4)}, Lng: {waypoint.lng.toFixed(4)}
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                       </React.Fragment>
                  )}
                </MapContainer>
              </div>
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
                    onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
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
                    
                    {loadingRoutes && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                        <span>Calculating route...</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewRoute(route);
                          setShowViewModal(true);
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
              center={[waypointForm.lat, waypointForm.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              dragging={false}
              zoomControl={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
            >
              <TileLayer
                attribution={mapStyles[selectedMapStyle].attribution}
                url={mapStyles[selectedMapStyle].url}
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
