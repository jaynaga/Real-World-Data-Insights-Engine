import React from 'react';

const DatasetList = ({ datasets }) => {
  return (
    <div className="space-y-4">
      {datasets.map((dataset, index) => (
        <div key={index} className="p-4 border rounded shadow">
          <h3 className="text-lg font-semibold">{dataset.name}</h3>
          <p className="text-gray-600">{dataset.description}</p>
        </div>
      ))}
    </div>
  );
};

export default DatasetList;