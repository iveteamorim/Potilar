import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ListingMaterialStudio from '@/components/ListingMaterialStudio';
import { BASE_URL } from '@/lib/config';
import { normalizeListingImageUrl } from '@/lib/imageUrls';
import { buildListingMaterial } from '@/lib/listingMaterial';
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
  bathrooms?: number | null;
  parking?: number | null;
  area_sqm?: number | null;
  location?: string | null;
  features?: string[] | null;
  video_url?: string | null;
  images?: string[] | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
};

const LISTING_SELECT =
  'id,owner_id,title,property_type,transaction,price,price_period,bedrooms,bathrooms,parking,area_sqm,location,features,video_url,images,contact_phone,contact_whatsapp';

function getListingHref(listing: ListingShareRow) {
  return `/imoveis/${slugify(`${listing.title}-${listing.location ?? ''}-${listing.id}`)}`;
}

export default async function AdminListingShareKitPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/mi-cuenta');

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();

  const listing = data as ListingShareRow;
  const listingHref = getListingHref(listing);
  const publicUrl = `${BASE_URL}${listingHref}`;
  const image = normalizeListingImageUrl(listing.images?.[0] ?? '');
  const images = (listing.images ?? []).map((item) => normalizeListingImageUrl(item));
  const { data: ownerProfile } = await supabase.from('profiles').select('phone').eq('id', listing.owner_id).maybeSingle();
  const profilePhone = typeof ownerProfile?.phone === 'string' ? ownerProfile.phone : null;

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-950 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-7xl print:max-w-none">
        <div className="mb-8 flex flex-col gap-5 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Admin
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-ocean-700">Marketing do anuncio</p>
            <h1 className="mt-2 text-4xl font-semibold">Criar banner</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Gere cartazes e imagens para divulgar este anuncio em redes sociais, WhatsApp ou material impresso.
            </p>
          </div>
          <Link href={listingHref} className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
            Ver anuncio publico
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <ListingMaterialStudio
          material={buildListingMaterial({
            listing,
            publicUrl,
            image,
            images,
            contactWhatsapp: listing.contact_whatsapp ?? profilePhone,
            contactPhone: listing.contact_phone ?? profilePhone
          })}
        />
      </div>
    </main>
  );
}
