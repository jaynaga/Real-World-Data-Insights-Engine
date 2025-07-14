import React, { useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import ReactECharts from 'echarts-for-react';
import ChartTypeSelector from './ChartTypeSelector';
import VariablesList from './VariablesList';
import DroppableZone from './DroppableZone';

const chartTypes = [
  { id: 'bar', name: 'Bar Chart' },
  { id: 'line', name: 'Line Chart' },
  { id: 'scatter', name: 'Scatter Plot' },
  { id: 'pie', name: 'Pie Chart' },
  { id: 'box', name: 'Box Plot' }
];

export default function DataVisualizer({ dataset }) {
  const [selectedChart, setSelectedChart] = useState(chartTypes[0]);
  const [mappedVariables, setMappedVariables] = useState({
    x: null,
    y: null,
    color: null,
    size: null
  });
  const [chartOptions, setChartOptions] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over) {
      const variable = active.id;
      const dropZone = over.id;

      setMappedVariables(prev => ({
        ...prev,
        [dropZone]: variable
      }));

      updateChartOptions({
        ...mappedVariables,
        [dropZone]: variable
      });
    }
  };

  const updateChartOptions = (newMappings) => {
    const options = {
      title: {
        text: 'Dynamic Visualization',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      // We'll generate the rest of the options based on the chart type and mappings
      ...generateChartOptions(selectedChart.id, newMappings, dataset)
    };

    setChartOptions(options);
  };

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div className="w-1/4 bg-white dark:bg-card-dark rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">
            Variables
          </h3>
          <VariablesList dataset={dataset} />
        </div>

        <div className="w-2/4 mx-4">
          <div className="bg-white dark:bg-card-dark rounded-lg shadow p-4 mb-4">
            <ChartTypeSelector
              types={chartTypes}
              selected={selectedChart}
              onChange={setSelectedChart}
            />
          </div>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="bg-white dark:bg-card-dark rounded-lg shadow p-4">
              {chartOptions && (
                <ReactECharts
                  option={chartOptions}
                  style={{ height: '400px' }}
                  className="w-full"
                />
              )}
            </div>
          </DndContext>
        </div>

        <div className="w-1/4 bg-white dark:bg-card-dark rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">
            Chart Properties
          </h3>
          <div className="space-y-4">
            <DroppableZone
              id="x"
              label="X Axis"
              value={mappedVariables.x}
            />
            <DroppableZone
              id="y"
              label="Y Axis"
              value={mappedVariables.y}
            />
            <DroppableZone
              id="color"
              label="Color"
              value={mappedVariables.color}
            />
            <DroppableZone
              id="size"
              label="Size"
              value={mappedVariables.size}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
