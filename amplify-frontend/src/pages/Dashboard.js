import React from "react";
import { useAuth } from "../context/AuthContext";

const mockDatasets = [
  { id: 1, name: "Mental Health Survey 2023", description: "National survey data" },
  { id: 2, name: "Youth Wellbeing Study", description: "Adolescent mental health" },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user?.email}!</h1>
      <h2 className="text-xl font-semibold mb-2">Datasets</h2>
      <ul className="space-y-2">
        {mockDatasets.map(ds => (
          <li key={ds.id} className="p-4 bg-gray-100 rounded shadow">
            <div className="font-semibold">{ds.name}</div>
            <div className="text-gray-600">{ds.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
