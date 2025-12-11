// Core API Response Types

export interface NASAFlareEvent {
  flrID: string
  beginTime: string
  peakTime: string
  endTime: string
  classType: string  // e.g., "M2.5", "X1.0"
  sourceLocation: string
  activeRegionNum: number
  linkedEvents: any[]
}

export interface FlareData {
  date: string
  flare: number
  class: string
  peakTime: string
  sourceRegion?: number
}

export interface StockQuote {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockData {
  date: string
  close: number
  volume: number
  volatility: number
  high?: number
  low?: number
  open?: number
}

// Composed and Processed Data Types

export interface ComposedData {
  date: string
  flare: number
  volatility: number
  trades: number
}

export interface CorrelationData {
  flare: number
  volatility: number
}

export interface DistributionData {
  range: string
  count: number
}

export interface DashboardStats {
  avgFlare: number
  avgVolatility: number
  totalTrades: number
  correlation: number
  maxFlare: number
  maxVolatility: number
}

export interface DashboardData {
  composedData: ComposedData[]
  correlationData: CorrelationData[]
  distributionData: DistributionData[]
  heatmapData: Array<ComposedData & { intensity: number }>
  stats: DashboardStats
}

// Forecast Data Types

export interface ForecastPrediction {
  date: string
  predictedFlare: number
  predictedVolatility: number
  confidenceInterval: [number, number]
}

export interface ForecastData {
  forecastDays: number
  avgPredictedVolatility: number
  avgPredictedFlare: number
  confidence: number
  trend: 'rising' | 'declining' | 'stable'
  predictions: ForecastPrediction[]
  keyPredictions?: {
    volatilityChange: string
    solarActivity: string
    riskWindow: string
  }
}

// API Client Configuration Types

export interface NASAClientConfig {
  apiKey: string
  baseUrl: string
  timeout: number
}

export interface StockClientConfig {
  provider: 'yahoo' | 'alphavantage' | 'finnhub'
  apiKey?: string
  timeout: number
}

// Error Types

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}
