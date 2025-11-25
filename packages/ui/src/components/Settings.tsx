import React, { useEffect, useState } from 'react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    riskTolerance: 'balanced',
    autoBlock: true,
    notifications: {
      contractChanges: true,
      largeTransfers: true,
      gasPriceAlerts: true,
      trendingTokens: false,
    },
    thresholds: {
      maxTransferAmount: '1000',
      minContractAge: 7,
      gasLimitWarning: 500000,
    },
    telemetry: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'UI.GET_SETTINGS' });
      if (response?.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await chrome.runtime.sendMessage({
        type: 'UI.UPDATE_SETTINGS',
        payload: { settings }
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
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
    <div className="space-y-4 pb-24">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>

      {/* Risk Management */}
      <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          🛡️ Risk Management
        </h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Risk Tolerance
          </label>
          <div className="flex gap-2">
            {['conservative', 'balanced', 'aggressive'].map((level) => (
              <button
                key={level}
                onClick={() => setSettings({ ...settings, riskTolerance: level })}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors capitalize ${
                  settings.riskTolerance === level
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-brand-primary'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Auto-block risky transactions</span>
          <button
            onClick={() => setSettings({ ...settings, autoBlock: !settings.autoBlock })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoBlock ? 'bg-brand-primary' : 'bg-gray-300'
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Max Transfer Amount (ETH)
          </label>
          <input
            type="number"
            value={settings.thresholds?.maxTransferAmount || 1000}
            onChange={(e) => setSettings({
              ...settings,
              thresholds: { ...settings.thresholds, maxTransferAmount: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Minimum Contract Age (days)
          </label>
          <input
            type="number"
            value={settings.thresholds?.minContractAge || 7}
            onChange={(e) => setSettings({
              ...settings,
              thresholds: { ...settings.thresholds, minContractAge: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          🔔 Notifications
        </h3>

        {[
          { key: 'contractChanges', label: 'Contract state changes' },
          { key: 'largeTransfers', label: 'Large transfers' },
          { key: 'gasPriceAlerts', label: 'Gas price alerts' },
          { key: 'trendingTokens', label: 'Trending tokens' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <button
              onClick={() => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
                  [key]: !settings.notifications?.[key]
                }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications?.[key] ? 'bg-brand-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications?.[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Telemetry */}
      <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          📊 Telemetry
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-sm text-gray-700 block">Share anonymous usage data</span>
            <span className="text-xs text-gray-500">Helps improve prediction accuracy</span>
          </div>
          <button
            onClick={() => setSettings({ ...settings, telemetry: !settings.telemetry })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.telemetry ? 'bg-brand-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.telemetry ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Version: 0.1.0</div>
          <div>Smart Wallet Copilot for Somnia</div>
          <a 
            href="https://github.com/yourusername/smart-wallet-copilot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary hover:underline inline-flex items-center gap-1"
          >
            Documentation
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
