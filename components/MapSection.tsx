export default function MapSection({ title = 'Mapa do entorno' }: { title?: string }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-sand-200 dark:border-slate-800">
        <iframe
          title="Mapa do RN"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126688.35590952108!2d-35.2561!3d-5.8529!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1"
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
