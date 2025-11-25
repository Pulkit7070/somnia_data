# Smart Wallet Copilot - UI/UX Design Specification

## Design Philosophy

**Principles:**

- **Clarity First:** Risk information must be immediately understandable
- **Non-Intrusive:** Alerts appear only when necessary
- **Action-Oriented:** Every alert provides clear next steps
- **Trust Through Transparency:** Show evidence and reasoning
- **Professional Aesthetic:** Modern, clean, trustworthy

## Color System

### Brand Colors

```
Primary: #6366F1 (Indigo)
Secondary: #8B5CF6 (Purple)
Accent: #EC4899 (Pink)
```

### Risk Level Colors

```
Critical: #DC2626 (Red-600)
High: #EA580C (Orange-600)
Medium: #F59E0B (Amber-500)
Low: #10B981 (Green-500)
Info: #3B82F6 (Blue-500)
```

### Neutral Colors

```
Background: #F9FAFB (Gray-50)
Surface: #FFFFFF (White)
Border: #E5E7EB (Gray-200)
Text Primary: #111827 (Gray-900)
Text Secondary: #6B7280 (Gray-500)
```

## Typography

```
Font Family: 'Inter', system-ui, sans-serif
Headings: 600 weight (Semi-bold)
Body: 400 weight (Regular)
Emphasis: 500 weight (Medium)
```

### Scale

```
h1: 24px / 1.5 line height
h2: 20px / 1.4 line height
h3: 18px / 1.4 line height
body: 14px / 1.5 line height
small: 12px / 1.4 line height
```

## Component Designs

### 1. Alert Modal

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Critical Risk Detected                       [×]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Infinite Approval to Unknown Contract           ┃  │
│  ┃                                                   ┃  │
│  ┃  You are about to approve UNLIMITED spending     ┃  │
│  ┃  to an unverified contract. This could allow     ┃  │
│  ┃  the contract to steal all your tokens.          ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                         │
│  📋 Evidence                                           │
│  ─────────────────────────────────────────────────────  │
│  Contract: 0x742d35...f0bEb                            │
│  Amount: ∞ (2²⁵⁶ - 1)                                 │
│  Verified: ❌ No                                        │
│  Age: 2 days                                           │
│                                                         │
│  💡 Recommendation                                     │
│  ─────────────────────────────────────────────────────  │
│  Approve a specific amount instead of unlimited.       │
│  Or verify the contract source code before approving.  │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🔍 Details  │  │ ⛔ Block Tx   │  │ ⚠️ Override  │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  Override requires manual confirmation                  │
│  [ ] I understand the risks and want to proceed        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**

- Appears as overlay (z-index 9999)
- Backdrop blur + dim (rgba(0,0,0,0.5))
- Animation: Fade in + slide down (200ms)
- Auto-focus on primary action button
- Escape key to dismiss (if not critical)
- Click outside to dismiss (if not critical)

### 2. Gas Prediction Badge

```
┌──────────────────────────────────────┐
│  ⛽ Gas Prediction                   │
│  ────────────────────────────────    │
│  Current: 25 Gwei                    │
│  5min: 28.5 Gwei ▲ 14%              │
│  Confidence: ████████░░ 85%          │
│                                      │
│  💡 Wait 5 minutes to save ~$0.50   │
│                                      │
│  [Submit Now]  [Wait]  [Dismiss]    │
└──────────────────────────────────────┘
```

**Placement:** Top-right of MetaMask popup
**Animation:** Slide in from right (300ms)

### 3. Transaction History Item

```
┌─────────────────────────────────────────────────────────┐
│ 🔄 Token Swap                              2 mins ago   │
│ ─────────────────────────────────────────────────────    │
│ 1000 USDC → 0.045 ETH                                   │
│ Via: Uniswap V3                                         │
│ Fee: $2.50 (18 Gwei)                                    │
│                                                         │
│ [View on Explorer] [Add to Notes]                      │
└─────────────────────────────────────────────────────────┘
```

### 4. Watchlist Entry

```
┌─────────────────────────────────────────────────────────┐
│ 📜 SomniaSwap Router                           [Edit]   │
│ ─────────────────────────────────────────────────────    │
│ 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb             │
│                                                         │
│ Status: ✅ Active    Last Event: 5 mins ago            │
│ Events: 142 today   Risk: 🟢 Low                       │
│                                                         │
│ Alerts: Ownership change, Pause/Unpause, Upgrade      │
│                                                         │
│ [Remove]  [Configure Alerts]                           │
└─────────────────────────────────────────────────────────┘
```

