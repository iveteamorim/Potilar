'use client';

import MobileMapToggle from '@/app/imoveis/mobile-map-toggle';
import PropertyMap from '@/components/PropertyMapLoader';
import type { Property } from '@/data/properties';

type Props = {
  items: Property[];
  height?: string;
};

export default function MobilePropertyMapToggle({ items, height = '360px' }: Props) {
  return (
    <MobileMapToggle count={items.length}>
      <PropertyMap items={items} height={height} mapActive />
    </MobileMapToggle>
  );
}
