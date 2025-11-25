import React from 'react';
import { Alert, RiskLevel, RiskDetectedAlert, ContractChangeAlert, GasPredictionAlert } from '@swc/shared';

interface AlertModalProps {
  alert: Alert;
  onDismiss: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ alert, onDismiss }) => {
  // Type guard to check if alert has level property
  const hasLevel = (a: Alert): a is RiskDetectedAlert | ContractChangeAlert | GasPredictionAlert => {
    return 'level' in a;
  };
  
  const level = hasLevel(alert) ? alert.level : RiskLevel.INFO;
  
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-50 border-red-500 text-red-900';
      case 'HIGH': return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'LOW': return 'bg-green-50 border-green-500 text-green-900';
      default: return 'bg-blue-50 border-blue-500 text-blue-900';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
        return '✓';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onDismiss}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-down">
        {/* Header */}
        <div className={`px-6 py-4 border-l-4 rounded-t-xl ${getRiskColor(level)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getRiskIcon(level)}</span>
              <h2 className="text-lg font-semibold">{level} Risk Detected</h2>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Alert Content */}
          {renderAlertContent(alert)}

          {/* Timestamp */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Detected at {new Date(alert.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              // Block or take action
              onDismiss();
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Block
          </button>
        </div>
      </div>
    </div>
  );
};

function renderAlertContent(alert: Alert): React.ReactNode {
  switch (alert.type) {
    case 'ALERT.RISK_DETECTED':
      const riskAlert = alert as any;
      return (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-red-900 mb-1">
              {riskAlert.ruleName}
            </h3>
            <p className="text-sm text-red-800">{riskAlert.description}</p>
          </div>

          {riskAlert.evidence && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase">Evidence</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 font-mono">
                {Object.entries(riskAlert.evidence).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-gray-500 capitalize">{key}:</span>
                    <span className="text-gray-900 break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'ALERT.CONTRACT_CHANGE':
      const contractAlert = alert as any;
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Contract <span className="font-mono font-semibold">{contractAlert.contract}</span> has been{' '}
            <span className="font-semibold">{contractAlert.changeType}</span>
          </p>
          {contractAlert.newOwner && (
            <div className="text-xs text-gray-600">
              New owner: <span className="font-mono">{contractAlert.newOwner}</span>
            </div>
          )}
        </div>
      );

    case 'ALERT.GAS_PREDICTION':
      const gasAlert = alert as any;
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Gas price is predicted to {gasAlert.trend === 'up' ? 'increase' : 'decrease'} by{' '}
            <span className="font-bold">{Math.abs(gasAlert.percent).toFixed(1)}%</span> in the next{' '}
            {gasAlert.horizon} minutes.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              {gasAlert.recommendedAction === 'wait' 
                ? '⏱️ Consider waiting for lower gas prices'
                : gasAlert.recommendedAction === 'submit-now'
                ? '✓ Good time to submit transaction'
                : '👁️ Continue monitoring gas prices'}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-sm text-gray-700">
          Alert detected. Please review the details carefully.
        </p>
      );
  }
}
