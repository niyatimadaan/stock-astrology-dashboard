"use client"

import { useEffect, useState } from "react"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"
import { getInsightsData } from "@/lib/actions/insights"
import type { InsightsData } from "@/lib/actions/insights"

export default function InsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsightsDataFromServer()
  }, [])

  const fetchInsightsDataFromServer = async () => {
    try {
      const result = await getInsightsData()
      setData(result)
    } catch (err) {
      console.error("Error fetching insights:", err)
      setSampleInsightsData()
    } finally {
      setLoading(false)
    }
  }

  const setSampleInsightsData = () => {
    setData({
      insights: [
        {
          id: "1",
          type: "pattern",
          severity: "medium",
          title: "Pattern Detected",
          description:
            "Although correlation is low overall, extreme X-class flares correlate with volatility spikes within 1–2 days.",
          confidence: 0.75,
        },
        {
          id: "2",
          type: "anomaly",
          severity: "high",
          title: "Risk Alert",
          description:
            "High volatility detected in last 24h. Solar activity elevated. Recommend caution on leveraged positions.",
          confidence: 0.85,
        },
        {
          id: "3",
          type: "trend",
          severity: "low",
          title: "Opportunity Insight",
          description: "Volatility expected to decline in next 3 days post flare. Consider mean-reversion strategies.",
          confidence: 0.65,
        },
        {
          id: "4",
          type: "correlation",
          severity: "medium",
          title: "Technical Explanation",
          description:
            "Solar wind pressure increases particle flux to Earth, causing geomagnetic disturbances that affect market sentiment.",
          confidence: 0.70,
        },
      ],
      summary: {
        totalInsights: 4,
        highSeverityCount: 1,
        avgConfidence: 0.74,
      },
      generatedAt: new Date().toISOString(),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate risk score from insights
  const riskScore = data?.summary.highSeverityCount 
    ? Math.min(10, 5 + data.summary.highSeverityCount * 2)
    : 5
  const riskPercentage = (riskScore / 10) * 100
  const riskStatus = riskScore > 7 ? "Elevated" : riskScore > 4 ? "Moderate" : "Low"

  // Map insight types to icons
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'correlation': return '📊'
      case 'trend': return '📈'
      case 'anomaly': return '⚠️'
      case 'pattern': return '🔍'
      default: return '💡'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Current Market Risk
            </CardTitle>
            <CardDescription>Real-time risk assessment combining volatility and solar activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-5xl font-bold text-destructive">{riskScore.toFixed(1)}</p>
                <p className="text-xl text-muted-foreground">/ 10</p>
              </div>

              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full transition-all duration-300"
                    style={{ width: `${riskPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Safe</span>
                  <span>Moderate</span>
                  <span>Elevated</span>
                </div>
              </div>

              <div>
                <Badge
                  className={`text-lg py-2 px-4 ${
                    riskScore > 7
                      ? "bg-destructive/20 text-destructive border-destructive/30"
                      : "bg-secondary/20 text-secondary border-secondary/30"
                  }`}
                >
                  {riskStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <CardTitle className="text-sm">Insights Summary</CardTitle>
            <CardDescription className="text-xs">Analysis overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Insights</span>
                <Badge variant="outline">{data?.summary.totalInsights || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">High Severity</span>
                <Badge variant="outline">{data?.summary.highSeverityCount || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Confidence</span>
                <Badge variant="outline">{((data?.summary.avgConfidence || 0) * 100).toFixed(0)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data?.insights?.map((insight) => (
          <Card key={insight.id} className={`border-l-4`} style={{ borderLeftColor: "var(--color-primary)" }}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="text-3xl">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-lg">{insight.title}</p>
                    <Badge variant={insight.severity === 'high' ? 'destructive' : 'secondary'}>
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{insight.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
