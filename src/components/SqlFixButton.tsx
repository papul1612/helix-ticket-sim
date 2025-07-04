
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SqlFixButtonProps {
  sql: string;
  onSqlFixed: (fixedSql: string) => void;
}

export const SqlFixButton: React.FC<SqlFixButtonProps> = ({ sql, onSqlFixed }) => {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const handleFixSql = async () => {
    setIsFixing(true);
    
    try {
      // Simulate AI-powered SQL fixing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock SQL fixes - in real implementation, this would call an AI API
      const commonFixes = [
        {
          pattern: /SELCT/gi,
          replacement: 'SELECT'
        },
        {
          pattern: /FORM/gi,
          replacement: 'FROM'
        },
        {
          pattern: /WEHERE/gi,
          replacement: 'WHERE'
        },
        {
          pattern: /GROPU BY/gi,
          replacement: 'GROUP BY'
        },
        {
          pattern: /ORDR BY/gi,
          replacement: 'ORDER BY'
        }
      ];

      let fixedSql = sql;
      let hasChanges = false;

      commonFixes.forEach(fix => {
        if (fix.pattern.test(fixedSql)) {
          fixedSql = fixedSql.replace(fix.pattern, fix.replacement);
          hasChanges = true;
        }
      });

      // Add missing semicolons
      if (!fixedSql.trim().endsWith(';')) {
        fixedSql = fixedSql.trim() + ';';
        hasChanges = true;
      }

      // Format SQL for better readability
      if (!hasChanges) {
        // If no syntax errors found, apply formatting improvements
        fixedSql = fixedSql
          .replace(/\s+/g, ' ')
          .replace(/,\s*/g, ',\n  ')
          .replace(/\bFROM\b/gi, '\nFROM')
          .replace(/\bWHERE\b/gi, '\nWHERE')
          .replace(/\bAND\b/gi, '\n  AND')
          .replace(/\bOR\b/gi, '\n  OR')
          .replace(/\bORDER BY\b/gi, '\nORDER BY')
          .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
          .trim();
        hasChanges = true;
      }

      if (hasChanges) {
        onSqlFixed(fixedSql);
        toast({
          title: "SQL Fixed",
          description: "SQL has been automatically corrected and formatted."
        });
      } else {
        toast({
          title: "SQL Already Correct",
          description: "No syntax errors or improvements found."
        });
      }
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: "Unable to fix SQL. Please check manually.",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFixSql}
      disabled={isFixing}
      className="flex items-center gap-2"
    >
      <Wrench className="w-4 h-4" />
      {isFixing ? "Fixing..." : "Fix SQL"}
    </Button>
  );
};
