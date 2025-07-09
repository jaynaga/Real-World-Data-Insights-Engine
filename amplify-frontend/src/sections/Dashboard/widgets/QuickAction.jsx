import React from 'react';

export default function QuickAction({ icon, label }) {
  return (
    <div className="quick-tile group cursor-pointer hover:shadow-md transition">
      <div className="quick-icon mb-2 text-xl">
        {icon}
      </div>
      <div className="quick-label text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark group-hover:underline">
        {label}
      </div>
    </div>
  );
}