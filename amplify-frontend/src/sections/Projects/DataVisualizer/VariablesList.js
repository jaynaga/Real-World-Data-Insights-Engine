import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export default function VariablesList({ dataset }) {
  // Extract column names from dataset
  const variables = Object.keys(dataset?.[0] || {});

  return (
    <div className="space-y-2">
      {variables.map((variable) => (
        <DraggableVariable key={variable} name={variable} />
      ))}
    </div>
  );
}

function DraggableVariable({ name }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: name,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 bg-gray-100 dark:bg-gray-700 rounded cursor-move hover:bg-gray-200 dark:hover:bg-gray-600 text-textPrimary-light dark:text-textPrimary-dark"
    >
      {name}
    </div>
  );
}
