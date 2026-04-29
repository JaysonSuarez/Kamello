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

export default function MapView({ position, setPosition, isLocationFixed, activeRequest, route }) {
  return (
    <div className="map-fullscreen">
      {position && (
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          {!activeRequest ? (
            <LocationPicker position={position} setPosition={setPosition} isFixed={isLocationFixed} />
          ) : (
            <>
              {activeRequest.client_lat != null && (
                <Marker position={[Number(activeRequest.client_lat), Number(activeRequest.client_lng)]} />
              )}
              {activeRequest.kamellador?.current_lat != null && (
                <Marker 
                  position={[Number(activeRequest.kamellador.current_lat), Number(activeRequest.kamellador.current_lng)]}
                  icon={L.divIcon({
                    className: 'kamellador-marker',
                    html: `<div class="marker-kamellador">🛵</div>`,
                    iconSize: [30, 30]
                  })}
                />
              )}
              {(route.length > 0 && (activeRequest.status === 'accepted' || activeRequest.status === 'in_progress')) ? (
                <Polyline positions={route} color="#ff7665" weight={5} opacity={0.7} lineCap="round" />
              ) : (activeRequest.client_lat != null && activeRequest.kamellador?.current_lat != null && (activeRequest.status === 'accepted' || activeRequest.status === 'in_progress')) ? (
                 <Polyline 
                  positions={[
                    [Number(activeRequest.client_lat), Number(activeRequest.client_lng)],
                    [Number(activeRequest.kamellador.current_lat), Number(activeRequest.kamellador.current_lng)]
                  ]} 
                  color="#ff7665" 
                  weight={3} 
                  dashArray="5, 10" 
                />
              ) : null}
            </>
          )}
        </MapContainer>
      )}
    </div>
  );
}
