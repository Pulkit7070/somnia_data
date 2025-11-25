import React, { useEffect, useState } from 'react';

export const Watchlist: React.FC = () => {
  const [contracts, setContracts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'UI.GET_STATUS' });
      if (response?.success) {
        setContracts(response.data.watchedContracts || []);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAddress) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'UI.ADD_WATCHLIST',
        payload: { address: newAddress, label: newLabel || newAddress }
      });
      setNewAddress('');
      setNewLabel('');
      setShowAddForm(false);
      await fetchWatchlist();
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add contract. Please check the address.');
    }
  };

  const handleRemove = async (address: string) => {
    if (!confirm('Remove this contract from watchlist?')) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'UI.REMOVE_WATCHLIST',
        payload: { address }
      });
      await fetchWatchlist();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-secondary transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-3 animate-slide-down">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contract Address *
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Label (optional)
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="My Contract"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newAddress}
            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Watchlist
          </button>
        </div>
      )}

      {/* Contract List */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">👁️</div>
          <p className="text-gray-600 mb-2">No contracts in watchlist</p>
          <p className="text-sm text-gray-500 mb-4">
            Add contracts to monitor for state changes, pauses, upgrades, and ownership transfers
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
          >
            Add Your First Contract
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((address) => (
            <div key={address} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📜</span>
                    <span className="text-sm font-semibold text-gray-900">Contract</span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 break-all">
                    {address}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(address)}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Active</span>
                </div>
                <div>Monitoring all events</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
