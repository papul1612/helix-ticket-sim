
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, Sparkles, Undo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SqlFixButtonProps {
  sql: string;
  onSqlFixed: (fixedSql: string) => void;
}

export const SqlFixButton = ({ sql, onSqlFixed }: SqlFixButtonProps) => {
  const [isFixing, setIsFixing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFixClick = async () => {
    setIsFixing(true);
    setHistory(prev => [...prev, sql]); // Save to undo history
    
    try {
      // Simulate AI API call with timeout
      const fixedSql = await mockAIFixSQL(sql);
      onSqlFixed(fixedSql);
      toast({
        title: "SQL Fixed",
        description: "The SQL has been automatically corrected.",
      });
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: "Unable to fix SQL automatically. Please check manually.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      onSqlFixed(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleFixClick}
        disabled={isFixing}
      >
        {isFixing ? (
          <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
        ) : (
          <Wrench className="w-4 h-4 mr-2" />
        )}
        Fix SQL
      </Button>
      
      {history.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          title="Undo last fix"
        >
          <Undo className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

// Mock AI service
const mockAIFixSQL = (sql: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Split SQL into individual queries (split by query comments)
      const queryBlocks = sql.split(/(?=--\s*Query\s+\d+:)/i).filter(block => block.trim());
      
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

      const fixedQueries = queryBlocks.map(queryBlock => {
        let fixedQuery = queryBlock;
        
        // Apply common fixes to each query
        fixes.forEach(([pattern, replacement]) => {
          fixedQuery = fixedQuery.replace(pattern, replacement);
        });

        // Add LIMIT if missing for this query
        if (!fixedQuery.includes('LIMIT') && !fixedQuery.includes('TOP')) {
          fixedQuery = fixedQuery.replace(/(ORDER BY.+?)(;|$)/i, '$1 LIMIT 1000$2');
        }

        // Add missing semicolons for this query
        if (!fixedQuery.trim().endsWith(';')) {
          fixedQuery = fixedQuery.trim() + ';';
        }

        // Format each query individually
        const lines = fixedQuery.split('\n');
        const formattedLines = lines.map(line => {
          const trimmedLine = line.trim();
          
          // Keep comment lines as-is
          if (trimmedLine.startsWith('--')) {
            return trimmedLine;
          }
          
          // Format SQL keywords on new lines only within the SQL part
          let formattedLine = trimmedLine
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\bFROM\b/gi, '\nFROM')
            .replace(/\bWHERE\b/gi, '\nWHERE')
            .replace(/\bORDER BY\b/gi, '\nORDER BY')
            .replace(/\bGROUP BY\b/gi, '\nGROUP BY');
          
          return formattedLine;
        });

        return formattedLines.join('\n').trim();
      });

      const finalSql = fixedQueries.join('\n\n');
      resolve(finalSql);
    }, 800);
  });
};
