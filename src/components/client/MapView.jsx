import React, { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_POSITION = [4.6097, -74.0817];

function LocationPicker({ position, setPosition, isFixed }) {
  useMapEvents({ click(e) { if (!isFixed) setPosition([e.latlng.lat, e.latlng.lng]); } });
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, map.getZoom()); }, [position, map]);
  return position ? <Marker position={position} /> : null;
}

// Auto-fit bounds when both markers exist
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [points?.map(p => p?.join(',')).join('|'), map]);
  return null;
}

export default function MapView({ position, setPosition, isLocationFixed, activeRequest, route }) {
  const clientPos = activeRequest?.client_lat != null
    ? [Number(activeRequest.client_lat), Number(activeRequest.client_lng)]
    : null;

  const kamelladorPos = activeRequest?.kamellador?.current_lat != null
    ? [Number(activeRequest.kamellador.current_lat), Number(activeRequest.kamellador.current_lng)]
    : null;

  const isTracking = activeRequest &&
    ['accepted', 'in_progress'].includes(activeRequest.status) &&
    clientPos && kamelladorPos;

  const fitPoints = isTracking ? [clientPos, kamelladorPos] : null;

  return (
    <div className="map-fullscreen">
      {position && (
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {!activeRequest ? (
            <LocationPicker position={position} setPosition={setPosition} isFixed={isLocationFixed} />
          ) : (
            <>
              {/* Client pin */}
              {clientPos && <Marker position={clientPos} />}

              {/* Kamellador pin with moto emoji */}
              {kamelladorPos && (
                <Marker
                  position={kamelladorPos}
                  icon={L.divIcon({
                    className: 'kamellador-marker',
                    html: `<div class="marker-kamellador">🛵</div>`,
                    iconSize: [30, 30]
                  })}
                />
              )}

              {/* Route line */}
              {isTracking && route.length > 0 && (
                <Polyline positions={route} color="#ff7665" weight={5} opacity={0.8} lineCap="round" />
              )}

              {/* Fallback straight line while route loads */}
              {isTracking && route.length === 0 && (
                <Polyline
                  positions={[clientPos, kamelladorPos]}
                  color="#ff7665"
                  weight={3}
                  dashArray="8, 12"
                  opacity={0.6}
                />
              )}

              {/* Auto-fit both markers in view */}
              {fitPoints && <FitBounds points={fitPoints} />}
            </>
          )}
        </MapContainer>
      )}
    </div>
  );
}
