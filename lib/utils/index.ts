// Data transformation utilities
export { mergeDatasets } from './data-transform'

// Statistical utilities
export { 
  calculateAverage, 
  calculateMax, 
  calculateSum, 
  categorizeIntensity 
} from './statistics'

// Correlation utilities
export { calculateCorrelation } from './correlation'

// Error handling utilities
export {
  logError,
  logWarning,
  logInfo,
  getEmptyDashboardData,
  getEmptyFlareData,
  getEmptyStockData,
  getEmptyStockQuotes,
  getEmptyNASAFlareEvents,
  getEmptyComposedData,
  getEmptyCorrelationData,
  getEmptyDistributionData,
  getEmptyDashboardStats,
  getEmptyForecastData,
  isTimeoutError,
  isRateLimitError,
  isNetworkError,
  getUserFriendlyErrorMessage,
  type ErrorContext,
} from './error-handling'
