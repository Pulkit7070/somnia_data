import React, { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { AlertModal } from './components/AlertModal';
import { Settings } from './components/Settings';
import { History } from './components/History';
import { Watchlist } from './components/Watchlist';
import { Alert, GasPrediction } from '@swc/shared';

type View = 'dashboard' | 'history' | 'watchlist' | 'settings';

export const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [gasPrediction, setGasPrediction] = useState<GasPrediction | null>(null);

  useEffect(() => {
    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'ALERT.RISK_DETECTED') {
        setActiveAlert(message.payload);
      } else if (message.type === 'GAS.PREDICTION_UPDATED') {
        setGasPrediction(message.payload);
      } else if (message.type === 'ALERT.CONTRACT_CHANGE') {
        setActiveAlert(message.payload);
      } else if (message.type === 'ALERT.GAS_PREDICTION') {
        setActiveAlert(message.payload);
      }
    });
  }, []);

  const dismissAlert = () => {
    if (activeAlert) {
      chrome.runtime.sendMessage({
        type: 'UI.DISMISS_ALERT',
        payload: { alertId: (activeAlert as any).id },
      });
      setActiveAlert(null);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard gasPrediction={gasPrediction} />;
      case 'history':
        return <History />;
      case 'watchlist':
        return <Watchlist />;
      case 'settings':
        return <Settings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🧠</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Smart Wallet Copilot</h1>
          </div>
          <button
            onClick={() => setView('settings')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {renderView()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around">
          <button
            onClick={() => setView('dashboard')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${
              view === 'dashboard' ? 'text-brand-primary' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${
              view === 'history' ? 'text-brand-primary' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">History</span>
          </button>
          <button
            onClick={() => setView('watchlist')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${
              view === 'watchlist' ? 'text-brand-primary' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs">Watchlist</span>
          </button>
        </div>
      </nav>

      {/* Alert Modal */}
      {activeAlert && (
        <AlertModal alert={activeAlert} onDismiss={dismissAlert} />
      )}
    </div>
  );
};
