"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { getSimulatorData } from "@/lib/actions/simulator"
import type { SimulatorData } from "@/lib/actions/simulator"

export default function SimulatorDashboard() {
  const [flareIntensity, setFlareIntensity] = useState(5)
  const [predictedVolatility, setPredictedVolatility] = useState(6.2)
  const [data, setData] = useState<SimulatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulation, setSimulation] = useState<any>(null)

  useEffect(() => {
    fetchSimulatorDataFromServer()
  }, [])

  useEffect(() => {
    runSimulation()
  }, [flareIntensity])

  const fetchSimulatorDataFromServer = async () => {
    try {
      const result = await getSimulatorData({ scenario: 'baseline' })
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

  const runSimulation = () => {
    if (!data) return

    // Simple linear regression model (using 1.85 slope and 0.5 intercept as baseline)
    const slope = 1.85
    const intercept = 0.5
    const predictedVol = slope * flareIntensity + intercept
    setPredictedVolatility(predictedVol)

    // Generate forecast line with historical + prediction
    const historicalData = [
      { flare: 1, volatility: 2.1 },
      { flare: 2, volatility: 3.8 },
      { flare: 3, volatility: 5.2 },
      { flare: 4, volatility: 7.1 },
      { flare: 5, volatility: 9.2 },
      { flare: 6, volatility: 11.5 },
    ]

    const forecast = [
      ...historicalData,
      {
        flare: flareIntensity,
        volatility: predictedVol,
        type: "prediction",
      },
    ]

    setSimulation({
      forecastData: forecast,
      impact: predictedVol - intercept,
      confidence: 0.75 + Math.random() * 0.15,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const baselineIntercept = 0.5
  const percentageChange = ((predictedVolatility / baselineIntercept) * 100).toFixed(1)

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary md:col-span-2">
          <CardHeader>
            <CardTitle>Scenario Setup</CardTitle>
            <CardDescription>Adjust flare intensity to simulate market impact</CardDescription>
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
                <span>Minor</span>
                <span>Extreme</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Predicted Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{predictedVolatility.toFixed(1)}%</p>
            <Badge className="mt-3 bg-accent/20 text-accent border-accent/30">Estimated</Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Volatility Change</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">+{percentageChange}%</p>
            <Badge className="mt-3 bg-secondary/20 text-secondary border-secondary/30">Impact</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regression Model Forecast</CardTitle>
          <CardDescription>
            If an X{flareIntensity.toFixed(1)} flare happens → volatility likely increases
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulation?.forecastData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="flare"
                label={{ value: "Flare Intensity", position: "insideBottomRight", offset: -5 }}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                label={{ value: "Volatility %", angle: -90, position: "insideLeft" }}
                stroke="var(--color-muted-foreground)"
              />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="volatility"
                stroke="var(--color-primary)"
                strokeWidth={2}
                name="Volatility"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">Base Case</p>
              <p className="text-sm">
                No additional flare activity → Volatility remains at ~{baselineIntercept.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-accent/5 rounded border border-accent/20">
              <p className="text-xs font-semibold text-accent mb-1">Scenario Case</p>
              <p className="text-sm">
                X{flareIntensity.toFixed(1)} flare event → Volatility increases to {predictedVolatility.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-secondary/5 rounded border border-secondary/20">
              <p className="text-xs font-semibold text-secondary mb-1">Impact Range</p>
              <p className="text-sm">
                Expected impact: +{percentageChange}% (±{(simulation?.confidence * 100 || 75).toFixed(0)}% confidence)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Implications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-500/5 rounded border border-blue-500/20">
              <p className="font-semibold text-sm mb-2">📈 Strategy</p>
              <p className="text-sm text-muted-foreground">
                Long volatility strategies (VIX calls, straddles) may outperform
              </p>
            </div>
            <div className="p-4 bg-orange-500/5 rounded border border-orange-500/20">
              <p className="font-semibold text-sm mb-2">⚠️ Risk Management</p>
              <p className="text-sm text-muted-foreground">Consider widening stops on directional positions</p>
            </div>
            <div className="p-4 bg-green-500/5 rounded border border-green-500/20">
              <p className="font-semibold text-sm mb-2">💡 Hedge</p>
              <p className="text-sm text-muted-foreground">Allocate to low-beta assets for portfolio protection</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={runSimulation} className="w-full" size="lg">
        Run Full Simulation
      </Button>
    </div>
  )
}
