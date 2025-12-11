# Implementation Plan

- [x] 1. Set up project structure and shared types





  - Create lib/api directory for API clients
  - Create lib/actions directory for server functions
  - Create lib/utils directory for utility functions
  - Define all TypeScript interfaces in lib/api/types.ts
  - Set up environment variables in .env.local
  - _Requirements: 7.1, 7.5_


- [x] 2. Implement NASA API client



- [x] 2.1 Create NASA API client class


  - Implement NASAClient class with configuration
  - Implement getFlareEvents method with date range parameters
  - Add proper error handling and logging
  - Implement request timeout handling
  - _Requirements: 2.1, 5.1_

- [ ]* 2.2 Write property test for NASA API request construction
  - **Property 2: NASA API request construction**
  - **Validates: Requirements 2.1**

- [x] 2.3 Implement NASA data transformation

  - Create transformFlareData method to parse raw NASA responses
  - Extract flare class, peak time, intensity, and source region
  - Normalize dates to YYYY-MM-DD format
  - Handle missing or malformed fields gracefully
  - _Requirements: 2.2, 2.3, 4.4_

- [ ]* 2.4 Write property test for NASA data transformation
  - **Property 3: NASA data transformation completeness**
  - **Validates: Requirements 2.2, 2.3**

- [ ]* 2.5 Write property test for date normalization
  - **Property 7: Date normalization consistency**
  - **Validates: Requirements 4.4**

- [x] 3. Implement Stock API client




- [x] 3.1 Create Stock API client class with multi-provider support


  - Implement StockClient class with provider configuration
  - Implement Yahoo Finance API integration
  - Add provider abstraction for future alternatives
  - Implement request timeout and error handling
  - _Requirements: 3.1, 3.4_

- [x] 3.2 Implement stock data extraction and volatility calculation

  - Create getStockData method to fetch OHLC data
  - Extract open, high, low, close, and volume
  - Implement calculateVolatility method using price variance
  - Ensure volatility is always non-negative
  - _Requirements: 3.2, 3.3_

- [ ]* 3.3 Write property test for volatility calculation
  - **Property 4: Stock data extraction and volatility calculation**
  - **Validates: Requirements 3.2, 3.3**

- [x] 3.4 Implement stock symbol validation

  - Create validateStockSymbol utility function
  - Check symbol format (uppercase letters, 1-5 characters)
  - Return validation errors for invalid symbols
  - _Requirements: 8.1, 8.4_

- [ ]* 3.5 Write property test for stock symbol validation
  - **Property 10: Stock symbol validation**
  - **Validates: Requirements 8.1, 8.4**

- [x] 3.6 Implement API fallback mechanism

  - Add Alpha Vantage API integration as fallback
  - Add Finnhub API integration as secondary fallback
  - Implement sequential fallback logic
  - _Requirements: 3.4_

- [ ]* 3.7 Write property test for API fallback
  - **Property 11: API fallback mechanism**
  - **Validates: Requirements 3.4**


- [x] 4. Implement data transformation and statistical utilities



- [x] 4.1 Create data merging utility


  - Implement mergeDatasets function to align by date
  - Preserve chronological order
  - Prevent duplicate date entries
  - Handle mismatched array lengths
  - _Requirements: 4.1, 4.3_

- [ ]* 4.2 Write property test for data merge
  - **Property 6: Data merge with temporal alignment**
  - **Validates: Requirements 4.1, 4.3**

- [x] 4.3 Implement correlation calculation


  - Create calculateCorrelation function
  - Compute Pearson correlation coefficient
  - Ensure result is between -1 and 1
  - Handle edge cases (empty arrays, single values)
  - _Requirements: 4.2, 9.4_

- [ ]* 4.4 Write property test for correlation bounds
  - **Property 8: Correlation coefficient mathematical bounds**
  - **Validates: Requirements 4.2, 9.4**

- [x] 4.5 Implement missing data handling


  - Add null/undefined/NaN filtering in correlation
  - Add missing data handling in merge operations
  - Ensure no exceptions thrown for incomplete data
  - _Requirements: 4.5_

- [ ]* 4.6 Write property test for incomplete data handling
  - **Property 9: Incomplete data handling**
  - **Validates: Requirements 4.5**

