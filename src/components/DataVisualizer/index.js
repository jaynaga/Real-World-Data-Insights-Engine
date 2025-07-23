import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ChartTypeSelector from './ChartTypeSelector';
import VariablesList from './VariablesList';
import DroppableZone from './DroppableZone';

const DataVisualizer = ({ data }) => {
  const [chartType, setChartType] = useState('line');
  const [variables, setVariables] = useState([]);
  const [droppedVariables, setDroppedVariables] = useState([]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const variable = variables.find(v => v.id === active.id);
      if (variable && !droppedVariables.find(v => v.id === variable.id)) {
        setDroppedVariables([...droppedVariables, variable]);
      }
    }
  };

  const handleRemoveVariable = (variableId) => {
    setDroppedVariables(droppedVariables.filter(v => v.id !== variableId));
  };

  const getChartOptions = () => {
    const options = {
      chart: {
        type: chartType,
        height: 350,
        animations: {
          enabled: true
        },
        toolbar: {
          show: true
        }
      },
      xaxis: {
        type: 'category'
      },
      tooltip: {
        enabled: true
      }
    };

    if (droppedVariables.length > 0) {
      options.xaxis.categories = data.map(d => d[droppedVariables[0].key]);
    }

    return options;
  };

  const getChartSeries = () => {
    return droppedVariables.slice(1).map(variable => ({
      name: variable.label,
      data: data.map(d => parseFloat(d[variable.key]) || 0)
    }));
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <ChartTypeSelector
            selectedType={chartType}
            onSelect={setChartType}
          />
          <VariablesList
            variables={variables}
            onVariableSelect={(variable) => {
              if (!droppedVariables.find(v => v.id === variable.id)) {
                setDroppedVariables([...droppedVariables, variable]);
              }
            }}
          />
        </div>
        <div className="md:col-span-3">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={droppedVariables.map(v => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableZone
                variables={droppedVariables}
                onRemove={handleRemoveVariable}
              />
            </SortableContext>
          </DndContext>
          {droppedVariables.length > 1 && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <Chart
                options={getChartOptions()}
                series={getChartSeries()}
                height={350}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualizer;
