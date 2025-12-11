"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Info } from "lucide-react"
import { getSimulatorData } from "@/lib/actions/simulator"
import type { SimulatorData, ScenarioType } from "@/lib/actions/simulator"

export default function SimulatorDashboard() {
  const [flareIntensity, setFlareIntensity] = useState(5)
  const [data, setData] = useState<SimulatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>('baseline')

  useEffect(() => {
    fetchSimulatorDataFromServer()
  }, [])

  useEffect(() => {
    // Determine scenario based on flare intensity and fetch new data
    const scenario = determineScenario(flareIntensity)
    if (scenario !== currentScenario) {
      setCurrentScenario(scenario)
      fetchSimulatorDataFromServer(scenario)
    }
  }, [flareIntensity])

  const determineScenario = (intensity: number): ScenarioType => {
    if (intensity >= 8) return 'extreme_event'
    if (intensity >= 5) return 'high_solar'
    if (intensity <= 2) return 'low_solar'
    return 'baseline'
  }

  const fetchSimulatorDataFromServer = async (scenario: ScenarioType = 'baseline') => {
    try {
      setLoading(true)
      const result = await getSimulatorData({ scenario, days: 14 })
      console.log("Fetched simulator data:", result)
      setData(result)
    } catch (err) {
      console.error("Error fetching simulator:", err)
      setSampleSimulatorData()
    } finally {
      setLoading(false)
    }
  }

  const setSampleSimulatorData = () => {
    setData({
      scenario: 'baseline',
      description: 'Sample baseline scenario',
      simulatedData: [],
      summary: {
        avgFlare: 2.5,
        avgVolatility: 5.0,
        totalVolume: 1000000,
        riskLevel: 'medium',
      },
      assumptions: ['Sample data'],
    })
  }

  // Calculate predicted volatility from actual data
  const predictedVolatility = data?.summary.avgVolatility || 0
  const baselineVolatility = 2.0 // Historical baseline
  const percentageChange = ((predictedVolatility - baselineVolatility) / baselineVolatility * 100).toFixed(1)

  // Transform simulator data for chart
  const chartData = data?.simulatedData.map(d => ({
    date: d.date.substring(5), // MM-DD format
    flare: d.flare,
    volatility: d.volatility,
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const riskLevelColors = {
    low: 'bg-green-500/20 text-green-700 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    extreme: 'bg-red-500/20 text-red-700 border-red-500/30',
  }

  return (
    <div className="p-6 space-y-6">
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Scenario Setup
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Adjust solar flare intensity to simulate different scenarios: Low Solar (0.5-2), Baseline (2-5), High Solar (5-8), Extreme Event (8-10)</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Current: {data?.scenario.replace('_', ' ').toUpperCase()} scenario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Solar Flare Intensity</label>
                  <Badge variant="outline" className="text-base py-1 px-3">
                    X{flareIntensity.toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  value={[flareIntensity]}
                  onValueChange={(value) => setFlareIntensity(value[0])}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Minor (0.5)</span>
                  <span>Extreme (10)</span>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold mb-1">Active Scenario</p>
                <p className="text-sm">{data?.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Predicted Volatility
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Average predicted market volatility percentage for the selected scenario over 14 days</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{predictedVolatility.toFixed(1)}%</p>
              <Badge className="mt-3 bg-accent/20 text-accent border-accent/30">Estimated</Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Risk Level
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Overall market risk assessment based on predicted solar activity and volatility levels</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold capitalize">{data?.summary.riskLevel}</p>
              <Badge className={`mt-3 ${riskLevelColors[data?.summary.riskLevel || 'medium']}`}>
                {percentageChange > '0' ? '+' : ''}{percentageChange}% vs baseline
              </Badge>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <Card>
        <CardHeader>
          <CardTitle>Simulated Activity Forecast</CardTitle>
          <CardDescription>
            14-day projection for {data?.scenario.replace('_', ' ')} scenario
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                yAxisId="left"
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--color-muted-foreground)"
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="flare"
                stroke="var(--color-primary)"
                strokeWidth={2}
                name="Flare Intensity"
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="volatility"
                stroke="var(--color-accent)"
                strokeWidth={2}
                name="Volatility %"
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>Key metrics for {data?.scenario.replace('_', ' ')} scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">Average Flare Intensity</p>
              <p className="text-sm">
                X{data?.summary.avgFlare.toFixed(2)} over 14-day simulation period
              </p>
            </div>
            <div className="p-4 bg-accent/5 rounded border border-accent/20">
              <p className="text-xs font-semibold text-accent mb-1">Average Volatility</p>
              <p className="text-sm">
                {data?.summary.avgVolatility.toFixed(2)}% market volatility expected
              </p>
            </div>
            <div className="p-4 bg-secondary/5 rounded border border-secondary/20">
              <p className="text-xs font-semibold text-secondary mb-1">Total Trading Volume</p>
              <p className="text-sm">
                {((data?.summary.totalVolume || 0) / 1000000).toFixed(1)}M shares across simulation period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Assumptions</CardTitle>
            <CardDescription>Scenario parameters and constraints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.assumptions.map((assumption, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-sm">• {assumption}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={() => fetchSimulatorDataFromServer(currentScenario)} 
        className="w-full" 
        size="lg"
        disabled={loading}
      >
        {loading ? 'Running...' : 'Refresh Simulation'}
      </Button>
    </div>
  )
}
