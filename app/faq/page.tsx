import type { Metadata } from 'next';
import { buildFaqPageJsonLd, getFaqItems } from '@/lib/siteIdentity';

export const metadata: Metadata = {
  title: 'FAQ | Potilar',
  description:
    'O que é a Potilar, como anunciar imóvel no RN, preços, contato direto, revisão de anúncios e segurança na plataforma.',
  alternates: {
    canonical: '/faq'
  }
};

export default function FaqPage() {
  const questions = getFaqItems();
  const faqJsonLd = buildFaqPageJsonLd(questions);

  return (
    <main className="section-padding">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">FAQ</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Perguntas frequentes</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Respostas sobre o portal de imóveis no Rio Grande do Norte: publicação, preços, contato direto, revisão e
          segurança.
        </p>

        <section className="mt-10 divide-y divide-sand-200 border-y border-sand-200 dark:divide-slate-800 dark:border-slate-800">
          {questions.map((item) => (
            <article key={item.title} className="py-6">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.answer}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
