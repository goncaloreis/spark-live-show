# Component Documentation

## Component Overview

All components in this directory are production-ready and follow best practices for React + TypeScript development.

### Card Components

#### **KPICard**
Displays a single key performance indicator with optional change indicator.
- **Props**: `label`, `value`, `change` (optional), `suffix` (optional), `valueColor` (optional)
- **Usage**: Best for displaying simple metrics like points, rank, etc.

#### **ProjectionCard**
Displays airdrop projections with conservative/moderate/optimistic variants.
- **Props**: `label`, `value`, `badge`, `variant`
- **Variants**: `conservative` | `moderate` | `optimistic`

#### **MetricRowCard**
Displays two related metrics side by side with change indicators.
- **Props**: `leftLabel`, `leftValue`, `leftChange`, `rightLabel`, `rightValue`, `rightChange`, `leftSuffix`, `rightSuffix`
- **Usage**: Best for comparing two related metrics

#### **PaceStatusCard**
Shows whether wallet is outpacing, trailing, or keeping pace with total pool.
- **Props**: `poolShareChange` (numeric value)
- **Logic**: Uses threshold of 0.0001 to determine status

#### **LiveSPKCard**
Displays live SPK price with pulsing indicator.
- **Props**: `spkPrice` (number | null)
- **Behavior**: Auto-hides if price is null

#### **StatsCard** (Legacy)
Legacy component - consider refactoring to use newer card components.

### Chart Components

#### **CombinedChart**
Dual-axis chart showing points (area) and rank (line) over time.
- **Props**: `data` (HistoryDataPoint[]), `loading` (optional)
- **Features**: 
  - Auto-scaling Y-axes
  - Inverted rank display (higher = better)
  - Responsive design
  - Custom tooltip

### Design System

All components use the semantic token system from `index.css`:
- **Never use**: `text-white`, `bg-black`, direct color values
- **Always use**: `text-foreground`, `bg-background`, `text-primary`, etc.
- **Gradients**: Use CSS variables like `var(--gradient-mesh)`

### Best Practices

1. **Type Safety**: All props are fully typed with TypeScript interfaces
2. **Accessibility**: Proper ARIA labels and semantic HTML
3. **Performance**: Memoization where appropriate, minimal re-renders
4. **Responsive**: Mobile-first design with Tailwind breakpoints
5. **Animation**: Smooth transitions with Tailwind animate utilities
