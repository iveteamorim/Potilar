import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sobre nós | Potilar',
  description: 'Conheça a história da Potilar e nosso compromisso com transparência no Rio Grande do Norte.'
};

const team = [
  {
    name: 'Lívia Costa',
    role: 'Fundadora & Atendimento',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=320&h=320&q=85'
  },
  {
    name: 'Eduardo Alves',
    role: 'Consultor Digital',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=320&h=320&q=85'
  },
  {
    name: 'Camila Rocha',
    role: 'Suporte ao Cliente',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=320&h=320&q=85'
  }
];

export default function SobrePage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Sobre nós</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              História local, atendimento humano e tecnologia a favor do RN.
            </h1>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              A Potilar nasceu para conectar famílias a imóveis acessíveis nas cidades do RN, com processos
              digitais, visitas virtuais e acompanhamento transparente. Atendemos com base em valores de proximidade,
              educação financeira e confiança.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Nosso time conhece a realidade local e oferece suporte para divulgação e conexão entre proprietários e
              interessados.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nossos valores</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>Transparência nas negociações e documentação.</li>
              <li>Proximidade com comunidades do RN.</li>
              <li>Processos digitais e suporte humano.</li>
            </ul>
          </div>
        </div>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Equipe</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="glass-card p-6 text-center">
                <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full">
                  <Image src={member.image} alt={member.name} fill className="object-cover" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{member.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
