import React, { useEffect, useState } from 'react';
import { GasPrediction } from '@swc/shared';

interface DashboardProps {
  gasPrediction: GasPrediction | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ gasPrediction }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'UI.GET_STATUS' });
      if (response?.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Connection Status */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status?.sdsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-900">
              {status?.sdsConnected ? 'Connected to Somnia' : 'Disconnected'}
            </span>
          </div>
          {status?.sdsConnected && (
            <span className="text-xs text-gray-500">Live</span>
          )}
        </div>
      </div>

      {/* Today's Activity */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">📊 Today's Activity</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{status?.alertCount || 0}</div>
            <div className="text-xs text-gray-500">Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-xs text-gray-500">Blocked</div>
          </div>
        </div>
      </div>

      {/* Gas Prediction */}
      {gasPrediction && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">⛽ Gas Prediction</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current</span>
              <span className="text-lg font-bold text-gray-900">{gasPrediction.currentGwei.toFixed(1)} Gwei</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{gasPrediction.horizon}min</span>
              <span className={`text-lg font-bold ${
                gasPrediction.trend === 'up' ? 'text-red-600' : 
                gasPrediction.trend === 'down' ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {gasPrediction.predictedGwei.toFixed(1)} Gwei
                {gasPrediction.trend === 'up' ? ' ▲' : gasPrediction.trend === 'down' ? ' ▼' : ' ─'}
                {Math.abs(gasPrediction.percentChange).toFixed(1)}%
              </span>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Confidence</span>
                <span>{(gasPrediction.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-brand-primary h-2 rounded-full transition-all"
                  style={{ width: `${gasPrediction.confidence * 100}%` }}
                ></div>
              </div>
            </div>
            {gasPrediction.recommendedAction === 'wait' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
                💡 Consider waiting {gasPrediction.horizon} minutes for lower gas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Watchlist Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">👁️ Watched Contracts</h2>
          <span className="text-xs text-gray-500">{status?.watchedContracts?.length || 0}</span>
        </div>
        {(!status?.watchedContracts || status.watchedContracts.length === 0) ? (
          <p className="text-sm text-gray-500 text-center py-3">No contracts being watched</p>
        ) : (
          <div className="text-xs text-gray-600">
            Monitoring {status.watchedContracts.length} contract{status.watchedContracts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg p-4 shadow-sm text-white">
        <h3 className="text-sm font-semibold mb-2">🚀 Quick Start</h3>
        <p className="text-xs opacity-90 mb-3">
          Start by adding contracts to your watchlist to monitor for changes
        </p>
        <button 
          onClick={() => {
            // Navigate to watchlist
            window.location.hash = '#watchlist';
          }}
          className="bg-white text-brand-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Add Contract
        </button>
      </div>
    </div>
  );
};
