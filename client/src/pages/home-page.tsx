import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { RideCard } from "@/components/ride-card";
import { useAuth } from "@/hooks/use-auth";
import { Ride } from "@shared/schema";
import { Loader2, Map, Share2, Info, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { SequenceManager } from "@/components/sequence-manager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Fetch all rides
  const { data: rides, isLoading: isLoadingRides } = useQuery<Ride[]>({
    queryKey: ["/api/rides"],
  });
  
  // Fetch rides that the user has joined (but not created)
  const { data: joinedRides, isLoading: isLoadingJoined } = useQuery<Ride[]>({
    queryKey: ["/api/rides/user/joined"],
    enabled: !!user && activeTab === 'my-rides', // Only fetch when user is logged in and on My Rides tab
  });
  
  // Generate shareable trip summary
  const generateTripSummary = (ride: Ride) => {
    const directionText = ride.direction === "SG->FC" ? "Singapore to Forest City" : "Forest City to Singapore";
    const dateText = new Date(ride.date).toLocaleString();
    const totalCost = ride.cost + (ride.additionalStops * 5);
    const perPersonCost = (totalCost / (ride.maxPassengers || 1)).toFixed(2);
    
    const summary = `🚗 RideShare Trip Summary 🚗\n\n` +
      `Direction: ${directionText}\n` +
      `Date & Time: ${dateText}\n` +
      `Pickup: ${ride.pickupLocation}\n` +
      `Passengers: ${ride.currentPassengers}/${ride.maxPassengers}\n` +
      `Total Cost: $${totalCost} SGD\n` +
      `Cost per person: $${perPersonCost} SGD\n\n` +
      `📱 Join through the RideShare app!`;
      
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

  const isLoading = isLoadingRides || (activeTab === 'my-rides' && isLoadingJoined);

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

  // Get rides created by the user
  const userCreatedRides = rides?.filter(ride => 
    user && ride.creatorId === user.id
  ) || [];
  
  // Combine created and joined rides for My Rides tab
  const myRides = [
    ...(userCreatedRides || []),
    ...(joinedRides || [])
  ];
  
  // Filter rides based on active tab
  const filteredRides = activeTab === 'all' 
    ? rides 
    : (activeTab === 'my-rides' ? myRides : []);
  
  // Get rides created by the user that are in the FC->SG direction
  const userFCtoSGRides = userCreatedRides.filter(ride => 
    ride.direction === "FC->SG"
  ) || [];

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">{/* Added pt-20 for navbar spacing */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Rides</h1>
            <TabsList>
              <TabsTrigger value="all">All Rides</TabsTrigger>
              <TabsTrigger value="my-rides">My Rides</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRides?.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onJoin={() => setLocation(`/rides/${ride.id}/join`)}
                  onAssign={
                    user?.isVendor
                      ? () => setLocation(`/vendor?rideId=${ride.id}`)
                      : undefined
                  }
                />
              ))}
              {filteredRides?.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No rides available at the moment.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-rides" className="space-y-8">
            {/* Only show sequence management for user's FC->SG rides */}
            {userFCtoSGRides.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Manage Drop-off Sequence</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  For rides from Forest City to Singapore, you can set the order in which passengers will be dropped off.
                </p>
                
                {userFCtoSGRides.map(ride => (
                  <div key={ride.id} className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium">
                        Ride on {new Date(ride.date).toLocaleDateString()}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateTripSummary(ride)}
                        className="flex items-center"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Summary
                      </Button>
                    </div>
                    <SequenceManager rideId={ride.id} />
                  </div>
                ))}
              </div>
            )}
            
            {/* Display rides organized by the user */}
            {userCreatedRides.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Rides You Organized</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userCreatedRides.map((ride) => (
                    <div key={ride.id} className="relative">
                      <RideCard
                        ride={ride}
                        showActions={false}
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generateTripSummary(ride)}
                          className="flex items-center"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setLocation(`/rides/edit/${ride.id}`)}
                          className="flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Display rides joined by the user */}
            {joinedRides && joinedRides.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Rides You Joined</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {joinedRides.map((ride) => (
                    <div key={ride.id} className="relative">
                      <RideCard
                        ride={ride}
                        showActions={false}
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generateTripSummary(ride)}
                          className="flex items-center"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setLocation(`/rides/${ride.id}`)}
                          className="flex items-center"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show message if no rides */}
            {myRides.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                You haven't created or joined any rides yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
