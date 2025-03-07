import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RidePassenger } from "@shared/schema";

interface PassengerWithSequence extends RidePassenger {
  user?: {
    fullName: string;
  };
}

interface SequenceManagerProps {
  rideId: number;
}

export function SequenceManager({ rideId }: SequenceManagerProps) {
  const [passengers, setPassengers] = useState<PassengerWithSequence[]>([]);
  const [sequenceLocked, setSequenceLocked] = useState(false);
  const { toast } = useToast();

  // Fetch passengers
  const { data: passengersData, isLoading } = useQuery<PassengerWithSequence[]>({
    queryKey: [`/api/rides/${rideId}/passengers`],
    enabled: !!rideId,
  });

  useEffect(() => {
    if (passengersData) {
      const sortedPassengers = [...passengersData].sort((a, b) => {
        // If both have sequence numbers, sort by sequence
        if (a.dropoffSequence !== null && b.dropoffSequence !== null) {
          return a.dropoffSequence - b.dropoffSequence;
        }
        // If only a has sequence, a comes first
        if (a.dropoffSequence !== null) return -1;
        // If only b has sequence, b comes first
        if (b.dropoffSequence !== null) return 1;
        // If neither has sequence, keep original order
        return 0;
      });

      setPassengers(sortedPassengers);

      // Check if sequence is locked (all passengers have sequence numbers)
      const isLocked = sortedPassengers.length > 0 && 
        sortedPassengers.every(p => p.dropoffSequence !== null);
      setSequenceLocked(isLocked);
    }
  }, [passengersData]);

  // Update sequence mutation
  const updateSequenceMutation = useMutation({
    mutationFn: async ({ passengerId, sequence }: { passengerId: number, sequence: number }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/rides/${rideId}/passengers/${passengerId}/sequence`,
        { sequence }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rides/${rideId}/passengers`] });
      toast({
        title: "Success",
        description: "Passenger sequence updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Lock sequence mutation
  const lockSequenceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/rides/${rideId}/lockSequence`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rides/${rideId}/passengers`] });
      setSequenceLocked(true);
      toast({
        title: "Success",
        description: "Sequence locked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop
  const onDragEnd = (result: any) => {
    if (!result.destination || sequenceLocked) return;

    const items = Array.from(passengers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      dropoffSequence: index + 1,
    }));

    setPassengers(updatedItems);

    // Update sequence in database
    updateSequenceMutation.mutate({
      passengerId: reorderedItem.id,
      sequence: result.destination.index + 1,
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading passengers...</div>;
  }

  if (!passengers.length) {
    return <div className="text-center py-4">No passengers have joined this ride yet.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Drop-off Sequence</span>
          {sequenceLocked ? (
            <Lock className="h-5 w-5 text-red-500" />
          ) : (
            <Unlock className="h-5 w-5 text-green-500" />
          )}
        </CardTitle>
        <CardDescription>
          {sequenceLocked
            ? "The drop-off sequence has been locked."
            : "Drag to reorder the drop-off sequence for passengers."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sequenceLocked && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Drag and drop passengers to set the sequence in which they will be dropped off. Lock the sequence when finalized.
            </AlertDescription>
          </Alert>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {passengers.map((passenger, index) => (
                  <Draggable
                    key={passenger.id.toString()}
                    draggableId={passenger.id.toString()}
                    index={index}
                    isDragDisabled={sequenceLocked}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 rounded-md border ${
                          sequenceLocked ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold">
                            {passenger.dropoffSequence || index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{passenger.user?.fullName || 'Passenger'}</div>
                            <div className="text-sm text-gray-500">{passenger.dropoffLocation}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {!sequenceLocked && (
          <Button
            onClick={() => lockSequenceMutation.mutate()}
            className="w-full mt-4"
            variant="destructive"
            disabled={lockSequenceMutation.isPending}
          >
            {lockSequenceMutation.isPending ? "Locking..." : "Lock Sequence"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}