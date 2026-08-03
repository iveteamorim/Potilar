import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ListingMaterialStudio from '@/components/ListingMaterialStudio';
import { BASE_URL } from '@/lib/config';
import { normalizeListingImageUrl } from '@/lib/imageUrls';
import { slugify } from '@/lib/slugify';
import { createClient } from '@/lib/supabase/server';

type ListingShareRow = {
  id: string;
  owner_id: string;
  title: string;
  property_type?: string | null;
  transaction?: string | null;
  price?: number | null;
  price_period?: string | null;
  bedrooms?: number | null;
  parking?: number | null;
  area_sqm?: number | null;
  location?: string | null;
  images?: string[] | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
};

const LISTING_SELECT =
  'id,owner_id,title,property_type,transaction,price,price_period,bedrooms,parking,area_sqm,location,images,contact_phone,contact_whatsapp';

function formatPrice(price?: number | null, period?: string | null) {
  if (!price) return 'CONSULTE';
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(price);

  return period ? `${formatted}/${period}` : formatted;
}

function getIntent(transaction?: string | null) {
  if (transaction === 'Aluguel') return 'ALUGA-SE';
  if (transaction === 'Temporada') return 'TEMPORADA';
  return 'VENDE-SE';
}

function getListingHref(listing: ListingShareRow) {
  return `/imoveis/${slugify(`${listing.title}-${listing.location ?? ''}-${listing.id}`)}`;
}

function getCompactFeatures(listing: ListingShareRow) {
  return [
    listing.property_type ?? 'Imovel',
    listing.bedrooms ? `${listing.bedrooms} quartos` : null,
    listing.parking ? `${listing.parking} vagas` : null,
    listing.area_sqm ? `${listing.area_sqm} m2` : null
  ]
    .filter(Boolean)
    .join(' - ');
}

export default async function ListingShareKitPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error || !data) notFound();

  const listing = data as ListingShareRow;
  const listingHref = getListingHref(listing);
  const publicUrl = `${BASE_URL}${listingHref}`;
  const image = normalizeListingImageUrl(listing.images?.[0] ?? '');
  const images = (listing.images ?? []).map((item) => normalizeListingImageUrl(item));
  const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle();
  const profilePhone = typeof profile?.phone === 'string' ? profile.phone : null;

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-950 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-7xl print:max-w-none">
        <div className="mb-8 flex flex-col gap-5 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/mi-cuenta" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Minha conta
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-ocean-700">Material de divulgacao</p>
            <h1 className="mt-2 text-4xl font-semibold">Descargar material</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Escolha onde vai colocar o cartaz e PotiLar recomenda o tamanho certo automaticamente.
            </p>
          </div>
          <Link href={listingHref} className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
            Ver anuncio publico
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <ListingMaterialStudio
          material={{
            intent: getIntent(listing.transaction),
            price: formatPrice(listing.price, listing.price_period),
            image,
            images,
            publicUrl,
            contactWhatsapp: listing.contact_whatsapp ?? profilePhone,
            contactPhone: listing.contact_phone ?? profilePhone,
            compactFeatures: getCompactFeatures(listing)
          }}
        />
      </div>
    </main>
  );
}
