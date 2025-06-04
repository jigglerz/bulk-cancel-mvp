import React, { useEffect, useState } from 'react';

const TicketLog = ({ jobState, resetSignal, setResetLogSignal }) => {
  const [failedLogs, setFailedLogs] = useState([]);

  // Reset the log if resetSignal is true
  useEffect(() => {
    if (resetSignal) {
      setFailedLogs([]);
      setResetLogSignal(false); // ✅ reset the flag after clearing
    }
  }, [resetSignal, setResetLogSignal]);

  // Watch for new failed statuses
  useEffect(() => {
    const newFailures = Object.entries(jobState.finalTicketStatuses)
      .filter(([_, result]) => result.statusCode !== 200); // ✅ correct destructure

    setFailedLogs((prev) => {
      const existingIds = new Set(prev.map(([id]) => id));
      const uniqueNew = newFailures.filter(([id]) => !existingIds.has(id));
      const combined = [...prev, ...uniqueNew];
      return combined.slice(0, 20);
    });
  }, [jobState.finalTicketStatuses]);

  if (failedLogs.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded shadow">
      <h3 className="text-red-700 font-semibold mb-2">⚠️ Failed Requests (up to 20)</h3>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
       {failedLogs.map(([ticketId, log]) => (
  <li key={ticketId}>
    Ticket <strong>{ticketId}</strong> failed with status: {log.statusCode} – {log.statusText}
    {log.errorDetail && (
      <>
        <br />
        <span className="ml-2 text-sm text-red-600 font-medium">Reason: {log.errorDetail}</span>
      </>
    )}
  </li>
))}
      </ul>
    </div>
  );
};

export default TicketLog;
