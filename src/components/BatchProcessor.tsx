
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Download, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BatchTicket {
  id: string;
  content: string;
  sql: string;
  criteria: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any[];
  error?: string;
}

interface BatchProcessorProps {
  onBack: () => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBack }) => {
  const [batchContent, setBatchContent] = useState('');
  const [tickets, setTickets] = useState<BatchTicket[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const mockBatchExample = `Ticket #HELIX-12345
Request: Execute monthly sales report for Q1 2024
SQL: \`\`\`sql
SELECT product_id, sales, region, date FROM orders WHERE date BETWEEN '2024-01-01' AND '2024-03-31'
\`\`\`
Success Criteria: ROWCOUNT > 100 AND MAX(sales) > 5000

---

Ticket #HELIX-12346
Request: Get top performing products
SQL: \`\`\`sql
SELECT product_id, SUM(sales) as total_sales FROM orders GROUP BY product_id ORDER BY total_sales DESC LIMIT 10
\`\`\`
Success Criteria: ROWCOUNT = 10 AND MIN(total_sales) > 1000

---

Ticket #HELIX-12347
Request: Regional sales analysis
SQL: \`\`\`sql
SELECT region, AVG(sales) as avg_sales, COUNT(*) as order_count FROM orders GROUP BY region
\`\`\`
Success Criteria: ROWCOUNT > 2 AND MIN(avg_sales) > 500`;

  const handleLoadExample = () => {
    setBatchContent(mockBatchExample);
    toast({
      title: "Example loaded",
      description: "Sample batch tickets have been loaded."
    });
  };

  const parseBatchTickets = () => {
    const ticketSections = batchContent.split('---').filter(section => section.trim());
    
    const parsedTickets: BatchTicket[] = ticketSections.map((section, index) => {
      const idMatch = section.match(/Ticket #([\w-]+)/);
      const sqlMatch = section.match(/```sql\s*([\s\S]*?)\s*```/);
      const criteriaMatch = section.match(/Success Criteria:\s*(.+)/);

      return {
        id: idMatch?.[1] || `BATCH-${index + 1}`,
        content: section.trim(),
        sql: sqlMatch?.[1]?.trim() || '',
        criteria: criteriaMatch?.[1]?.trim() || '',
        status: 'pending' as const
      };
    });

    setTickets(parsedTickets);
    toast({
      title: "Tickets parsed",
      description: `${parsedTickets.length} tickets ready for processing.`
    });
  };

  const processBatchTickets = async () => {
    if (tickets.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      
      // Update ticket status to processing
      setTickets(prev => prev.map(t => 
        t.id === ticket.id ? { ...t, status: 'processing' } : t
      ));

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock results generation
      const mockResults = Array(Math.floor(Math.random() * 150) + 50).fill(null).map((_, idx) => ({
        product_id: `PROD-${1000 + idx}`,
        sales: Math.floor(Math.random() * 8000) + 1000,
        region: idx % 2 === 0 ? 'West' : 'East',
      }));

      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;

      // Update ticket with results
      setTickets(prev => prev.map(t => 
        t.id === ticket.id ? {
          ...t,
          status: success ? 'completed' : 'failed',
          results: success ? mockResults : undefined,
          error: success ? undefined : 'Query execution failed'
        } : t
      ));

      // Update progress
      setProgress(((i + 1) / tickets.length) * 100);
    }

    setIsProcessing(false);
    toast({
      title: "Batch processing completed",
      description: `Processed ${tickets.length} tickets.`
    });
  };

  const exportResults = () => {
    const completedTickets = tickets.filter(t => t.status === 'completed');
    const exportData = completedTickets.map(ticket => ({
      ticket_id: ticket.id,
      sql: ticket.sql,
      criteria: ticket.criteria,
      row_count: ticket.results?.length || 0,
      status: ticket.status
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_results.json';
    a.click();

    toast({
      title: "Results exported",
      description: "Batch results have been downloaded."
    });
  };

  const getStatusIcon = (status: BatchTicket['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const failedCount = tickets.filter(t => t.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Single Mode
        </Button>
      </div>

      {/* Input Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Batch Ticket Input
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLoadExample} className="text-sm">
              Load Example
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste multiple tickets separated by '---' lines..."
            value={batchContent}
            onChange={(e) => setBatchContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={parseBatchTickets}
              disabled={!batchContent.trim()}
              variant="outline"
            >
              Parse Tickets
            </Button>
            <Button
              onClick={processBatchTickets}
              disabled={tickets.length === 0 || isProcessing}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              <Play className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Process All'}
            </Button>
            {completedCount > 0 && (
              <Button
                onClick={exportResults}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {isProcessing && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Batch</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {tickets.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Batch Results</span>
              <div className="flex gap-4 text-sm">
                <Badge variant="outline" className="bg-green-50">
                  Completed: {completedCount}
                </Badge>
                <Badge variant="outline" className="bg-red-50">
                  Failed: {failedCount}
                </Badge>
                <Badge variant="outline">
                  Total: {tickets.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <h4 className="font-medium">{ticket.id}</h4>
                      <p className="text-sm text-gray-600">
                        {ticket.status === 'completed' && ticket.results
                          ? `${ticket.results.length} rows returned`
                          : ticket.status === 'failed'
                          ? ticket.error || 'Processing failed'
                          : 'Waiting for processing'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      ticket.status === 'completed'
                        ? 'default'
                        : ticket.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
