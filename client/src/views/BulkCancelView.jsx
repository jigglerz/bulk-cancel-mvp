import React, { useEffect, useMemo, useState } from 'react';
import BulkCancelForm from '../components/BulkCancelForm';
import JobProgress from '../components/JobProgress';
import TicketLog from '../components/TicketLog';
import DownloadCsvButton from '../components/DownloadCsvButton';
import ErrorBanner from '../components/ErrorBanner';
import useCsvReadyCheck from '../hooks/useCsvReadyCheck';
import socket from '../services/socket';

const BulkCancelView = () => {
  const [jobState, setJobState] = useState({
    totalTickets: 0,
    processedTickets: 0,
    successCount: 0,
    failureCount: 0,
    finalTicketStatuses: {},
    isCancelled: false
  });

  const [resetLogSignal, setResetLogSignal] = useState(false);
  const [csvReady, setCsvReady, checkCsvReadyWithRetries] = useCsvReadyCheck();
  const [error, setError] = useState(null);

  const groupId = useMemo(() => {
    let id = localStorage.getItem('jobControllerId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('jobControllerId', id);
    }
    return `cancel-group-${id}`;
  }, []);

  const resetJobState = (count = 0) => {
    setJobState({
      totalTickets: count,
      processedTickets: 0,
      successCount: 0,
      failureCount: 0,
      finalTicketStatuses: {},
      isCancelled: false
    });
    setCsvReady(false);
    setResetLogSignal(true);
    setError(null);
  };

  useEffect(() => {
    socket.on('startCancellationProcess', () => {
      console.log('⚙️ Job started');
    });

    socket.on('getTotalTickets', (count) => {
      console.log('📦 Total tickets received:', count);
      resetJobState(count);
    });

    socket.on('jobDone', ({ ticketId, httpStatus, httpStatusText, errorDetail }) => {
      setJobState((prev) => {
        if (prev.finalTicketStatuses[ticketId]) return prev;
        const isSuccess = httpStatus === 200;
        return {
          ...prev,
          processedTickets: prev.processedTickets + 1,
          successCount: isSuccess ? prev.successCount + 1 : prev.successCount,
          failureCount: !isSuccess ? prev.failureCount + 1 : prev.failureCount,
          finalTicketStatuses: {
            ...prev.finalTicketStatuses,
            [ticketId]: {
              statusCode: httpStatus,
              statusText: httpStatusText,
              errorDetail: isSuccess ? null : errorDetail
            }
          }
        };
      });
    });

    socket.on('jobCancelled', (data) => {
      console.warn(`🚫 Job cancelled for group ${data.groupId}`);
      setJobState((prev) => ({ ...prev, isCancelled: true }));
    });

    return () => {
      socket.off('startCancellationProcess');
      socket.off('getTotalTickets');
      socket.off('jobDone');
      socket.off('jobCancelled');
    };
  }, []);

  useEffect(() => {
    const { processedTickets, totalTickets, isCancelled } = jobState;
    if (processedTickets > 0 && (processedTickets === totalTickets || isCancelled)) {
      checkCsvReadyWithRetries(groupId);
    }
  }, [jobState, groupId]);

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <BulkCancelForm
        socket={socket}
        resetJobState={resetJobState}
        jobState={jobState}
        groupId={groupId}
        setError={setError}
      />
      <JobProgress jobState={jobState} />
      <DownloadCsvButton csvReady={csvReady} groupId={groupId} />
      <TicketLog jobState={jobState} resetSignal={resetLogSignal} setResetLogSignal={setResetLogSignal} />
    </div>
  );
};

export default BulkCancelView;
