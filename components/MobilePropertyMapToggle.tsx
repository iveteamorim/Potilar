'use client';

import MobileMapToggle from '@/app/imoveis/mobile-map-toggle';
import PropertyMap from '@/components/PropertyMapLoader';
import type { Property } from '@/data/properties';

type Props = {
  items: Property[];
  height?: string;
  closedLabel?: string;
  openLabel?: string;
};

export default function MobilePropertyMapToggle({ items, height = '360px', closedLabel, openLabel }: Props) {
  return (
    <MobileMapToggle count={items.length} closedLabel={closedLabel} openLabel={openLabel}>
      <PropertyMap items={items} height={height} mapActive />
    </MobileMapToggle>
  );
}
