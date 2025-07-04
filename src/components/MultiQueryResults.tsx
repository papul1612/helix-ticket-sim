import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface QueryEvaluation {
  queryNumber: number;
  passed: boolean;
  message: string;
  rowCount: number;
  results: any[];
}

interface MultiQueryResultsProps {
  ticketId: string;
  queryEvaluations: QueryEvaluation[];
  overallPassed: boolean;
}

export const MultiQueryResults: React.FC<MultiQueryResultsProps> = ({
  ticketId,
  queryEvaluations,
  overallPassed
}) => {
  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className="mb-4">
        <Badge 
          variant={overallPassed ? "default" : "destructive"}
          className="text-sm p-2 mb-2"
        >
          {overallPassed ? '✅ All Criteria Met' : '❌ Some Criteria Failed'}
        </Badge>
        <p className="text-sm text-gray-600">
          Multi-query ticket: {queryEvaluations.filter(q => q.passed).length} of {queryEvaluations.length} queries passed
        </p>
      </div>

      {/* Individual Query Results */}
      <div className="space-y-4">
        {queryEvaluations.map((evaluation, index) => (
          <Card key={index} className="border-l-4" style={{
            borderLeftColor: evaluation.passed ? '#10b981' : '#ef4444'
          }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {evaluation.passed ? 
                  <CheckCircle className="w-5 h-5 text-green-500" /> : 
                  <XCircle className="w-5 h-5 text-red-500" />
                }
                Query {evaluation.queryNumber}
                <Badge variant={evaluation.passed ? "default" : "destructive"} className="ml-2">
                  {evaluation.passed ? 'PASS' : 'FAIL'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{evaluation.message}</p>
              
              {/* Query Results Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <p className="text-sm font-medium">Results ({evaluation.rowCount} rows)</p>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        {evaluation.results.length > 0 && Object.keys(evaluation.results[0]).map((key) => (
                          <th key={key} className="text-left p-2 capitalize">
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evaluation.results.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((value, j) => (
                            <td key={j} className="p-2">
                              {typeof value === 'number' && (value > 100 || String(value).includes('.')) 
                                ? `$${value.toLocaleString()}` 
                                : String(value)
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {evaluation.results.length > 3 && (
                    <div className="p-2 text-center text-gray-400 text-xs border-t">
                      ... and {evaluation.results.length - 3} more rows
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};