- [x] 4.7 Implement statistics calculation utilities


  - Create calculateAverage function
  - Create calculateMax function
  - Create calculateSum function
  - Ensure floating-point precision handling
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 4.8 Write property test for statistical calculations
  - **Property 15: Statistical calculation accuracy**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 4.9 Implement distribution categorization


  - Create categorizeIntensity function
  - Define ranges: Low (0-2), Medium (2-4), High (4-6), Extreme (6+)
  - Ensure every value maps to exactly one category
  - _Requirements: 9.5_

- [ ]* 4.10 Write property test for distribution categorization
  - **Property 16: Distribution categorization completeness**
  - **Validates: Requirements 9.5**


- [ ] 5. Implement error handling infrastructure



- [x] 5.1 Create APIError class and error utilities


  - Define APIError class with statusCode and provider fields
  - Create error logging utility with context
  - Implement getEmptyDataStructure fallback functions
  - _Requirements: 5.1, 5.2_

- [x] 5.2 Add comprehensive error handling to API clients


  - Wrap all API calls in try-catch blocks
  - Log errors with timestamps and context
  - Return empty arrays on failures
  - Handle network timeouts
  - Handle rate limiting (429 status codes)
  - _Requirements: 5.2, 5.3, 5.4_

- [ ]* 5.3 Write property test for API error handling
  - **Property 5: API error handling with empty returns**
  - **Validates: Requirements 2.4, 5.1, 5.2, 5.3**

- [ ]* 5.4 Write unit tests for error scenarios
  - Test network timeout handling
  - Test 404, 500, 429 status code handling
  - Test malformed JSON responses
  - Test empty response bodies
  - _Requirements: 5.2, 5.3, 5.4_


- [x] 6. Implement dashboard server function





- [x] 6.1 Create getDashboardData server function

  - Add 'use server' directive
  - Accept optional parameters (startDate, endDate, stockSymbol)
  - Implement parallel API calls using Promise.all
  - Merge NASA and stock data
  - Calculate all statistics (avg, max, correlation)
  - Generate distribution and heatmap data
  - Add Next.js caching with 1800s revalidation
  - _Requirements: 1.1, 1.2, 4.1, 6.1, 8.2_

- [ ]* 6.2 Write property test for server function type safety
  - **Property 1: Server function type safety**
  - **Validates: Requirements 1.2, 7.2**

- [ ]* 6.3 Write property test for optional parameter handling
  - **Property 18: Optional parameter handling**
  - **Validates: Requirements 8.2, 8.3**


- [-] 6.4 Implement parallel API call independence

  - Ensure NASA API failure doesn't block stock API
  - Ensure stock API failure doesn't block NASA API
  - Return partial data when one source fails
  - _Requirements: 5.3_

- [ ]* 6.5 Write unit test for parallel API independence
  - Test NASA failure with stock success
  - Test stock failure with NASA success
  - Test both failures

  - _Requirements: 5.3_

- [ ] 7. Implement caching and optimization

- [x] 7.1 Configure Next.js caching for server functions


  - Add unstable_cache wrapper to getDashboardData
  - Set revalidation period to 1800 seconds
  - Add cache tags for granular invalidation
  - _Requirements: 1.5, 6.1_

- [ ]* 7.2 Write property test for cache hit behavior
  - **Property 12: Cache hit behavior**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 7.3 Write property test for cache expiration
  - **Property 13: Cache expiration and refresh**
  - **Validates: Requirements 6.3**


- [x] 7.4 Implement request deduplication


  - Use React cache() for request deduplication
  - Ensure simultaneous requests share results
  - _Requirements: 6.4_

- [ ]* 7.5 Write property test for request deduplication
  - **Property 14: Request deduplication**
  - **Validates: Requirements 6.4**


- [x] 8. Implement additional server functions



- [x] 8.1 Create getForecastData server function


  - Add 'use server' directive
  - Accept optional days parameter
  - Implement basic forecast logic (trend analysis)
  - Add caching with 7200s revalidation
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 8.2 Create getAnalysisData server function


  - Add 'use server' directive
  - Reuse NASA and stock clients
  - Provide detailed analysis metrics
  - Add appropriate caching
  - _Requirements: 1.1, 1.2_

