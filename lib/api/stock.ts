import { StockClientConfig, StockQuote, StockData, APIError } from './types'
import { logError, logWarning, logInfo, getEmptyStockQuotes } from '../utils/error-handling'

/**
 * Stock API Client with multi-provider support
 * Supports Yahoo Finance, Alpha Vantage, and Finnhub with automatic fallback
 */
export class StockClient {
  private config: StockClientConfig

  constructor(config?: Partial<StockClientConfig>) {
    // Default configuration with environment variable fallbacks
    const defaultProvider = (process.env.STOCK_API_PROVIDER as 'yahoo' | 'alphavantage' | 'finnhub') || 'yahoo'
    
    this.config = {
      provider: config?.provider || defaultProvider,
      apiKey: config?.apiKey || process.env.STOCK_API_KEY,
      timeout: config?.timeout || 10000, // 10 seconds default
    }
  }

  /**
   * Validate stock symbol format
   * @param symbol - Stock symbol to validate
   * @returns Validation result with error message if invalid
   */
  validateStockSymbol(symbol: string): { valid: boolean; error?: string } {
    if (!symbol || typeof symbol !== 'string') {
      return { valid: false, error: 'Symbol must be a non-empty string' }
    }

    // Trim whitespace
    const trimmedSymbol = symbol.trim()

    // Check length (1-10 characters to allow for symbols like BTC-USD, ^NSEI)
    if (trimmedSymbol.length < 1 || trimmedSymbol.length > 10) {
      return { valid: false, error: 'Symbol must be 1-10 characters long' }
    }

    // Check format (uppercase letters, numbers, hyphens, carets, and dots)
    if (!/^[A-Z0-9^.\-]+$/.test(trimmedSymbol)) {
      return { valid: false, error: 'Symbol must contain only uppercase letters, numbers, ^, -, or .' }
    }

    return { valid: true }
  }

  /**
   * Fetch stock data with automatic fallback to alternative providers
   * @param symbol - Stock symbol (e.g., "AAPL", "TSLA")
   * @param range - Date range (e.g., "1mo", "3mo", "1y")
   * @returns Array of stock quotes
   */
  async getStockData(
    symbol: string,
    range: string = '1mo'
  ): Promise<StockQuote[]> {
    try {
      // Validate symbol
      const validation = this.validateStockSymbol(symbol)
      if (!validation.valid) {
        logError(
          'Invalid stock symbol',
          new APIError(`Invalid stock symbol: ${validation.error}`, 400, this.config.provider),
          {
            function: 'getStockData',
            provider: this.config.provider,
            symbol,
            validationError: validation.error,
          }
        )
        return getEmptyStockQuotes()
      }

      // Try primary provider
      try {
        return await this.fetchFromProvider(symbol, range, this.config.provider)
      } catch (primaryError) {
        logWarning(`Primary provider ${this.config.provider} failed, attempting fallback`, {
          function: 'getStockData',
          provider: this.config.provider,
          symbol,
          range,
          error: primaryError instanceof Error ? primaryError.message : 'Unknown error',
        })

        // Attempt fallback providers
        const fallbackProviders = this.getFallbackProviders()
        
        for (const provider of fallbackProviders) {
          try {
            logInfo(`Trying fallback provider: ${provider}`, {
              function: 'getStockData',
              provider,
              symbol,
              range,
            })
            return await this.fetchFromProvider(symbol, range, provider)
          } catch (fallbackError) {
            logWarning(`Fallback provider ${provider} failed`, {
              function: 'getStockData',
              provider,
              symbol,
              range,
              error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
            })
            // Continue to next fallback
          }
        }

        // All providers failed
        logError(
          'All stock API providers failed',
          new Error('All providers exhausted'),
          {
            function: 'getStockData',
            symbol,
            range,
            attemptedProviders: [this.config.provider, ...fallbackProviders],
          }
        )

        // Return empty array as per error handling strategy
        return getEmptyStockQuotes()
      }
    } catch (error) {
      // Catch any unexpected errors
      logError(
        'Unexpected error in getStockData',
        error,
        {
          function: 'getStockData',
          provider: this.config.provider,
          symbol,
          range,
        }
      )
      
      return getEmptyStockQuotes()
    }
  }

  /**
   * Get list of fallback providers based on current provider
   */
  private getFallbackProviders(): Array<'yahoo' | 'alphavantage' | 'finnhub'> {
    const allProviders: Array<'yahoo' | 'alphavantage' | 'finnhub'> = ['yahoo', 'alphavantage', 'finnhub']
    return allProviders.filter(p => p !== this.config.provider)
  }

  /**
   * Fetch stock data from a specific provider
   */
  private async fetchFromProvider(
    symbol: string,
    range: string,
    provider: 'yahoo' | 'alphavantage' | 'finnhub'
  ): Promise<StockQuote[]> {
    switch (provider) {
      case 'yahoo':
        return await this.fetchFromYahoo(symbol, range)
      case 'alphavantage':
        return await this.fetchFromAlphaVantage(symbol)
      case 'finnhub':
        return await this.fetchFromFinnhub(symbol)
      default:
        throw new APIError(`Unknown provider: ${provider}`, undefined, provider)
    }
  }

