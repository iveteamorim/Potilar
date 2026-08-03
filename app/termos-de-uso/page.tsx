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
            A Potilar é uma plataforma digital de divulgação de imóveis. Ao criar conta, anunciar ou utilizar o site,
            você concorda com estes termos.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Papel da Potilar</h2>
            <p className="mt-2">
              A Potilar divulga anúncios e facilita o contato direto entre anunciantes e interessados. A plataforma não
              atua como corretora, imobiliária, intermediadora financeira ou garantidora da negociação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Responsabilidade do anunciante</h2>
            <p className="mt-2">
              O anunciante é responsável pela veracidade das informações, fotos, valores, disponibilidade, documentos e
              autorização para divulgar o imóvel. Anúncios com dados falsos, incompletos ou inadequados podem ser
              removidos ou recusados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Revisão e publicação</h2>
            <p className="mt-2">
              Os anúncios podem passar por revisão antes da publicação. A Potilar pode aprovar, rejeitar, pausar, editar
              organização visual ou remover anúncios para manter a qualidade e segurança da plataforma.
              Contas, anúncios, dados profissionais e pagamentos podem passar por revisão manual de segurança, normalmente
              em até 24 horas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Pagamentos</h2>
            <p className="mt-2">
              Serviços pagos, como anúncios adicionais, temporada, renovações e destaques, podem ser cobrados por Pix.
              A ativação ocorre após confirmação do pagamento pela equipe. Valores e condições podem ser atualizados
              pela Potilar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Negociações</h2>
            <p className="mt-2">
              Visitas, propostas, contratos, pagamentos, chaves e demais combinações acontecem diretamente entre as
              partes. Antes de fechar qualquer negócio, recomendamos conferir documentação, identidade das partes e
              condições do imóvel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Uso indevido</h2>
            <p className="mt-2">
              Não é permitido publicar conteúdo falso, ofensivo, ilegal, imagens sem autorização, anúncios duplicados de
              forma abusiva ou qualquer tentativa de prejudicar usuários e a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">7. Contato</h2>
            <p className="mt-2">
              Para dúvidas sobre estes termos, fale com a Potilar pelo formulario de contato.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
