import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | Potilar',
  description: 'Perguntas frequentes sobre anuncios, contatos, seguranca e funcionamento da Potilar.',
  alternates: {
    canonical: '/faq'
  }
};

const questions = [
  {
    title: 'A Potilar faz intermediacao?',
    answer:
      'Nao. Atuamos como plataforma de divulgacao imobiliaria. A negociacao acontece diretamente entre proprietarios, anunciantes e interessados.'
  },
  {
    title: 'Como divulgo meu imovel?',
    answer:
      'Crie sua conta, preencha o anuncio, envie fotos reais, informe cidade, tipo de negociacao, preco e dados de contato.'
  },
  {
    title: 'Posso acompanhar meu anuncio?',
    answer:
      'Sim. Na area Minha conta voce acompanha o status, edita informacoes, organiza fotos e atualiza contatos.'
  },
  {
    title: 'A Potilar verifica os anuncios?',
    answer:
      'Os anuncios podem passar por revisao antes de aparecerem publicamente. Mesmo assim, recomendamos confirmar dados, documentos e identidade do anunciante antes de qualquer pagamento.'
  },
  {
    title: 'Como entro em contato com um anunciante?',
    answer:
      'Cada anuncio pode mostrar os canais informados pelo responsavel, como WhatsApp, telefone ou email. O contato e feito diretamente entre as partes.'
  },
  {
    title: 'E seguro pagar sinal ou reserva?',
    answer:
      'Nunca envie dinheiro sem confirmar a existencia do imovel, a identidade do responsavel e a documentacao. Em caso de duvida, procure orientacao profissional.'
  }
];

export default function FaqPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">FAQ</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Perguntas frequentes</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Respostas rapidas sobre publicacao de anuncios, contato direto, revisao e cuidados de seguranca.
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