  /**
   * Fetch stock data from Yahoo Finance
   */
  private async fetchFromYahoo(symbol: string, range: string): Promise<StockQuote[]> {
    try {
      // Yahoo Finance API v8 endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`

      logInfo('Fetching from Yahoo Finance', {
        function: 'fetchFromYahoo',
        provider: 'yahoo',
        symbol,
        range,
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
        })

        clearTimeout(timeoutId)

        // Handle rate limiting (429 status code)
        if (response.status === 429) {
          throw new APIError(
            'Yahoo Finance rate limit exceeded',
            429,
            'yahoo'
          )
        }

        if (!response.ok) {
          throw new APIError(
            `Yahoo Finance API returned status ${response.status}`,
            response.status,
            'yahoo'
          )
        }

        const data = await response.json()

        // Parse Yahoo Finance response format
        const result = data?.chart?.result?.[0]
        if (!result) {
          logWarning('No data in Yahoo Finance response', {
            function: 'fetchFromYahoo',
            provider: 'yahoo',
            symbol,
            range,
          })
          return getEmptyStockQuotes()
        }

        const timestamps = result.timestamp || []
        const quotes = result.indicators?.quote?.[0]
        
        if (!quotes) {
          logWarning('No quote data in Yahoo Finance response', {
            function: 'fetchFromYahoo',
            provider: 'yahoo',
            symbol,
            range,
          })
          return getEmptyStockQuotes()
        }

        const stockQuotes: StockQuote[] = []
        
        for (let i = 0; i < timestamps.length; i++) {
          // Skip entries with missing data
          if (
            quotes.open?.[i] == null ||
            quotes.high?.[i] == null ||
            quotes.low?.[i] == null ||
            quotes.close?.[i] == null ||
            quotes.volume?.[i] == null
          ) {
            continue
          }

          stockQuotes.push({
            timestamp: timestamps[i],
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i],
          })
        }

        logInfo('Successfully fetched from Yahoo Finance', {
          function: 'fetchFromYahoo',
          provider: 'yahoo',
          symbol,
          count: stockQuotes.length,
        })

        return stockQuotes
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logError(
          'Yahoo Finance request timed out',
          error,
          {
            function: 'fetchFromYahoo',
            provider: 'yahoo',
            timeout: this.config.timeout,
            symbol,
            range,
          }
        )
        throw new APIError(
          `Yahoo Finance request timed out after ${this.config.timeout}ms`,
          undefined,
          'yahoo'
        )
      }

      if (error instanceof APIError) {
        logError(
          'Yahoo Finance API error',
          error,
          {
            function: 'fetchFromYahoo',
            provider: 'yahoo',
            statusCode: error.statusCode,
            symbol,
            range,
          }
        )
        throw error
      }

      logError(
        'Network error while fetching Yahoo Finance data',
        error,
        {
          function: 'fetchFromYahoo',
          provider: 'yahoo',
          symbol,
          range,
        }
      )

