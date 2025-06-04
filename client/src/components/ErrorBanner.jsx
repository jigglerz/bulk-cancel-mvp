import React from 'react';

const ErrorBanner = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded">
      ❌ {message}
    </div>
  );
};

export default ErrorBanner;
