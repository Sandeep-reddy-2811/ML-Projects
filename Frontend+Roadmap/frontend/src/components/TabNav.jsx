import React from 'react';
import '../styles/TabNav.css';

export default function TabNav({ activeTab, onSwitch, resultsUnlocked }) {
  return (
    <div className="tab-nav">
      <button
        className={`tab-btn${activeTab === 'upload' ? ' active' : ''}`}
        onClick={() => onSwitch('upload')}
      >
        Upload
      </button>
      <button
        className={`tab-btn${activeTab === 'results' ? ' active' : ''}${!resultsUnlocked ? ' disabled' : ''}`}
        onClick={() => resultsUnlocked && onSwitch('results')}
      >
        Results {!resultsUnlocked && <span className="tab-lock">🔒</span>}
      </button>
    </div>
  );
}
