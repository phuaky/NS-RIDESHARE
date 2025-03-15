import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Share2, Edit, MapPin, Users, MessageCircle, Calendar, DollarSign, Clock, CheckCircle, ChevronRight, AlertTriangle, Phone, Mail, User } from "lucide-react";
import { LocationMap } from "@/components/map/location-map";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RideCard } from "@/components/ride-card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Ride } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, isPastDate } from "@/lib/utils";

// Update the interfaces to match the new schema
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
  passengerCount: number;
  user?: {
    id: number;
    discordUsername: string;
    name: string | null;
    whatsappNumber: string | null;
    malaysianNumber: string | null;
    revolutUsername: string | null;
  };
}

// Update creator type to match the new schema
interface RideWithCreator extends Ride {
  creator?: {
    id: number;
    name: string | null;
    discordUsername: string;
    whatsappNumber: string | null;
    malaysianNumber: string | null;
    revolutUsername: string | null;
  };
}

// Form schema for joining a ride
const joinRideSchema = z.object({
  passengerCount: z.number()
    .min(1, "Must have at least 1 passenger")
    .max(4, "Cannot exceed 4 passengers"),
  dropoffLocation: z.string().min(1, "Drop-off location is required"),
});

type JoinRideFormData = z.infer<typeof joinRideSchema>;

