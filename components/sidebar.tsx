"use client"
import { BarChart3, TrendingUp, Zap, Brain, GitCompare, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activePage: string
  onPageChange: (page: string) => void
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const pages = [
    { id: "overview", label: "Overview", icon: BarChart3, description: "Core metrics & activity" },
    { id: "forecast", label: "Forecast", icon: TrendingUp, description: "Predictions & trends" },
    { id: "analysis", label: "Analysis", icon: Zap, description: "Lag & correlation" },
    { id: "insights", label: "Insights", icon: Brain, description: "AI patterns & alerts" },
    { id: "comparison", label: "Comparison", icon: GitCompare, description: "Multi-stock view" },
    { id: "simulator", label: "Simulator", icon: Wand2, description: "What-if scenarios" },
  ]

  return (
    <div className="w-64 bg-card border-r border-border h-screen sticky top-16 overflow-y-auto pt-4">
      <div className="px-4 mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dashboard</h2>
      </div>

      <nav className="space-y-2 px-2">
        {pages.map((page) => {
          const Icon = page.icon
          const isActive = activePage === page.id

          return (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                isActive
                  ? "bg-primary/20 text-primary border-l-2 border-primary"
                  : "text-muted-foreground border-l-2 border-transparent",
              )}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">{page.label}</p>
                <p className="text-xs text-muted-foreground">{page.description}</p>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="mt-8 px-4 py-4 bg-primary/5 rounded-lg border border-primary/20 mx-2">
        <p className="text-xs font-semibold text-primary mb-1">💡 Tip</p>
        <p className="text-xs text-muted-foreground">Each tab reveals different insights into solar-market dynamics.</p>
      </div>
    </div>
  )
}
