import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ListingEditorForm from '@/components/listing-editor/ListingEditorForm';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Editar anuncio admin | Potilar'
};

const LISTING_SELECT =
  'id,title,property_type,transaction,price,price_period,bedrooms,bathrooms,parking,location,neighborhood,community,address_extra,description,features,images,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods';
const LISTING_SELECT_FALLBACK =
  'id,title,property_type,transaction,price,bedrooms,bathrooms,parking,location,neighborhood,community,address_extra,description,features,images,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods';

export default async function EditAdminListingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/mi-cuenta');

  let { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', params.id).single();

  if (error) {
    const fallback = await supabase.from('listings').select(LISTING_SELECT_FALLBACK).eq('id', params.id).single();
    data = fallback.data
      ? {
          ...fallback.data,
          price_period: null
        }
      : null;
  }

  if (!data) notFound();

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Admin</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Editar anuncio</h1>
        </div>
        <ListingEditorForm listing={data} backHref="/admin" />
      </div>
    </main>
  );
}
