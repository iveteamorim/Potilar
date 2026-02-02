export default function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-24 rounded-2xl bg-sand-100 animate-pulse dark:bg-slate-800" />
      ))}
    </div>
  );
}
