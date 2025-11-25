'use client';

import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dashboard from '@/components/Dashboard';
import Watchlist from '@/components/Watchlist';
import History from '@/components/History';
import Settings from '@/components/Settings';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchlist' | 'history' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">Smart Wallet Copilot</h1>
                <p className="text-xs text-text-secondary">Somnia Network</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'watchlist', label: 'Watchlist' },
                { id: 'history', label: 'History' },
                { id: 'settings', label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-dark-hover text-blue-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Wallet Connect */}
            <div className="flex items-center gap-3">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-dark-border">
          <div className="flex">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'watchlist', label: 'Watchlist' },
              { id: 'history', label: 'History' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-3 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-primary text-blue-primary'
                    : 'border-transparent text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="card text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
              <p className="text-text-secondary mb-6">
                Connect your wallet to start monitoring smart contracts and analyzing transactions on Somnia Network
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard address={address!} />}
            {activeTab === 'watchlist' && <Watchlist address={address!} />}
            {activeTab === 'history' && <History address={address!} />}
            {activeTab === 'settings' && <Settings address={address!} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark-surface border-t border-dark-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-text-tertiary">
            <p>Smart Wallet Copilot v0.1.0 - Built for Somnia Network</p>
            <p className="mt-1">AI-powered blockchain security and transaction analysis</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
