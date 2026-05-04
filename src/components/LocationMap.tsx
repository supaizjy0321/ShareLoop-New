import React, { useEffect } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

export interface MapPoint {
  latitude: number;
  longitude: number;
  label?: string;
}

interface LocationMapProps {
  vendor: MapPoint;
  customer?: MapPoint | null;
  className?: string;
}

// Inline SVG DivIcon avoids the Leaflet "default marker doesn't load under bundlers" issue
// while letting us colour the pins to match the project palette.
const buildPinIcon = (variant: 'primary' | 'accent') => {
  const fill = variant === 'primary' ? '#16a34a' : '#0ea5e9';
  return L.divIcon({
    className: 'shareloop-pin',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0z" fill="${fill}"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
};

const vendorIcon = buildPinIcon('primary');
const customerIcon = buildPinIcon('accent');

const FitBounds: React.FC<{ points: MapPoint[] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14, {
        animate: false,
      });
      return;
    }
    const bounds = L.latLngBounds(
      points.map(p => [p.latitude, p.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
};

export const LocationMap: React.FC<LocationMapProps> = ({
  vendor,
  customer,
  className,
}) => {
  const points: MapPoint[] = customer ? [vendor, customer] : [vendor];
  const center: [number, number] = [vendor.latitude, vendor.longitude];

  return (
    <div
      className={cn(
        'relative h-[300px] w-full overflow-hidden rounded-xl bg-secondary/20',
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[vendor.latitude, vendor.longitude]}
          icon={vendorIcon}
        >
          {vendor.label && <Popup>{vendor.label}</Popup>}
        </Marker>
        {customer && (
          <Marker
            position={[customer.latitude, customer.longitude]}
            icon={customerIcon}
          >
            {customer.label && <Popup>{customer.label}</Popup>}
          </Marker>
        )}
        {customer && (
          <Polyline
            positions={[
              [vendor.latitude, vendor.longitude],
              [customer.latitude, customer.longitude],
            ]}
            pathOptions={{ color: '#16a34a', weight: 3, dashArray: '6 6' }}
          />
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
};
