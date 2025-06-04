import { useState } from 'react';

export default function useCsvReadyCheck() {
  const [csvReady, setCsvReady] = useState(false);

  const checkCsvReadyWithRetries = async (groupId, maxAttempts = 3, delay = 2000) => {
    const tryCheck = async (attempt = 1) => {
      const res = await fetch(`/api/checkCsvReady?groupId=${groupId}`);
      if (res.status === 200) {
        setCsvReady(true);
      } else if (attempt < maxAttempts) {
        setTimeout(() => tryCheck(attempt + 1), delay);
      } else {
        setCsvReady(false);
      }
    };
    tryCheck();
  };

  return [csvReady, setCsvReady, checkCsvReadyWithRetries];
}