      throw new APIError(
        `Network error while fetching Yahoo Finance data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'yahoo'
      )
    }
  }

  /**
   * Fetch stock data from Alpha Vantage
   */
  private async fetchFromAlphaVantage(symbol: string): Promise<StockQuote[]> {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || this.config.apiKey
      
      if (!apiKey) {
        throw new APIError(
          'Alpha Vantage API key not configured',
          401,
          'alphavantage'
        )
      }

      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`

      logInfo('Fetching from Alpha Vantage', {
        function: 'fetchFromAlphaVantage',
        provider: 'alphavantage',
        symbol,
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new APIError(
            `Alpha Vantage API returned status ${response.status}`,
            response.status,
            'alphavantage'
          )
        }

        const data = await response.json()

        // Check for API error messages
        if (data['Error Message']) {
          throw new APIError(
            `Alpha Vantage error: ${data['Error Message']}`,
            400,
            'alphavantage'
          )
        }

        // Check for rate limit message
        if (data['Note']) {
          throw new APIError(
            'Alpha Vantage rate limit exceeded',
            429,
            'alphavantage'
          )
        }

        const timeSeries = data['Time Series (Daily)']
        if (!timeSeries) {
          logWarning('No time series data in Alpha Vantage response', {
            function: 'fetchFromAlphaVantage',
            provider: 'alphavantage',
            symbol,
          })
          return getEmptyStockQuotes()
        }

        const stockQuotes: StockQuote[] = []
        
        for (const [dateStr, values] of Object.entries(timeSeries)) {
          const date = new Date(dateStr)
          
          stockQuotes.push({
            timestamp: Math.floor(date.getTime() / 1000),
            open: parseFloat((values as any)['1. open']),
            high: parseFloat((values as any)['2. high']),
            low: parseFloat((values as any)['3. low']),
            close: parseFloat((values as any)['4. close']),
            volume: parseInt((values as any)['5. volume'], 10),
          })
        }

        // Sort by timestamp ascending
        stockQuotes.sort((a, b) => a.timestamp - b.timestamp)

        logInfo('Successfully fetched from Alpha Vantage', {
          function: 'fetchFromAlphaVantage',
          provider: 'alphavantage',
          symbol,
          count: stockQuotes.length,
        })

        return stockQuotes
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logError(
          'Alpha Vantage request timed out',
          error,
          {
            function: 'fetchFromAlphaVantage',
            provider: 'alphavantage',
            timeout: this.config.timeout,
            symbol,
          }
        )
        throw new APIError(
          `Alpha Vantage request timed out after ${this.config.timeout}ms`,
          undefined,
          'alphavantage'
        )
      }

      if (error instanceof APIError) {
        logError(
          'Alpha Vantage API error',
          error,
          {
            function: 'fetchFromAlphaVantage',
            provider: 'alphavantage',
            statusCode: error.statusCode,
            symbol,
          }
        )
        throw error
      }

      logError(
        'Network error while fetching Alpha Vantage data',
        error,
        {
          function: 'fetchFromAlphaVantage',
          provider: 'alphavantage',
          symbol,
        }
      )

      throw new APIError(
        `Network error while fetching Alpha Vantage data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'alphavantage'
      )
    }
  }

  /**
   * Fetch stock data from Finnhub
   */
  private async fetchFromFinnhub(symbol: string): Promise<StockQuote[]> {
    try {
      const apiKey = process.env.FINNHUB_API_KEY || this.config.apiKey
      
      if (!apiKey) {
        throw new APIError(
          'Finnhub API key not configured',
          401,
          'finnhub'
        )
      }

      // Finnhub requires Unix timestamps
      const endDate = Math.floor(Date.now() / 1000)
      const startDate = endDate - (30 * 24 * 60 * 60) // 30 days ago

      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${startDate}&to=${endDate}&token=${apiKey}`

      logInfo('Fetching from Finnhub', {
        function: 'fetchFromFinnhub',
        provider: 'finnhub',
        symbol,
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new APIError(
            `Finnhub API returned status ${response.status}`,
            response.status,
            'finnhub'
          )
        }

        const data = await response.json()

        // Check for no data response
        if (data.s === 'no_data') {
          logWarning('No data available from Finnhub', {
            function: 'fetchFromFinnhub',
            provider: 'finnhub',
            symbol,
          })
          return getEmptyStockQuotes()
        }

        if (data.s !== 'ok') {
          throw new APIError(
            `Finnhub returned status: ${data.s}`,
            400,
            'finnhub'
          )
        }

        const stockQuotes: StockQuote[] = []
        
        for (let i = 0; i < data.t.length; i++) {
          stockQuotes.push({
            timestamp: data.t[i],
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i],
          })
        }

        logInfo('Successfully fetched from Finnhub', {
          function: 'fetchFromFinnhub',
          provider: 'finnhub',
          symbol,
          count: stockQuotes.length,
        })

        return stockQuotes
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logError(
          'Finnhub request timed out',
          error,
          {
            function: 'fetchFromFinnhub',
            provider: 'finnhub',
            timeout: this.config.timeout,
            symbol,
          }
        )
        throw new APIError(
          `Finnhub request timed out after ${this.config.timeout}ms`,
          undefined,
          'finnhub'
        )
      }

      if (error instanceof APIError) {
        logError(
          'Finnhub API error',
          error,
          {
            function: 'fetchFromFinnhub',
            provider: 'finnhub',
            statusCode: error.statusCode,
            symbol,
          }
        )
        throw error
      }

      logError(
        'Network error while fetching Finnhub data',
        error,
        {
          function: 'fetchFromFinnhub',
          provider: 'finnhub',
          symbol,
        }
      )

      throw new APIError(
        `Network error while fetching Finnhub data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'finnhub'
      )
    }
  }

  /**
   * Calculate volatility from stock quotes and transform to StockData format
   * @param quotes - Array of stock quotes
   * @returns Array of stock data with volatility calculations
   */
  calculateVolatility(quotes: StockQuote[]): StockData[] {
    if (!quotes || quotes.length === 0) {
      return []
    }

    const stockData: StockData[] = []

    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i]
      
      // Calculate intraday volatility (high-low range as percentage of close)
      const intradayVolatility = quote.close > 0 
        ? Math.abs((quote.high - quote.low) / quote.close) * 100
        : 0

      // Calculate price change volatility if we have previous data
      let priceChangeVolatility = 0
      if (i > 0) {
        const prevClose = quotes[i - 1].close
        if (prevClose > 0) {
          priceChangeVolatility = Math.abs((quote.close - prevClose) / prevClose) * 100
        }
      }

      // Use the maximum of the two volatility measures
      const volatility = Math.max(intradayVolatility, priceChangeVolatility)

      // Ensure volatility is non-negative
      const finalVolatility = Math.max(0, volatility)

      // Convert timestamp to YYYY-MM-DD format
      const date = new Date(quote.timestamp * 1000)
      const dateStr = date.toISOString().split('T')[0]

      stockData.push({
        date: dateStr,
        close: quote.close,
        volume: quote.volume,
        volatility: finalVolatility,
        high: quote.high,
        low: quote.low,
        open: quote.open,
      })
    }

    return stockData
  }
}
