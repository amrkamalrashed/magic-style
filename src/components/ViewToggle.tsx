import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className
}) => {
  const views = [
    { id: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid View' },
    { id: 'list' as ViewMode, icon: List, label: 'List View' }
  ];

  return (
    <div className={cn("flex bg-surface-elevated rounded-lg p-1", className)}>
      {views.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(id)}
          className={cn(
            "h-8 px-3 transition-all",
            currentView === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};

export default ViewToggle;