import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRideSchema } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export default function CreateRide() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/rides/edit/:id");
  const isEditing = !!params?.id;
  const rideId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPassportReminder, setShowPassportReminder] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch ride data if editing
  const { data: rideToEdit, isLoading } = useQuery({
    queryKey: [`/api/rides/${rideId}`],
    enabled: isEditing,
  });

  // Form setup with validation
  const form = useForm({
    resolver: zodResolver(insertRideSchema.extend({
      organizerPassengerCount: insertRideSchema.shape.organizerPassengerCount.default(1),
      dropoffLocations: insertRideSchema.shape.dropoffLocations.default([])
    })),
    defaultValues: {
      direction: "SG->FC",
      date: new Date(),
      maxPassengers: 4,
      pickupLocation: "",
      dropoffLocations: [],
      organizerPassengerCount: 1,
    },
  });

  // Load ride data into form when editing
  useEffect(() => {
    if (isEditing && rideToEdit && !isLoading) {
      if (user?.id !== rideToEdit.creatorId) {
        toast({
          title: "Error",
          description: "You are not authorized to edit this ride",
          variant: "destructive",
        });
        setLocation("/home");
        return;
      }

      // Convert ISO string date to Date object
      const date = new Date(rideToEdit.date);

      // Reset form with ride data
      form.reset({
        ...rideToEdit,
        date,
        organizerPassengerCount: rideToEdit.dropoffLocations?.[0]?.passengerCount || 1,
        dropoffLocations: rideToEdit.direction === "FC->SG" 
          ? rideToEdit.dropoffLocations.map(d => d.location).join('\n')
          : rideToEdit.dropoffLocations
      });
    }
  }, [rideToEdit, isEditing, isLoading, form, toast, setLocation, user]);

  // Mutation for creating or updating a ride
  const rideMutation = useMutation({
    mutationFn: async (data: any) => {
      const submissionData = { ...data };

      // Ensure date is properly formatted
      if (submissionData.date instanceof Date) {
        submissionData.date = submissionData.date.toISOString();
      } else if (typeof submissionData.date === 'string') {
        const date = new Date(submissionData.date);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date provided");
        }
        submissionData.date = date.toISOString();
      }

      // Ensure organizerPassengerCount is a number
      submissionData.organizerPassengerCount = Number(submissionData.organizerPassengerCount);
      if (isNaN(submissionData.organizerPassengerCount)) {
        submissionData.organizerPassengerCount = 1;
      }

      // Format dropoff locations based on direction
      if (submissionData.direction === "FC->SG") {
        // For FC->SG rides
        const locations = typeof submissionData.dropoffLocations === 'string'
          ? submissionData.dropoffLocations.split('\n').filter(Boolean).map(loc => loc.trim())
          : Array.isArray(submissionData.dropoffLocations)
            ? submissionData.dropoffLocations
            : [];

        submissionData.dropoffLocations = locations.map(location => ({
          location: location,
          passengerCount: submissionData.organizerPassengerCount
        }));
      } else {
        // For SG->FC rides
        submissionData.dropoffLocations = [{
          location: submissionData.pickupLocation,
          passengerCount: submissionData.organizerPassengerCount
        }];
      }

      // Send request to API
      if (isEditing && rideId) {
        const res = await apiRequest("PATCH", `/api/rides/${rideId}`, submissionData);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/rides", submissionData);
        return res.json();
      }
    },
    onSuccess: (ride) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      queryClient.invalidateQueries({ queryKey: [`/api/rides/${rideId}`] });

      toast({
        title: "Success",
        description: isEditing ? "Ride updated successfully" : "Ride created successfully",
      });

      setLocation(`/rides/${ride.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation - moved inside component
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!rideId) throw new Error("No ride ID provided");
      const res = await apiRequest("DELETE", `/api/rides/${rideId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });

      toast({
        title: "Success",
        description: "Ride deleted successfully",
      });

      setLocation("/home");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete function - moved inside component
  const handleDeleteRide = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
      toast({
        title: "Confirm Deletion",
        description: "Click Delete again to confirm. This action cannot be undone.",
        variant: "destructive",
      });

      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 5000);
    }
  };

  // Watch form fields for conditional rendering
  const currentDirection = form.watch('direction');

  return (
    <div className="min-h-screen pt-20">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Ride" : "Create a New Ride"}</CardTitle>
            <CardDescription>
              {currentDirection === "FC->SG" 
                ? "Enter the drop-off locations in Singapore and the number of passengers in your group"
                : "Enter your pickup location in Singapore and the number of passengers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  rideMutation.mutate(data);
                })}
                className="space-y-6"
              >
                {/* Direction Selection */}
                <FormField
                  control={form.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Direction</FormLabel>
                      <FormControl>
                        <div className="flex flex-col md:flex-row gap-3">
                          <Button
                            type="button"
                            variant={field.value === "SG->FC" ? "default" : "outline"}
                            className="flex-1 justify-center py-6 text-base"
                            onClick={() => field.onChange("SG->FC")}
                          >
                            Singapore to Forest City
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "FC->SG" ? "default" : "outline"}
                            className="flex-1 justify-center py-6 text-base"
                            onClick={() => field.onChange("FC->SG")}
                          >
                            Forest City to Singapore
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Passenger Count - Moved outside direction conditional */}
                <FormField
                  control={form.control}
                  name="organizerPassengerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Passengers in Your Group</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="4"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Passengers */}
                <FormField
                  control={form.control}
                  name="maxPassengers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Total Passengers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date and Time */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field: { value, onChange, ...fieldProps } }) => {
                    const dateValue = value instanceof Date 
                      ? value.toISOString().slice(0, 16) 
                      : '';

                    return (
                      <FormItem>
                        <FormLabel>Date and Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            value={dateValue}
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value);
                                if (!isNaN(date.getTime())) {
                                  onChange(date);
                                }
                              }
                            }}
                            {...fieldProps}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Locations Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium">Locations</h3>

                  {showPassportReminder && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Don't forget to bring your passport! Many travelers have forgotten them in the past.
                        <button 
                          className="ml-2 text-amber-600 underline" 
                          onClick={() => setShowPassportReminder(false)}
                        >
                          Dismiss
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {currentDirection === "SG->FC" ? (
                    <FormField
                      control={form.control}
                      name="pickupLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Location in Singapore</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter your pickup location details"
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            You can enter multiple lines of text for detailed location instructions
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="dropoffLocations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drop-off Locations in Singapore</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="min-h-[100px]"
                              placeholder="Enter one location per line"
                              value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                              onChange={(e) => {
                                const locations = e.target.value.split('\n').filter(loc => loc.trim());
                                field.onChange(locations);
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter one location per line. These locations will be visited in sequence.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Submit and Delete Buttons */}
                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={rideMutation.isPending}
                  >
                    {rideMutation.isPending 
                      ? isEditing ? "Updating..." : "Creating..." 
                      : isEditing ? "Update Ride" : "Create Ride"
                    }
                  </Button>

                  {isEditing && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteRide}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete Ride"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}