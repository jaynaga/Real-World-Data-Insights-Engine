import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaThumbtack } from 'react-icons/fa';
import { FiPlus, FiEye, FiDownload } from 'react-icons/fi';

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
        <FiPlus className="cursor-pointer text-accent-light dark:text-accent-dark" />
        <FiEye className="cursor-pointer text-accent-light dark:text-accent-dark" />
        <FiDownload className="cursor-pointer text-accent-light dark:text-accent-dark" />
      </div>
    </div>
  );
}