// Add this component for contact display
function ContactInfo({ 
  label, 
  value, 
  icon: Icon, 
  type 
}: { 
  label: string; 
  value: string | null; 
  icon: any;
  type?: 'whatsapp' | 'discord';
}) {
  if (!value) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (type) {
                openDirectMessage(type, value);
              }
            }}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {value}</p>
          {type && <p className="text-xs text-muted-foreground">Click to open chat</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


export default function RideDetails() {
  const [, params] = useRoute("/rides/:id");
  const rideId = params?.id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [dropoffLocations, setDropoffLocations] = useState<LocationPoint[]>([]);

  // Update the type of ride to include creator
  const { data: ride, isLoading: isRideLoading } = useQuery<RideWithCreator>({
    queryKey: [`/api/rides/${rideId}`],
    enabled: !!rideId,
  });

  // Passengers data fetch - only if user is authenticated
  const {
    data: passengers,
    isLoading: isPassengersLoading,
    refetch: refetchPassengers
  } = useQuery<RidePassenger[]>({
    queryKey: [`/api/rides/${rideId}/passengers`],
    enabled: !!rideId && !!user,
  });

  // Form for joining ride
  const form = useForm<JoinRideFormData>({
    resolver: zodResolver(joinRideSchema),
    defaultValues: {
      passengerCount: 1,
      dropoffLocation: "",
    },
  });

  // Join ride mutation
  const joinRideMutation = useMutation({
    mutationFn: async (data: JoinRideFormData) => {
      if (!user) throw new Error("You must be logged in to join a ride");
      if (!ride) throw new Error("Ride not found");

      const res = await apiRequest(
        "POST",
        `/api/rides/${rideId}/join`,
        {
          ...data,
          rideId: parseInt(rideId || "0")
        }
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
    if (!ride) return;

    // Convert ride drop-off locations to map format
    const locations: LocationPoint[] = [];

    // Add pickup location
    if (ride.pickupLocation) {
      locations.push({
        id: 'pickup',
        position: [1.3421, 103.7998], // This should be replaced with actual coordinates
        name: ride.pickupLocation
      });
    }

    // Add dropoff locations from ride
    ride.dropoffLocations.forEach((loc, index) => {
      const locationName = typeof loc === 'string' ? loc : (loc.location || 'Unknown location');
      locations.push({
        id: `dropoff-${index}`,
        position: [1.3521 + (index * 0.01), 103.8198 + (index * 0.01)], // This should be replaced with actual coordinates
        name: locationName
      });
    });

    // Add passenger dropoff locations
    passengers?.forEach((passenger, index) => {
      if (!locations.some(loc => loc.name === passenger.dropoffLocation)) {
        locations.push({
          id: `passenger-${index}`,
          position: [1.3621 + (index * 0.01), 103.8298 + (index * 0.01)], // This should be replaced with actual coordinates
          name: passenger.dropoffLocation
        });
      }
    });

    setDropoffLocations(locations);
  }, [ride, passengers]);

  // Check if the current user is already a passenger
  const isUserPassenger = passengers?.some(p => p.userId === user?.id);

  // Check if the user is the ride creator
  const isCreator = user && ride && user.id === ride.creator?.id;
  const creator = ride?.creator;


  // Calculate remaining spots
  const totalPassengersCount = ride?.currentPassengers || 0;
  const remainingSpots = ride ? ride.maxPassengers - totalPassengersCount : 0;
  const isFull = remainingSpots <= 0;

  // Format date for display (using our shared utility)
  const formatDateTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatDate(date);
  };
  
  // Check if the ride is in the past
  const isRidePast = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return isPastDate(date);
  };

  // Format direction for display
  const formatDirection = (direction: string) => {
    return direction === "SG->FC" ? "Singapore to Forest City" : "Forest City to Singapore";
  };

  // Handle form submission
  const onSubmit = (data: JoinRideFormData) => {
    if (remainingSpots < data.passengerCount) {
      toast({
        title: "Error",
        description: `Only ${remainingSpots} spots remaining`,
        variant: "destructive",
      });
      return;
    }
    joinRideMutation.mutate(data);
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
      .map(p => {
        const number = p.user?.whatsappNumber?.replace(/\D/g, '');
        return number ? `${p.user?.name || p.user?.discordUsername}: ${number}` : null;
      })
      .filter(Boolean)
      .join('\n');

    if (!phoneNumbers) {
      toast({
        title: "No WhatsApp Numbers",
        description: "None of the passengers have registered their WhatsApp numbers",
        variant: "destructive",
      });
      return;
    }

    // Create group name based on ride details
    const groupName = `RideShare: ${formatDirection(ride?.direction || "")} ${formatDateTime(ride?.date || new Date())}`;

    const messageText = `Create a WhatsApp group:\n\nGroup Name: "${groupName}"\n\nAdd these contacts:\n${phoneNumbers}`;

    navigator.clipboard.writeText(messageText);

    toast({
      title: "WhatsApp Group Info Copied!",
      description: "1. Open WhatsApp\n2. Click 'New Group'\n3. Add the copied contacts",
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
    const groupName = `RideShare: ${formatDirection(ride?.direction || "")} ${formatDateTime(ride?.date || new Date())}`;

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
    const dateText = formatDateTime(ride.date);
    const totalCost = ride.cost + (ride.additionalStops * 5);
    // Cost explanation more detailed based on passenger count
    const costDetails = totalCost === ride.cost ? 
      `$${totalCost} SGD` : 
      `$${ride.cost} SGD + $${ride.additionalStops * 5} SGD for additional stops`;

    // Format all locations
    const locationsText = ride.direction === "SG->FC" ?
      `Pickup: ${ride.pickupLocation}` :
      `Pickup: Forest City\nDrop-offs: ${ride.dropoffLocations.map(loc => 
        typeof loc === 'string' ? loc : loc.location
      ).join(', ')}`;

    const summary = `🚗 RideShare Trip Summary 🚗\n\n` +
      `Direction: ${directionText}\n` +
      `Date & Time: ${dateText}\n` +
      `${ride.direction === "FC->SG" ? "Drop-off" : "Pickup"}: ${ride.pickupLocation}\n` +
      `Passengers: ${totalPassengersCount}/${ride.maxPassengers}\n` +
      `Total Cost: ${costDetails}\n\n` +
      `📱 Join through RideShare: https://ns-rideshare.replit.app/rides/${ride.id}`;

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

  // Add direct messaging function
  const openDirectMessage = (type: 'whatsapp' | 'discord', contact: string | null) => {
    if (!contact) {
      toast({
        title: "Contact not available",
        description: `No ${type} contact information provided.`,
        variant: "destructive",
      });
      return;
    }

    let url = '';
    if (type === 'whatsapp') {
      // Remove any non-numeric characters from phone number
      const cleanNumber = contact.replace(/\D/g, '');
      url = `https://wa.me/${cleanNumber}`;
    } else if (type === 'discord') {
      // Copy Discord username to clipboard
      navigator.clipboard.writeText(contact);
      toast({
        title: "Discord username copied!",
        description: "Open Discord and search for this username to start a conversation.",
      });
      return;
    }

    if (url) {
      window.open(url, '_blank');
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

  if (!ride) {
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
    <div className="min-h-screen pb-16 pt-16"> {/* Add padding-top for fixed navbar */}
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
                {formatDateTime(ride.date)}
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
              {totalPassengersCount}/{ride.maxPassengers} passengers
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
                          <p className="text-sm text-muted-foreground">{formatDateTime(ride.date)}</p>
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
                              : ride.dropoffLocations.map(loc => 
                                  typeof loc === 'string' ? loc : loc.location
                                ).join(", ")}
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

              {!isCreator && user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ride Organizer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{ride.creator?.name || ride.creator?.discordUsername || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">Organizer</p>
                        </div>
                        <div className="flex space-x-1">
                          <ContactInfo
                            label="WhatsApp"
                            value={ride.creator?.whatsappNumber}
                            icon={Phone}
                            type="whatsapp"
                          />
                          <ContactInfo
                            label="Malaysian Number"
                            value={ride.creator?.malaysianNumber}
                            icon={Phone}
                          />
                          <ContactInfo
                            label="Discord"
                            value={ride.creator?.discordUsername}
                            icon={Mail}
                            type="discord"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Join Ride Section */}
              {user && !isCreator && !isUserPassenger && !isFull && !isRidePast(ride.date) && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Join This Ride</CardTitle>
                    <CardDescription>
                      There are {remainingSpots} spots left on this ride
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="passengerCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Passengers</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={Math.min(4, remainingSpots)}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum {Math.min(4, remainingSpots)} passengers allowed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dropoffLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Drop-off Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter your drop-off location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={joinRideMutation.isPending}
                        >
                          {joinRideMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            "Join Ride"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Already Joined Section */}
              {user && isUserPassenger && (
                <Card className={`border-blue-200 ${isRidePast(ride.date) ? 'bg-gray-100' : 'bg-blue-50'}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                      {isRidePast(ride.date) ? "This Ride Is Completed" : "You've Joined This Ride"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm ${isRidePast(ride.date) ? 'text-gray-600' : 'text-blue-700'} mb-4`}>
                      {isRidePast(ride.date) 
                        ? "This ride has already taken place." 
                        : "You're all set for this trip! The ride organizer will confirm details closer to the departure date."}
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

              {/* Past Ride Message */}
              {isRidePast(ride.date) && !isUserPassenger && (
                <Card className="border-gray-200 bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-gray-600" />
                      This Ride Is In The Past
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      This ride has already taken place and is no longer available to join.
                    </p>
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
                      <CardTitle className="text-lg">
                        Passengers ({totalPassengersCount}/{ride.maxPassengers})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {passengers.map((passenger, index) => (
                          <div key={passenger.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{passenger.user?.name || passenger.user?.discordUsername || "Unknown User"}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {passenger.dropoffLocation}
                                  {passenger.dropoffSequence && (
                                    <Badge variant="secondary" className="ml-2">
                                      Stop #{passenger.dropoffSequence}
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Passengers: {passenger.passengerCount || 1}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                {passenger.user && (
                                  <>
                                    <ContactInfo
                                      label="WhatsApp"
                                      value={passenger.user.whatsappNumber}
                                      icon={Phone}
                                      type="whatsapp"
                                    />
                                    <ContactInfo
                                      label="Malaysian Number"
                                      value={passenger.user.malaysianNumber}
                                      icon={Phone}
                                    />
                                    <ContactInfo
                                      label="Discord"
                                      value={passenger.user.discordUsername}
                                      icon={Mail}
                                      type="discord"
                                    />
                                    <ContactInfo
                                      label="Revolut"
                                      value={passenger.user.revolutUsername}
                                      icon={User}
                                    />
                                  </>
                                )}
                                {isCreator && (
                                  <Badge>Passenger {index + 1}</Badge>
                                )}
                              </div>
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
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-800">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <p>Group communication setup is not working yet. Coming soon!</p>
                      </div>
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
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-800">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p>Maps functionality is not working yet. Coming soon!</p>
                  </div>
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
                          <p className="mt-1">
                            {typeof location === 'string' 
                              ? location 
                              : (location.location || 'Unknown location')}
                          </p>
                          {typeof location !== 'string' && location.passengerCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Passengers: {location.passengerCount}
                            </p>
                          )}
                        </div>
                      ))}

                      {passengers?.map((passenger, index) => (
                        <div key={`passenger-${passenger.id}`} className="p-2 border rounded-md">
                          <Badge variant="outline" className="bg-green-50">
                            Passenger Dropoff
                          </Badge>
                          <p className="mt-1">
                            {passenger.dropoffLocation}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({passenger.user?.fullName || "Unknown"})
                            </span>
                          </p>
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