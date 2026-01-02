import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { TeamMember } from '../types';

const TUCUMAN_CENTER = { lat: -26.8241, lng: -65.2226 };
const TUCUMAN_BOUNDS: L.LatLngBoundsExpression = [
  [-28.5, -67.0], 
  [-25.5, -64.0]
];

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl });

interface MapDisplayProps {
  userLocation: { lat: number; lng: number } | null;
  teamMembers: TeamMember[];
  accuracy: number;
  isManualMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapController = ({ center }: { center: { lat: number; lng: number } | null }) => {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500); 
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

/**
 * Este componente SOLO se monta cuando queremos capturar un click.
 * Al desmontarse, Leaflet limpia el evento 'click'.
 */
const MapClickCapture = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const createTacticalIcon = (color: string, isUser: boolean = false, isManual: boolean = false) => {
  const pulseClass = (isUser && !isManual) ? 'animate-pulse' : '';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="${pulseClass}" style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid ${isManual ? '#f97316' : 'white'}; box-shadow: 0 0 15px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export const MapDisplay: React.FC<MapDisplayProps> = ({ userLocation, teamMembers, accuracy, isManualMode = false, onMapClick }) => {
  const userIcon = createTacticalIcon(isManualMode ? '#f97316' : '#10b981', true, isManualMode); 
  const teamIcon = createTacticalIcon('#f97316'); 
  
  const getAccuracyColor = (acc: number) => acc > 200 ? '#ef4444' : '#10b981';

  return (
    <div className={`w-full h-full bg-[#0a0a0a] ${isManualMode ? 'cursor-crosshair' : ''}`}>
      <MapContainer 
        center={userLocation || TUCUMAN_CENTER} 
        zoom={13} 
        minZoom={7}
        maxBounds={TUCUMAN_BOUNDS}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-grayscale"
        />
        
        <MapController center={isManualMode ? null : userLocation} />
        
        {/* Solo activamos el capturador de clicks si estamos en modo manual */}
        {isManualMode && onMapClick && (
          <MapClickCapture onMapClick={onMapClick} />
        )}

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div className="font-bold text-gray-900">{isManualMode ? 'MODO_CALIBRACIÓN' : 'MI_UNIDAD'}</div>
                <div className="text-[10px] text-gray-500 uppercase">
                  {accuracy === 0 ? 'Posición fijada manualmente' : `PRECISIÓN: ±${accuracy.toFixed(0)}m`}
                </div>
              </Popup>
            </Marker>
            {!isManualMode && accuracy > 0 && (
              <Circle 
                center={userLocation}
                radius={accuracy || 50} 
                pathOptions={{ 
                  color: getAccuracyColor(accuracy), 
                  fillColor: getAccuracyColor(accuracy), 
                  fillOpacity: 0.1, 
                  weight: 1,
                  dashArray: accuracy > 200 ? '5, 5' : '' 
                }} 
              />
            )}
          </>
        )}

        {teamMembers.map((member) => (
          <React.Fragment key={member.id}>
            <Marker 
              position={{ lat: member.lat, lng: member.lng }} 
              icon={teamIcon}
            >
              <Popup>
                 <div className="font-bold text-gray-900 uppercase text-xs">{member.name}</div>
                 <div className="text-[10px] text-gray-500 font-mono mt-1">DIST: {member.distance}</div>
                 <div className="text-[10px] text-gray-400 font-mono">
                    PREC: {member.accuracy === 0 ? 'FIJA (Manual)' : `±${member.accuracy}m`}
                 </div>
                 <div className="text-[9px] text-orange-500 mt-0.5 font-bold">{member.role}</div>
              </Popup>
            </Marker>
            {member.accuracy && member.accuracy > 0 && (
              <Circle 
                center={{ lat: member.lat, lng: member.lng }}
                radius={member.accuracy}
                pathOptions={{ 
                  color: member.accuracy > 200 ? '#ef4444' : '#f97316', 
                  fillColor: member.accuracy > 200 ? '#ef4444' : '#f97316', 
                  fillOpacity: 0.05, 
                  weight: 0.5,
                  dashArray: member.accuracy > 200 ? '3, 3' : '' 
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
      <style>{`
        .map-tiles-grayscale {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container { background: #0a0a0a !important; }
        .custom-div-icon { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
};
