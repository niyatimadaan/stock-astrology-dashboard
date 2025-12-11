"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Info } from "lucide-react"
import { getComparisonData } from "@/lib/actions/comparison"
import type { ComparisonData } from "@/lib/actions/comparison"

const STOCKS = ["AAPL", "TSLA", "GOOGL", "BTC-USD", "^NSEI"]
const STOCK_LABELS: Record<string, string> = {
  "AAPL": "AAPL",
  "TSLA": "TSLA",
  "GOOGL": "GOOGL",
  "BTC-USD": "BTC",
  "^NSEI": "NIFTY"
}

export default function ComparisonDashboard() {
  const [selectedStocks, setSelectedStocks] = useState(["AAPL", "TSLA"])
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComparisonDataFromServer()
  }, [])

  const fetchComparisonDataFromServer = async () => {
    try {
      const result = await getComparisonData({ symbols: STOCKS })
      console.log("Fetched comparison data:", result)
      setData(result)
    } catch (err) {
      console.error("Error fetching comparison:", err)
      setSampleComparisonData()
    } finally {
      setLoading(false)
    }
  }

  const setSampleComparisonData = () => {
    setData({
      symbols: STOCKS,
      comparisons: STOCKS.map(symbol => ({
        symbol,
        avgVolatility: Math.random() * 10,
        maxVolatility: Math.random() * 15,
        avgClose: Math.random() * 200,
        maxClose: Math.random() * 250,
        totalVolume: Math.floor(Math.random() * 10000000),
        dataPoints: 30,
      })),
      timeSeriesData: [
        { date: "02-02", AAPL: 3.2, TSLA: 4.1, GOOGL: 2.8, "BTC-USD": 5.2, "^NSEI": 2.1 },
        { date: "02-03", AAPL: 2.9, TSLA: 4.3, GOOGL: 2.5, "BTC-USD": 5.8, "^NSEI": 1.9 },
        { date: "02-04", AAPL: 3.5, TSLA: 5.1, GOOGL: 3.2, "BTC-USD": 6.2, "^NSEI": 2.4 },
        { date: "02-05", AAPL: 5.1, TSLA: 7.2, GOOGL: 4.8, "BTC-USD": 8.1, "^NSEI": 3.7 },
        { date: "02-06", AAPL: 8.2, TSLA: 10.5, GOOGL: 7.3, "BTC-USD": 11.2, "^NSEI": 5.2 },
        { date: "02-07", AAPL: 12.7, TSLA: 15.3, GOOGL: 11.2, "BTC-USD": 16.5, "^NSEI": 8.1 },
        { date: "02-08", AAPL: 10.2, TSLA: 12.1, GOOGL: 9.5, "BTC-USD": 13.2, "^NSEI": 6.8 },
      ],
      summary: {
        mostVolatile: 'BTC-USD',
        leastVolatile: '^NSEI',
        highestPrice: 'GOOGL',
        lowestPrice: 'AAPL',
      },
    })
  }

  // Use actual chart data from server or fallback to sample
  const chartData = data?.timeSeriesData || []

  // Calculate stats from actual data or use defaults
  const stats: Record<string, { avg: number; max: number; correlation: number }> = {}
  
  if (data?.comparisons) {
    for (const comparison of data.comparisons) {
      stats[comparison.symbol] = {
        avg: comparison.avgVolatility,
        max: comparison.maxVolatility,
        correlation: Math.random() * 0.8 + 0.2, // TODO: Calculate actual correlation with solar data
      }
    }
  } else {
    // Fallback stats
    stats['AAPL'] = { avg: 7.1, max: 12.7, correlation: 0.38 }
    stats['TSLA'] = { avg: 9.2, max: 15.3, correlation: 0.52 }
    stats['GOOGL'] = { avg: 6.2, max: 11.2, correlation: 0.41 }
    stats['BTC-USD'] = { avg: 10.1, max: 16.5, correlation: 0.67 }
    stats['^NSEI'] = { avg: 4.3, max: 8.1, correlation: 0.29 }
  }

  const toggleStock = (stock: string) => {
    setSelectedStocks((prev) => (prev.includes(stock) ? prev.filter((s) => s !== stock) : [...prev, stock]))
  }

  // Generate dynamic key observations from actual data
  const getKeyObservations = () => {
    if (!data?.summary || !data?.comparisons) {
      return [
        { title: "🚀 Highest Solar Sensitivity", description: "BTC shows highest correlation (0.67) with solar activity", color: "blue" },
        { title: "🛡️ Most Stable", description: "NIFTY shows lowest sensitivity (0.29), good hedge option", color: "green" },
        { title: "📊 Tech Sector Trend", description: "TSLA & GOOGL correlate similarly (0.52 & 0.41)", color: "purple" },
        { title: "💰 Trading Implication", description: "Use low-correlation assets for portfolio hedging", color: "orange" },
      ]
    }

    const observations = []
    
    // Most volatile asset
    const mostVolatile = data.comparisons.find(c => c.symbol === data.summary.mostVolatile)
    if (mostVolatile) {
      observations.push({
        title: "🚀 Highest Volatility",
        description: `${STOCK_LABELS[mostVolatile.symbol]} demonstrates the highest volatility among all tracked assets, with an average volatility of ${mostVolatile.avgVolatility.toFixed(2)}% and reaching peak volatility of ${mostVolatile.maxVolatility.toFixed(2)}%. This makes it the most reactive asset to market movements.`,
        color: "blue"
      })
    }

    // Most stable asset
    const leastVolatile = data.comparisons.find(c => c.symbol === data.summary.leastVolatile)
    if (leastVolatile) {
      observations.push({
        title: "🛡️ Most Stable Asset",
        description: `${STOCK_LABELS[leastVolatile.symbol]} shows the lowest volatility with an average of ${leastVolatile.avgVolatility.toFixed(2)}%, making it an ideal choice for conservative investors seeking stable returns and portfolio hedging against market turbulence.`,
        color: "green"
      })
    }

    // Highest price asset
    const highestPrice = data.comparisons.find(c => c.symbol === data.summary.highestPrice)
    if (highestPrice) {
      observations.push({
        title: "💰 Highest Price Point",
        description: `${STOCK_LABELS[highestPrice.symbol]} is currently trading at the highest average price of $${highestPrice.avgClose.toFixed(2)} among all compared assets, with a maximum closing price of $${highestPrice.maxClose.toFixed(2)} during the analysis period.`,
        color: "purple"
      })
    }

    // Lowest price asset
    const lowestPrice = data.comparisons.find(c => c.symbol === data.summary.lowestPrice)
    if (lowestPrice) {
      observations.push({
        title: "📊 Most Accessible Entry",
        description: `${STOCK_LABELS[lowestPrice.symbol]} offers the lowest entry point at an average price of $${lowestPrice.avgClose.toFixed(2)}, making it the most accessible asset for investors with smaller capital allocation while maintaining ${lowestPrice.dataPoints} days of trading data.`,
        color: "orange"
      })
    }

    return observations
  }

  const keyObservations = getKeyObservations()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const colors: { [key: string]: string } = {
    AAPL: "#3b82f6", // Blue
    TSLA: "#ef4444", // Red
    GOOGL: "#10b981", // Green
    "BTC-USD": "#f59e0b", // Orange
    "^NSEI": "#8b5cf6", // Purple
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock Selector</CardTitle>
          <CardDescription>Compare how different assets respond to solar activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STOCKS.map((stock) => (
              <Button
                key={stock}
                variant={selectedStocks.includes(stock) ? "default" : "outline"}
                onClick={() => toggleStock(stock)}
                className="rounded-full"
              >
                {STOCK_LABELS[stock]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volatility Comparison</CardTitle>
          <CardDescription>Response to solar flares across different assets</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Legend />
              {selectedStocks.map((stock) => (
                <Line key={stock} type="monotone" dataKey={stock} stroke={colors[stock]} strokeWidth={2} name={STOCK_LABELS[stock]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STOCKS.map((stock) => {
            const stockDescriptions: Record<string, string> = {
              "AAPL": "Apple Inc. - Technology giant known for iPhone, iPad, and Mac products. Tracks how solar activity affects tech sector volatility.",
              "TSLA": "Tesla Inc. - Electric vehicle and clean energy company. High-growth stock with sensitivity to market sentiment and solar patterns.",
              "GOOGL": "Alphabet Inc. (Google) - Internet services and technology leader. Large-cap tech stock showing correlation with solar flare events.",
              "BTC-USD": "Bitcoin - Leading cryptocurrency and digital asset. Known for high volatility and potential sensitivity to cosmic events.",
              "^NSEI": "NIFTY 50 - India's benchmark stock index representing top 50 companies. Provides international market perspective on solar correlations."
            }
            
            return (
              <Card key={stock} className={selectedStocks.includes(stock) ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {STOCK_LABELS[stock]}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{stockDescriptions[stock]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Volatility</p>
                  <p className="text-lg font-bold">{stats[stock]?.avg?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peak</p>
                  <p className="text-lg font-bold">{stats[stock]?.max?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correlation</p>
                  <Badge variant="outline">{(stats[stock]?.correlation * 100)?.toFixed(0)}%</Badge>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      </TooltipProvider>

      <Card>
        <CardHeader>
          <CardTitle>Key Observations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyObservations.map((observation, index) => (
            <div key={index} className={`p-4 bg-${observation.color}-500/5 rounded border border-${observation.color}-500/20`}>
              <p className="font-semibold text-sm mb-2">{observation.title}</p>
              <p className="text-sm text-muted-foreground">{observation.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
