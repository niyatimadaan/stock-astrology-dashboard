"use client"
import { useState } from "react"
import Sidebar from "@/components/sidebar"
import OverviewDashboard from "@/components/dashboards/overview-dashboard"
import ForecastDashboard from "@/components/dashboards/forecast-dashboard"
import AnalysisDashboard from "@/components/dashboards/analysis-dashboard"
import InsightsDashboard from "@/components/dashboards/insights-dashboard"
import ComparisonDashboard from "@/components/dashboards/comparison-dashboard"
import SimulatorDashboard from "@/components/dashboards/simulator-dashboard"

export default function Home() {
  const [activePage, setActivePage] = useState("overview")

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <OverviewDashboard />
      case "forecast":
        return <ForecastDashboard />
      case "analysis":
        return <AnalysisDashboard />
      case "insights":
        return <InsightsDashboard />
      case "comparison":
        return <ComparisonDashboard />
      case "simulator":
        return <SimulatorDashboard />
      default:
        return <OverviewDashboard />
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🌍 Stock Astrology
            </h1>
            <p className="text-sm text-muted-foreground">Solar Flares vs Market Volatility</p>
          </div>
        </div>
      </div>

      <div className="flex">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </div>
    </main>
  )
}
