import React from 'react';
import { FiBarChart2, FiDownload, FiUpload, FiBookmark } from 'react-icons/fi';

const iconMap = {
  dashboard: <FiBarChart2 className="text-blue-500 w-5 h-5" />,
  download: <FiDownload className="text-green-500 w-5 h-5" />,
  upload: <FiUpload className="text-indigo-500 w-5 h-5" />,
  bookmark: <FiBookmark className="text-green-500 w-5 h-5" />,
  info: <FiBarChart2 className="text-gray-500 w-5 h-5" />,
};

export default function ActivityFeed({ activities }) {
  return (
    <ul className="space-y-4 text-sm text-subtle">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className="flex items-start gap-3 pb-4"
        >
          <div className="pt-[2px]">
            {iconMap[activity.type] || <div className="w-5" />}
          </div>
          <div>
            <p className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
              {activity.text}
            </p>
            <p className="text-xs text-subtle">{activity.timestamp}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}