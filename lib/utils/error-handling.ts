import {
  DashboardData,
  FlareData,
  StockData,
  ComposedData,
  CorrelationData,
  DistributionData,
  DashboardStats,
  ForecastData,
  StockQuote,
  NASAFlareEvent,
} from '../api/types'

/**
 * Error logging context interface
 */
export interface ErrorContext {
  function?: string
  operation?: string
  provider?: string
  symbol?: string
  startDate?: string
  endDate?: string
  statusCode?: number
  [key: string]: any
}

/**
 * Log error with structured context
 * @param message - Error message
 * @param error - Error object
 * @param context - Additional context information
 */
export function logError(
  message: string,
  error: unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errorName = error instanceof Error ? error.name : 'Error'
  
  console.error(`[ErrorHandler] ${message}`, {
    error: errorMessage,
    errorName,
    timestamp: new Date().toISOString(),
    ...context,
  })
}

/**
 * Log warning with structured context
 * @param message - Warning message
 * @param context - Additional context information
 */
export function logWarning(
  message: string,
  context?: ErrorContext
): void {
  console.warn(`[Warning] ${message}`, {
    timestamp: new Date().toISOString(),
    ...context,
  })
}

/**
 * Log info with structured context
 * @param message - Info message
 * @param context - Additional context information
 */
export function logInfo(
  message: string,
  context?: ErrorContext
): void {
  console.log(`[Info] ${message}`, {
    timestamp: new Date().toISOString(),
    ...context,
  })
}

/**
 * Get empty dashboard data structure
 * Used as fallback when all data fetching fails
 */
export function getEmptyDashboardData(): DashboardData {
  return {
    composedData: [],
    correlationData: [],
    distributionData: [],
    heatmapData: [],
    stats: {
      avgFlare: 0,
      avgVolatility: 0,
      totalTrades: 0,
      correlation: 0,
      maxFlare: 0,
      maxVolatility: 0,
    },
  }
}

/**
 * Get empty flare data array
 * Used as fallback when NASA API fails
 */
export function getEmptyFlareData(): FlareData[] {
  return []
}

/**
 * Get empty stock data array
 * Used as fallback when stock API fails
 */
export function getEmptyStockData(): StockData[] {
  return []
}

/**
 * Get empty stock quotes array
 * Used as fallback when stock API fails
 */
export function getEmptyStockQuotes(): StockQuote[] {
  return []
}

/**
 * Get empty NASA flare events array
 * Used as fallback when NASA API fails
 */
export function getEmptyNASAFlareEvents(): NASAFlareEvent[] {
  return []
}

/**
 * Get empty composed data array
 * Used as fallback when data merging fails
 */
export function getEmptyComposedData(): ComposedData[] {
  return []
}

/**
 * Get empty correlation data array
 * Used as fallback when correlation calculation fails
 */
export function getEmptyCorrelationData(): CorrelationData[] {
  return []
}

/**
 * Get empty distribution data array
 * Used as fallback when distribution calculation fails
 */
export function getEmptyDistributionData(): DistributionData[] {
  return []
}

/**
 * Get empty dashboard stats
 * Used as fallback when statistics calculation fails
 */
export function getEmptyDashboardStats(): DashboardStats {
  return {
    avgFlare: 0,
    avgVolatility: 0,
    totalTrades: 0,
    correlation: 0,
    maxFlare: 0,
    maxVolatility: 0,
  }
}

/**
 * Get empty forecast data
 * Used as fallback when forecast calculation fails
 */
export function getEmptyForecastData(days: number = 7): ForecastData {
  return {
    forecastDays: days,
    avgPredictedVolatility: 0,
    avgPredictedFlare: 0,
    confidence: 0,
    trend: 'stable',
    predictions: [],
  }
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error && 'statusCode' in error) {
    return (error as any).statusCode === 429
  }
  return false
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    )
  }
  return false
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.'
  }
  
  if (isRateLimitError(error)) {
    return 'API rate limit exceeded. Please try again later.'
  }
  
  if (isNetworkError(error)) {
    return 'Network error occurred. Please check your connection.'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred.'
}
