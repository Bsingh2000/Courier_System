export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="panel h-40 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="panel h-32 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel h-[28rem] animate-pulse" />
        <div className="panel h-[28rem] animate-pulse" />
      </div>
    </div>
  );
}