### 5. Settings Panel

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🛡️ Risk Management                                     │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ Risk Tolerance                                          │
│ ○ Conservative  ● Balanced  ○ Aggressive               │
│                                                         │
│ Auto-Block Risky Transactions                          │
│ [●] Enabled                                             │
│                                                         │
│ Thresholds                                              │
│ Max Transfer Amount: [1000] ETH                        │
│ Min Contract Age: [7] days                             │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ 🔔 Notifications                                        │
│ ─────────────────────────────────────────────────────   │
│ [●] Contract state changes                              │
│ [●] Large transfers                                     │
│ [●] Gas price alerts                                    │
│ [ ] Trending tokens                                     │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ 📊 Telemetry                                            │
│ ─────────────────────────────────────────────────────   │
│ [ ] Share anonymous usage data                          │
│                                                         │
│ Helps improve prediction accuracy and features.        │
│ No personal information is collected.                   │
│                                                         │
│ [Learn More]                                            │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│         [Reset to Defaults]    [Save Changes]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6. Dashboard (Extension Popup)

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 Smart Wallet Copilot                        [⚙️] [?] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Status: ● Connected to Somnia                          │
│ Account: 0x1234...5678                                 │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ 📊 Today's Activity                                    │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│ │    12    │  │     3    │  │     0    │              │
│ │   Txs    │  │  Alerts  │  │ Blocked  │              │
│ └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ ⛽ Gas Trend (24h)                                     │
│                                                         │
│  50│       ╱╲                                          │
│  40│      ╱  ╲      ╱╲                                │
│  30│  ╱╲╱    ╲    ╱  ╲                                │
│  20│╱         ╲╱╱     ╲─                              │
│   0└────────────────────────────                       │
│     Now   6h   12h  18h  24h                           │
│                                                         │
│ Current: 28 Gwei  Trend: ▼ Decreasing                 │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ 🔥 Trending on Somnia                                  │
│ 1. $STT   ▲ 127% vol      [Watch]                     │
│ 2. $GAME  ▲ 84% vol       [Watch]                     │
│ 3. $NFT   ▲ 56% vol       [Watch]                     │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ [📝 History] [👁️ Watchlist] [🛡️ Security]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7. Notification Toast

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Contract Paused                            [×]      │
│ ─────────────────────────────────────────────────────    │
│ SomniaSwap router was paused 10s ago                   │
│ [View Details]                                          │
└─────────────────────────────────────────────────────────┘
```

**Placement:** Bottom-right corner
**Duration:** 5 seconds (auto-dismiss)
**Animation:** Slide up from bottom

## Interaction Patterns

### Alert Priority System

**Critical (Red):**

- Full-screen modal
- Blocks interaction
- Requires explicit override
- Sound alert (optional)

**High (Orange):**

- Modal overlay
- Dismissible
- Logged to history

**Medium (Yellow):**

- Notification toast
- Auto-dismiss after 5s
- Logged to history

**Low (Green):**

- In-page badge
- Non-intrusive
- Optional viewing

**Info (Blue):**

- Passive indicator
- Expandable details

### Button States

**Primary Action:**

```
Normal:    [bg-indigo-600 text-white]
Hover:     [bg-indigo-700]
Active:    [bg-indigo-800]
Disabled:  [bg-gray-300 text-gray-500 cursor-not-allowed]
```

**Secondary Action:**

```
Normal:    [border-2 border-indigo-600 text-indigo-600]
Hover:     [bg-indigo-50]
Active:    [bg-indigo-100]
```

**Danger Action:**

```
Normal:    [bg-red-600 text-white]
Hover:     [bg-red-700]
Active:    [bg-red-800]
```

## Responsive Design

### Extension Popup

- Width: 380px (fixed)
- Height: 600px (scrollable)
- Min-width: 320px
- Max-height: 800px

### In-Page Overlay

- Desktop: 400px width, right-aligned
- Mobile: Full-screen modal

## Accessibility

### WCAG 2.1 AA Compliance

- **Color Contrast:** All text ≥ 4.5:1 ratio
- **Focus Indicators:** 2px solid outline on focus
- **Keyboard Navigation:** All interactive elements accessible
- **Screen Readers:** ARIA labels on all icons
- **Reduced Motion:** Respect `prefers-reduced-motion`

### ARIA Patterns

```html
<div role="dialog" aria-labelledby="alert-title" aria-describedby="alert-desc">
  <h2 id="alert-title">Risk Detected</h2>
  <p id="alert-desc">Description of the risk...</p>
</div>
```

## Animation Specifications

### Alert Modal

```
Entry:
  - Opacity: 0 → 1 (200ms ease-out)
  - Transform: translateY(-20px) → translateY(0)

Exit:
  - Opacity: 1 → 0 (150ms ease-in)
  - Transform: scale(1) → scale(0.95)
```

### Toast Notification

```
Entry:
  - Opacity: 0 → 1 (300ms ease-out)
  - Transform: translateY(100%) → translateY(0)

Exit:
  - Opacity: 1 → 0 (200ms ease-in)
  - Transform: translateX(0) → translateX(100%)
```

### Loading States

```
Spinner: Rotate 360deg, 1s linear infinite
Skeleton: Pulse opacity 0.5 → 1, 1.5s ease-in-out infinite
```

## Dark Mode

### Color Overrides

```
Background: #111827 (Gray-900)
Surface: #1F2937 (Gray-800)
Border: #374151 (Gray-700)
Text Primary: #F9FAFB (Gray-50)
Text Secondary: #9CA3AF (Gray-400)
```

### Auto-Detection

Respect system preference: `prefers-color-scheme: dark`

## Icons

**Library:** Heroicons v2 (Outline style)

**Common Icons:**

- ⚠️ Alert: `ExclamationTriangleIcon`
- ✅ Success: `CheckCircleIcon`
- ❌ Error: `XCircleIcon`
- ⚙️ Settings: `CogIcon`
- 🔍 Details: `MagnifyingGlassIcon`
- 📊 Stats: `ChartBarIcon`
- 🛡️ Security: `ShieldCheckIcon`

## Implementation Notes

### Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#6366F1",
          secondary: "#8B5CF6",
          accent: "#EC4899",
        },
        risk: {
          critical: "#DC2626",
          high: "#EA580C",
          medium: "#F59E0B",
          low: "#10B981",
          info: "#3B82F6",
        },
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
      },
    },
  },
};
```

### CSS Variables

```css
:root {
  --swc-primary: #6366f1;
  --swc-critical: #dc2626;
  --swc-transition: 200ms ease-out;
  --swc-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  --swc-radius: 12px;
}
```

---

**Design System Version:** 1.0  
**Last Updated:** 2025-01-25  
**Figma:** [Link to mockups when available]
