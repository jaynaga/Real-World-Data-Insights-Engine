import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableVariable = ({ variable, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: variable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm mb-2"
    >
      <span className="font-medium">{variable.label}</span>
      <button
        onClick={() => onRemove(variable.id)}
        className="text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  );
};

const DroppableZone = ({ variables, onRemove }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <h3 className="text-lg font-semibold mb-3">
        {variables.length === 0 ? 'Drop variables here' : 'Chart Variables'}
      </h3>
      {variables.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Drag and drop variables to create a chart
        </div>
      ) : (
        <div className="space-y-2">
          {variables.map((variable) => (
            <SortableVariable
              key={variable.id}
              variable={variable}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DroppableZone;
