
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface QueryResult {
  product_id: string;
  sales: number;
  region?: string;
  date?: string;
}

interface CriteriaChartProps {
  rowCount: number;
  maxSales: number;
  results: QueryResult[];
}

export const CriteriaChart: React.FC<CriteriaChartProps> = ({ rowCount, maxSales, results }) => {
  // Prepare data for row count visualization
  const rowCountData = [
    {
      name: 'Current Rows',
      value: rowCount,
      threshold: 100,
      status: rowCount > 100 ? 'passed' : 'failed'
    }
  ];

  // Prepare data for max sales visualization
  const maxSalesData = [
    {
      name: 'Max Sales',
      value: maxSales,
      threshold: 5000,
      status: maxSales > 5000 ? 'passed' : 'failed'
    }
  ];

  // Prepare region distribution data
  const regionData = results.reduce((acc: any[], result) => {
    const existing = acc.find(item => item.region === result.region);
    if (existing) {
      existing.count += 1;
      existing.totalSales += result.sales;
    } else {
      acc.push({
        region: result.region || 'Unknown',
        count: 1,
        totalSales: result.sales
      });
    }
    return acc;
  }, []);

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
    threshold: {
      label: "Threshold",
      color: "hsl(var(--chart-2))",
    },
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Row Count Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Row Count Criteria</h4>
        <div className="h-32">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rowCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="value" 
                  fill={rowCount > 100 ? "#22c55e" : "#ef4444"} 
                  name="Actual"
                />
                <Bar 
                  dataKey="threshold" 
                  fill="#94a3b8" 
                  name="Threshold"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <p className="text-xs text-gray-600">
          {rowCount} rows (threshold: 100) - {rowCount > 100 ? '✅ Pass' : '❌ Fail'}
        </p>
      </div>

      {/* Max Sales Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Max Sales Criteria</h4>
        <div className="h-32">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maxSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="value" 
                  fill={maxSales > 5000 ? "#22c55e" : "#ef4444"} 
                  name="Actual"
                />
                <Bar 
                  dataKey="threshold" 
                  fill="#94a3b8" 
                  name="Threshold"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <p className="text-xs text-gray-600">
          ${maxSales.toLocaleString()} (threshold: $5,000) - {maxSales > 5000 ? '✅ Pass' : '❌ Fail'}
        </p>
      </div>

      {/* Region Distribution */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Region Distribution</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                outerRadius={50}
                fill="#8884d8"
                dataKey="count"
                label={({ region, count }) => `${region}: ${count}`}
                fontSize={10}
              >
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-600">
          {regionData.length} regions represented
        </p>
      </div>
    </div>
  );
};
