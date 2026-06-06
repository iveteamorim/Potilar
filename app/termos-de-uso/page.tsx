import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | Potilar',
  description: 'Termos de uso da plataforma Potilar.'
};

export default function TermosDeUsoPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Potilar</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Termos de Uso</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>
            A Potilar e uma plataforma digital de divulgacao de imoveis. Ao criar conta, anunciar ou utilizar o site,
            voce concorda com estes termos.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Papel da Potilar</h2>
            <p className="mt-2">
              A Potilar divulga anuncios e facilita o contato direto entre anunciantes e interessados. A plataforma nao
              atua como corretora, imobiliaria, intermediadora financeira ou garantidora da negociacao.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Responsabilidade do anunciante</h2>
            <p className="mt-2">
              O anunciante e responsavel pela veracidade das informacoes, fotos, valores, disponibilidade, documentos e
              autorizacao para divulgar o imovel. Anuncios com dados falsos, incompletos ou inadequados podem ser
              removidos ou recusados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Revisao e publicacao</h2>
            <p className="mt-2">
              Os anuncios podem passar por revisao antes da publicacao. A Potilar pode aprovar, rejeitar, pausar, editar
              organizacao visual ou remover anuncios para manter a qualidade e seguranca da plataforma.
              Contas, anuncios, dados profissionais e pagamentos podem passar por revisao manual de seguranca, normalmente
              em ate 24 horas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Pagamentos</h2>
            <p className="mt-2">
              Servicos pagos, como anuncios adicionais, temporada, renovacoes e destaques, podem ser cobrados por Pix.
              A ativacao ocorre apos confirmacao do pagamento pela equipe. Valores e condicoes podem ser atualizados
              pela Potilar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Negociacoes</h2>
            <p className="mt-2">
              Visitas, propostas, contratos, pagamentos, chaves e demais combinacoes acontecem diretamente entre as
              partes. Antes de fechar qualquer negocio, recomendamos conferir documentacao, identidade das partes e
              condicoes do imovel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Uso indevido</h2>
            <p className="mt-2">
              Nao e permitido publicar conteudo falso, ofensivo, ilegal, imagens sem autorizacao, anuncios duplicados de
              forma abusiva ou qualquer tentativa de prejudicar usuarios e a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">7. Contato</h2>
            <p className="mt-2">
              Para duvidas sobre estes termos, fale com a Potilar pelo WhatsApp +55 21 96972-4141.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
