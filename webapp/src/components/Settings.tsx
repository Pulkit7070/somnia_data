'use client';

import { useState, useEffect } from 'react';

interface SettingsProps {
  address: string;
}

interface Settings {
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  autoBlock: boolean;
  notifications: {
    contractChanges: boolean;
    largeTransfers: boolean;
    gasPriceAlerts: boolean;
  };
  thresholds: {
    maxTransferAmount: string;
    minContractAge: number;
  };
}

export default function Settings({ address }: SettingsProps) {
  const [settings, setSettings] = useState<Settings>({
    riskTolerance: 'balanced',
    autoBlock: true,
    notifications: {
      contractChanges: true,
      largeTransfers: true,
      gasPriceAlerts: true,
    },
    thresholds: {
      maxTransferAmount: '1000',
      minContractAge: 7,
    },
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleNotification = (key: keyof Settings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
        <p className="text-sm text-text-secondary mt-1">
          Configure your security preferences and notification settings
        </p>
      </div>

      {/* Risk Management */}
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Risk Management</h3>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Risk Tolerance Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['conservative', 'balanced', 'aggressive'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSettings(prev => ({ ...prev, riskTolerance: level }))}
                className={`px-4 py-3 text-sm rounded-md border transition-colors capitalize ${
                  settings.riskTolerance === level
                    ? 'bg-blue-primary text-white border-blue-primary'
                    : 'bg-dark-surface text-text-primary border-dark-border hover:border-blue-primary'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {settings.riskTolerance === 'conservative' && 'Strictest security checks, blocks most risky transactions'}
            {settings.riskTolerance === 'balanced' && 'Balanced approach between security and flexibility'}
            {settings.riskTolerance === 'aggressive' && 'Minimal restrictions, allows most transactions with warnings'}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-text-primary">Auto-block risky transactions</span>
            <p className="text-xs text-text-tertiary">Automatically prevent high-risk transactions from executing</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoBlock: !prev.autoBlock }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoBlock ? 'bg-blue-primary' : 'bg-dark-hover'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoBlock ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Maximum Transfer Amount (ETH)
          </label>
          <input
            type="number"
            value={settings.thresholds.maxTransferAmount}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              thresholds: { ...prev.thresholds, maxTransferAmount: e.target.value }
            }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Minimum Contract Age (days)
          </label>
          <input
            type="number"
            value={settings.thresholds.minContractAge}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              thresholds: { ...prev.thresholds, minContractAge: parseInt(e.target.value) }
            }))}
            className="input-field"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>

        {[
          { key: 'contractChanges', label: 'Contract State Changes', desc: 'Get notified when watched contracts change state' },
          { key: 'largeTransfers', label: 'Large Transfers', desc: 'Alerts for transactions exceeding threshold' },
          { key: 'gasPriceAlerts', label: 'Gas Price Alerts', desc: 'Notifications when gas prices spike or drop' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-primary">{label}</span>
              <p className="text-xs text-text-tertiary">{desc}</p>
            </div>
            <button
              onClick={() => toggleNotification(key as keyof Settings['notifications'])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications[key as keyof Settings['notifications']] ? 'bg-blue-primary' : 'bg-dark-hover'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications[key as keyof Settings['notifications']] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* About */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-3">About</h3>
        <div className="text-sm text-text-secondary space-y-2">
          <p><strong className="text-text-primary">Version:</strong> 0.1.0</p>
          <p><strong className="text-text-primary">Connected Wallet:</strong> <code className="text-xs font-mono">{address}</code></p>
          <p><strong className="text-text-primary">Network:</strong> Somnia Testnet</p>
          <a 
            href="https://github.com/yourusername/smart-wallet-copilot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-primary hover:text-blue-hover inline-flex items-center gap-1"
          >
            View Documentation
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="btn-primary w-full"
      >
        {saved ? '✓ Saved Successfully' : 'Save Settings'}
      </button>
    </div>
  );
}
