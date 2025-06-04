import React, { useState } from 'react';

const BulkCancelForm = ({ socket, resetJobState, jobState, groupId, setError }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    accountId: '',
    eventId: '',
    refundAmount: '',
    sendEmail: false,
    ticketListInput: ''
  });

  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const isBusy = isRequestInProgress || isStopping;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) return;

    socket.emit('joinGroup', groupId);
    console.log(`✅ Group joined: ${groupId}`);

    setIsRequestInProgress(true);
    resetJobState();

    try {
      const response = await fetch('/api/bulkCancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ticketListInput: formData.ticketListInput.trim(), groupId })
      });

      if (!response.ok) {
        let errorMsg = 'Request failed';
        try {
          const errorJson = await response.json();
          errorMsg = errorJson.error || errorMsg;
        } catch (parseErr) {
          console.warn('⚠️ Failed to parse error JSON:', parseErr);
        }

        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error sending cancellation request:', error);
    } finally {
      setIsRequestInProgress(false);
    }
  };

  const handleCancelOperation = async () => {
    setIsStopping(true);
    try {
      const response = await fetch('/api/stopBulkCancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Cancellation failed');
        throw new Error(errorText);
      }

      const data = await response.json();
      console.log('🛑 Cancellation acknowledged:', data);
    } catch (err) {
      console.error('❌ Error cancelling operation:', err);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-6 space-y-4">
      {['clientId', 'clientSecret', 'accountId', 'eventId', 'refundAmount'].map((field) => (
        <div key={field}>
          <label htmlFor={field} className="block text-sm font-semibold text-gray-700 capitalize">
            {field.replace(/([A-Z])/g, ' $1')}
          </label>
          <input
            type={
              field === 'clientSecret'
                ? 'password'
                : field === 'refundAmount'
                ? 'number'
                : 'text'
            }
            step={field === 'refundAmount' ? '0.01' : undefined}
            min={field === 'refundAmount' ? '0' : undefined}
            id={field}
            name={field}
            value={formData[field]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-teal-300"
            required
          />
        </div>
      ))}
<div className="py-4">
  <div className="flex items-center">
    <span className="mr-3 text-sm font-medium text-gray-700">Send Cancellation Email</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id="sendEmail"
        name="sendEmail"
        checked={formData.sendEmail}
        onChange={handleChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:none peer-focus:ring-teal-500 rounded-full peer peer-checked:bg-teal-500 transition-all"></div>
      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-full"></div>
    </label>
  </div>
</div>

      <div>
        <label htmlFor="ticketListInput" className="block text-sm font-semibold text-gray-700">
          Ticket IDs (comma/newline separated)
        </label>
        <textarea
          id="ticketListInput"
          name="ticketListInput"
          value={formData.ticketListInput}
          onChange={handleChange}
          rows="5"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-teal-300"
          required
        ></textarea>
      </div>

      <div className="flex space-x-4">
  {(jobState.processedTickets === 0 ||
    jobState.isCancelled ||
    jobState.processedTickets === jobState.totalTickets) && (
    <button
      type="submit"
      disabled={isBusy}
      className={`px-4 py-2 rounded text-white ${
        isBusy ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
      }`}
    >
      {isRequestInProgress ? 'Processing...' : 'Cancel Tickets'}
    </button>
  )}

  {jobState.processedTickets > 0 &&
    jobState.processedTickets < jobState.totalTickets &&
    !jobState.isCancelled && (
      <button
        type="button"
        onClick={handleCancelOperation}
        disabled={isStopping}
        className={`px-4 py-2 rounded text-white ${
          isStopping ? 'bg-yellow-300 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
        }`}
      >
        {isStopping ? 'Stopping...' : 'Stop'}
      </button>
    )}
</div>
    </form>
  );
};

export default BulkCancelForm;
