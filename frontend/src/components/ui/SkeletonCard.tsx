'use client';

export function SkeletonCard() {
  return (
    <div className="card flex gap-3 p-3">
      <div className="skeleton w-24 h-24 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 rounded-lg w-3/4" />
        <div className="skeleton h-3 rounded-lg w-full" />
        <div className="skeleton h-3 rounded-lg w-2/3" />
        <div className="flex justify-between mt-3">
          <div className="skeleton h-5 w-20 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCategoryTab() {
  return (
    <div className="flex gap-2 px-4 py-1">
      {[80, 110, 90, 130, 75].map((w, i) => (
        <div key={i} className="skeleton h-8 rounded-full flex-shrink-0" style={{ width: w }} />
      ))}
    </div>
  );
}
