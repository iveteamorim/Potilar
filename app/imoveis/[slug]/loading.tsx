import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl">
        <LoadingSkeleton rows={5} />
      </div>
    </main>
  );
}
