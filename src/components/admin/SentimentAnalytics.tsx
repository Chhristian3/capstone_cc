import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"

interface SentimentData {
  category: string
  count: number
  percentage: number
}

interface SentimentAnalyticsProps {
  sentimentDistribution: SentimentData[]
  averageSentimentScore: number
  sentimentByService: Record<string, {
    averageScore: number
    distribution: SentimentData[]
  }>
  sentimentTrend: {
    date: string
    averageScore: number
  }[]
}

const sentimentColors = {
  VERY_POSITIVE: "#22c55e",
  POSITIVE: "#4ade80",
  NEUTRAL: "#94a3b8",
  NEGATIVE: "#f87171",
  VERY_NEGATIVE: "#ef4444"
}

export function SentimentAnalytics({
  sentimentDistribution,
  averageSentimentScore,
  sentimentByService,
  sentimentTrend
}: SentimentAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentDistribution}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {sentimentDistribution.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: sentimentColors[item.category as keyof typeof sentimentColors]
                      }}
                    />
                    <span className="text-sm capitalize">
                      {item.category.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentTrend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="averageScore"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-medium">Average Sentiment Score</div>
              <Badge variant="outline">
                {averageSentimentScore.toFixed(2)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(sentimentByService).map(([serviceName, data]) => (
              <div key={serviceName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{serviceName}</h3>
                  <Badge variant="outline">
                    Score: {data.averageScore.toFixed(2)}
                  </Badge>
                </div>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.distribution}>
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="percentage"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.distribution.map((item) => (
                    <Badge
                      key={item.category}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: sentimentColors[item.category as keyof typeof sentimentColors]
                        }}
                      />
                      <span>
                        {item.category.toLowerCase().replace("_", " ")}: {item.percentage.toFixed(1)}%
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 