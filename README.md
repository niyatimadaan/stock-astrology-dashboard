# 🌟 Stock Astrology Dashboard

A comprehensive Next.js dashboard that analyzes correlations between solar flare activity and stock market volatility. This innovative application combines real-time data from NASA's solar flare monitoring systems with financial market data to identify patterns and predict market movements based on cosmic events.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=flat-square&logo=tailwind-css)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Dashboards](#dashboards)
- [API Integration](#api-integration)
- [Configuration](#configuration)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ Features

### 📊 Multiple Interactive Dashboards

- **Overview Dashboard**: Comprehensive view of solar activity, market volatility, correlation metrics, and trading volumes
- **Analysis Dashboard**: Deep dive into correlation analysis with lag patterns, rolling window analysis, and dynamic confidence metrics
- **Comparison Dashboard**: Multi-stock comparison across AAPL, TSLA, GOOGL, BTC, and NIFTY 50 with volatility tracking
- **Forecast Dashboard**: 7-day predictive analytics using ARIMA models with confidence intervals
- **Insights Dashboard**: AI-powered pattern recognition and trading recommendations
- **Simulator Dashboard**: Scenario-based simulations (Baseline, High Solar, Low Solar, Extreme Event)

### 🔬 Advanced Analytics

- **Correlation Analysis**: Pearson correlation calculation between solar flares and stock volatility
- **Lag Analysis**: Identifies optimal time delays between solar events and market reactions (0-10 days)
- **Rolling Window Analysis**: Dynamic correlation tracking with adjustable window sizes (3-10 days)
- **Time Series Forecasting**: Exponential decay models with trend analysis
- **Scenario Simulation**: Multi-scenario modeling with different solar activity levels

### 🌐 Real-Time Data Integration

- **NASA DONKI API**: Real-time solar flare event data with classification (X, M, C class)
- **Yahoo Finance API**: Primary stock data provider with automatic fallback
- **Multi-Provider Support**: Backup providers (Alpha Vantage, Finnhub) for reliability
- **International Markets**: Support for US stocks, cryptocurrency, and global indices

### 🎨 Modern UI/UX

- **Dark/Light Mode**: Theme switching with system preference detection
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Charts**: Recharts integration for dynamic data visualization
- **Tooltips & Info Icons**: Contextual help throughout the interface
- **Loading States**: Skeleton screens and spinners for better UX

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Server Actions**: Next.js Server Actions
- **Caching**: React Cache + Next.js unstable_cache
- **Data Fetching**: Native fetch API with fallback mechanisms

### APIs & Data Sources
- **NASA DONKI API**: Solar flare event data
- **Yahoo Finance**: Stock market data (primary)
- **Alpha Vantage**: Stock data (fallback)
- **Finnhub**: Stock data (fallback)

### Development Tools
- **Testing**: Vitest
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: pnpm

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager (or npm/yarn)
- API keys for stock data providers (optional for basic functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/niyatimadaan/stock-astrology-dashboard.git
   cd stock-astrology-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Optional: Stock API providers (Yahoo Finance works without keys)
   ALPHA_VANTAGE_API_KEY=your_key_here
   FINNHUB_API_KEY=your_key_here
   
   # Stock API Configuration
   STOCK_API_PROVIDER=yahoo  # Options: yahoo, alphavantage, finnhub
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
stock-astrology-dashboard/
├── app/                          # Next.js App Router
│   ├── api/                     # API route handlers
│   │   ├── comparison-data/    # Comparison data endpoint
│   │   └── dashboard-data/     # Dashboard data endpoint
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Home page with dashboard tabs
│   └── globals.css             # Global styles
├── components/
│   ├── dashboards/             # Dashboard components
│   │   ├── analysis-dashboard.tsx
│   │   ├── comparison-dashboard.tsx
│   │   ├── forecast-dashboard.tsx
│   │   ├── insights-dashboard.tsx
│   │   ├── modern-dashboard.tsx
│   │   ├── overview-dashboard.tsx
│   │   └── simulator-dashboard.tsx
│   ├── ui/                     # Reusable UI components (shadcn/ui)
│   ├── sidebar.tsx             # Navigation sidebar
│   └── theme-provider.tsx      # Theme context provider
├── lib/
│   ├── actions/                # Server actions
│   │   ├── analysis.ts         # Analysis data fetching
│   │   ├── comparison.ts       # Multi-stock comparison
│   │   ├── dashboard.ts        # Dashboard data
│   │   ├── forecast.ts         # Forecasting logic
│   │   ├── insights.ts         # Pattern insights
│   │   └── simulator.ts        # Scenario simulation
│   ├── api/                    # API clients
│   │   ├── nasa.ts            # NASA DONKI API client
│   │   ├── stock.ts           # Stock API client (multi-provider)
│   │   └── types.ts           # TypeScript interfaces
│   └── utils/                  # Utility functions
│       ├── correlation.ts      # Correlation calculations
│       ├── data-transform.ts   # Data transformation
│       ├── error-handling.ts   # Error logging
│       ├── statistics.ts       # Statistical functions
│       └── __tests__/         # Unit tests
├── hooks/                      # Custom React hooks
├── public/                     # Static assets
├── styles/                     # Additional styles
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── vitest.config.ts
```

## 📊 Dashboards

### 1. Overview Dashboard
Provides a high-level view of current solar activity and market conditions with:
- Latest flare intensity and classification
- Peak volatility metrics
- Correlation coefficients
- Trading volume analytics
- Activity composition charts (flares, volatility, volume)

### 2. Analysis Dashboard
Advanced correlation analysis featuring:
- **Best Lag Detection**: Identifies optimal delay (0-10 days) between solar events and market reactions
- **Lag Confidence**: Statistical confidence in correlation patterns
- **Rolling Window Analysis**: Adjustable 3-10 day correlation windows
- **Dynamic Insights**: Auto-generated observations based on actual data patterns

### 3. Comparison Dashboard
Multi-asset comparison tool:
- **Supported Assets**: AAPL, TSLA, GOOGL, BTC-USD, NIFTY 50
- **Volatility Tracking**: Real-time volatility comparison across assets
- **Time Series Charts**: Historical volatility patterns
- **Key Observations**: Dynamic insights on most/least volatile assets
- **Asset Descriptions**: Detailed tooltips for each tracked asset

### 4. Forecast Dashboard
Predictive analytics with:
- **7-Day Forecasts**: Exponential decay models with trend analysis
- **Confidence Intervals**: Decreasing confidence for longer-term predictions
- **Dynamic Predictions**: Key insights based on actual forecast data
- **Model Details**: ARIMA methodology and accuracy metrics

### 5. Insights Dashboard
Pattern recognition and recommendations:
- AI-generated trading insights
- Risk assessment based on solar activity
- Historical pattern analysis
- Actionable trading recommendations

### 6. Simulator Dashboard
Scenario-based simulation tool:
- **Baseline Scenario**: Normal solar activity (flare 0.5-2)
- **High Solar**: Elevated activity (flare 5-8)
- **Low Solar**: Quiet period (flare 2-5)
- **Extreme Event**: X-class flares (flare 8-10)
- **14-Day Projections**: Volatility and volume forecasts
- **Model Assumptions**: Scenario-specific parameters

## 🔌 API Integration

### NASA DONKI API
- **Endpoint**: `https://api.nasa.gov/DONKI/FLR`
- **Rate Limit**: 1000 requests/hour (no API key required)
- **Data**: Solar flare events with class, intensity, and timestamps
- **Caching**: 30-minute revalidation

### Stock APIs

#### Yahoo Finance (Primary)
- No API key required
- Real-time stock data
- Support for stocks, crypto, and indices
- Symbol format: `AAPL`, `BTC-USD`, `^NSEI`

#### Alpha Vantage (Fallback)
- Free tier: 5 API requests/minute, 500/day
- Requires API key
- Premium features available

#### Finnhub (Fallback)
- Free tier: 60 API calls/minute
- Requires API key
- Additional market data available

### Multi-Provider Configuration

```typescript
// lib/api/stock.ts
const config = {
  provider: process.env.STOCK_API_PROVIDER || 'yahoo',
  alphavantageKey: process.env.ALPHA_VANTAGE_API_KEY,
  finnhubKey: process.env.FINNHUB_API_KEY,
}
```

## ⚙️ Configuration

### Environment Variables

```env
# Stock API Provider (yahoo, alphavantage, finnhub)
STOCK_API_PROVIDER=yahoo

# Alpha Vantage API Key (optional)
ALPHA_VANTAGE_API_KEY=your_key_here

# Finnhub API Key (optional)
FINNHUB_API_KEY=your_key_here

# Node Environment
NODE_ENV=development
```

### Caching Strategy

- **Server Actions**: React `cache()` for request deduplication
- **Persistent Cache**: Next.js `unstable_cache()` with configurable revalidation
- **Default TTL**: 30 minutes for most data, 2 hours for forecasts

### Symbol Validation

```typescript
// Supported symbol formats:
// - US Stocks: AAPL, GOOGL, TSLA
// - Crypto: BTC-USD, ETH-USD
// - Indices: ^NSEI, ^DJI, ^GSPC
// - International: Valid symbols 1-10 characters with ^, -, .
```

## 🧪 Testing

Run the test suite:

```bash
pnpm test
# or
npm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Test coverage:

```bash
pnpm test:coverage
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use semantic commit messages
- Update documentation for new features
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NASA DONKI API** for providing free access to solar flare data
- **shadcn/ui** for beautiful UI components
- **Recharts** for powerful charting capabilities
- **Yahoo Finance** for reliable stock market data

## 📧 Contact

Niyati Madaan - [@niyatimadaan](https://github.com/niyatimadaan)

Project Link: [https://github.com/niyatimadaan/stock-astrology-dashboard](https://github.com/niyatimadaan/stock-astrology-dashboard)

---

**Note**: This project is for educational and research purposes. Solar activity correlation with stock markets is a theoretical concept and should not be used as the sole basis for investment decisions.
