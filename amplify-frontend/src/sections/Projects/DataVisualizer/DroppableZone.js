import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function DroppableZone({ id, label, value }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-accent-light dark:hover:border-accent-dark"
      {...attributes}
      {...listeners}
    >
      <div className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
        {label}
      </div>
      {value ? (
        <div className="bg-accent-light dark:bg-accent-dark text-white px-3 py-1 rounded text-sm">
          {value}
        </div>
      ) : (
        <div className="text-textSecondary-light dark:text-textSecondary-dark text-sm">
          Drag variable here
        </div>
      )}
    </div>
  );
}
