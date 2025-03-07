import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRidePassengerSchema } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { RideCard } from "@/components/ride-card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { LocationMap } from "@/components/map/location-map";
import { useState, useEffect } from "react";

interface LocationPoint {
  id: string;
  position: [number, number];
  name: string;
}

export default function JoinRide() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  // Get the ride ID from the route parameters instead of query params
  const [, params] = useRoute("/rides/:id/join");
  const rideId = params?.id;
  console.log("Ride ID from route params:", rideId);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const [showPassportReminder, setShowPassportReminder] = useState(true);

  const { data: ride, isLoading } = useQuery({
    queryKey: [`/api/rides/${rideId}`],
    enabled: !!rideId,
  });

  const form = useForm({
    resolver: zodResolver(insertRidePassengerSchema),
    defaultValues: {
      rideId: parseInt(rideId || "0"),
      dropoffLocation: "",
    },
  });
  
  // Handle location selection
  const handleLocationSelect = (location: LocationPoint) => {
    setSelectedLocation(location);
    form.setValue('dropoffLocation', location.name);
  };

  const joinRideMutation = useMutation({
    mutationFn: async (data: any) => {
      // Log the data being sent to the server
      console.log("Joining ride with data:", data);
      const res = await apiRequest(
        "POST",
        `/api/rides/${data.rideId}/join`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      toast({
        title: "Success",
        description: "Successfully joined the ride",
        variant: "success",
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="max-w-3xl mx-auto px-4 py-8 pt-20">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Ride Not Found</CardTitle>
              <CardDescription>
                The ride you're looking for could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                The ride may have been cancelled or doesn't exist. Please check the ride ID and try again.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setLocation("/home")}>
                  View Available Rides
                </Button>
                <Button onClick={() => setLocation("/rides/create")}>
                  Create a New Ride
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8 pt-20">
        <div className="space-y-8">
          <RideCard ride={ride} showActions={false} />

          <Card>
            <CardHeader>
              <CardTitle>Join This Ride</CardTitle>
              <CardDescription>
                Select your drop-off location to join this ride
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showPassportReminder && ride.direction === "SG->FC" && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200 mb-6">
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
              
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    joinRideMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="dropoffLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drop-off Location</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Select a location on the map or enter here" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Select Location on Map</h3>
                    <LocationMap 
                      selectedLocations={selectedLocation ? [selectedLocation] : []} 
                      onLocationSelect={handleLocationSelect}
                      editable
                    />
                  </div>
                  
                  {ride.direction === "FC->SG" && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">Drop-off Sequence</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        The ride organizer will set the drop-off sequence for all passengers traveling from Forest City to Singapore.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Cost Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Cost:</span>
                        <span>${ride.cost} SGD</span>
                      </div>
                      {ride.additionalStops > 0 && (
                        <div className="flex justify-between">
                          <span>Additional Stops ({ride.additionalStops}):</span>
                          <span>${ride.additionalStops * 5} SGD</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium pt-2 border-t mt-2">
                        <span>Total Cost:</span>
                        <span>${ride.cost + (ride.additionalStops * 5)} SGD</span>
                      </div>
                      <div className="flex justify-between text-green-600 pt-2">
                        <span>Your Cost (estimated):</span>
                        <span>${((ride.cost + (ride.additionalStops * 5)) / ride.maxPassengers).toFixed(2)} SGD</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={joinRideMutation.isPending}
                  >
                    {joinRideMutation.isPending ? "Joining..." : "Join Ride"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
