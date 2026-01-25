'use client';

import { useUnits } from '@/components/providers/units-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function UnitSelector() {
  const { unitSystem, setUnitSystem } = useUnits();

  return (
    <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 px-2 text-xs font-medium rounded-md',
          unitSystem === 'metric'
            ? 'bg-background shadow-sm'
            : 'hover:bg-transparent text-muted-foreground'
        )}
        onClick={() => setUnitSystem('metric')}
      >
        km
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 px-2 text-xs font-medium rounded-md',
          unitSystem === 'imperial'
            ? 'bg-background shadow-sm'
            : 'hover:bg-transparent text-muted-foreground'
        )}
        onClick={() => setUnitSystem('imperial')}
      >
        mi
      </Button>
    </div>
  );
}
