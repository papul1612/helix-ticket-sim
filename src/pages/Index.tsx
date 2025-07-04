import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Database, Mail, Copy, Clipboard, ArrowRight, Wrench, BarChart3, FileStack } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SqlFixButton } from '@/components/SqlFixButton';
import { SimpleCriteriaChart } from '@/components/SimpleCriteriaChart';
import { BatchProcessor } from '@/components/BatchProcessor';
import { ErrorDialog } from '@/components/ErrorDialog';
import { MultiQueryResults } from '@/components/MultiQueryResults';

interface ParsedTicket {
  id: string;
  sql: string;
  criteria: string;
  isValid: boolean;
  isFixed?: boolean; // Track if SQL has been auto-fixed
  sqlQueries?: string[]; // Support multiple SQL queries
  description?: string;
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
  const [helixTicketNumber, setHelixTicketNumber] = useState('');
  const [isRetrievingTicket, setIsRetrievingTicket] = useState(false);
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

  // Mock Helix tickets database with various scenarios
  const mockHelixTickets: { [key: string]: any } = {
    'HELIX-12345': {
      id: 'HELIX-12345',
      description: 'Execute monthly sales report for Q1 2024',
      sql: `SELECT product_id, sales, region, date 
FROM orders 
WHERE date BETWEEN '2024-01-01' AND '2024-03-31' 
AND region IN ('West', 'East')
ORDER BY sales DESC;`,
      criteria: 'ROWCOUNT > 100 AND MAX(sales) > 5000',
      mockResults: Array(120).fill(null).map((_, i) => ({
        product_id: `PROD-${1000 + i}`,
        sales: Math.floor(Math.random() * 8000) + 1000,
        region: i % 2 === 0 ? 'West' : 'East',
        date: `2024-0${Math.floor(Math.random() * 3) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
      }))
    },
    'HELIX-54321': {
      id: 'HELIX-54321',
      description: 'Low inventory alert report - CRITERIA WILL FAIL',
      sql: `SELECT product_id, inventory_count, warehouse_location 
FROM inventory 
WHERE inventory_count < 50 
ORDER BY inventory_count ASC;`,
      criteria: 'ROWCOUNT > 200 AND MIN(inventory_count) < 10',
      mockResults: Array(45).fill(null).map((_, i) => ({
        product_id: `PROD-${2000 + i}`,
        inventory_count: Math.floor(Math.random() * 40) + 5,
        warehouse_location: i % 3 === 0 ? 'Warehouse A' : i % 3 === 1 ? 'Warehouse B' : 'Warehouse C',
      }))
    },
    'HELIX-98765': {
      id: 'HELIX-98765',
      description: 'Multi-query customer analysis report',
      sqlQueries: [
        `SELECT customer_id, total_orders, total_spent 
FROM customer_summary 
WHERE total_spent > 1000 
ORDER BY total_spent DESC;`,
        `SELECT region, COUNT(*) as customer_count, AVG(total_spent) as avg_spent
FROM customer_summary 
WHERE total_spent > 1000 
GROUP BY region;`
      ],
      sql: `-- Query 1: High-value customers
SELECT customer_id, total_orders, total_spent 
FROM customer_summary 
WHERE total_spent > 1000 
ORDER BY total_spent DESC;

-- Query 2: Regional analysis
SELECT region, COUNT(*) as customer_count, AVG(total_spent) as avg_spent
FROM customer_summary 
WHERE total_spent > 1000 
GROUP BY region;`,
      criteria: 'ROWCOUNT > 50 AND AVG(total_spent) > 1500',
      mockResults: Array(85).fill(null).map((_, i) => ({
        customer_id: `CUST-${3000 + i}`,
        total_orders: Math.floor(Math.random() * 50) + 5,
        total_spent: Math.floor(Math.random() * 5000) + 1000,
        region: i % 4 === 0 ? 'North' : i % 4 === 1 ? 'South' : i % 4 === 2 ? 'East' : 'West'
      }))
    },
    'HELIX-11111': {
      id: 'HELIX-11111',
      description: 'SQL with syntax errors - needs auto-fix',
      sql: `SELCT product_id, sales, region 
FORM orders 
WEHERE date BETWEN '2024-01-01' AND '2024-03-31' 
AND region IN ('west', 'east')
ORDR BY sales DESC`,
      criteria: 'ROWCOUNT > 80 AND MAX(sales) > 3000',
      mockResults: Array(95).fill(null).map((_, i) => ({
        product_id: `PROD-${4000 + i}`,
        sales: Math.floor(Math.random() * 6000) + 1000,
        region: i % 2 === 0 ? 'West' : 'East',
        date: `2024-0${Math.floor(Math.random() * 3) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
      }))
    },
    'HELIX-22222': {
      id: 'HELIX-22222',
      description: 'Multi-query report - ALL QUERIES PASS',
      sqlQueries: [
        `SELECT product_id, sales, region 
FROM orders 
WHERE sales > 2000 
ORDER BY sales DESC;`,
        `SELECT region, COUNT(*) as order_count, AVG(sales) as avg_sales
FROM orders 
WHERE sales > 2000 
GROUP BY region;`,
        `SELECT customer_id, total_spent 
FROM customer_summary 
WHERE total_spent > 3000;`
      ],
      sql: `-- Query 1: High-value orders
SELECT product_id, sales, region 
FROM orders 
WHERE sales > 2000 
ORDER BY sales DESC;

-- Query 2: Regional sales analysis
SELECT region, COUNT(*) as order_count, AVG(sales) as avg_sales
FROM orders 
WHERE sales > 2000 
GROUP BY region;

-- Query 3: Premium customers
SELECT customer_id, total_spent 
FROM customer_summary 
WHERE total_spent > 3000;`,
      criteria: 'Query 1: ROWCOUNT > 50 AND MAX(sales) > 4000; Query 2: ROWCOUNT > 2 AND AVG(avg_sales) > 3000; Query 3: ROWCOUNT > 30 AND MAX(total_spent) > 5000',
      mockResults: {
        query1: Array(75).fill(null).map((_, i) => ({
          product_id: `PROD-${5000 + i}`,
          sales: Math.floor(Math.random() * 4000) + 2000,
          region: i % 3 === 0 ? 'North' : i % 3 === 1 ? 'South' : 'West'
        })),
        query2: [
          { region: 'North', order_count: 25, avg_sales: 3200 },
          { region: 'South', order_count: 30, avg_sales: 3400 },
          { region: 'West', order_count: 20, avg_sales: 3100 }
        ],
        query3: Array(45).fill(null).map((_, i) => ({
          customer_id: `CUST-${6000 + i}`,
          total_spent: Math.floor(Math.random() * 3000) + 3000
        }))
      }
    },
    'HELIX-33333': {
      id: 'HELIX-33333',
      description: 'Multi-query report - ALL QUERIES FAIL',
      sqlQueries: [
        `SELECT product_id, sales 
FROM orders 
WHERE sales > 1000 
LIMIT 10;`,
        `SELECT region, COUNT(*) as customer_count
FROM customers 
GROUP BY region 
LIMIT 2;`,
        `SELECT inventory_id, stock_level
FROM inventory 
WHERE stock_level < 100 
LIMIT 5;`
      ],
      sql: `-- Query 1: Basic sales data (will fail row count)
SELECT product_id, sales 
FROM orders 
WHERE sales > 1000 
LIMIT 10;

-- Query 2: Customer regions (will fail row count)
SELECT region, COUNT(*) as customer_count
FROM customers 
GROUP BY region 
LIMIT 2;

-- Query 3: Low inventory (will fail criteria)
SELECT inventory_id, stock_level
FROM inventory 
WHERE stock_level < 100 
LIMIT 5;`,
      criteria: 'Query 1: ROWCOUNT > 50 AND MAX(sales) > 5000; Query 2: ROWCOUNT > 10 AND MAX(customer_count) > 1000; Query 3: ROWCOUNT > 20 AND MIN(stock_level) < 10',
      mockResults: {
        query1: Array(10).fill(null).map((_, i) => ({
          product_id: `PROD-${7000 + i}`,
          sales: Math.floor(Math.random() * 2000) + 1000
        })),
        query2: [
          { region: 'East', customer_count: 150 },
          { region: 'West', customer_count: 200 }
        ],
        query3: Array(5).fill(null).map((_, i) => ({
          inventory_id: `INV-${8000 + i}`,
          stock_level: Math.floor(Math.random() * 50) + 20
        }))
      }
    },
    'HELIX-44444': {
      id: 'HELIX-44444',
      description: 'Multi-query report - MIXED RESULTS (some pass, some fail)',
      sqlQueries: [
        `SELECT product_id, sales, category
FROM products 
WHERE sales > 1500 
ORDER BY sales DESC;`,
        `SELECT store_id, revenue, employees
FROM stores 
WHERE revenue > 50000;`,
        `SELECT campaign_id, clicks, conversions
FROM marketing_campaigns 
WHERE clicks > 100;`
      ],
      sql: `-- Query 1: Product sales (WILL PASS)
SELECT product_id, sales, category
FROM products 
WHERE sales > 1500 
ORDER BY sales DESC;

-- Query 2: Store performance (WILL FAIL)
SELECT store_id, revenue, employees
FROM stores 
WHERE revenue > 50000;

-- Query 3: Marketing campaigns (WILL PASS)
SELECT campaign_id, clicks, conversions
FROM marketing_campaigns 
WHERE clicks > 100;`,
      criteria: 'Query 1: ROWCOUNT > 40 AND MAX(sales) > 4000; Query 2: ROWCOUNT > 50 AND AVG(revenue) > 75000; Query 3: ROWCOUNT > 25 AND MAX(clicks) > 500',
      mockResults: {
        query1: Array(60).fill(null).map((_, i) => ({
          product_id: `PROD-${9000 + i}`,
          sales: Math.floor(Math.random() * 3000) + 1500,
          category: i % 4 === 0 ? 'Electronics' : i % 4 === 1 ? 'Clothing' : i % 4 === 2 ? 'Home' : 'Sports'
        })),
        query2: Array(15).fill(null).map((_, i) => ({
          store_id: `STORE-${100 + i}`,
          revenue: Math.floor(Math.random() * 30000) + 50000,
          employees: Math.floor(Math.random() * 20) + 5
        })),
        query3: Array(35).fill(null).map((_, i) => ({
          campaign_id: `CAMP-${200 + i}`,
          clicks: Math.floor(Math.random() * 800) + 100,
          conversions: Math.floor(Math.random() * 50) + 5
        }))
      }
    }
  };

  const retrieveHelixTicket = async (ticketNumber: string) => {
    setIsRetrievingTicket(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const ticket = mockHelixTickets[ticketNumber];
        
        if (ticket) {
          setTicketContent(`Ticket #${ticket.id}
Request: ${ticket.description}
SQL: \`\`\`sql
${ticket.sql}
\`\`\`
Success Criteria: ${ticket.criteria}`);
          
          toast({
            title: "Ticket retrieved successfully",
            description: `Helix ticket ${ticketNumber} has been loaded.`
          });
        } else {
          toast({
            title: "Ticket not found",
            description: `Helix ticket ${ticketNumber} could not be found in the system.`,
            variant: "destructive"
          });
        }
        
        setIsRetrievingTicket(false);
        resolve();
      }, 1500);
    });
  };

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
        // Use ticket-specific mock results if available from Helix mode
        let queryResults = mockResults; // Default results
        
        if (parsedTicket) {
          const ticket = mockHelixTickets[parsedTicket.id];
          if (ticket && ticket.mockResults) {
            // For multi-query tickets, use the first query results as the main results
            // The MultiQueryResults component will handle displaying all query results
            if (typeof ticket.mockResults === 'object' && !Array.isArray(ticket.mockResults)) {
              queryResults = ticket.mockResults.query1 || [];
            } else {
              queryResults = ticket.mockResults;
            }
          }
        }
        
        // Ensure queryResults is always an array
        if (!Array.isArray(queryResults)) {
          queryResults = [];
        }
        
        setResults(queryResults);
        setStep(3);
        toast({
          title: "Query executed",
          description: `Query returned ${queryResults.length} rows successfully.`
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
    
    // Skip validation for previously fixed SQL
    if (parsedTicket.isFixed) {
      executeQueryAfterValidation();
      return;
    }
    
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
        sql: fixedSql,
        isFixed: true // Mark as fixed to skip validation
      };
      setParsedTicket(updatedTicket);
      
      // Close the error dialog
      setErrorDialog({ ...errorDialog, isOpen: false });
      
      // Show success message and let user manually execute
      toast({
        title: "SQL Fixed",
        description: "SQL has been corrected. Review the changes and click 'Execute Query' to proceed."
      });
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

        // Format SQL - handle multi-query SQL with proper spacing
        if (fixedSql.includes('-- Query')) {
          // For multi-query SQL, ensure proper spacing between queries
          fixedSql = fixedSql
            .replace(/;\s*--\s*Query/g, ';\n\n-- Query')
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
            .trim();
        } else {
          // Format single SQL - minimal formatting, only where needed
          fixedSql = fixedSql
            .replace(/\s+/g, ' ') // Normalize whitespace first
            .replace(/\bFROM\b/gi, '\nFROM')
            .replace(/\bWHERE\b/gi, '\nWHERE')
            .replace(/\bORDER BY\b/gi, '\nORDER BY')
            .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
            .trim();
        }

        resolve(fixedSql);
      }, 800);
    });
  };

  const evaluateCriteria = () => {
    if (!results.length) return { passed: false, message: "No results", rowCount: 0, maxSales: 0 };
    
    const rowCount = results.length;
    
    // Handle different types of criteria based on the ticket
    if (parsedTicket) {
      const ticket = mockHelixTickets[parsedTicket.id];
      
      if (ticket) {
        // Handle multi-query tickets
        if (ticket.mockResults && typeof ticket.mockResults === 'object' && !Array.isArray(ticket.mockResults)) {
          return evaluateMultiQueryCriteria(parsedTicket.id, ticket.mockResults);
        }
        
        // Handle specific single-query ticket criteria
        if (parsedTicket.id === 'HELIX-54321') {
          // Inventory ticket - ROWCOUNT > 200 AND MIN(inventory_count) < 10
          const minInventory = Math.min(...results.map(r => (r as any).inventory_count || 0));
          const rowCountPassed = rowCount > 200;
          const minInventoryPassed = minInventory < 10;
          
          return {
            passed: rowCountPassed && minInventoryPassed,
            message: `ROWCOUNT = ${rowCount} (${rowCountPassed ? '✅' : '❌'} > 200), MIN(inventory_count) = ${minInventory} (${minInventoryPassed ? '✅' : '❌'} < 10)`,
            rowCount,
            maxSales: 0
          };
        } else if (parsedTicket.id === 'HELIX-11111') {
          // Fixed SQL ticket - ROWCOUNT > 80 AND MAX(sales) > 3000
          const maxSales = Math.max(...results.map(r => r.sales || 0));
          const rowCountPassed = rowCount > 80;
          const maxSalesPassed = maxSales > 3000;
          
          return {
            passed: rowCountPassed && maxSalesPassed,
            message: `ROWCOUNT = ${rowCount} (${rowCountPassed ? '✅' : '❌'} > 80), MAX(sales) = ${maxSales} (${maxSalesPassed ? '✅' : '❌'} > 3000)`,
            rowCount,
            maxSales
          };
        }
      }
    }
    
    // Default criteria - ROWCOUNT > 100 AND MAX(sales) > 5000
    const maxSales = Math.max(...results.map(r => r.sales || 0));
    const rowCountPassed = rowCount > 100;
    const maxSalesPassed = maxSales > 5000;
    
    return {
      passed: rowCountPassed && maxSalesPassed,
      message: `ROWCOUNT = ${rowCount} (${rowCountPassed ? '✅' : '❌'} > 100), MAX(sales) = ${maxSales} (${maxSalesPassed ? '✅' : '❌'} > 5000)`,
      rowCount,
      maxSales
    };
  };

  const evaluateMultiQueryCriteria = (ticketId: string, mockResults: any) => {
    const queryEvaluations = [];
    let overallPassed = true;

    if (ticketId === 'HELIX-98765') {
      // Original multi-query customer analysis
      const avgSpent = results.reduce((sum, r) => sum + ((r as any).total_spent || 0), 0) / results.length;
      const rowCountPassed = results.length > 50;
      const avgSpentPassed = avgSpent > 1500;
      
      return {
        passed: rowCountPassed && avgSpentPassed,
        message: `ROWCOUNT = ${results.length} (${rowCountPassed ? '✅' : '❌'} > 50), AVG(total_spent) = ${avgSpent.toFixed(2)} (${avgSpentPassed ? '✅' : '❌'} > 1500)`,
        rowCount: results.length,
        maxSales: avgSpent,
        queryEvaluations: [{
          queryNumber: 1,
          passed: rowCountPassed && avgSpentPassed,
          message: `ROWCOUNT = ${results.length} (${rowCountPassed ? '✅' : '❌'} > 50), AVG(total_spent) = ${avgSpent.toFixed(2)} (${avgSpentPassed ? '✅' : '❌'} > 1500)`,
          rowCount: results.length,
          results: results.slice(0, 10)
        }]
      };
    } else if (ticketId === 'HELIX-22222') {
      // All queries pass scenario
      const query1Results = mockResults.query1;
      const query2Results = mockResults.query2;
      const query3Results = mockResults.query3;
      
      // Query 1: ROWCOUNT > 50 AND MAX(sales) > 4000
      const q1RowCount = query1Results.length;
      const q1MaxSales = Math.max(...query1Results.map(r => r.sales));
      const q1Pass = q1RowCount > 50 && q1MaxSales > 4000;
      
      // Query 2: ROWCOUNT > 2 AND AVG(avg_sales) > 3000
      const q2RowCount = query2Results.length;
      const q2AvgSales = query2Results.reduce((sum, r) => sum + r.avg_sales, 0) / query2Results.length;
      const q2Pass = q2RowCount > 2 && q2AvgSales > 3000;
      
      // Query 3: ROWCOUNT > 30 AND MAX(total_spent) > 5000
      const q3RowCount = query3Results.length;
      const q3MaxSpent = Math.max(...query3Results.map(r => r.total_spent));
      const q3Pass = q3RowCount > 30 && q3MaxSpent > 5000;
      
      queryEvaluations.push(
        {
          queryNumber: 1,
          passed: q1Pass,
          message: `ROWCOUNT = ${q1RowCount} (${q1RowCount > 50 ? '✅' : '❌'} > 50), MAX(sales) = ${q1MaxSales} (${q1MaxSales > 4000 ? '✅' : '❌'} > 4000)`,
          rowCount: q1RowCount,
          results: query1Results.slice(0, 10)
        },
        {
          queryNumber: 2,
          passed: q2Pass,
          message: `ROWCOUNT = ${q2RowCount} (${q2RowCount > 2 ? '✅' : '❌'} > 2), AVG(avg_sales) = ${q2AvgSales.toFixed(2)} (${q2AvgSales > 3000 ? '✅' : '❌'} > 3000)`,
          rowCount: q2RowCount,
          results: query2Results
        },
        {
          queryNumber: 3,
          passed: q3Pass,
          message: `ROWCOUNT = ${q3RowCount} (${q3RowCount > 30 ? '✅' : '❌'} > 30), MAX(total_spent) = ${q3MaxSpent} (${q3MaxSpent > 5000 ? '✅' : '❌'} > 5000)`,
          rowCount: q3RowCount,
          results: query3Results.slice(0, 10)
        }
      );
      
      overallPassed = q1Pass && q2Pass && q3Pass;
      
    } else if (ticketId === 'HELIX-33333') {
      // All queries fail scenario
      const query1Results = mockResults.query1;
      const query2Results = mockResults.query2;
      const query3Results = mockResults.query3;
      
      // Query 1: ROWCOUNT > 50 AND MAX(sales) > 5000 (WILL FAIL)
      const q1RowCount = query1Results.length;
      const q1MaxSales = Math.max(...query1Results.map(r => r.sales));
      const q1Pass = q1RowCount > 50 && q1MaxSales > 5000;
      
      // Query 2: ROWCOUNT > 10 AND MAX(customer_count) > 1000 (WILL FAIL)
      const q2RowCount = query2Results.length;
      const q2MaxCustomers = Math.max(...query2Results.map(r => r.customer_count));
      const q2Pass = q2RowCount > 10 && q2MaxCustomers > 1000;
      
      // Query 3: ROWCOUNT > 20 AND MIN(stock_level) < 10 (WILL FAIL)
      const q3RowCount = query3Results.length;
      const q3MinStock = Math.min(...query3Results.map(r => r.stock_level));
      const q3Pass = q3RowCount > 20 && q3MinStock < 10;
      
      queryEvaluations.push(
        {
          queryNumber: 1,
          passed: q1Pass,
          message: `ROWCOUNT = ${q1RowCount} (${q1RowCount > 50 ? '✅' : '❌'} > 50), MAX(sales) = ${q1MaxSales} (${q1MaxSales > 5000 ? '✅' : '❌'} > 5000)`,
          rowCount: q1RowCount,
          results: query1Results
        },
        {
          queryNumber: 2,
          passed: q2Pass,
          message: `ROWCOUNT = ${q2RowCount} (${q2RowCount > 10 ? '✅' : '❌'} > 10), MAX(customer_count) = ${q2MaxCustomers} (${q2MaxCustomers > 1000 ? '✅' : '❌'} > 1000)`,
          rowCount: q2RowCount,
          results: query2Results
        },
        {
          queryNumber: 3,
          passed: q3Pass,
          message: `ROWCOUNT = ${q3RowCount} (${q3RowCount > 20 ? '✅' : '❌'} > 20), MIN(stock_level) = ${q3MinStock} (${q3MinStock < 10 ? '✅' : '❌'} < 10)`,
          rowCount: q3RowCount,
          results: query3Results
        }
      );
      
      overallPassed = q1Pass && q2Pass && q3Pass;
      
    } else if (ticketId === 'HELIX-44444') {
      // Mixed results scenario (some pass, some fail)
      const query1Results = mockResults.query1;
      const query2Results = mockResults.query2;
      const query3Results = mockResults.query3;
      
      // Query 1: ROWCOUNT > 40 AND MAX(sales) > 4000 (WILL PASS)
      const q1RowCount = query1Results.length;
      const q1MaxSales = Math.max(...query1Results.map(r => r.sales));
      const q1Pass = q1RowCount > 40 && q1MaxSales > 4000;
      
      // Query 2: ROWCOUNT > 50 AND AVG(revenue) > 75000 (WILL FAIL)
      const q2RowCount = query2Results.length;
      const q2AvgRevenue = query2Results.reduce((sum, r) => sum + r.revenue, 0) / query2Results.length;
      const q2Pass = q2RowCount > 50 && q2AvgRevenue > 75000;
      
      // Query 3: ROWCOUNT > 25 AND MAX(clicks) > 500 (WILL PASS)
      const q3RowCount = query3Results.length;
      const q3MaxClicks = Math.max(...query3Results.map(r => r.clicks));
      const q3Pass = q3RowCount > 25 && q3MaxClicks > 500;
      
      queryEvaluations.push(
        {
          queryNumber: 1,
          passed: q1Pass,
          message: `ROWCOUNT = ${q1RowCount} (${q1RowCount > 40 ? '✅' : '❌'} > 40), MAX(sales) = ${q1MaxSales} (${q1MaxSales > 4000 ? '✅' : '❌'} > 4000)`,
          rowCount: q1RowCount,
          results: query1Results.slice(0, 10)
        },
        {
          queryNumber: 2,
          passed: q2Pass,
          message: `ROWCOUNT = ${q2RowCount} (${q2RowCount > 50 ? '✅' : '❌'} > 50), AVG(revenue) = ${q2AvgRevenue.toFixed(2)} (${q2AvgRevenue > 75000 ? '✅' : '❌'} > 75000)`,
          rowCount: q2RowCount,
          results: query2Results
        },
        {
          queryNumber: 3,
          passed: q3Pass,
          message: `ROWCOUNT = ${q3RowCount} (${q3RowCount > 25 ? '✅' : '❌'} > 25), MAX(clicks) = ${q3MaxClicks} (${q3MaxClicks > 500 ? '✅' : '❌'} > 500)`,
          rowCount: q3RowCount,
          results: query3Results.slice(0, 10)
        }
      );
      
      overallPassed = q1Pass && q2Pass && q3Pass;
    }
    
    return {
      passed: overallPassed,
      message: `Multi-query evaluation: ${queryEvaluations.filter(q => q.passed).length} of ${queryEvaluations.length} queries passed`,
      rowCount: queryEvaluations.reduce((sum, q) => sum + q.rowCount, 0),
      maxSales: 0,
      queryEvaluations
    };
  };

  const generateEmailTemplate = () => {
    const evaluation = evaluateCriteria();
    const isMultiQuery = (evaluation as any).queryEvaluations;
    
    if (isMultiQuery) {
      const queryEvals = (evaluation as any).queryEvaluations;
      const passedQueries = queryEvals.filter(q => q.passed).length;
      const totalQueries = queryEvals.length;
      
      return `Subject: Multi-Query Results for ${parsedTicket?.id || 'HELIX-XXXXX'}

Dear Requester,

Your multi-query SQL request has been executed with the following results:

Overall Status: ${evaluation.passed ? 'ALL QUERIES PASSED' : 'SOME QUERIES FAILED'}
Query Summary: ${passedQueries} of ${totalQueries} queries passed

${queryEvals.map(q => 
  `Query ${q.queryNumber}: ${q.passed ? 'PASSED' : 'FAILED'} (${q.rowCount} rows)
  Details: ${q.message}`
).join('\n\n')}

Please find the detailed results attached or contact us if you need the data in a different format.

Best regards,
Database Team`;
    }
    
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
    const isMultiQuery = (evaluation as any).queryEvaluations;
    
    if (isMultiQuery) {
      const queryEvals = (evaluation as any).queryEvaluations;
      const passedQueries = queryEvals.filter(q => q.passed).length;
      const totalQueries = queryEvals.length;
      
      return `[Automated Response]
Ticket: ${parsedTicket?.id || 'HELIX-XXXXX'}
Status: COMPLETED
Multi-query execution completed.
Overall Result: ${evaluation.passed ? 'ALL QUERIES PASSED' : 'SOME QUERIES FAILED'}
Query Results: ${passedQueries}/${totalQueries} queries passed
${queryEvals.map(q => `Query ${q.queryNumber}: ${q.passed ? 'PASS' : 'FAIL'} (${q.rowCount} rows)`).join('\n')}
Execution timestamp: ${new Date().toISOString()}`;
    }
    
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
              {!isApiMode ? (
                // Manual paste mode
                <>
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
                </>
              ) : (
                // Helix API mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Helix Ticket Number</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter ticket number (e.g., HELIX-12345)"
                        value={helixTicketNumber}
                        onChange={(e) => setHelixTicketNumber(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => retrieveHelixTicket(helixTicketNumber)}
                        disabled={!helixTicketNumber.trim() || isRetrievingTicket}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {isRetrievingTicket ? 'Retrieving...' : 'Retrieve'}
                      </Button>
                    </div>
                  </div>
                  
                   <div className="bg-blue-50 p-4 rounded-lg">
                     <h4 className="font-semibold text-blue-900 mb-2">Available Test Tickets:</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span>HELIX-12345</span>
                         <span className="text-blue-600">✅ Single query - will pass</span>
                       </div>
                       <div className="flex justify-between">
                         <span>HELIX-54321</span>
                         <span className="text-red-600">❌ Single query - will fail</span>
                       </div>
                       <div className="flex justify-between">
                         <span>HELIX-98765</span>
                         <span className="text-purple-600">📊 Multi-query - mixed results</span>
                       </div>
                       <div className="flex justify-between">
                         <span>HELIX-11111</span>
                         <span className="text-orange-600">🔧 Single query - needs fixing</span>
                       </div>
                       <div className="flex justify-between">
                         <span>HELIX-22222</span>
                         <span className="text-green-600">✅ Multi-query - all pass</span>
                       </div>
                       <div className="flex justify-between">
                         <span>HELIX-33333</span>
                         <span className="text-red-600">❌ Multi-query - all fail</span>
                       </div>
                       <div className="flex justify-between">
                         <span>HELIX-44444</span>
                         <span className="text-yellow-600">⚡ Multi-query - mixed (pass/fail)</span>
                       </div>
                     </div>
                   </div>

                  {ticketContent && (
                    <>
                      <Textarea
                        value={ticketContent}
                        onChange={(e) => setTicketContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm bg-gray-50"
                        readOnly
                      />
                      <Button
                        onClick={handleParseTicket}
                        className="w-full bg-indigo-500 hover:bg-indigo-600"
                      >
                        Parse Retrieved Ticket & Extract SQL
                      </Button>
                    </>
                  )}
                </div>
              )}
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
                <Textarea
                  value={parsedTicket.sql}
                  onChange={(e) => {
                    const updatedTicket = {
                      ...parsedTicket,
                      sql: e.target.value,
                      isFixed: false // Reset fix status when manually edited
                    };
                    setParsedTicket(updatedTicket);
                  }}
                  className="bg-gray-900 text-green-400 font-mono text-sm min-h-[200px] resize-y"
                  placeholder="SQL query..."
                />
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
                 {(() => {
                   const criteria = evaluateCriteria();
                   return (criteria as any).queryEvaluations ? (
                     <MultiQueryResults 
                       ticketId={parsedTicket?.id || ''}
                       queryEvaluations={(criteria as any).queryEvaluations}
                       overallPassed={criteria.passed}
                     />
                   ) : (
                   <>
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
                               {results.length > 0 && Object.keys(results[0]).map((key) => (
                                 <th key={key} className="text-left p-2 capitalize">
                                   {key.replace(/_/g, ' ')}
                                 </th>
                               ))}
                             </tr>
                           </thead>
                           <tbody>
                             {results.slice(0, 10).map((row, i) => (
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
                         {results.length > 10 && (
                           <div className="p-2 text-center text-gray-500 border-t">
                             ... and {results.length - 10} more rows
                           </div>
                         )}
                       </div>
                     </div>
                    </>
                  );
                })()}
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
