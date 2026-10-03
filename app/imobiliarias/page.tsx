import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Info,
  MapPin,
  Megaphone,
  ShieldCheck
} from 'lucide-react';
import ProfessionalPlanCards from '@/components/ProfessionalPlanCards';
import { getFreeActiveLimit } from '@/lib/listingCapacity';
import { PLANS, formatPlanPrice } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Imobiliárias e corretores no RN | Potilar',
  description:
    'Comece grátis na Potilar. Corretores e imobiliárias do Rio Grande do Norte divulgam imóveis com marca própria e só pagam quando precisam de mais capacidade.',
  alternates: {
    canonical: '/imobiliarias'
  }
};

const contactHref = '/contato';

const benefits = [
  { title: 'Página própria', text: 'Uma vitrine profissional para reunir sua marca e seus imóveis em um só lugar.', Icon: Building2 },
  { title: 'Kit de divulgação', text: 'Cartazes, QR Code e materiais para redes prontos para cada imóvel publicado.', Icon: Megaphone },
  { title: 'Busca local', text: 'Seus anúncios aparecem por cidade, tipo de imóvel, filtros e mapa do RN.', Icon: MapPin }
];

const heroBenefits = ['Sem comissão', 'Página profissional', 'Contato direto', 'Comece grátis'];

const faqItems = [
  {
    question: 'A Potilar cobra comissão?',
    answer: 'Não. A Potilar divulga os imóveis; a negociação continua diretamente entre anunciante e interessado.'
  },
  {
    question: 'Preciso pagar para criar conta profissional?',
    answer: `Não. Corretor começa com ${getFreeActiveLimit('corretor')} imóveis ativos grátis. Imobiliária começa com ${getFreeActiveLimit('imobiliaria')}. O plano mensal só entra quando você quiser mais capacidade.`
  },
  {
    question: 'Posso divulgar imóveis de várias cidades do RN?',
    answer: 'Sim. A busca foi pensada para Rio Grande do Norte, com páginas por cidade, filtros e mapa.'
  }
];

export default function ImobiliariasPage() {
  return (
    <main className="section-padding bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="rounded-[2rem] border border-ocean-900 bg-ocean-900 p-6 text-white shadow-soft md:p-8 lg:px-10 lg:py-9">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-100">Imobiliárias no RN</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-white md:text-5xl lg:text-6xl">
                Imobiliárias no Rio Grande do Norte
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ocean-50 md:text-lg">
                Organize sua carteira, divulgue seus imóveis e fortaleça sua marca em um portal feito para o RN. Comece
                grátis. Pague só quando precisar de mais capacidade.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#planos-profissionais"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-ocean-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Ver planos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {heroBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15">
                  <ShieldCheck className="h-4 w-4 text-sun-300" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Benefícios</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">O essencial para publicar com padrão profissional.</h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {benefits.map(({ title, text, Icon }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos-profissionais" className="rounded-[2rem] bg-ocean-900 p-5 text-white shadow-soft sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-4xl text-white md:text-5xl">Planos</h2>
              <div className="mt-3 space-y-1 text-sm leading-6 text-ocean-50 sm:text-base">
                <p>Corretor: {getFreeActiveLimit('corretor')} imóveis grátis → {formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true })} até {PLANS.professional.corretor.listingLimit}.</p>
                <p>Imobiliária: {getFreeActiveLimit('imobiliaria')} imóveis grátis → {formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true })} até {PLANS.professional.imobiliaria.listingLimit}.</p>
                <p>Imobiliária Pro: {formatPlanPrice(PLANS.professional.plus.price, { perMonth: true })} até {PLANS.professional.plus.listingLimit}.</p>
              </div>
            </div>
            <Link href="/planos" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ocean-200 hover:text-white">
              Ver detalhes dos planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            <ProfessionalPlanCards contactHref={contactHref} />
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-6 text-ocean-50 ring-1 ring-white/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-ocean-200" aria-hidden="true" />
            <p>A cota grátis faz parte do produto. Sem fidelidade. Cancele o plano quando quiser.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
