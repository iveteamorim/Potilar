import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ListingMaterialStudio from '@/components/ListingMaterialStudio';
import { buildListingMaterial } from '@/lib/listingMaterial';

export default function ListingShareKitDemoPage() {
  const demoImages = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80'
  ];

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-950 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-7xl print:max-w-none">
        <div className="mb-8 print:hidden">
          <Link href="/mi-cuenta" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Minha conta
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-ocean-700">Demo local</p>
          <h1 className="mt-2 text-4xl font-semibold">Descargar material</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Escolha onde o material sera colocado. PotiLar muda tamanho e escala para janela, reja, fachada, lona ou redes.
          </p>
        </div>

        <ListingMaterialStudio
          material={buildListingMaterial({
            listing: {
              title: 'Conforto e espaço para a sua família.',
              property_type: 'Casa',
              transaction: 'Compra',
              price: 270000,
              bedrooms: 3,
              bathrooms: 2,
              parking: 1,
              area_sqm: 88,
              location: "Lagoa d'Anta, RN"
            },
            publicUrl: 'https://potilar.com.br/imoveis/casa-em-lagoa-danta-demo',
            image: demoImages[0],
            images: demoImages,
            contactWhatsapp: '84909090909',
            contactPhone: '84909090909'
          })}
        />
      </div>
    </main>
  );
}