- [x] 8.3 Create getComparisonData server function


  - Add 'use server' directive
  - Support multiple stock symbols
  - Implement parallel fetching for multiple symbols
  - Preserve symbol order in results
  - _Requirements: 8.5_

- [ ]* 8.4 Write property test for parallel symbol fetching
  - **Property 17: Parallel symbol fetching order preservation**
  - **Validates: Requirements 8.5**

- [x] 8.5 Create getInsightsData server function


  - Add 'use server' directive
  - Generate AI-style insights from patterns
  - Add caching
  - _Requirements: 1.1, 1.2_

- [x] 8.6 Create getSimulatorData server function


  - Add 'use server' directive
  - Implement scenario simulation logic
  - Add caching
  - _Requirements: 1.1, 1.2_


- [x] 9. Update dashboard components to use server functions


- [x] 9.1 Update modern-dashboard.tsx


  - Remove fetch('/api/dashboard-data') call
  - Import and call getDashboardData() directly
  - Remove HTTP error handling (use function errors)
  - Update loading and error states
  - _Requirements: 1.4_



- [x] 9.2 Update forecast-dashboard.tsx
  - Import and call getForecastData() directly
  - Remove API route dependency
  - _Requirements: 1.4_

- [x] 9.3 Update analysis-dashboard.tsx
  - Import and call getAnalysisData() directly
  - Remove API route dependency
  - _Requirements: 1.4_



- [x] 9.4 Update comparison-dashboard.tsx
  - Import and call getComparisonData() directly
  - Remove API route dependency
  - _Requirements: 1.4_

- [x] 9.5 Update insights-dashboard.tsx
  - Import and call getInsightsData() directly
  - Remove API route dependency
  - _Requirements: 1.4_

- [x] 9.6 Update simulator-dashboard.tsx

  - Import and call getSimulatorData() directly
  - Remove API route dependency
  - _Requirements: 1.4_

- [ ] 10. Remove old API routes
- [ ] 10.1 Delete app/api/dashboard-data/route.ts
  - Verify no components still reference this route
  - Delete the file
  - _Requirements: 1.1_

- [ ] 10.2 Delete app/api/forecast-data/route.ts
  - Verify no components still reference this route
  - Delete the file
  - _Requirements: 1.1_

- [ ] 10.3 Delete app/api/analysis-data/route.ts
  - Verify no components still reference this route
  - Delete the file
  - _Requirements: 1.1_

- [ ] 10.4 Delete app/api/comparison-data/route.ts
  - Verify no components still reference this route
  - Delete the file
  - _Requirements: 1.1_

- [ ] 10.5 Delete app/api/insights-data/route.ts
  - Verify no components still reference this route
  - Delete the file
  - _Requirements: 1.1_

- [ ] 10.6 Delete app/api/simulator-data/route.ts
  - Verify no components still reference this route
  - Delete the file
  - _Requirements: 1.1_

- [ ]* 11. Set up testing infrastructure
- [ ]* 11.1 Install testing dependencies
  - Install vitest for unit testing
  - Install fast-check for property-based testing
  - Install @testing-library/react for component testing
  - Install msw for API mocking
  - Configure vitest.config.ts
  - _Requirements: Testing Strategy_

- [ ]* 11.2 Create test utilities and fixtures
  - Create mock NASA API responses
  - Create mock stock API responses
  - Create MSW handlers for external APIs
  - Create test data generators
  - _Requirements: Testing Strategy_

- [ ]* 11.3 Write property test for data validation
  - **Property 19: Data validation for unexpected formats**
  - **Validates: Requirements 7.4**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Documentation and final polish
- [ ]* 13.1 Add JSDoc comments to all public functions
  - Document parameters and return types
  - Add usage examples
  - Document error conditions
  - _Requirements: 7.1_

- [x]* 13.2 Create README for lib/actions



  - Document all server functions
  - Provide usage examples
  - Document caching behavior
  - _Requirements: 1.1_

- [ ]* 13.3 Add inline code comments for complex logic
  - Comment correlation calculation
  - Comment volatility calculation
  - Comment data merging logic
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
