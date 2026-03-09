import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Pane, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const ROUTES_MAP_DEFAULT_CENTER = [10.0806, 124.3436];

export const MAP_STYLES = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  {
    name: 'Topo Map',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  {
    name: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    name: 'Light Mode',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    name: 'Street (Carto Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
];

const ROUTES_MAP_LOG_PREFIX = '[RoutesMap]';

const logRoutesMap = (message, payload) => {
  if (payload === undefined) {
    console.log(`${ROUTES_MAP_LOG_PREFIX} ${message}`);
    return;
  }

  console.log(`${ROUTES_MAP_LOG_PREFIX} ${message}`, payload);
};

const getWaypointLatLng = (waypoint) => [Number(waypoint.lat), Number(waypoint.lng)];

const getWaypointLabel = (waypoint) => {
  if (waypoint.type === 'start') return 'Start';
  if (waypoint.type === 'end') return 'End';
  return 'Waypoint';
};

const createCustomIcon = (color, type, number, isSelected = false) => {
  const baseSize = isSelected ? 38 : 32;
  const iconHtml = type === 'start' || type === 'end'
    ? `<div style="background-color:${color};width:${baseSize}px;height:${baseSize}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);opacity:${isSelected ? '1' : '0.95'};"><div style="transform:rotate(45deg);margin-top:${isSelected ? '8px' : '6px'};margin-left:${isSelected ? '11px' : '9px'};color:white;font-weight:bold;font-size:${isSelected ? '14px' : '12px'};">${number}</div></div>`
    : `<div style="background-color:${color};width:${baseSize}px;height:${baseSize}px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${isSelected ? '14px' : '12px'};opacity:${isSelected ? '1' : '0.95'};">${number}</div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-route-marker',
    iconSize: [baseSize, baseSize],
    iconAnchor: [baseSize / 2, baseSize],
  });
};

const MapClickHandler = ({ enabled, onMapClick }) => {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      logRoutesMap('Map click for waypoint selection', event.latlng);
      onMapClick?.(event.latlng);
    },
  });

  return null;
};

const MapBoundsController = ({ selectedRoute, routes, routeGeometries, isCreatingRoute, newRouteWaypoints }) => {
  const map = useMap();

  useEffect(() => {
    const creationCoordinates = newRouteWaypoints.map(getWaypointLatLng);
    const selectedCoordinates = selectedRoute
      ? (routeGeometries[selectedRoute.id]?.coordinates?.length
        ? routeGeometries[selectedRoute.id].coordinates
        : selectedRoute.waypoints.map(getWaypointLatLng))
      : [];

    const allRouteCoordinates = routes.flatMap((route) => {
      const geometryCoordinates = routeGeometries[route.id]?.coordinates;
      if (Array.isArray(geometryCoordinates) && geometryCoordinates.length > 0) {
        return geometryCoordinates;
      }

      return Array.isArray(route.waypoints) ? route.waypoints.map(getWaypointLatLng) : [];
    });

    const targetCoordinates = isCreatingRoute && creationCoordinates.length > 0
      ? creationCoordinates
      : selectedCoordinates.length > 0
        ? selectedCoordinates
        : allRouteCoordinates;

    if (!targetCoordinates.length) return;

    const bounds = L.latLngBounds(targetCoordinates);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: targetCoordinates.length === 1 ? 16 : 14,
      });
    }
  }, [map, selectedRoute, routes, routeGeometries, isCreatingRoute, newRouteWaypoints]);

  return null;
};

const MapReadyLogger = ({ selectedStyle }) => {
  const map = useMap();

  useEffect(() => {
    logRoutesMap('Map initialized', {
      center: map.getCenter(),
      zoom: map.getZoom(),
      selectedStyle: selectedStyle?.name,
    });
  }, [map, selectedStyle]);

  return null;
};

const LeafletRoutesMap = ({
  routes = [],
  selectedRoute = null,
  selectedWaypoint = null,
  routeGeometries = {},
  selectedMapStyle = 0,
  loadingGeometries = false,
  isCreatingRoute = false,
  newRouteWaypoints = [],
  newRouteColor = '#3B82F6',
  showWaypointModal = false,
  showCreateModal = false,
  onMapClick,
  onSelectRoute,
  onSelectWaypoint,
}) => {
  const activeStyle = MAP_STYLES[selectedMapStyle] || MAP_STYLES[0];

  const flattenedMarkers = useMemo(() => routes.flatMap((route) => (
    (route.waypoints || []).map((waypoint) => ({ route, waypoint }))
  )), [routes]);

  return (
    <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={ROUTES_MAP_DEFAULT_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer attribution={activeStyle.attribution} url={activeStyle.url} />

        <MapReadyLogger selectedStyle={activeStyle} />
        <MapClickHandler
          enabled={isCreatingRoute && !showWaypointModal && !showCreateModal}
          onMapClick={onMapClick}
        />
        <MapBoundsController
          selectedRoute={selectedRoute}
          routes={routes}
          routeGeometries={routeGeometries}
          isCreatingRoute={isCreatingRoute}
          newRouteWaypoints={newRouteWaypoints}
        />

        <Pane name="route-base" style={{ zIndex: 350 }} />
        <Pane name="route-highlight" style={{ zIndex: 400 }} />
        <Pane name="route-markers" style={{ zIndex: 450 }} />

        {routes.map((route) => {
          const geometry = routeGeometries[route.id];
          const positions = geometry?.coordinates?.length
            ? geometry.coordinates
            : (route.waypoints || []).map(getWaypointLatLng);

          if (!positions.length) return null;

          const isSelected = selectedRoute?.id === route.id;
          const routeInfo = {
            routeId: route.route_id || route.id,
            routeName: route.name,
            geometrySource: geometry?.source || 'straight-line',
            waypointCount: route.waypoints?.length || 0,
            coordinateCount: positions.length,
          };

          return (
            <React.Fragment key={route.id}>
              <Polyline
                pane="route-base"
                positions={positions}
                color={route.color || '#3B82F6'}
                weight={isSelected ? 6 : 4}
                opacity={isSelected ? 0.95 : 0.45}
                eventHandlers={{
                  click: () => {
                    logRoutesMap('Route clicked', routeInfo);
                    onSelectRoute?.(route, { source: 'map' });
                  },
                }}
              />

              {isSelected && (
                <Polyline
                  pane="route-highlight"
                  positions={positions}
                  color="#ffffff"
                  weight={10}
                  opacity={0.45}
                  interactive={false}
                />
              )}
            </React.Fragment>
          );
        })}

        {flattenedMarkers.map(({ route, waypoint }) => {
          const isSelectedRoute = selectedRoute?.id === route.id;
          const isSelectedWaypoint = selectedWaypoint?.routeId === route.id && selectedWaypoint?.waypointId === waypoint.id;
          const markerPayload = {
            routeId: route.route_id || route.id,
            routeName: route.name,
            waypointId: waypoint.id,
            waypointName: waypoint.name,
            waypointOrder: waypoint.order,
            waypointType: waypoint.type,
            latitude: waypoint.lat,
            longitude: waypoint.lng,
          };

          return (
            <Marker
              key={`${route.id}-${waypoint.id}`}
              pane="route-markers"
              position={getWaypointLatLng(waypoint)}
              icon={createCustomIcon(route.color || '#3B82F6', waypoint.type, waypoint.order, isSelectedWaypoint || isSelectedRoute)}
              opacity={isSelectedRoute ? 1 : 0.8}
              zIndexOffset={isSelectedWaypoint ? 1200 : isSelectedRoute ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  logRoutesMap('Marker click event', markerPayload);
                  onSelectRoute?.(route, { source: 'marker' });
                  onSelectWaypoint?.({ routeId: route.id, waypointId: waypoint.id, route, waypoint });
                },
              }}
            >
              <Popup>
                <div className="text-sm min-w-[220px]">
                  <p className="font-semibold text-primary-600">{route.name}</p>
                  <p className="text-xs text-gray-500">Route ID: {route.route_id || route.id}</p>
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold">Stop #{waypoint.order}: {waypoint.name}</p>
                    <p className="text-gray-600">{waypoint.barangay || 'No barangay set'}</p>
                    <p className="text-xs text-gray-500">{getWaypointLabel(waypoint)} point</p>
                    <p className="text-xs text-gray-500">Lat: {Number(waypoint.lat).toFixed(5)}, Lng: {Number(waypoint.lng).toFixed(5)}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {isCreatingRoute && newRouteWaypoints.length > 0 && (
          <>
            {newRouteWaypoints.length > 1 && (
              <Polyline
                pane="route-highlight"
                positions={newRouteWaypoints.map(getWaypointLatLng)}
                color={newRouteColor}
                weight={4}
                dashArray="6 10"
                opacity={0.95}
              />
            )}

            {newRouteWaypoints.map((waypoint) => (
              <Marker
                key={waypoint.id}
                pane="route-markers"
                position={getWaypointLatLng(waypoint)}
                icon={createCustomIcon(newRouteColor, waypoint.type, waypoint.order, true)}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold text-primary-600">New route stop #{waypoint.order}</p>
                    <p className="font-semibold mt-1">{waypoint.name || 'Unnamed waypoint'}</p>
                    <p className="text-gray-600">{waypoint.barangay || 'Barangay not set yet'}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>

      {isCreatingRoute && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Click on the map to add waypoints ({newRouteWaypoints.length} added)</span>
          </div>
        </div>
      )}

      {loadingGeometries && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="text-sm font-medium">Loading route geometries...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletRoutesMap;
