'use client';

import { useState, useEffect } from 'react';
import { useBlockNumber, useBalance } from 'wagmi';
import { formatEther } from 'viem';

interface DashboardProps {
  address: string;
}

export default function Dashboard({ address }: DashboardProps) {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: balance } = useBalance({ address: address as `0x${string}` });
  const [stats, setStats] = useState({
    watchedContracts: 0,
    totalTransactions: 0,
    alertsTriggered: 0,
    blocked: 0,
  });

  useEffect(() => {
    // Load stats from localStorage
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      const watchlist = JSON.parse(savedWatchlist);
      setStats(prev => ({ ...prev, watchedContracts: watchlist.length }));
    }

    const savedHistory = localStorage.getItem('transactionHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setStats(prev => ({ ...prev, totalTransactions: history.length }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="status-dot status-online"></div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Connected</h3>
              <p className="text-xs text-text-secondary">{address}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">
              {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} {balance?.symbol || 'ETH'}
            </p>
            <p className="text-xs text-text-tertiary">Block #{blockNumber?.toString() || '...'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-text-secondary mb-1">Watched Contracts</p>
          <p className="text-3xl font-bold text-text-primary">{stats.watchedContracts}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-text-primary">{stats.totalTransactions}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary mb-1">Alerts Triggered</p>
          <p className="text-3xl font-bold text-status-warning">{stats.alertsTriggered}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary mb-1">Blocked</p>
          <p className="text-3xl font-bold text-status-error">{stats.blocked}</p>
        </div>
      </div>

      {/* Security Score */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Security Score</h3>
          <span className="text-sm text-text-secondary">Overall protection level</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold text-status-success">98</span>
              <span className="text-2xl text-text-secondary">/100</span>
            </div>
            <div className="w-full bg-dark-hover rounded-full h-3">
              <div className="bg-status-success h-3 rounded-full" style={{ width: '98%' }}></div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-status-success">Excellent</p>
            <p className="text-xs text-text-tertiary">Protection Active</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="card hover:bg-dark-hover transition-colors text-left">
          <svg className="w-8 h-8 text-blue-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <h4 className="font-semibold text-text-primary mb-1">Add Contract to Watchlist</h4>
          <p className="text-sm text-text-secondary">Monitor smart contract for changes</p>
        </button>

        <button className="card hover:bg-dark-hover transition-colors text-left">
          <svg className="w-8 h-8 text-blue-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h4 className="font-semibold text-text-primary mb-1">View Transaction History</h4>
          <p className="text-sm text-text-secondary">Analyze past transactions</p>
        </button>

        <button className="card hover:bg-dark-hover transition-colors text-left">
          <svg className="w-8 h-8 text-blue-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h4 className="font-semibold text-text-primary mb-1">Configure Settings</h4>
          <p className="text-sm text-text-secondary">Customize security preferences</p>
        </button>
      </div>
    </div>
  );
}
