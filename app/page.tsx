import HeroSearch from '@/components/HeroSearch';
import PropertyCard from '@/components/PropertyCard';
import PropertyMap from '@/components/PropertyMap';
import Testimonials from '@/components/Testimonials';
import { properties } from '@/data/properties';
import Link from 'next/link';

export default function HomePage() {
  const featured = properties.slice(0, 4);

  return (
    <main>
      <HeroSearch />
      <section className="section-padding">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Imóveis em destaque</h2>
            <Link href="/imoveis" className="text-sm font-semibold text-ocean-700">
              Ver todos
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>
      <section className="section-padding bg-sand-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Como funciona</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Anuncie com facilidade',
                text: 'Envie as informações básicas do imóvel e nossa equipe local organiza o anúncio.'
              },
              {
                title: 'Ganhe visibilidade local',
                text: 'Seu anúncio aparece em destaque para pessoas que buscam no interior do RN.'
              },
              {
                title: 'Conexão direta',
                text: 'Interessados falam diretamente com você pelo WhatsApp.'
              }
            ].map((item) => (
              <div key={item.title} className="glass-card p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-padding bg-sand-100/70 dark:bg-slate-900">
                              <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Atendimento digital</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Conexão digital e informações organizadas para sua decisão.
            </h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Nossa equipe local oferece suporte na divulgação e conecta proprietários e interessados com clareza e
              agilidade, sempre pelo atendimento digital.
            </p>
            <Link
              href="/contato"
              className="mt-6 inline-flex rounded-full bg-sun-500 px-6 py-3 text-sm font-semibold text-white shadow-soft"
            >
              Falar com atendimento
            </Link>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Imóveis no mapa</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Veja a distribuição dos anúncios e explore as regiões com mais oportunidades.
            </p>
            <div className="mt-4">
              <PropertyMap items={featured} height="320px" />
            </div>
          </div>
        </div>
      </section>
      <Testimonials />
      <section className="section-padding bg-sand-100/70 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Perguntas frequentes</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">A RN Lar faz intermediação?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Não. Atuamos como plataforma de divulgação e atendimento digital. A negociação acontece diretamente entre
                proprietários e interessados.
              </p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Como divulgo meu imóvel?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Preencha o formulário de anúncio e nossa equipe local organiza as informações e fotos para dar mais
                visibilidade ao seu imóvel.
              </p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Tem custos para anunciar?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Os valores são informados pelo WhatsApp e variam conforme tipo de imóvel e região.
              </p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Vocês acompanham visitas?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Oferecemos suporte digital e conexão entre as partes. Visitas presenciais são combinadas diretamente.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="mx-auto max-w-6xl rounded-3xl bg-ocean-700 px-6 py-10 text-white shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Quer divulgar seu imóvel?</h3>
              <p className="mt-2 text-sm text-sand-100">
                Divulgue com visibilidade local, fotos bem cuidadas e suporte digital da nossa equipe.
              </p>
            </div>
            <Link
              href="/anunciar"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ocean-700"
            >
              Anunciar meu imóvel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
