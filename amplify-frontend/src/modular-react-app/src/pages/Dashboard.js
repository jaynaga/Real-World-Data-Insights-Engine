import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DatasetList from '../components/DatasetList';

const mockDatasets = [
  { id: 1, name: 'Mental Health Dataset 1', description: 'Description for dataset 1' },
  { id: 2, name: 'Mental Health Dataset 2', description: 'Description for dataset 2' },
  { id: 3, name: 'Mental Health Dataset 3', description: 'Description for dataset 3' },
];

function Dashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome, {user ? user.email : 'Guest'}!</h1>
      <h2 className="mt-4 text-xl">Available Datasets:</h2>
      <DatasetList datasets={mockDatasets} />
    </div>
  );
}

export default Dashboard;