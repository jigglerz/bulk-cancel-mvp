import React from 'react';

const JobProgress = ({ jobState }) => {
  const { processedTickets, totalTickets } = jobState;

  const percent = totalTickets > 0
    ? Math.round((processedTickets / totalTickets) * 100)
    : 0;

  if (totalTickets === 0) return null; // Don’t show if no job started

  return (
    <div className="my-4" role="progressbar" aria-valuemin="0" aria-valuemax={totalTickets} aria-valuenow={processedTickets}>
      <div className="text-sm text-gray-700 mb-1">
        <strong>Progress:</strong> {processedTickets} / {totalTickets} ({percent}%)
      </div>
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div
          className="bg-teal-500 h-3 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default JobProgress;
