import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { useAuthStore } from "../store/auth-store";

const weeklyData = [
  { date: "Mon", bloodPressure: 120, heartRate: 72, weight: 150 },
  { date: "Tue", bloodPressure: 118, heartRate: 70, weight: 149.8 },
  { date: "Wed", bloodPressure: 122, heartRate: 74, weight: 150.2 },
  { date: "Thu", bloodPressure: 119, heartRate: 71, weight: 149.5 },
  { date: "Fri", bloodPressure: 121, heartRate: 73, weight: 150.1 },
  { date: "Sat", bloodPressure: 117, heartRate: 69, weight: 149.7 },
  { date: "Sun", bloodPressure: 120, heartRate: 72, weight: 150 },
];

const monthlyData = [
  { date: "Week 1", bloodPressure: 120, heartRate: 72, weight: 151 },
  { date: "Week 2", bloodPressure: 118, heartRate: 70, weight: 150.5 },
  { date: "Week 3", bloodPressure: 119, heartRate: 71, weight: 150 },
  { date: "Week 4", bloodPressure: 121, heartRate: 73, weight: 149.8 },
];

export function ProgressDashboard() {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState("weekly");
  const data = timeRange === "weekly" ? weeklyData : monthlyData;

  const getInsightMessage = (metric: string, value: number, date: string) => {
    const insights = {
      bloodPressure: [
        "Great reading! Your lifestyle changes are showing positive results.",
        "A bit elevated - consider reducing sodium intake today.",
        "Higher than usual - stress or medication timing might be factors.",
      ],
      heartRate: [
        "Excellent heart rate - your fitness routine is paying off!",
        "Slightly elevated - make sure you're staying hydrated.",
        "Higher than normal - consider some relaxation techniques.",
      ],
      weight: [
        "Steady progress - you're doing great with your health goals!",
        "Small fluctuation is normal - keep focusing on healthy habits.",
        "Notable change - let's discuss this with your care team.",
      ]
    };
    
    const randomIndex = Math.floor(Math.random() * insights[metric as keyof typeof insights].length);
    return insights[metric as keyof typeof insights][randomIndex];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-xl border max-w-xs">
          <p className="font-medium mb-2">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mb-2">
              <p className="text-sm font-medium" style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value}${entry.name === 'Weight' ? ' lbs' : entry.name === 'Blood Pressure' ? ' mmHg' : ' bpm'}`}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {getInsightMessage(entry.dataKey, entry.value, label)}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Health Journey</CardTitle>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            className="bg-gray-100 p-1 rounded-lg"
          >
            <ToggleGroupItem value="weekly" className="text-sm">
              Weekly
            </ToggleGroupItem>
            <ToggleGroupItem value="monthly" className="text-sm">
              Monthly
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Blood Pressure Chart */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700">Blood Pressure</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="bloodPressure" 
                  stroke="#457B9D" 
                  strokeWidth={2}
                  dot={{ fill: '#457B9D', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#457B9D', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Heart Rate Chart */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700">Heart Rate</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={['dataMin - 3', 'dataMax + 3']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="heartRate" 
                  stroke="#FCA311" 
                  strokeWidth={2}
                  dot={{ fill: '#FCA311', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#FCA311', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weight Chart */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700">Weight</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#A8DADC" 
                  strokeWidth={2}
                  dot={{ fill: '#A8DADC', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#A8DADC', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}