'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import { BedDouble, Bath, MapPin, X } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Property } from '@/data/properties';
import { showsDestaquePresentation } from '@/lib/legacyHomeFeatured';
import { formatPropertyPrice } from '@/lib/pricing';
import { getCleanPropertyTitle } from '@/lib/displayTitle';
import { getListingHref } from '@/lib/listingUrls';

type Props = {
  items: Property[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  mapActive?: boolean;
  compactPreview?: boolean;
};

type MapProperty = Property & {
  mapLat: number;
  mapLng: number;
};

type MapCluster = {
  id: string;
  mapLat: number;
  mapLng: number;
  count: number;
  items: MapProperty[];
};

type DisplayMapItem = (MapProperty | MapCluster) & {
  displayLat: number;
  displayLng: number;
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

function formatMarkerPrice(property: Property) {
  const suffix = property.transaction === 'Temporada' && property.pricePeriod ? `/${property.pricePeriod}` : '';
  if (property.price >= 1000000) return `R$ ${(property.price / 1000000).toFixed(property.price >= 10000000 ? 0 : 1).replace('.', ',')} mi${suffix}`;
  if (property.price >= 1000) return `R$ ${Math.round(property.price / 1000)} mil${suffix}`;
  return `${formatPropertyPrice(property)}`;
}

function getMarkerIcon(property: Property, selected = false) {
  const isSuperFeatured = property.isFeatured && property.featuredPlan === 'super_30_days';
  const isHighlighted = showsDestaquePresentation(property);
  const color = isSuperFeatured ? '#7c3aed' : isHighlighted ? '#f59e0b' : '#075985';
  const background = selected ? color : isHighlighted ? '#fff7ed' : 'white';
  const label = formatMarkerPrice(property);
  const selectedStyle = selected
    ? 'transform:translateY(-2px);box-shadow:0 18px 38px rgba(15,23,42,.36);'
    : 'box-shadow:0 12px 28px rgba(15,23,42,.28);';

  return L.divIcon({
    className: '',
    html: `<span style="display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;border-radius:9999px;background:${background};border:2px solid ${color};color:${selected ? 'white' : '#075985'};font:800 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;padding:8px 12px;${selectedStyle}">${label}</span>`,
    iconSize: [92, 34],
    iconAnchor: [46, 17],
    popupAnchor: [0, -12]
  });
}

function getClusterIcon(cluster: MapCluster) {
  const label = `${cluster.count} imóveis`;

  return L.divIcon({
    className: '',
    html: `<span style="display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;border-radius:14px;background:#075985;border:2px solid white;color:white;font:900 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;padding:10px 14px;box-shadow:0 18px 36px rgba(15,23,42,.36);">${label}</span>`,
    iconSize: [98, 36],
    iconAnchor: [49, 18],
    popupAnchor: [0, -14]
  });
}

function getClusterCellSize(zoomLevel: number) {
  if (zoomLevel >= 11) return 0;
  if (zoomLevel >= 10) return 0.06;
  if (zoomLevel >= 9) return 0.16;
  return 0.36;
}

function clusterMapItems(items: MapProperty[], zoomLevel: number): Array<MapProperty | MapCluster> {
  const cellSize = getClusterCellSize(zoomLevel);
  if (!cellSize) return items;

  const groups = new Map<string, MapProperty[]>();
  items.forEach((item) => {
    const latKey = Math.round(item.mapLat / cellSize);
    const lngKey = Math.round(item.mapLng / cellSize);
    const key = `${latKey}:${lngKey}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  const result: Array<MapProperty | MapCluster> = [];
  Array.from(groups.entries()).forEach(([key, group]) => {
    if (group.length <= 1) {
      result.push(...group);
      return;
    }

    const mapLat = group.reduce((sum, item) => sum + item.mapLat, 0) / group.length;
    const mapLng = group.reduce((sum, item) => sum + item.mapLng, 0) / group.length;
    result.push({ id: key, mapLat, mapLng, count: group.length, items: group });
  });

  return result;
}

function getDisplayCellSize(zoomLevel: number) {
  if (zoomLevel >= 11) return 0.012;
  if (zoomLevel >= 10) return 0.035;
  if (zoomLevel >= 9) return 0.075;
  return 0.18;
}

function spreadDisplayItems(items: Array<MapProperty | MapCluster>, zoomLevel: number): DisplayMapItem[] {
  const cellSize = getDisplayCellSize(zoomLevel);
  const groups = new Map<string, Array<MapProperty | MapCluster>>();

  items.forEach((item) => {
    const key = `${Math.round(item.mapLat / cellSize)}:${Math.round(item.mapLng / cellSize)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return items.map((item) => {
    const key = `${Math.round(item.mapLat / cellSize)}:${Math.round(item.mapLng / cellSize)}`;
    const group = groups.get(key) ?? [item];
    if (group.length <= 1) return { ...item, displayLat: item.mapLat, displayLng: item.mapLng };

    const index = group.findIndex((groupItem) => groupItem.id === item.id);
    const angle = (2 * Math.PI * Math.max(index, 0)) / group.length;
    const radius = cellSize * Math.min(0.24, 0.12 + group.length * 0.02);

    return {
      ...item,
      displayLat: item.mapLat + Math.sin(angle) * radius,
      displayLng: item.mapLng + Math.cos(angle) * radius
    };
  });
}

function isCluster(item: MapProperty | MapCluster): item is MapCluster {
  return 'count' in item;
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

function MapZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom())
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

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
  mapActive = true,
  compactPreview = false
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
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const lastMarkerTapAt = useRef(0);
  const mapCenter = center ?? RN_CENTER;
  const selectedImage = selectedProperty?.images[0] ?? '/og-home.svg';
  const selectedTitle = selectedProperty ? getCleanPropertyTitle(selectedProperty) : '';
  const visibleMapItems = useMemo(
    () => spreadDisplayItems(clusterMapItems(mapItems, currentZoom), currentZoom),
    [mapItems, currentZoom]
  );

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
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nenhum anúncio com localização nesta busca</p>
        <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
          Ajuste os filtros ou explore outras cidades para ver imóveis no mapa.
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
    <div className="relative space-y-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-sand-200 shadow-soft dark:border-slate-800"
        style={{ height }}
        aria-label="Mapa de imóveis no Rio Grande do Norte"
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
          <MapZoomTracker onZoomChange={setCurrentZoom} />
          {!center && <MapBoundsFitter items={mapItems} />}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap
          />
          {visibleMapItems.map((item) => {
            if (isCluster(item)) {
              return (
                <Marker
                  key={`cluster-${item.id}`}
                  position={[item.displayLat, item.displayLng]}
                  icon={getClusterIcon(item)}
                  bubblingMouseEvents={false}
                  eventHandlers={{
                    click: (event) => {
                      L.DomEvent.stopPropagation(event);
                      event.target._map?.setView([item.mapLat, item.mapLng], Math.min(currentZoom + 2, 12), {
                        animate: true
                      });
                      setSelectedProperty(null);
                    }
                  }}
                />
              );
            }

            return (
              <Marker
                key={item.id}
                position={[item.displayLat, item.displayLng]}
                icon={getMarkerIcon(item, selectedProperty?.id === item.id)}
                bubblingMouseEvents={false}
                eventHandlers={{
                  click: (event) => {
                    lastMarkerTapAt.current = Date.now();
                    selectMarkerProperty(event, item, setSelectedProperty);
                    event.target._map?.panBy([0, -55], { animate: true, duration: 0.25 });
                  }
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {selectedProperty && (
        <div
          className={`pointer-events-auto z-[1000] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900 ${
            compactPreview
              ? 'absolute bottom-4 left-4 right-4 max-w-[300px]'
              : 'sticky bottom-3 md:absolute md:bottom-4 md:left-4 md:w-[320px]'
          }`}
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
          <div className="flex gap-3 p-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[10px] bg-sand-100 shadow-sm dark:bg-slate-800">
              {selectedImage.startsWith('data:') || selectedImage.startsWith('blob:') ? (
                <img src={selectedImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src={selectedImage} alt="" fill className="object-cover" sizes="80px" />
              )}
            </div>
            <div className="min-w-0 flex-1 pr-7">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-white">{selectedTitle}</p>
              <p className="mt-1 text-base font-extrabold text-ocean-700 dark:text-ocean-300">
                {formatPropertyPrice(selectedProperty)}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {selectedProperty.location} - RN
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
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
              className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-sand-200 bg-white text-slate-500 shadow-sm transition hover:bg-sand-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Fechar anúncio no mapa"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {!selectedProperty.id.startsWith('user-') && (
            <div className="border-t border-sand-100 px-3 pb-3 pt-2 dark:border-slate-800">
              <button
                type="button"
                onClick={openSelectedListing}
                disabled={!canOpenListing}
                className="flex w-full items-center justify-center rounded-xl bg-ocean-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-800 disabled:cursor-wait disabled:opacity-70"
              >
                {canOpenListing ? 'Ver anúncio' : 'Abrindo...'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
