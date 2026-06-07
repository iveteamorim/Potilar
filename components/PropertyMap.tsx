'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import { BedDouble, Bath, MapPin, X } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import type { Property } from '@/data/properties';
import { formatPropertyPrice } from '@/lib/pricing';
import { getCleanPropertyTitle } from '@/lib/displayTitle';
import { getListingHref } from '@/lib/listingUrls';

type Props = {
  items: Property[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  mapActive?: boolean;
};

type MapProperty = Property & {
  mapLat: number;
  mapLng: number;
};

const RN_CENTER: [number, number] = [-5.79, -36.55];
const RN_BOUNDS: [[number, number], [number, number]] = [
  [-7.05, -38.85],
  [-4.65, -34.7]
];

function isValidCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function isCoordinateInsideRn(lat: number, lng: number) {
  const [[minLat, minLng], [maxLat, maxLng]] = RN_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

function spreadOverlappingMarkers(items: Property[]): MapProperty[] {
  const groups = new Map<string, Property[]>();

  items.forEach((item) => {
    const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return items.map((item) => {
    const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`;
    const group = groups.get(key) ?? [item];
    const index = group.findIndex((groupItem) => groupItem.id === item.id);

    if (group.length <= 1) {
      return { ...item, mapLat: item.lat, mapLng: item.lng };
    }

    const angle = (2 * Math.PI * Math.max(index, 0)) / group.length;
    const radius = 0.0015 + group.length * 0.00008;

    return {
      ...item,
      mapLat: item.lat + Math.sin(angle) * radius,
      mapLng: item.lng + Math.cos(angle) * radius
    };
  });
}

function getMarkerIcon(property: Property) {
  const color = property.featuredPlan === 'super_30_days' ? '#7c3aed' : property.isFeatured ? '#f59e0b' : '#075985';

  return L.divIcon({
    className: '',
    html: `<span style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:9999px;background:rgba(255,255,255,.9);box-shadow:0 10px 24px rgba(15,23,42,.28);"><span style="display:block;width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid white;"></span></span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -12]
  });
}

function MapSizeFixer({ active = true }: { active?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    const timers = [100, 350, 800].map((delay) => window.setTimeout(() => map.invalidateSize(), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [map, active]);

  return null;
}

function MapBoundsFitter({ items }: { items: MapProperty[] }) {
  const map = useMap();

  useEffect(() => {
    if (items.length === 0) return;

    if (items.length === 1) {
      map.setView([items[0].mapLat, items[0].mapLng], 12, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(items.map((item) => [item.mapLat, item.mapLng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: true });
  }, [map, items]);

  return null;
}

function selectMarkerProperty(
  event: L.LeafletMouseEvent,
  property: Property,
  setSelectedProperty: (property: Property) => void
) {
  L.DomEvent.stopPropagation(event);
  if (event.originalEvent) {
    L.DomEvent.preventDefault(event.originalEvent);
  }
  setSelectedProperty(property);
}

export default function PropertyMap({
  items,
  height = '360px',
  center,
  zoom = 8,
  mapActive = true
}: Props) {
  const router = useRouter();
  const mapItems = useMemo(
    () => {
      const validItems = items.filter(
        (item) => Boolean(item.slug) && isValidCoordinate(item.lat, item.lng) && isCoordinateInsideRn(item.lat, item.lng)
      );

      return spreadOverlappingMarkers(validItems);
    },
    [items]
  );
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [canOpenListing, setCanOpenListing] = useState(false);
  const lastMarkerTapAt = useRef(0);
  const mapCenter = center ?? RN_CENTER;
  const selectedImage = selectedProperty?.images[0] ?? '/og-home.svg';
  const selectedTitle = selectedProperty ? getCleanPropertyTitle(selectedProperty) : '';

  useEffect(() => {
    setSelectedProperty((current) => {
      if (!current) return null;
      return mapItems.some((item) => item.id === current.id) ? current : null;
    });
  }, [mapItems]);

  useEffect(() => {
    if (!selectedProperty) {
      setCanOpenListing(false);
      return;
    }

    setCanOpenListing(false);
    const timer = window.setTimeout(() => setCanOpenListing(true), 400);
    return () => window.clearTimeout(timer);
  }, [selectedProperty]);

  function openSelectedListing() {
    if (!selectedProperty || !canOpenListing) return;
    if (selectedProperty.id.startsWith('user-')) return;

    const href = getListingHref(selectedProperty);
    router.push(href);
  }

  if (mapItems.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-sand-300 bg-sand-50 px-6 text-center dark:border-slate-700 dark:bg-slate-900"
        style={{ height }}
        role="status"
      >
        <MapPin className="h-8 w-8 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nenhum anuncio com localizacao nesta busca</p>
        <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
          Ajuste os filtros ou explore outras cidades para ver imoveis no mapa.
        </p>
        <Link
          href="/imoveis"
          className="mt-1 rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Limpar busca
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-sand-200 shadow-soft dark:border-slate-800"
        style={{ height }}
        aria-label="Mapa de imoveis no Rio Grande do Norte"
      >
        <MapContainer
          center={center ? mapCenter : undefined}
          bounds={center ? undefined : RN_BOUNDS}
          zoom={zoom}
          zoomSnap={0.25}
          minZoom={7.25}
          maxZoom={16}
          maxBounds={RN_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          dragging
          touchZoom
          doubleClickZoom
          boxZoom
          className="h-full w-full"
        >
          <MapSizeFixer active={mapActive} />
          {!center && <MapBoundsFitter items={mapItems} />}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap
          />
          {mapItems.map((property) => (
            <Marker
              key={property.id}
              position={[property.mapLat, property.mapLng]}
              icon={getMarkerIcon(property)}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (event) => {
                  lastMarkerTapAt.current = Date.now();
                  selectMarkerProperty(event, property, setSelectedProperty);
                }
              }}
            />
          ))}
        </MapContainer>
      </div>

      {selectedProperty && (
        <div
          className="sticky bottom-3 z-[1000] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900 md:relative md:bottom-auto"
          role="region"
          aria-live="polite"
          aria-label="Anuncio selecionado no mapa"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            if (Date.now() - lastMarkerTapAt.current < 500) {
              event.preventDefault();
            }
          }}
        >
          <div className="flex gap-3 p-3 sm:p-4">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100 dark:bg-slate-800">
              {selectedImage.startsWith('data:') || selectedImage.startsWith('blob:') ? (
                <img src={selectedImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src={selectedImage} alt="" fill className="object-cover" sizes="96px" />
              )}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{selectedTitle}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedProperty.location}, RN
              </p>
              <p className="mt-2 text-sm font-bold text-ocean-700 dark:text-ocean-300">
                {formatPropertyPrice(selectedProperty)}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
                  {selectedProperty.bedrooms}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" aria-hidden="true" />
                  {selectedProperty.bathrooms}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProperty(null)}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-sand-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Fechar anuncio no mapa"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {!selectedProperty.id.startsWith('user-') && (
            <div className="border-t border-sand-100 px-3 py-3 dark:border-slate-800 sm:px-4">
              <button
                type="button"
                onClick={openSelectedListing}
                disabled={!canOpenListing}
                className="flex w-full items-center justify-center rounded-2xl bg-ocean-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-800 disabled:cursor-wait disabled:opacity-70"
              >
                {canOpenListing ? 'Ver anuncio' : 'Abrindo...'}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                Toque no pin para ver o resumo. Depois confirme para abrir o anuncio.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
