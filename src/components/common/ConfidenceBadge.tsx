import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);

  if (pct >= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        High Confidence ({pct}%)
      </span>
    );
  }

  if (pct >= 75) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        Review Recommended ({pct}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
      Low Confidence ({pct}%)
    </span>
  );
};
