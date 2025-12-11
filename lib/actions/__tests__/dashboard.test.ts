import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardData } from '../dashboard'
import * as nasaModule from '../../api/nasa'
import * as stockModule from '../../api/stock'

// Mock the API client modules
vi.mock('../../api/nasa')
vi.mock('../../api/stock')

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return dashboard data with default parameters', async () => {
    // Mock NASA client methods
    const mockGetFlareEvents = vi.fn().mockResolvedValue([
      {
        flrID: 'test-1',
        beginTime: '2024-01-01T00:00:00Z',
        peakTime: '2024-01-01T12:00:00Z',
        endTime: '2024-01-01T23:59:59Z',
        classType: 'M2.5',
        sourceLocation: 'N10W20',
        activeRegionNum: 12345,
        linkedEvents: [],
      },
    ])

    const mockTransformFlareData = vi.fn().mockReturnValue([
      {
        date: '2024-01-01',
        flare: 2.5,
        class: 'M2.5',
        peakTime: '2024-01-01T12:00:00Z',
        sourceRegion: 12345,
      },
    ])

    // Mock Stock client methods
    const mockGetStockData = vi.fn().mockResolvedValue([
      {
        timestamp: 1704067200,
        open: 150,
        high: 155,
        low: 148,
        close: 152,
        volume: 1000000,
      },
    ])

    const mockCalculateVolatility = vi.fn().mockReturnValue([
      {
        date: '2024-01-01',
        close: 152,
        volume: 1000000,
        volatility: 4.6,
        high: 155,
        low: 148,
        open: 150,
      },
    ])

    // Mock the constructors
    vi.mocked(nasaModule.NASAClient).mockImplementation(function (this: any) {
      this.getFlareEvents = mockGetFlareEvents
      this.transformFlareData = mockTransformFlareData
      return this
    } as any)

    vi.mocked(stockModule.StockClient).mockImplementation(function (this: any) {
      this.getStockData = mockGetStockData
      this.calculateVolatility = mockCalculateVolatility
      this.config = { provider: 'yahoo' }
      return this
    } as any)

    const result = await getDashboardData()

    expect(result).toBeDefined()
    expect(result.composedData).toHaveLength(1)
    expect(result.composedData[0]).toEqual({
      date: '2024-01-01',
      flare: 2.5,
      volatility: 4.6,
      trades: 1000000,
    })
    expect(result.stats.avgFlare).toBe(2.5)
    expect(result.stats.avgVolatility).toBe(4.6)
  })

  it('should handle NASA API failure gracefully (parallel independence)', async () => {
    // Mock NASA client to fail
    const mockGetFlareEvents = vi.fn().mockRejectedValue(new Error('NASA API failed'))
    const mockTransformFlareData = vi.fn().mockReturnValue([])

    // Mock Stock client to succeed
    const mockGetStockData = vi.fn().mockResolvedValue([
      {
        timestamp: 1704067200,
        open: 150,
        high: 155,
        low: 148,
        close: 152,
        volume: 1000000,
      },
    ])

    const mockCalculateVolatility = vi.fn().mockReturnValue([
      {
        date: '2024-01-01',
        close: 152,
        volume: 1000000,
        volatility: 4.6,
      },
    ])

    vi.mocked(nasaModule.NASAClient).mockImplementation(function (this: any) {
      this.getFlareEvents = mockGetFlareEvents
      this.transformFlareData = mockTransformFlareData
      return this
    } as any)

    vi.mocked(stockModule.StockClient).mockImplementation(function (this: any) {
      this.getStockData = mockGetStockData
      this.calculateVolatility = mockCalculateVolatility
      this.config = { provider: 'yahoo' }
      return this
    } as any)

    const result = await getDashboardData()

    // Should return empty composed data but not throw
    expect(result).toBeDefined()
    expect(result.composedData).toHaveLength(0)
    expect(mockGetStockData).toHaveBeenCalled()
  })

  it('should handle Stock API failure gracefully (parallel independence)', async () => {
    // Mock NASA client to succeed
    const mockGetFlareEvents = vi.fn().mockResolvedValue([
      {
        flrID: 'test-1',
        beginTime: '2024-01-01T00:00:00Z',
        peakTime: '2024-01-01T12:00:00Z',
        endTime: '2024-01-01T23:59:59Z',
        classType: 'M2.5',
        sourceLocation: 'N10W20',
        activeRegionNum: 12345,
        linkedEvents: [],
      },
    ])

    const mockTransformFlareData = vi.fn().mockReturnValue([
      {
        date: '2024-01-01',
        flare: 2.5,
        class: 'M2.5',
        peakTime: '2024-01-01T12:00:00Z',
      },
    ])

    // Mock Stock client to fail
    const mockGetStockData = vi.fn().mockRejectedValue(new Error('Stock API failed'))
    const mockCalculateVolatility = vi.fn().mockReturnValue([])

    vi.mocked(nasaModule.NASAClient).mockImplementation(function (this: any) {
      this.getFlareEvents = mockGetFlareEvents
      this.transformFlareData = mockTransformFlareData
      return this
    } as any)

    vi.mocked(stockModule.StockClient).mockImplementation(function (this: any) {
      this.getStockData = mockGetStockData
      this.calculateVolatility = mockCalculateVolatility
      this.config = { provider: 'yahoo' }
      return this
    } as any)

    const result = await getDashboardData()

    // Should return empty composed data but not throw
    expect(result).toBeDefined()
    expect(result.composedData).toHaveLength(0)
    expect(mockGetFlareEvents).toHaveBeenCalled()
  })

  it('should accept optional parameters', async () => {
    const mockGetFlareEvents = vi.fn().mockResolvedValue([])
    const mockTransformFlareData = vi.fn().mockReturnValue([])
    const mockGetStockData = vi.fn().mockResolvedValue([])
    const mockCalculateVolatility = vi.fn().mockReturnValue([])

    vi.mocked(nasaModule.NASAClient).mockImplementation(function (this: any) {
      this.getFlareEvents = mockGetFlareEvents
      this.transformFlareData = mockTransformFlareData
      return this
    } as any)

    vi.mocked(stockModule.StockClient).mockImplementation(function (this: any) {
      this.getStockData = mockGetStockData
      this.calculateVolatility = mockCalculateVolatility
      this.config = { provider: 'yahoo' }
      return this
    } as any)

    await getDashboardData({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      stockSymbol: 'TSLA',
    })

    expect(mockGetFlareEvents).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
    expect(mockGetStockData).toHaveBeenCalledWith('TSLA', '1mo')
  })
})
