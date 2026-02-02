import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-6">
        <LoadingSkeleton rows={4} />
      </div>
    </main>
  );
}
