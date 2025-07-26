import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibilityIndicatorProps {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  grade: 'excellent' | 'good' | 'poor' | 'fail';
  onFix?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showFixButton?: boolean;
}

export const AccessibilityIndicator: React.FC<AccessibilityIndicatorProps> = ({
  ratio,
  wcagAA,
  wcagAAA,
  grade,
  onFix,
  size = 'md',
  showFixButton = true
}) => {
  const getGradeConfig = () => {
    switch (grade) {
      case 'excellent':
        return {
          icon: CheckCircle,
          color: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
          text: 'AAA',
          description: 'Excellent contrast'
        };
      case 'good':
        return {
          icon: CheckCircle,
          color: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
          text: 'AA',
          description: 'Good contrast'
        };
      case 'poor':
        return {
          icon: AlertTriangle,
          color: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
          text: 'Poor',
          description: 'Poor contrast'
        };
      case 'fail':
        return {
          icon: XCircle,
          color: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
          text: 'Fail',
          description: 'Failed contrast'
        };
    }
  };

  const config = getGradeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm',
    lg: 'h-6 w-6 text-base'
  };

  const shouldShowFix = showFixButton && (grade === 'poor' || grade === 'fail') && onFix;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          config.color,
          sizeClasses[size]
        )}
      >
        <Icon className={cn("shrink-0", sizeClasses[size])} />
        <span className="font-medium">{config.text}</span>
        <span className="text-muted-foreground font-normal">
          {ratio.toFixed(1)}:1
        </span>
      </Badge>
      
      {shouldShowFix && (
        <Button
          size="sm"
          variant="outline"
          onClick={onFix}
          className="h-6 px-2 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
        >
          <Zap className="h-3 w-3 mr-1" />
          Fix
        </Button>
      )}
    </div>
  );
};

export default AccessibilityIndicator;