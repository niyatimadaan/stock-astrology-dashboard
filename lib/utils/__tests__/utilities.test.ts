import { describe, it, expect } from 'vitest'
import { mergeDatasets } from '../data-transform'
import { calculateCorrelation } from '../correlation'
import { calculateAverage, calculateMax, calculateSum, categorizeIntensity } from '../statistics'
import { FlareData, StockData } from '../../api/types'

describe('Data Transformation Utilities', () => {
  describe('mergeDatasets', () => {
    it('should merge flare and stock data by date', () => {
      const flareData: FlareData[] = [
        { date: '2024-01-01', flare: 2.5, class: 'M2.5', peakTime: '10:00' },
        { date: '2024-01-02', flare: 3.0, class: 'M3.0', peakTime: '11:00' }
      ]
      const stockData: StockData[] = [
        { date: '2024-01-01', close: 100, volume: 1000, volatility: 0.5 },
        { date: '2024-01-02', close: 105, volume: 1200, volatility: 0.6 }
      ]

      const result = mergeDatasets(flareData, stockData)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        date: '2024-01-01',
        flare: 2.5,
        volatility: 0.5,
        trades: 1000
      })
    })

    it('should handle empty arrays', () => {
      expect(mergeDatasets([], [])).toEqual([])
    })

    it('should filter out invalid data', () => {
      const flareData: FlareData[] = [
        { date: '2024-01-01', flare: NaN, class: 'M2.5', peakTime: '10:00' },
        { date: '2024-01-02', flare: 3.0, class: 'M3.0', peakTime: '11:00' }
      ]
      const stockData: StockData[] = [
        { date: '2024-01-01', close: 100, volume: 1000, volatility: 0.5 },
        { date: '2024-01-02', close: 105, volume: 1200, volatility: 0.6 }
      ]

      const result = mergeDatasets(flareData, stockData)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2024-01-02')
    })
  })

  describe('calculateCorrelation', () => {
    it('should calculate correlation coefficient', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [2, 4, 6, 8, 10]
      const result = calculateCorrelation(x, y)
      expect(result).toBeCloseTo(1, 5)
    })

    it('should return 0 for empty arrays', () => {
      expect(calculateCorrelation([], [])).toBe(0)
    })

    it('should handle arrays with NaN values', () => {
      const x = [1, 2, NaN, 4, 5]
      const y = [2, 4, 6, 8, 10]
      const result = calculateCorrelation(x, y)
      expect(result).toBeGreaterThanOrEqual(-1)
      expect(result).toBeLessThanOrEqual(1)
    })

    it('should return value between -1 and 1', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [5, 4, 3, 2, 1]
      const result = calculateCorrelation(x, y)
      expect(result).toBeGreaterThanOrEqual(-1)
      expect(result).toBeLessThanOrEqual(1)
    })
  })

  describe('Statistics Functions', () => {
    describe('calculateAverage', () => {
      it('should calculate average correctly', () => {
        expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
      })

      it('should handle empty array', () => {
        expect(calculateAverage([])).toBe(0)
      })

      it('should filter out NaN values', () => {
        expect(calculateAverage([1, 2, NaN, 4])).toBeCloseTo(2.333, 2)
      })
    })

    describe('calculateMax', () => {
      it('should find maximum value', () => {
        expect(calculateMax([1, 5, 3, 2, 4])).toBe(5)
      })

      it('should handle empty array', () => {
        expect(calculateMax([])).toBe(0)
      })

      it('should filter out NaN values', () => {
        expect(calculateMax([1, NaN, 5, 3])).toBe(5)
      })
    })

    describe('calculateSum', () => {
      it('should calculate sum correctly', () => {
        expect(calculateSum([1, 2, 3, 4, 5])).toBe(15)
      })

      it('should handle empty array', () => {
        expect(calculateSum([])).toBe(0)
      })

      it('should filter out NaN values', () => {
        expect(calculateSum([1, 2, NaN, 4])).toBe(7)
      })
    })

    describe('categorizeIntensity', () => {
      it('should categorize as Low for values < 2', () => {
        expect(categorizeIntensity(0)).toBe('Low')
        expect(categorizeIntensity(1.5)).toBe('Low')
      })

      it('should categorize as Medium for values 2-4', () => {
        expect(categorizeIntensity(2)).toBe('Medium')
        expect(categorizeIntensity(3.5)).toBe('Medium')
      })

      it('should categorize as High for values 4-6', () => {
        expect(categorizeIntensity(4)).toBe('High')
        expect(categorizeIntensity(5.5)).toBe('High')
      })

      it('should categorize as Extreme for values >= 6', () => {
        expect(categorizeIntensity(6)).toBe('Extreme')
        expect(categorizeIntensity(10)).toBe('Extreme')
      })

      it('should handle invalid values', () => {
        expect(categorizeIntensity(NaN)).toBe('Low')
        expect(categorizeIntensity(-1)).toBe('Low')
      })
    })
  })
})
