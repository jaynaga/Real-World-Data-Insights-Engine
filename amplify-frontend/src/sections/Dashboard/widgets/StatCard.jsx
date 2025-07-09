import React from 'react';

export default function StatCard({ label, value, icon }) {
  return (
    <div className="flex items-center card w-full">
      {icon && <div className="mr-4 text-blue-600 text-xl">{icon}</div>}
      <div>
        <p className="text-sm text-subtle">{label}</p>
        <p className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">{value}</p>
      </div>
    </div>
  );
}