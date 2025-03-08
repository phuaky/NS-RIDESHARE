import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRideSchema, type InsertRide } from "@shared/schema";
import { z } from "zod";
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
import { formatForDateTimeInput } from "@/lib/utils";

// Define types for the form data
interface DropoffLocation {
  location: string;
  passengerCount: number;
}

interface RideData {
  id?: string;
  creatorId?: string;
  direction: "SG->FC" | "FC->SG";
  date: Date | string;
  maxPassengers: number;
  pickupLocation?: string;
  dropoffLocations?: DropoffLocation[] | string[];
  organizerPassengerCount?: number;
}

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
  const { data: rideToEdit, isLoading } = useQuery<RideData>({
    queryKey: [`/api/rides/${rideId}`],
    enabled: isEditing,
  });

  // Extended form schema with organizerLocation field
  const formSchema = insertRideSchema.extend({
    organizerLocation: z.string().min(1, "Please specify your location"),
    organizerPassengerCount: insertRideSchema.shape.organizerPassengerCount.default(1),
    dropoffLocations: insertRideSchema.shape.dropoffLocations.default([])
  });

  // Form setup with validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      direction: "SG->FC",
      date: new Date(),
      maxPassengers: 4,
      pickupLocation: "",
      dropoffLocations: [],
      organizerPassengerCount: 1,
      organizerLocation: "",
    },
    mode: "onBlur", // Validate fields when they lose focus
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

      // Ensure we have a valid passengerCount
      const passengerCount = 
        Array.isArray(rideToEdit.dropoffLocations) && rideToEdit.dropoffLocations[0] && 
        typeof rideToEdit.dropoffLocations[0] === 'object' && 'passengerCount' in rideToEdit.dropoffLocations[0]
          ? rideToEdit.dropoffLocations[0].passengerCount
          : typeof rideToEdit.organizerPassengerCount === 'number' 
            ? rideToEdit.organizerPassengerCount 
            : 1;

      // Extract organizer location based on direction
      let organizerLocation = "";
      
      if (rideToEdit.direction === "SG->FC") {
        // For SG->FC, the organizer location is the pickup location
        organizerLocation = rideToEdit.pickupLocation || "";
      } else {
        // For FC->SG, the organizer location is the first dropoff location
        if (Array.isArray(rideToEdit.dropoffLocations) && rideToEdit.dropoffLocations[0]) {
          if (typeof rideToEdit.dropoffLocations[0] === 'object' && 'location' in rideToEdit.dropoffLocations[0]) {
            organizerLocation = rideToEdit.dropoffLocations[0].location;
          } else if (typeof rideToEdit.dropoffLocations[0] === 'string') {
            organizerLocation = rideToEdit.dropoffLocations[0];
          }
        }
      }

      // Reset form with ride data
      form.reset({
        direction: rideToEdit.direction,
        date,
        maxPassengers: rideToEdit.maxPassengers,
        pickupLocation: rideToEdit.pickupLocation || "",
        dropoffLocations: [],  // We'll manage this separately
        organizerPassengerCount: passengerCount,
        organizerLocation: organizerLocation,
      });
    }
  }, [rideToEdit, isEditing, isLoading, form, toast, setLocation, user]);

  // Watch form fields for dynamic updates
  const currentDirection = form.watch('direction');
  const organizerLocation = form.watch('organizerLocation');
  const organizerPassengerCount = form.watch('organizerPassengerCount');

  // Update dropoffLocations whenever organizerLocation or organizerPassengerCount changes
  useEffect(() => {
    if (organizerLocation && organizerPassengerCount) {
      if (currentDirection === "FC->SG") {
        form.setValue(
          "dropoffLocations",
          [{ location: organizerLocation.trim(), passengerCount: organizerPassengerCount }],
          { shouldValidate: true }
        );
      }
    }
  }, [organizerLocation, organizerPassengerCount, currentDirection, form]);

  // Mutation for creating or updating a ride
  const rideMutation = useMutation({
    mutationFn: async (data: any) => {
      const submissionData = { ...data };

      // Ensure date is properly formatted for submission
      if (submissionData.date instanceof Date) {
        // Convert to ISO string for storage
        submissionData.date = submissionData.date.toISOString();
      } else if (typeof submissionData.date === 'string') {
        // If date is already a string, parse it first to ensure it's valid
        const date = new Date(submissionData.date);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date provided");
        }
        submissionData.date = date.toISOString();
      }

      // Ensure organizerPassengerCount is a number
      submissionData.organizerPassengerCount = Number(submissionData.organizerPassengerCount);
      if (isNaN(submissionData.organizerPassengerCount) || submissionData.organizerPassengerCount < 1) {
        submissionData.organizerPassengerCount = 1;
      }

      // Set pickupLocation based on direction
      if (submissionData.direction === "FC->SG") {
        submissionData.pickupLocation = "Forest City"; // Fixed pickup point for FC->SG
      } else {
        submissionData.pickupLocation = submissionData.organizerLocation.trim(); // Organizer's pickup for SG->FC
      }

      // Format dropoff locations based on direction
      if (submissionData.direction === "FC->SG") {
        // For FC->SG, use the already formatted dropoffLocations (set by useEffect)
        // We don't need to do anything as it's already correctly formatted
      } else {
        // For SG->FC, set dropoffLocations to the organizer's pickup location
        submissionData.dropoffLocations = [{
          location: submissionData.organizerLocation.trim(),
          passengerCount: Number(submissionData.organizerPassengerCount)
        }];
      }

      // Remove temporary field
      delete submissionData.organizerLocation;

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

  // Ensure organizerPassengerCount has a default value when switching directions
  useEffect(() => {
    const currentValue = form.getValues('organizerPassengerCount');
    if (!currentValue || isNaN(Number(currentValue))) {
      form.setValue('organizerPassengerCount', 1);
    }
  }, [currentDirection, form]);

  return (
    <div className="min-h-screen pt-20">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Ride" : "Create a New Ride"}</CardTitle>
            <CardDescription>
              {currentDirection === "FC->SG" 
                ? "Enter your drop-off location in Singapore and the number of passengers in your group"
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
                    // Format date for datetime-local input
                    const dateValue = value instanceof Date 
                      ? formatForDateTimeInput(value)
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
                                // When user inputs date, store it directly
                                const inputDate = new Date(e.target.value);
                                if (!isNaN(inputDate.getTime())) {
                                  onChange(inputDate);
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

                  {/* Passenger Count - Same for both directions */}
                  <FormField
                    control={form.control}
                    name="organizerPassengerCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Passengers at Your Location</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="4"
                            {...field}
                            value={field.value === undefined || field.value === null ? 1 : field.value}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              // Ensure value is valid, defaulting to 1 if parsing fails
                              field.onChange(isNaN(value) ? 1 : Math.max(1, Math.min(4, value)));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Organizer Location - dynamic label based on direction */}
                  <FormField
                    control={form.control}
                    name="organizerLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {currentDirection === "SG->FC" 
                            ? "Your Pickup Location in Singapore" 
                            : "Your Drop-off Location in Singapore"}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder={
                              currentDirection === "SG->FC" 
                                ? "e.g., Pasir Ris MRT" 
                                : "e.g., Tampines Mall"
                            }
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