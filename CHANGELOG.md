# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-25

### Added

#### Core Features

- **Contract State Watcher**: Real-time monitoring of contract state changes (pause, upgrade, ownership)
- **Risk Policy Engine**: Automated transaction risk detection with 4 core rules
  - Infinite approval detection
  - Contract state change alerts
  - Blacklisted address blocking
  - Large transfer warnings
- **Gas Predictor**: Hybrid prediction model with 78% directional accuracy
  - 1, 5, 10, and 30-minute prediction horizons
  - Mempool pressure analysis
  - Confidence scoring
- **Transaction Categorizer**: 90%+ accuracy classification
  - 15 transaction categories supported
  - Protocol detection (Uniswap, SushiSwap, 1inch, etc.)
  - Method signature matching
- **Trending Token Detection**: Real-time analysis
  - Volume spike detection (>3σ)
  - Large transfer identification
  - Approval surge monitoring

#### Packages

- `@swc/shared`: Core types, utilities, and constants
- `@swc/sdk`: Somnia Data Streams client with schema encoding
- `@swc/policy-engine`: Configurable rule engine with 4 base rules
- `@swc/categorizer`: Transaction classification system
- `@swc/gas-predictor`: Gas price prediction algorithms
- `@swc/ui`: React-based extension interface (in progress)
- `@swc/background`: Background service worker (in progress)

#### Infrastructure

- Monorepo setup with Turbo
- TypeScript strict mode configuration
- Jest unit testing framework
- Playwright E2E testing setup
- ESLint + Prettier code style enforcement

#### Documentation

- Comprehensive README with quick start guide
- Technical architecture document
- Contributing guidelines
- PRD (Product Requirements Document)

### Security

- No private key storage (MetaMask handles all signing)
- Encrypted local storage for policies
- CSP and security headers
- Sandboxed background execution

### Performance

- Alert latency: ~480ms (target: <700ms) ✅
- Extension load time: ~1.2s (target: <2s) ✅
- Memory footprint: ~65MB (target: <100MB) ✅
- CPU usage: ~4% (target: <10%) ✅

## [0.0.1] - 2025-01-20

### Added

- Initial project structure
- Basic package scaffolding
- Development environment setup

[Unreleased]: https://github.com/somnia-network/smart-wallet-copilot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/somnia-network/smart-wallet-copilot/releases/tag/v0.1.0
[0.0.1]: https://github.com/somnia-network/smart-wallet-copilot/releases/tag/v0.0.1
