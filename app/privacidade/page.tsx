import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidade | Potilar',
  description: 'Politica de privacidade da plataforma Potilar.'
};

export default function PrivacidadePage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Potilar</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Politica de Privacidade</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>
            Esta politica explica como a Potilar coleta e utiliza dados pessoais para operar a plataforma de anuncios
            imobiliarios.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Dados coletados</h2>
            <p className="mt-2">
              Podemos coletar nome, email, telefone, WhatsApp, dados de login, informacoes do anuncio, fotos do imovel,
              cidade, bairro, valores, CPF ou CNPJ do anunciante para verificacao interna de seguranca, mensagens
              enviadas para atendimento e dados tecnicos de acesso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Como usamos os dados</h2>
            <p className="mt-2">
              Usamos os dados para criar contas, publicar anuncios, permitir contato entre interessados e anunciantes,
              revisar conteudos, confirmar pagamentos, melhorar a plataforma e atender solicitacoes dos usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Dados exibidos publicamente</h2>
            <p className="mt-2">
              Ao publicar um anuncio, as informacoes escolhidas pelo anunciante para contato, como telefone, WhatsApp ou
              email, podem aparecer publicamente no anuncio. CPF ou CNPJ nao e exibido publicamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Compartilhamento</h2>
            <p className="mt-2">
              Nao vendemos dados pessoais. Podemos compartilhar dados apenas quando necessario para funcionamento do
              site, cumprimento de obrigacoes legais, seguranca da plataforma ou atendimento ao proprio usuario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Armazenamento e seguranca</h2>
            <p className="mt-2">
              Os dados sao armazenados em servicos de tecnologia utilizados pela Potilar. Aplicamos medidas razoaveis de
              seguranca, mas nenhum sistema digital e totalmente livre de riscos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Direitos do usuario</h2>
            <p className="mt-2">
              Voce pode solicitar correcao, exclusao ou orientacao sobre seus dados entrando em contato com a Potilar.
              Algumas informacoes podem ser mantidas quando necessario para seguranca, historico operacional ou
              obrigacoes legais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">7. Contato</h2>
            <p className="mt-2">
              Para falar sobre privacidade, envie mensagem pelo WhatsApp +55 21 96972-4141.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
