import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaThumbtack } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';

export default function DatasetCard({ index }) {
  const navigate = useNavigate();
  return (
    <div
      className="grid grid-cols-6 items-center gap-4 p-4 border-b border-default text-sm bg-card-light dark:bg-card-dark hover:bg-card-light dark:hover:bg-card-hover-dark transition-colors text-textPrimary-light dark:text-textPrimary-dark cursor-pointer"
      onClick={() => navigate('/explore/dataset')}
    >
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <FaThumbtack className="text-yellow-500" />
          <div>
            <p className="font-semibold">Example Dataset {index + 1}</p>
            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">This is a short description</p>
          </div>
        </div>
      </div>
      <div>Source Org</div>
      <div>Jun 1, 2023</div>
      <div>247</div>
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/explore/dataset');
          }}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <FiExternalLink />
          Open
        </button>
      </div>
    </div>
  );
}