import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Share2, Edit, MapPin, Users, MessageCircle, Calendar, DollarSign, Clock, CheckCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { LocationMap } from "@/components/map/location-map";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RideCard } from "@/components/ride-card";

// Define interfaces for our data types
interface LocationPoint {
  id: string;
  position: [number, number];
  name: string;
}

interface RidePassenger {
  id: number;
  rideId: number;
  userId: number;
  dropoffLocation: string;
  dropoffSequence: number | null;
  user?: {
    id: number;
    username: string;
    fullName: string;
    discordUsername: string;
    whatsappNumber: string | null;
    malaysianNumber: string | null;
    revolutUsername: string | null;
  };
}

export default function RideDetails() {
  const [, params] = useRoute("/rides/:id");
  const rideId = params?.id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [dropoffLocations, setDropoffLocations] = useState<LocationPoint[]>([]);
  
  // Ride data fetch
  const { data: ride, isLoading: isRideLoading, error: rideError } = useQuery({
    queryKey: [`/api/rides/${rideId}`],
    enabled: !!rideId,
  });

  // Passengers data fetch - only if user is authenticated
  const { 
    data: passengers, 
    isLoading: isPassengersLoading,
    refetch: refetchPassengers 
  } = useQuery({
    queryKey: [`/api/rides/${rideId}/passengers`],
    enabled: !!rideId && !!user,
    onError: (error) => {
      console.error("Failed to fetch passengers:", error);
    }
  });

  // Join ride mutation
  const joinRideMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to join a ride");
      if (!ride) throw new Error("Ride not found");
      
      // For simplicity, when joining from details page, we use the first dropoff location
      // Normally you would show a form to select or input location
      const dropoffLocation = ride.direction === "SG->FC" 
        ? ride.dropoffLocations[0] 
        : ride.pickupLocation;
        
      const res = await apiRequest(
        "POST",
        `/api/rides/${rideId}/join`,
        { dropoffLocation, rideId: parseInt(rideId || "0") }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rides/${rideId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rides/${rideId}/passengers`] });
      refetchPassengers();
      toast({
        title: "Success",
        description: "You have joined the ride",
        variant: "success",
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

  // Process drop-off locations once ride data is loaded
  useEffect(() => {
    if (ride) {
      // Convert ride drop-off locations to map format
      const locations = ride.dropoffLocations.map((loc, index) => ({
        id: `dropoff-${index}`,
        // This is a placeholder since we don't have real coordinates - in real app get from API
        position: [1.3521 + (index * 0.01), 103.8198 + (index * 0.01)] as [number, number], 
        name: loc
      }));
      
      // Add pickup location if available
      if (ride.pickupLocation) {
        locations.push({
          id: 'pickup',
          // This is a placeholder
          position: [1.3421, 103.7998] as [number, number],
          name: ride.pickupLocation
        });
      }
      
      setDropoffLocations(locations);
    }
  }, [ride]);

  // Check if the current user is already a passenger
  const isUserPassenger = passengers?.some(p => p.userId === user?.id);
  
  // Check if the user is the ride creator
  const isCreator = user && ride && user.id === ride.creatorId;
  
  // Check if the ride is full
  const isFull = ride && ride.currentPassengers >= ride.maxPassengers;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-SG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Format direction for display
  const formatDirection = (direction: string) => {
    return direction === "SG->FC" ? "Singapore to Forest City" : "Forest City to Singapore";
  };

  // Generate a WhatsApp group link with all passengers
  const createWhatsAppGroup = () => {
    if (!passengers || passengers.length === 0) {
      toast({
        title: "Error",
        description: "No passengers to add to WhatsApp group",
        variant: "destructive",
      });
      return;
    }

    // Filter passengers with WhatsApp numbers
    const phoneNumbers = passengers
      .filter(p => p.user?.whatsappNumber)
      .map(p => p.user?.whatsappNumber)
      .join(',');
    
    if (!phoneNumbers) {
      toast({
        title: "No WhatsApp Numbers",
        description: "None of the passengers have registered their WhatsApp numbers",
        variant: "destructive",
      });
      return;
    }

    // Create group name based on ride details
    const groupName = `RideShare: ${formatDirection(ride.direction)} ${new Date(ride.date).toLocaleDateString()}`;
    
    // WhatsApp doesn't have a direct group creation URL, so we'll copy text to clipboard instead
    const messageText = `Create a WhatsApp group called "${groupName}" with these contacts:\n\n${
      passengers
        .filter(p => p.user?.whatsappNumber)
        .map(p => `${p.user?.fullName}: ${p.user?.whatsappNumber}`)
        .join('\n')
    }`;
    
    navigator.clipboard.writeText(messageText);
    
    toast({
      title: "Copied to Clipboard",
      description: "Passenger information copied. Open WhatsApp and create a new group with these contacts.",
    });
  };

  // Generate a Discord invite text
  const createDiscordGroup = () => {
    if (!passengers || passengers.length === 0) {
      toast({
        title: "Error",
        description: "No passengers to add to Discord group",
        variant: "destructive",
      });
      return;
    }

    // Filter passengers with Discord usernames
    const discordUsers = passengers
      .filter(p => p.user?.discordUsername)
      .map(p => p.user?.discordUsername)
      .join(', ');
    
    if (!discordUsers) {
      toast({
        title: "No Discord Usernames",
        description: "None of the passengers have registered their Discord usernames",
        variant: "destructive",
      });
      return;
    }

    // Create group name based on ride details
    const groupName = `RideShare: ${formatDirection(ride.direction)} ${new Date(ride.date).toLocaleDateString()}`;
    
    // Copy Discord usernames to clipboard
    const messageText = `Create a Discord group called "${groupName}" with these users:\n\n${
      passengers
        .filter(p => p.user?.discordUsername)
        .map(p => `${p.user?.fullName}: ${p.user?.discordUsername}`)
        .join('\n')
    }`;
    
    navigator.clipboard.writeText(messageText);
    
    toast({
      title: "Copied to Clipboard",
      description: "Discord usernames copied. Open Discord and create a new group with these users.",
    });
  };

  // Generate shareable trip summary
  const generateTripSummary = () => {
    if (!ride) return;
    
    const directionText = formatDirection(ride.direction);
    const dateText = formatDate(ride.date);
    const totalCost = ride.cost + (ride.additionalStops * 5);
    const perPersonCost = (totalCost / (ride.maxPassengers || 1)).toFixed(2);
    
    const summary = `🚗 RideShare Trip Summary 🚗\n\n` +
      `Direction: ${directionText}\n` +
      `Date & Time: ${dateText}\n` +
      `Pickup: ${ride.pickupLocation}\n` +
      `Passengers: ${ride.currentPassengers}/${ride.maxPassengers}\n` +
      `Total Cost: $${totalCost} SGD\n` +
      `Cost per person: $${perPersonCost} SGD\n\n` +
      `📱 Join through the RideShare app: https://rideshare.app/rides/${ride.id}`;
      
    try {
      navigator.clipboard.writeText(summary);
      toast({
        title: "Trip summary copied to clipboard!",
        description: "You can now paste it in WhatsApp or other messaging apps.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the text manually.",
        variant: "destructive",
      });
    }
  };

  if (isRideLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </div>
    );
  }

  if (!ride || rideError) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="max-w-3xl mx-auto px-4 py-8">
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
                <Button variant="outline" onClick={() => navigate("/home")}>
                  View Available Rides
                </Button>
                <Button onClick={() => navigate("/rides/create")}>
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
    <div className="min-h-screen pb-16">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Ride Card */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {formatDirection(ride.direction)}
              </h1>
              <p className="text-muted-foreground">
                {formatDate(ride.date)}
              </p>
            </div>
            <div className="flex gap-2">
              {isCreator && (
                <Button variant="outline" onClick={() => navigate(`/rides/edit/${ride.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Ride
                </Button>
              )}
              <Button variant="outline" onClick={generateTripSummary}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-green-50 border-green-200 text-green-700">
              {ride.status === "open" ? "Open" : ride.status === "assigned" ? "Driver Assigned" : "Completed"}
            </Badge>
            
            <div className="text-sm text-muted-foreground">
              <Users className="inline-block h-4 w-4 mr-1" />
              {ride.currentPassengers}/{ride.maxPassengers} passengers
            </div>
            
            {isFull && (
              <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                Full
              </Badge>
            )}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="passengers">
                Passengers
                {!user && <span className="ml-1 opacity-60">(Login required)</span>}
              </TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ride Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Date & Time</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(ride.date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">
                            {ride.direction === "SG->FC" ? "Pickup Location" : "Dropoff Locations"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {ride.direction === "SG->FC" 
                              ? ride.pickupLocation
                              : ride.dropoffLocations.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <DollarSign className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Cost</h4>
                          <div className="text-sm text-muted-foreground">
                            <div className="flex justify-between gap-4">
                              <span>Base Cost:</span>
                              <span>${ride.cost} SGD</span>
                            </div>
                            {ride.additionalStops > 0 && (
                              <div className="flex justify-between gap-4">
                                <span>Additional Stops:</span>
                                <span>${ride.additionalStops * 5} SGD</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-4 font-medium">
                              <span>Total Cost:</span>
                              <span>${ride.cost + (ride.additionalStops * 5)} SGD</span>
                            </div>
                            <div className="flex justify-between gap-4 text-green-600">
                              <span>Per Person (if full):</span>
                              <span>${((ride.cost + (ride.additionalStops * 5)) / ride.maxPassengers).toFixed(2)} SGD</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Join Ride Section */}
              {user && !isCreator && !isUserPassenger && !isFull && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Join This Ride</CardTitle>
                    <CardDescription>
                      There are {ride.maxPassengers - ride.currentPassengers} spots left on this ride
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/rides/${ride.id}/join`)}
                    >
                      Select Drop-off Location to Join
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Already Joined Section */}
              {user && isUserPassenger && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                      You've Joined This Ride
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-700 mb-4">
                      You're all set for this trip! The ride organizer will confirm details closer to the departure date.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-300 hover:border-blue-400 hover:bg-blue-100 text-blue-800"
                      onClick={() => navigate(`/home`)}
                    >
                      View Your Rides
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Not Logged In section */}
              {!user && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                      Login Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-700 mb-4">
                      You need to login to join this ride or view passenger information.
                    </p>
                    <Button 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      onClick={() => navigate(`/auth`)}
                    >
                      Login or Register
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Creator Info for Non-Creators */}
              {user && !isCreator && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ride Organizer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      To contact the ride organizer, please use the messaging options below.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Passengers Tab */}
            <TabsContent value="passengers" className="space-y-6 pt-4">
              {!user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Login Required</CardTitle>
                    <CardDescription>
                      You need to login to view passenger information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => navigate("/auth")}
                      className="w-full"
                    >
                      Login or Register
                    </Button>
                  </CardContent>
                </Card>
              ) : isPassengersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
              ) : passengers && passengers.length > 0 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Passengers ({passengers.length}/{ride.maxPassengers})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {passengers.map((passenger, index) => (
                          <div key={passenger.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{passenger.user?.fullName || "Unknown User"}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {passenger.dropoffLocation}
                                  {passenger.dropoffSequence && (
                                    <Badge variant="secondary" className="ml-2">
                                      Stop #{passenger.dropoffSequence}
                                    </Badge>
                                  )}
                                </p>
                              </div>
                              {isCreator && (
                                <Badge>Passenger {index + 1}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Communication Options (for both creators and passengers) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={createWhatsAppGroup}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp Group
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={createDiscordGroup}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Discord Group
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Passengers Yet</CardTitle>
                    <CardDescription>
                      This ride doesn't have any passengers yet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Be the first to join this ride!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {ride.direction === "SG->FC" ? "Pickup & Dropoff Locations" : "Dropoff Locations"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap 
                    selectedLocations={dropoffLocations} 
                    height="400px"
                  />
                  <div className="mt-4">
                    <h4 className="font-medium">Locations</h4>
                    <div className="grid gap-2 mt-2">
                      {ride.direction === "SG->FC" && (
                        <div className="p-2 border rounded-md">
                          <Badge className="bg-blue-500">Pickup</Badge>
                          <p className="mt-1">{ride.pickupLocation}</p>
                        </div>
                      )}
                      
                      {ride.dropoffLocations.map((location, index) => (
                        <div key={index} className="p-2 border rounded-md">
                          <Badge variant="outline">Dropoff {index + 1}</Badge>
                          <p className="mt-1">{location}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}