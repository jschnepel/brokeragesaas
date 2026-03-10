"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { CHART_COLORS, CHART_STYLE } from "@/lib/config/brand"
import { SectionHeader } from "./SectionHeader"
import { QUARTERLY_SALES, YOY_VOLUME } from "../mock-data"

export function AgentSalesCharts() {
  return (
    <Card data-testid="agent-sales-charts">
      <CardContent className="p-4">
        <SectionHeader title="Sales Performance" />
        <Tabs defaultValue="quarterly">
          <TabsList className="mb-4">
            <TabsTrigger value="quarterly" data-testid="tab-quarterly">
              Quarterly
            </TabsTrigger>
            <TabsTrigger value="yoy" data-testid="tab-yoy">
              Year over Year
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quarterly">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={QUARTERLY_SALES}>
                  <CartesianGrid
                    strokeDasharray={CHART_STYLE.gridDash}
                    stroke={CHART_STYLE.gridStroke}
                  />
                  <XAxis
                    dataKey="quarter"
                    fontSize={CHART_STYLE.tickFontSize}
                    tick={{ fill: CHART_STYLE.tickColor }}
                  />
                  <YAxis
                    fontSize={CHART_STYLE.tickFontSize}
                    tick={{ fill: CHART_STYLE.tickColor }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: CHART_STYLE.tooltipRadius,
                      border: CHART_STYLE.tooltipBorder,
                      fontSize: CHART_STYLE.tooltipFontSize,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: CHART_STYLE.legendFontSize }}
                  />
                  <Bar
                    dataKey="listings"
                    name="Listings"
                    fill={CHART_COLORS.primary}
                    radius={CHART_STYLE.barRadius}
                  />
                  <Bar
                    dataKey="closings"
                    name="Closings"
                    fill={CHART_COLORS.secondary}
                    radius={CHART_STYLE.barRadius}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="yoy">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={YOY_VOLUME}>
                  <CartesianGrid
                    strokeDasharray={CHART_STYLE.gridDash}
                    stroke={CHART_STYLE.gridStroke}
                  />
                  <XAxis
                    dataKey="month"
                    fontSize={CHART_STYLE.tickFontSize}
                    tick={{ fill: CHART_STYLE.tickColor }}
                  />
                  <YAxis
                    fontSize={CHART_STYLE.tickFontSize}
                    tick={{ fill: CHART_STYLE.tickColor }}
                    tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: CHART_STYLE.tooltipRadius,
                      border: CHART_STYLE.tooltipBorder,
                      fontSize: CHART_STYLE.tooltipFontSize,
                    }}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, undefined]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: CHART_STYLE.legendFontSize }}
                  />
                  <Line
                    type="monotone"
                    dataKey="thisYear"
                    name="2026"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lastYear"
                    name="2025"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
