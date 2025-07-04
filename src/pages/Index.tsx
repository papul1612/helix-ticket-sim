import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Database, Mail, Copy, Clipboard, ArrowRight, Wrench, BarChart3, FileStack } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SqlFixButton } from '@/components/SqlFixButton';
import { SimpleCriteriaChart } from '@/components/SimpleCriteriaChart';
import { BatchProcessor } from '@/components/BatchProcessor';
import { ErrorDialog } from '@/components/ErrorDialog';

interface ParsedTicket {
  id: string;
  sql: string;
  criteria: string;
  isValid: boolean;
}

interface QueryResult {
  product_id: string;
  sales: number;
  region?: string;
  date?: string;
}

const Index = () => {
  const [step, setStep] = useState(1);
  const [ticketContent, setTicketContent] = useState('');
  const [parsedTicket, setParsedTicket] = useState<ParsedTicket | null>(null);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isApiMode, setIsApiMode] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    showFixButton: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    showFixButton: false
  });
  const { toast } = useToast();

  const mockTicketExample = `Ticket #HELIX-12345
Request: Execute monthly sales report for Q1 2024
SQL: \`\`\`sql
SELECT product_id, sales, region, date 
FROM orders 
WHERE date BETWEEN '2024-01-01' AND '2024-03-31' 
AND region IN ('West', 'East')
ORDER BY sales DESC
\`\`\`
Success Criteria: ROWCOUNT > 100 AND MAX(sales) > 5000`;

  const mockResults: QueryResult[] = Array(120).fill(null).map((_, i) => ({
    product_id: `PROD-${1000 + i}`,
    sales: Math.floor(Math.random() * 8000) + 1000,
    region: i % 2 === 0 ? 'West' : 'East',
    date: `2024-0${Math.floor(Math.random() * 3) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }));

  const handlePasteExample = () => {
    setTicketContent(mockTicketExample);
    toast({
      title: "Example loaded",
      description: "Mock ticket content has been pasted into the textarea."
    });
  };

  const handleParseTicket = () => {
    // Simulate parsing
    setTimeout(() => {
      const sqlMatch = ticketContent.match(/```sql\s*([\s\S]*?)\s*```/);
      const criteriaMatch = ticketContent.match(/Success Criteria:\s*(.+)/);
      const idMatch = ticketContent.match(/Ticket #([\w-]+)/);

      if (sqlMatch && criteriaMatch && idMatch) {
        setParsedTicket({
          id: idMatch[1],
          sql: sqlMatch[1].trim(),
          criteria: criteriaMatch[1].trim(),
          isValid: true
        });
        setStep(2);
        toast({
          title: "Ticket parsed successfully",
          description: "SQL and criteria have been extracted and validated."
        });
      } else {
        toast({
          title: "Parse error",
          description: "Unable to extract SQL or criteria from the ticket.",
          variant: "destructive"
        });
      }
    }, 500);
  };

  const simulateSqlValidation = (sql: string) => {
    // Check for common SQL issues
    const issues = [];
    
    if (sql.includes('DROP') || sql.includes('DELETE') || sql.includes('UPDATE')) {
      issues.push('Potentially dangerous SQL operations detected');
    }
    
    if (!sql.includes('LIMIT') && !sql.includes('TOP')) {
      issues.push('No row limit specified - query might return too many rows');
    }
    
    if (sql.includes('SELECT *')) {
      issues.push('Using SELECT * might impact performance');
    }
    
    // Simulate syntax errors
    if (sql.includes('SELCT') || sql.includes('FORM') || sql.includes('WEHERE')) {
      issues.push('SQL syntax errors detected');
    }
    
    return issues;
  };

  const executeQueryAfterValidation = () => {
    // Simulate query execution
    setTimeout(() => {
      try {
        setResults(mockResults);
        setStep(3);
        toast({
          title: "Query executed",
          description: `Query returned ${mockResults.length} rows successfully.`
        });
      } catch (error) {
        toast({
          title: "Execution failed",
          description: "An error occurred while executing the query.",
          variant: "destructive"
        });
      }
    }, 1000);
  };

  const handleExecuteQuery = () => {
    if (!parsedTicket) return;
    
    // Validate SQL before execution
    const sqlIssues = simulateSqlValidation(parsedTicket.sql);
    
    if (sqlIssues.length > 0) {
      setErrorDialog({
        isOpen: true,
        title: 'SQL Validation Issues',
        description: `The following issues were found:\n• ${sqlIssues.join('\n• ')}\n\nWould you like to fix these issues automatically?`,
        showFixButton: true
      });
      return;
    }
    
    executeQueryAfterValidation();
  };

  const handleSqlFixed = (fixedSql: string) => {
    if (parsedTicket) {
      const updatedTicket = {
        ...parsedTicket,
        sql: fixedSql
      };
      setParsedTicket(updatedTicket);
      
      // Close the error dialog
      setErrorDialog({ ...errorDialog, isOpen: false });
      
      // Re-validate the fixed SQL and proceed if valid
      const sqlIssues = simulateSqlValidation(fixedSql);
      
      if (sqlIssues.length === 0) {
        // If no issues after fixing, execute the query automatically
        executeQueryAfterValidation();
        toast({
          title: "SQL fixed and executed",
          description: "The SQL has been automatically corrected and executed."
        });
      } else {
        // If still issues, show them
        setErrorDialog({
          isOpen: true,
          title: 'Additional SQL Issues Found',
          description: `The following issues still remain:\n• ${sqlIssues.join('\n• ')}\n\nPlease review the SQL manually.`,
          showFixButton: false
        });
      }
    }
  };

  const handleErrorDialogFixClick = async () => {
    if (parsedTicket) {
      // Close dialog first to prevent re-triggering
      setErrorDialog({ ...errorDialog, isOpen: false });
      
      try {
        // Use the same AI fix logic as SqlFixButton
        const fixedSql = await mockAIFixSQL(parsedTicket.sql);
        handleSqlFixed(fixedSql);
        toast({
          title: "SQL Fixed",
          description: "The SQL has been automatically corrected.",
        });
      } catch (error) {
        toast({
          title: "Fix Failed",
          description: "Unable to fix SQL automatically. Please check manually.",
          variant: "destructive"
        });
      }
    }
  };

  // Mock AI service (shared with SqlFixButton)
  const mockAIFixSQL = (sql: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Common fixes
        const fixes: [RegExp, string][] = [
          [/SELCT/gi, 'SELECT'],
          [/FORM/gi, 'FROM'],
          [/WEHERE/gi, 'WHERE'],
          [/BETWEN/gi, 'BETWEEN'],
          [/GROPU BY/gi, 'GROUP BY'],
          [/ORDR BY/gi, 'ORDER BY'],
          [/ROMEQUINT/gi, 'ROWCOUNT'],
          [/RDAKCMUT/gi, 'ROWCOUNT'],
          [/'west'/gi, "'West'"],
          [/'east'/gi, "'East'"],
          [/'best'/g, "'West'"],
          [/'fast'/g, "'East'"],
          [/(SELECT\s+)\*/g, '$1product_id, sales, region, date'],
          [/'Jan 1 2024'/g, "'2024-01-01'"],
          [/'March 31st 2024'/g, "'2024-03-31'"],
        ];

        let fixedSql = sql;
        fixes.forEach(([pattern, replacement]) => {
          fixedSql = fixedSql.replace(pattern, replacement);
        });

        // Add LIMIT if missing
        if (!fixedSql.includes('LIMIT') && !fixedSql.includes('TOP')) {
          fixedSql = fixedSql.replace(/(ORDER BY.+?)(;|$)/i, '$1 LIMIT 1000$2');
        }

        // Add missing semicolons
        if (!fixedSql.trim().endsWith(';')) {
          fixedSql = fixedSql.trim() + ';';
        }

        // Format SQL
        fixedSql = fixedSql
          .replace(/\bFROM\b/gi, '\nFROM')
          .replace(/\bWHERE\b/gi, '\nWHERE')
          .replace(/\b(AND|OR)\b/gi, '\n  $1')
          .replace(/\b(ORDER BY|GROUP BY)\b/gi, '\n$1');

        resolve(fixedSql);
      }, 800);
    });
  };

  const evaluateCriteria = () => {
    if (!results.length) return { passed: false, message: "No results" };
    
    const rowCount = results.length;
    const maxSales = Math.max(...results.map(r => r.sales));
    
    const rowCountPassed = rowCount > 100;
    const maxSalesPassed = maxSales > 5000;
    
    return {
      passed: rowCountPassed && maxSalesPassed,
      message: `ROWCOUNT = ${rowCount} (${rowCountPassed ? '✅' : '❌'} > 100), MAX(sales) = ${maxSales} (${maxSalesPassed ? '✅' : '❌'} > 5000)`,
      rowCount,
      maxSales
    };
  };

  const generateEmailTemplate = () => {
    const evaluation = evaluateCriteria();
    return `Subject: Results for ${parsedTicket?.id || 'HELIX-XXXXX'}

Dear Requester,

Your SQL query has been executed successfully with the following results:

Query Results: ${results.length} rows returned
Criteria Evaluation: ${evaluation.passed ? 'PASSED' : 'FAILED'}
Details: ${evaluation.message}

Please find the results attached or contact us if you need the data in a different format.

Best regards,
Database Team`;
  };

  const generateHelixReply = () => {
    const evaluation = evaluateCriteria();
    return `[Automated Response]
Ticket: ${parsedTicket?.id || 'HELIX-XXXXX'}
Status: COMPLETED
Query executed successfully.
Results: ${results.length} rows returned.
Criteria evaluation: ${evaluation.passed ? 'PASSED' : 'FAILED'}
Details: ${evaluation.message}
Execution timestamp: ${new Date().toISOString()}`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} template has been copied.`
    });
  };

  if (isBatchMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Batch SQL Ticket Processing</h1>
            <p className="text-xl text-gray-600">Process multiple tickets simultaneously</p>
          </div>
          
          <BatchProcessor onBack={() => setIsBatchMode(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">SQL Ticket Workflow</h1>
          <p className="text-xl text-gray-600">Automated SQL execution and validation system</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsBatchMode(true)}
              className="flex items-center gap-2"
            >
              <FileStack className="w-4 h-4" />
              Batch Processing
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= stepNum 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <ArrowRight className={`w-6 h-6 mx-2 ${
                    step > stepNum ? 'text-indigo-500' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Input */}
        {step === 1 && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="w-6 h-6" />
                Step 1: Paste Ticket Content
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={isApiMode ? "default" : "outline"}
                  onClick={() => setIsApiMode(!isApiMode)}
                  className="text-sm"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isApiMode ? "API Connected" : "Paste Mode"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePasteExample}
                  className="text-sm"
                >
                  Load Example
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your Helix ticket content here..."
                value={ticketContent}
                onChange={(e) => setTicketContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <Button
                onClick={handleParseTicket}
                disabled={!ticketContent.trim()}
                className="w-full bg-indigo-500 hover:bg-indigo-600"
              >
                Parse Ticket & Extract SQL
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Validation */}
        {step === 2 && parsedTicket && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Step 2: SQL Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Extracted SQL:</h3>
                  <SqlFixButton sql={parsedTicket.sql} onSqlFixed={handleSqlFixed} />
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {parsedTicket.sql}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Success Criteria:</h3>
                <Badge variant="outline" className="text-sm p-2">
                  {parsedTicket.criteria}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Validation Checks:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>No DROP statements detected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Row limit within acceptable range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>SQL syntax validation passed</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleExecuteQuery}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Execute Query
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  Step 3: Query Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge 
                    variant={evaluateCriteria().passed ? "default" : "destructive"}
                    className="text-sm p-2"
                  >
                    {evaluateCriteria().passed ? '✅ Criteria Met' : '❌ Criteria Failed'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    {evaluateCriteria().message}
                  </p>
                </div>

                {/* Visual Criteria Indicators */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Criteria Visualization
                  </h3>
                  <SimpleCriteriaChart 
                    rowCount={evaluateCriteria().rowCount} 
                    maxSales={evaluateCriteria().maxSales}
                    results={results}
                  />
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <p className="font-semibold">Query Results ({results.length} rows)</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-2">Product ID</th>
                          <th className="text-left p-2">Sales</th>
                          <th className="text-left p-2">Region</th>
                          <th className="text-left p-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{row.product_id}</td>
                            <td className="p-2">${row.sales.toLocaleString()}</td>
                            <td className="p-2">{row.region}</td>
                            <td className="p-2">{row.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {results.length > 10 && (
                      <div className="p-2 text-center text-gray-500 border-t">
                        ... and {results.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email and Helix Templates */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {generateEmailTemplate()}
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(generateEmailTemplate(), "Email")}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Email Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Helix Reply Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {generateHelixReply()}
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(generateHelixReply(), "Helix reply")}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Helix Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button
                onClick={() => {
                  setStep(1);
                  setTicketContent('');
                  setParsedTicket(null);
                  setResults([]);
                }}
                variant="outline"
                className="mx-auto"
              >
                Process Another Ticket
              </Button>
            </div>
          </div>
        )}

        {/* Error Dialog */}
        <ErrorDialog
          isOpen={errorDialog.isOpen}
          onClose={() => setErrorDialog({ ...errorDialog, isOpen: false })}
          title={errorDialog.title}
          description={errorDialog.description}
          showFixButton={errorDialog.showFixButton}
          onFixClick={handleErrorDialogFixClick}
        />
      </div>
    </div>
  );
};

export default Index;
