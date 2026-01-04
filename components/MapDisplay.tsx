
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

L.Icon.Default.mergeOptions({ 
  iconUrl, 
  shadowUrl,
  iconRetinaUrl: iconUrl
});

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
    map.whenReady(() => map.invalidateSize());
  }, [map]);

  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapClickCapture = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
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

const USER_ICON_NORMAL = createTacticalIcon('#10b981', true, false);
const USER_ICON_MANUAL = createTacticalIcon('#f97316', true, true);
const TEAM_ICON = createTacticalIcon('#f97316');

export const MapDisplay: React.FC<MapDisplayProps> = ({ userLocation, teamMembers, accuracy, isManualMode = false, onMapClick }) => {
  const userIcon = isManualMode ? USER_ICON_MANUAL : USER_ICON_NORMAL;

  return (
    <div className={`w-full h-full bg-[#0a0a04] ${isManualMode ? 'cursor-crosshair' : ''}`}>
      <MapContainer 
        center={userLocation || TUCUMAN_CENTER} 
        zoom={14} 
        minZoom={7}
        maxBounds={TUCUMAN_BOUNDS}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-grayscale"
        />
        <MapController center={isManualMode ? null : userLocation} />
        {isManualMode && onMapClick && <MapClickCapture onMapClick={onMapClick} />}

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-bold text-gray-900">{isManualMode ? 'MODO_CALIBRACIÓN' : 'MI_UNIDAD'}</div>
            </Popup>
          </Marker>
        )}

        {teamMembers.map((member) => {
          if (member.lat == null || member.lng == null) return null;
          return (
            <Marker 
              key={`${member.id}-${member.channel_id}`}
              position={{ lat: member.lat, lng: member.lng }} 
              icon={TEAM_ICON}
            >
              <Popup>
                 <div className="font-bold text-gray-900 uppercase text-xs">{member.name}</div>
                 <div className="text-[10px] text-gray-500 font-mono mt-1">DIST: {member.distance}</div>
                 <div className={`text-[9px] mt-0.5 font-bold uppercase ${member.status === 'talking' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                    {member.status === 'talking' ? 'HABLANDO' : member.role}
                 </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
