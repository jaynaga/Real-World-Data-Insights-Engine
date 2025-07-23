import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DraggableVariable = ({ variable, onSelect }) => {
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
      className="cursor-move bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow mb-2"
      onClick={() => onSelect(variable)}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{variable.label}</span>
        <span className="text-gray-500 text-sm">{variable.type}</span>
      </div>
    </div>
  );
};

const VariablesList = ({ variables, onVariableSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Variables</h3>
      <div className="space-y-2">
        {variables.map(variable => (
          <DraggableVariable
            key={variable.id}
            variable={variable}
            onSelect={onVariableSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default VariablesList;
