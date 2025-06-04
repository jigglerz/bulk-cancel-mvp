import React, { useState } from 'react';

const DownloadCsvButton = ({ csvReady }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const userId = localStorage.getItem('jobControllerId');
    if (!userId) return alert("No group ID found. Run a job first.");

    const groupId = `cancel-group-${userId}`;
    setIsDownloading(true);

    try {
      const response = await fetch('/api/downloadLogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('❌ Failed to download CSV:', errText);
        alert(`Download failed: ${errText || 'Unknown error'}`);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${groupId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('❌ Download error:', err);
      alert('An error occurred while downloading the CSV.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!csvReady) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      aria-busy={isDownloading}
      className={`mt-4 w-full font-semibold py-2 px-4 rounded shadow-md transition-colors ${
        isDownloading
          ? 'bg-teal-300 cursor-not-allowed text-white'
          : 'bg-teal-500 hover:bg-teal-600 text-white'
      }`}
    >
      {isDownloading ? 'Downloading...' : 'Download Results as CSV'}
    </button>
  );
};

export default DownloadCsvButton;
