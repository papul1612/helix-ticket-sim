
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
