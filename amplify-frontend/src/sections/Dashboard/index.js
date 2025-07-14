import React, { useEffect, useState } from 'react';
import StatCard from './widgets/StatCard';
import QuickAction from './widgets/QuickAction';
import ActivityFeed from './widgets/ActivityFeed';
import DatasetList from '../../components/DatasetList';
import '../../styles/tokens.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({ dashboards: 0, bookmarks: 0, uploads: 0, reports: 0 });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    setStats({ dashboards: 12, bookmarks: 28, uploads: 5, reports: 34 });
    setActivities([
      { id: 1, type: 'dashboard', text: 'Created dashboard “Mental Health Trends Q2”', timestamp: '2 hours ago' },
      { id: 2, type: 'download', text: 'Downloaded “National Mental Health Survey 2022”', timestamp: '5 hours ago' },
      { id: 3, type: 'upload', text: 'Uploaded “Patient_Survey_Data.csv”', timestamp: '1 day ago' },
      { id: 4, type: 'bookmark', text: 'Bookmarked “Global Mental Health Indicators”', timestamp: '2 days ago' },
    ]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col page-bg dashboard-container p-6 space-y-6">
      {/* Top Welcome Card */}
      <div className="flex justify-between items-center card">
        <div>
          <h2 className="card-heading text-textPrimary-light dark:text-textPrimary-dark">Welcome back!</h2>
          <p className="subtext text-subtle">Here's what's happening in your workspace</p>
        </div>
        <button className="btn-accent text-sm">+ New Project</button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="My Dashboards" value={stats.dashboards} icon="📊" />
        <StatCard label="Bookmarked Datasets" value={stats.bookmarks} icon="🔖" />
        <StatCard label="Uploaded Files" value={stats.uploads} icon="📁" />
        <StatCard label="Generated Reports" value={stats.reports} icon="📄" />
      </div>

      {/* Available Datasets */}
      <div className="card">
        <DatasetList />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="section-heading mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction icon="📊" label="Create Dashboard" />
          <QuickAction icon="📤" label="Upload CSV" />
          <QuickAction icon="🔍" label="Browse Datasets" />
          <QuickAction icon="📄" label="Generate Report" />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-heading mb-4">Recent Activity</h3>
          <ActivityFeed activities={activities} />
        </div>
        <div className="card">
          <h3 className="section-heading mb-4">AI Search</h3>
          <p className="body-text">AI search coming soon...</p>
        </div>
      </div>
    </div>
  );
}