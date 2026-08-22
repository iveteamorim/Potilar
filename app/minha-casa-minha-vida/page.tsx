import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, FileText } from 'lucide-react';
import MinhaCasaMinhaVidaSimulator, { MinhaCasaMinhaVidaHighlights } from '@/components/MinhaCasaMinhaVidaSimulator';

export const metadata: Metadata = {
  title: 'Financiamento de Imóveis RN | Simulador Potilar',
  description:
    'Simule de forma orientativa financiamento de imóveis no Rio Grande do Norte, veja uma estimativa do Minha Casa Minha Vida e encontre imóveis compatíveis na Potilar.',
  alternates: {
    canonical: '/minha-casa-minha-vida'
  },
  openGraph: {
    title: 'Financiamento de imóveis no RN | Potilar',
    description:
      'Calcule uma estimativa de financiamento, entrada, FGTS, Minha Casa Minha Vida e veja imóveis de compra no Rio Grande do Norte.',
    url: '/minha-casa-minha-vida'
  }
};

const faqs = [
  {
    question: 'O simulador garante aprovação no Minha Casa Minha Vida?',
    answer:
      'Não. O resultado é uma estimativa inicial. A aprovação depende da análise da Caixa ou instituição financeira, documentação, renda, histórico de crédito, FGTS e regras vigentes.'
  },
  {
    question: 'A Potilar financia imóveis?',
    answer:
      'Não. A Potilar é uma plataforma de divulgação imobiliária. O financiamento deve ser tratado diretamente com banco, correspondente bancário, Caixa, corretor ou imobiliária.'
  },
  {
    question: 'Posso usar o simulador para imóveis em qualquer cidade do RN?',
    answer:
      'Sim. O simulador ajuda a planejar a compra e a encontrar anúncios em cidades do Rio Grande do Norte publicados na Potilar.'
  },
  {
    question: 'O FGTS entra na simulação?',
    answer:
      'Você pode informar um valor aproximado de FGTS disponível. O uso real depende das regras do financiamento e da análise da instituição financeira.'
  }
];

const guideCards = [
  {
    title: 'Como funciona a simulação?',
    text: 'A Potilar cruza renda, entrada, FGTS, cidade e valor do imóvel para mostrar uma estimativa inicial de compra.'
  },
  {
    title: 'O que o simulador calcula?',
    text: 'Faixa provável, valor aproximado a financiar, parcela de referência e imóveis compatíveis com seu orçamento.'
  },
  {
    title: 'Quem pode participar?',
    text: 'Em geral, famílias dentro das faixas de renda e sem imóvel residencial próprio devem confirmar elegibilidade com a instituição financeira.'
  },
  {
    title: 'Posso usar FGTS?',
    text: 'O FGTS pode ajudar na entrada ou no financiamento, mas o uso depende da análise e regras vigentes.'
  }
];

const financingSteps = [
  {
    title: '1. Veja quanto cabe no orçamento',
    text: 'Use como referência uma parcela que não comprometa demais a renda familiar mensal.'
  },
  {
    title: '2. Defina entrada e FGTS',
    text: 'Quanto maior a entrada, menor tende a ser o valor financiado e o peso das parcelas.'
  },
  {
    title: '3. Compare opções de crédito',
    text: 'Condições, juros, seguros e taxas variam entre bancos e correspondentes autorizados.'
  },
  {
    title: '4. Separe documentos',
    text: 'RG, CPF, comprovante de renda, estado civil, residência e documentos do imóvel costumam ser solicitados.'
  }
];

const paymentTypes = [
  {
    title: 'SAC',
    text: 'Parcelas começam maiores e tendem a diminuir com o tempo, porque a amortização é constante.'
  },
  {
    title: 'Price',
    text: 'Parcelas costumam ser mais estáveis ao longo do contrato, mas a composição de juros e amortização muda.'
  }
];

export default function MinhaCasaMinhaVidaPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-sand-50 py-6 dark:bg-slate-950 sm:py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-5 px-4 sm:gap-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10 rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.14)] sm:rounded-[2rem] sm:p-10 sm:shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Simulação gratuita e orientativa
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Descubra quanto você pode financiar.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Simule sua capacidade de compra antes de procurar um imóvel no Rio Grande do Norte.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/imoveis?transaction=Compra"
                className="inline-flex items-center justify-center rounded-full bg-ocean-700 px-7 py-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
              >
                Ver imóveis à venda
              </Link>
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden rounded-[1.75rem] bg-white/30 shadow-[0_18px_48px_rgba(15,23,42,0.14)] sm:min-h-[360px] sm:rounded-t-[8rem] lg:min-h-[520px]">
            <img
              src="/minhacasa-minhavida-web.jpg"
              alt="Família em casa simulando financiamento imobiliário"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section className="section-padding" id="simulador">
        <div className="mx-auto max-w-6xl">
          <MinhaCasaMinhaVidaSimulator />
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Como usar</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              Uma simulação simples para começar sua busca com mais clareza.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              Ao inserir seus dados, a ferramenta organiza uma projeção inicial da sua capacidade de compra. Ela estima a faixa provável de renda, o valor aproximado que poderia ser financiado, a entrada somada ao FGTS, uma parcela de referência e conecta esse orçamento a imóveis de compra publicados na Potilar.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              O resultado não substitui a análise da Caixa, banco ou correspondente. Taxas, subsídio, prazo, uso real do FGTS e aprovação dependem das regras vigentes e da avaliação oficial do seu perfil.
            </p>
          </div>
          <div className="mt-8">
            <MinhaCasaMinhaVidaHighlights />
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Guia rápido</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              Tire as principais dúvidas antes de procurar o imóvel.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {guideCards.map((card) => (
              <article key={card.title} className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Financiamento</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              Como pensar no cálculo antes de escolher o imóvel.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              A parcela de um financiamento normalmente combina amortização, juros, seguros e custos operacionais. A simulação da Potilar ajuda a organizar essa primeira noção antes da análise oficial.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {financingSteps.map((step) => (
              <article key={step.title} className="rounded-3xl border border-sand-200 bg-sand-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-ocean-700 shadow-sm dark:bg-slate-950">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-sand-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">SAC ou Price</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
                A forma de pagamento muda o comportamento da parcela.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {paymentTypes.map((item) => (
                <article key={item.title} className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-2xl font-semibold text-ocean-800 dark:text-ocean-200">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Perguntas frequentes</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              Antes de escolher um imóvel.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Respostas rápidas para usar a simulação com mais segurança.
            </p>
          </div>
          <div className="mt-8 grid gap-4">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-ocean-800 p-8 text-white shadow-soft md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold">Procure imóveis que cabem no seu plano.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ocean-50">
                Veja anúncios de compra no Rio Grande do Norte e fale direto com o anunciante.
              </p>
            </div>
            <Link
              href="/imoveis?transaction=Compra"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-ocean-800 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Ver imóveis à venda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
