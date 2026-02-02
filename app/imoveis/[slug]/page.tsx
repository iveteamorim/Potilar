import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';
import PropertyMap from '@/components/PropertyMap';
import PropertyGallery from '@/components/PropertyGallery';
import PropertyCard from '@/components/PropertyCard';
import { properties } from '@/data/properties';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = properties.find((item) => item.slug === params.slug);

  if (!property) return { title: 'Imóvel não encontrado | RN Lar' };

  return {
    title: `${property.title} | RN Lar`,
    description: property.description,
    alternates: {
      canonical: `${BASE_URL}/imoveis/${property.slug}`
    },
    openGraph: {
      title: `${property.title} | RN Lar`,
      description: property.description,
      type: 'article',
      images: [
        {
          url: property.images[0],
          alt: property.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${property.title} | RN Lar`,
      description: property.description
    }
  };
}

export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = properties.find((item) => item.slug === params.slug);

  if (!property) return notFound();

  const similar = properties.filter((item) => item.id !== property.id).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: property.title,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressRegion: 'RN'
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock'
    }
  };

  return (
    <main className="section-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <PropertyGallery images={property.images} />
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sun-500 px-3 py-1 text-xs font-semibold text-white">
                {property.transaction}
              </span>
              <span className="rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                {property.propertyType}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{property.title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {property.location} · {property.transaction} · {property.propertyType}
            </p>
            <p className="text-2xl font-semibold text-ocean-700">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(property.price)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{property.description}</p>
            <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
              {property.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ocean-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <form className="glass-card space-y-4 p-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Falar com atendimento</h3>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="email"
                placeholder="Seu email"
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <textarea
                rows={3}
                placeholder="Mensagem"
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Receber informações
              </button>
              <a
                href="https://wa.me/5584999999999"
                className="block text-center text-sm font-semibold text-ocean-700"
              >
                Ou falar com atendimento no WhatsApp
              </a>
            </form>
          </div>
        </div>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Mapa do entorno</h2>
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`}
              className="rounded-full border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700"
            >
              Ver no Street View
            </a>
          </div>
          <PropertyMap items={[property]} height="320px" center={[property.lat, property.lng]} zoom={13} />
        </section>
        {property.tourUrl && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Tour 360</h2>
            <div className="aspect-video w-full overflow-hidden rounded-3xl border border-sand-200 bg-sand-50 dark:border-slate-800 dark:bg-slate-900">
              <iframe
                title="Tour 360 do imóvel"
                src={property.tourUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tour 360 gratuito via YouTube 360. Caso prefira, podemos substituir por outro provedor.
            </p>
          </section>
        )}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Imóveis similares</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
