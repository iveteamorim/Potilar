'use client';

import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { Property } from '@/data/properties';
import Link from 'next/link';

type Props = {
  items: Property[];
  height?: string;
  center?: [number, number];
  zoom?: number;
};

const defaultCenter: [number, number] = [-5.95, -35.22];

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

export default function PropertyMap({ items, height = '360px', center, zoom = 9 }: Props) {
  const mapCenter = center ?? (items[0] ? [items[0].lat, items[0].lng] : defaultCenter);
  const [markerIcon, setMarkerIcon] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const L = await import('leaflet');
      const icon = new L.Icon({
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      setMarkerIcon(icon);
    })();
  }, []);

  return (
    <div className="relative z-0 overflow-hidden rounded-3xl border border-sand-200 shadow-soft dark:border-slate-800">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={false} style={{ height }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markerIcon &&
          items.map((property) => (
            <Marker key={property.id} position={[property.lat, property.lng]} icon={markerIcon}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{property.title}</p>
                  <p className="text-slate-600">{property.location}</p>
                  <Link href={`/imoveis/${property.slug}`} className="text-ocean-700">
                    Ver anúncio
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
