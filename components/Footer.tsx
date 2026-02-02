import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-sand-50/70 py-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-2">
            Plataforma digital focada no Rio Grande do Norte. Atendimento humano, transparente e sem
            burocracia na divulgação de imóveis.
          </p>
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">Navegação</p>
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/imoveis">Imóveis</Link>
            <Link href="/sobre">Sobre nós</Link>
            <Link href="/contato">Contato</Link>
          </div>
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">Contato</p>
          <p>WhatsApp: (84) 99999-9999</p>
          <p>Email: contato@rnlar.com.br</p>
          <Link
            href="/anunciar"
            className="mt-3 inline-flex rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-ocean-700"
          >
            Anunciar meu imóvel
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-slate-500 sm:px-6">
        © 2026 RN Lar. Todos os direitos reservados.
        <p className="mt-3">
          A RN Lar atua como plataforma digital de divulgação e atendimento imobiliário. A negociação e a formalização
          dos negócios são realizadas diretamente entre proprietários e interessados.
        </p>
      </div>
    </footer>
  );
}
