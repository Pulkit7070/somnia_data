'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WatchlistProps {
  address: string;
}

interface WatchedContract {
  address: string;
  label: string;
  addedAt: number;
}

export default function Watchlist({ address }: WatchlistProps) {
  const [contracts, setContracts] = useState<WatchedContract[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = () => {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      setContracts(JSON.parse(saved));
    }
  };

  const handleAdd = () => {
    setError('');

    // Validate address
    if (!newAddress) {
      setError('Contract address is required');
      return;
    }

    if (!ethers.isAddress(newAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    // Check for duplicates
    if (contracts.some(c => c.address.toLowerCase() === newAddress.toLowerCase())) {
      setError('Contract already in watchlist');
      return;
    }

    const newContract: WatchedContract = {
      address: newAddress,
      label: newLabel || newAddress.slice(0, 10) + '...',
      addedAt: Date.now(),
    };

    const updated = [...contracts, newContract];
    setContracts(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));

    // Reset form
    setNewAddress('');
    setNewLabel('');
    setShowAddForm(false);
  };

  const handleRemove = (contractAddress: string) => {
    if (!confirm('Remove this contract from watchlist?')) return;

    const updated = contracts.filter(c => c.address !== contractAddress);
    setContracts(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Contract Watchlist</h2>
          <p className="text-sm text-text-secondary mt-1">
            Monitor smart contracts for state changes, upgrades, and ownership transfers
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Contract'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Add Contract to Watchlist</h3>
          
          {error && (
            <div className="bg-status-error/10 border border-status-error/30 text-status-error px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Contract Address *
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="0x..."
              className="input-field"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Enter the Ethereum address of the smart contract to monitor
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="My Token Contract"
              className="input-field"
            />
          </div>

          <button
            onClick={handleAdd}
            className="btn-primary w-full"
          >
            Add to Watchlist
          </button>
        </div>
      )}

      {/* Contract List */}
      {contracts.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Contracts in Watchlist</h3>
          <p className="text-text-secondary mb-4">
            Add contracts to monitor for state changes, pauses, upgrades, and ownership transfers
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add Your First Contract
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => (
            <div key={contract.address} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary mb-1">{contract.label}</h4>
                  <p className="text-xs font-mono text-text-secondary break-all">{contract.address}</p>
                </div>
                <button
                  onClick={() => handleRemove(contract.address)}
                  className="ml-2 p-1.5 text-text-tertiary hover:text-status-error transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-tertiary pt-3 border-t border-dark-border">
                <div className="status-dot status-online"></div>
                <span>Monitoring active</span>
              </div>

              <div className="mt-3 text-xs text-text-tertiary">
                Added {new Date(contract.addedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Test with Deployed Contracts */}
      {contracts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Test Contracts</h3>
          <p className="text-sm text-text-secondary mb-4">
            Use these deployed test contracts to verify the watchlist functionality:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-dark-bg rounded">
              <span className="text-text-secondary">TestToken:</span>
              <code className="text-xs text-text-primary font-mono">0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9</code>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-bg rounded">
              <span className="text-text-secondary">MaliciousContract:</span>
              <code className="text-xs text-text-primary font-mono">0x5FC8d32690cc91D4c39d9d3abcBD16989F875707</code>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-bg rounded">
              <span className="text-text-secondary">UpgradeableToken:</span>
              <code className="text-xs text-text-primary font-mono">0x0165878A594ca255338adfa4d48449f69242Eb8F</code>
            </div>
            <div className="flex items-center justify-between p-2 bg-dark-bg rounded">
              <span className="text-text-secondary">SimpleSwap:</span>
              <code className="text-xs text-text-primary font-mono">0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
