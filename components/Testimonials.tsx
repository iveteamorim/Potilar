const testimonials = [
  {
    name: 'Amanda Nunes',
    text: 'Encontramos nossa casa em Monte Alegre sem sair de casa. Atendimento rápido e transparente.'
  },
  {
    name: 'Rafael Souza',
    text: 'A equipe entende a realidade do RN. Documentação e suporte impecáveis.'
  },
  {
    name: 'Joana Lima',
    text: 'Aluguel fechado em poucos dias. Tudo digital, sem burocracia.'
  }
];

export default function Testimonials() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Depoimentos de clientes</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="glass-card p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">“{testimonial.text}”</p>
              <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
