
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, TrendingUp } from 'lucide-react';

interface SimpleCriteriaChartProps {
  rowCount: number;
  maxSales: number;
  results: Array<{ sales: number; region?: string }>;
}

export const SimpleCriteriaChart: React.FC<SimpleCriteriaChartProps> = ({
  rowCount,
  maxSales,
  results
}) => {
  const rowCountTarget = 100;
  const maxSalesTarget = 5000;
  
  const rowCountProgress = Math.min((rowCount / rowCountTarget) * 100, 100);
  const maxSalesProgress = Math.min((maxSales / maxSalesTarget) * 100, 100);
  
  const avgSales = results.length > 0 ? 
    Math.round(results.reduce((sum, r) => sum + r.sales, 0) / results.length) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Row Count</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rowCount}</div>
          <div className="text-xs text-muted-foreground mb-2">
            Target: {rowCountTarget}
          </div>
          <Progress value={rowCountProgress} className="h-2" />
          <Badge 
            variant={rowCount > rowCountTarget ? "default" : "destructive"}
            className="mt-2 text-xs"
          >
            {rowCount > rowCountTarget ? '✅ Passed' : '❌ Failed'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Max Sales</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${maxSales.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mb-2">
            Target: ${maxSalesTarget.toLocaleString()}
          </div>
          <Progress value={maxSalesProgress} className="h-2" />
          <Badge 
            variant={maxSales > maxSalesTarget ? "default" : "destructive"}
            className="mt-2 text-xs"
          >
            {maxSales > maxSalesTarget ? '✅ Passed' : '❌ Failed'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Sales</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${avgSales.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            Per record average
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
