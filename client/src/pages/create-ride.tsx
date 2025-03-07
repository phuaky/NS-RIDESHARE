import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRideSchema } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { LocationMap } from "@/components/map/location-map";
import { useState, useEffect } from "react";

interface LocationPoint {
  id: string;
  position: [number, number];
  name: string;
}

export default function CreateRide() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<LocationPoint | null>(null);
  const [dropoffLocations, setDropoffLocations] = useState<LocationPoint[]>([]);
  const [locationTab, setLocationTab] = useState("pickup");
  const [showPassportReminder, setShowPassportReminder] = useState(true);

  const form = useForm({
    resolver: zodResolver(insertRideSchema),
    defaultValues: {
      direction: "SG->FC",
      date: new Date(),
      maxPassengers: 4,
      pickupLocation: "",
      dropoffLocations: [],
      cost: 80,
      additionalStops: 0,
    },
  });
  
  // Update form values when locations change
  useEffect(() => {
    if (selectedPickupLocation) {
      form.setValue('pickupLocation', selectedPickupLocation.name);
    }
    
    if (dropoffLocations.length > 0) {
      form.setValue('dropoffLocations', dropoffLocations.map(loc => loc.name));
      // Update additional stops based on number of dropoff locations
      form.setValue('additionalStops', Math.max(0, dropoffLocations.length - 1));
    }
  }, [selectedPickupLocation, dropoffLocations, form]);
  
  // Calculate total cost
  const baseCost = form.watch('cost') || 0;
  const additionalStops = form.watch('additionalStops') || 0;
  const totalCost = baseCost + (additionalStops * 5); // $5 per additional stop
  
  // Handle pickup location selection
  const handlePickupSelect = (location: LocationPoint) => {
    setSelectedPickupLocation(location);
  };
  
  // Handle dropoff location selection
  const handleDropoffSelect = (location: LocationPoint) => {
    setDropoffLocations([...dropoffLocations, location]);
  };
  
  // Handle dropoff location removal
  const handleDropoffRemove = (locationId: string) => {
    setDropoffLocations(dropoffLocations.filter(loc => loc.id !== locationId));
  };

  const createRideMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create a deep copy of the data to avoid modifying form state
      const submissionData = { ...data };
      
      // Ensure we're passing a proper Date object to the API
      if (typeof submissionData.date === 'string') {
        submissionData.date = new Date(submissionData.date);
      }
      
      // Validate the date before submission
      if (!(submissionData.date instanceof Date) || isNaN(submissionData.date.getTime())) {
        throw new Error("Invalid date provided");
      }
      
      // Convert date to ISO string for proper serialization
      submissionData.date = submissionData.date.toISOString();
      
      const res = await apiRequest("POST", "/api/rides", submissionData);
      return res.json();
    },
    onSuccess: (newRide) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      toast({
        title: "Success",
        description: "Ride created successfully",
        variant: "success",
      });
      // Redirect to ride details page
      setLocation(`/rides/${newRide.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get current direction value from form
  const currentDirection = form.watch('direction');
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Ride</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createRideMutation.mutate(data)
                )}
                className="space-y-6"
              >
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
                            onClick={() => {
                              field.onChange("SG->FC");
                              setLocationTab("pickup");
                            }}
                          >
                            Singapore to Forest City
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "FC->SG" ? "default" : "outline"}
                            className="flex-1 justify-center py-6 text-base"
                            onClick={() => {
                              field.onChange("FC->SG");
                              setLocationTab("dropoff");
                            }}
                          >
                            Forest City to Singapore
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field: { value, onChange, ...fieldProps } }) => {
                    // Format the date value for the datetime-local input
                    const dateValue = value instanceof Date 
                      ? value.toISOString().slice(0, 16) 
                      : typeof value === 'string' && value
                        ? value.slice(0, 16) 
                        : '';
                        
                    return (
                      <FormItem>
                        <FormLabel>Date and Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            value={dateValue}
                            onChange={(e) => {
                              // Make sure to create a valid Date object from the input
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

                <FormField
                  control={form.control}
                  name="maxPassengers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Passengers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Map and Location Selection */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium">Locations</h3>
                  
                  {showPassportReminder && (
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
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
                  
                  {/* Only show pickup location for SG->FC */}
                  {currentDirection === "SG->FC" ? (
                    <div>
                      <FormField
                        control={form.control}
                        name="pickupLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup Location</FormLabel>
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
                        <LocationMap 
                          selectedLocations={selectedPickupLocation ? [selectedPickupLocation] : []} 
                          onLocationSelect={handlePickupSelect}
                          editable
                        />
                      </div>
                    </div>
                  ) : (
                    /* Only show dropoff locations for FC->SG */
                    <div>
                      <CardContent className="p-0 pt-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {dropoffLocations.map((location) => (
                            <Badge key={location.id} variant="secondary" className="py-2">
                              {location.name}
                              <button 
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                onClick={() => handleDropoffRemove(location.id)}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          {dropoffLocations.length === 0 && (
                            <p className="text-sm text-gray-500">No dropoff locations added yet. Select points on the map below.</p>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <LocationMap 
                            selectedLocations={dropoffLocations} 
                            onLocationSelect={handleDropoffSelect}
                            onLocationRemove={handleDropoffRemove}
                            editable
                          />
                        </div>
                      </CardContent>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Cost (SGD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalStops"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Stops</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cost Summary */}
                <div className="border rounded-md p-4 mt-6 bg-gray-50">
                  <h3 className="font-medium mb-2">Cost Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <span>${baseCost} SGD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Stops ({additionalStops}):</span>
                      <span>${additionalStops * 5} SGD</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Cost:</span>
                      <span>${totalCost} SGD</span>
                    </div>
                    {form.watch('maxPassengers') > 0 && (
                      <div className="flex justify-between text-green-600 pt-2">
                        <span>Cost per person (if full):</span>
                        <span>${(totalCost / form.watch('maxPassengers')).toFixed(2)} SGD</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRideMutation.isPending}
                >
                  {createRideMutation.isPending ? "Creating..." : "Create Ride"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
