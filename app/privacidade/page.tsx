import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Potilar',
  description: 'Política de privacidade da plataforma Potilar.'
};

export default function PrivacidadePage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Potilar</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Política de Privacidade</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>
            Esta política explica como a Potilar coleta e utiliza dados pessoais para operar a plataforma de anúncios
            imobiliários.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Dados coletados</h2>
            <p className="mt-2">
              Podemos coletar nome, email, telefone, WhatsApp, dados de login, informações do anúncio, fotos do imóvel,
              cidade, bairro, valores, CPF ou CNPJ do anunciante para verificação interna de segurança, mensagens
              enviadas para atendimento e dados técnicos de acesso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Como usamos os dados</h2>
            <p className="mt-2">
              Usamos os dados para criar contas, publicar anúncios, permitir contato entre interessados e anunciantes,
              revisar conteúdos, confirmar pagamentos, melhorar a plataforma e atender solicitações dos usuários.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Dados exibidos publicamente</h2>
            <p className="mt-2">
              Ao publicar um anúncio, as informações escolhidas pelo anunciante para contato, como telefone, WhatsApp ou
              email, podem aparecer publicamente no anúncio. CPF ou CNPJ não é exibido publicamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Compartilhamento</h2>
            <p className="mt-2">
              Não vendemos dados pessoais. Podemos compartilhar dados apenas quando necessário para funcionamento do
              site, cumprimento de obrigações legais, segurança da plataforma ou atendimento ao próprio usuário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Armazenamento e segurança</h2>
            <p className="mt-2">
              Os dados são armazenados em serviços de tecnologia utilizados pela Potilar. Aplicamos medidas razoáveis de
              segurança, mas nenhum sistema digital é totalmente livre de riscos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Direitos do usuário</h2>
            <p className="mt-2">
              Você pode solicitar correção, exclusão ou orientação sobre seus dados entrando em contato com a Potilar.
              Algumas informações podem ser mantidas quando necessário para segurança, histórico operacional ou
              obrigações legais.
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
