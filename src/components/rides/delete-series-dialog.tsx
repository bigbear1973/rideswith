'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export type DeleteScope = 'this' | 'following' | 'all';

interface DeleteSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: DeleteScope) => Promise<void>;
  rideTitle: string;
  isRecurring: boolean;
  seriesCount?: number;
  followingCount?: number;
}

export function DeleteSeriesDialog({
  open,
  onOpenChange,
  onConfirm,
  rideTitle,
  isRecurring,
  seriesCount = 0,
  followingCount = 0,
}: DeleteSeriesDialogProps) {
  const [scope, setScope] = useState<DeleteScope>('this');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(scope);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset scope when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setScope('this');
    }
    onOpenChange(newOpen);
  };

  // For non-recurring rides, show simple confirmation
  if (!isRecurring) {
    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ride</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{rideTitle}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // For recurring rides, show options
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Recurring Ride</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{rideTitle}&quot; is part of a recurring series. What would you like to delete?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(value) => setScope(value as DeleteScope)}
          className="gap-4 py-4"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="this" id="delete-this" className="mt-1" />
            <div className="grid gap-1">
              <Label htmlFor="delete-this" className="font-medium cursor-pointer">
                This ride only
              </Label>
              <p className="text-sm text-muted-foreground">
                Delete only this occurrence. Other rides in the series will remain.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="following" id="delete-following" className="mt-1" />
            <div className="grid gap-1">
              <Label htmlFor="delete-following" className="font-medium cursor-pointer">
                This and following rides
                {followingCount > 1 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({followingCount} rides)
                  </span>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Delete this ride and all future rides in the series.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="all" id="delete-all" className="mt-1" />
            <div className="grid gap-1">
              <Label htmlFor="delete-all" className="font-medium cursor-pointer">
                All rides in series
                {seriesCount > 1 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({seriesCount} rides)
                  </span>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Delete the entire recurring series, including past rides.
              </p>
            </div>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
