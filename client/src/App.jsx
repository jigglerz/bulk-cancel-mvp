// App.jsx
import React, { useState } from 'react';
import BulkCancelView from './views/BulkCancelView';

const App = () => {
  const tabs = [
    { key: 'cancel', label: 'Bulk Ticket Cancel' },
    { key: 'update', label: 'Bulk Field Update' },
    // Future tabs can go here
  ];

  const [activeTab, setActiveTab] = useState('cancel');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cancel':
        return <BulkCancelView />;
      case 'update':
        return <div className="p-4">🔧 Bulk Field Update coming soon</div>;
      default:
        return <div className="p-4">Select a tab</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex space-x-4 border-b mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`navTabs py-2 px-4 font-semibold border-b-2 transition ${
              activeTab === tab.key
                ? 'border-teal-500 text-grey-600 activeTab'
                : 'border-transparent text-gray-600 hover:text-teal-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default App;
