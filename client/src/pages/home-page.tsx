import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { RideCard } from "@/components/ride-card";
import { useAuth } from "@/hooks/use-auth";
import { Ride } from "@shared/schema";
import { Loader2, Map, Share2, Info, Edit, UserPlus, ArrowUpDown, Filter, Plus, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { SequenceManager } from "@/components/sequence-manager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isPastDate, isDateInCurrentWeek } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("dateAsc");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("upcoming"); // "upcoming", "thisWeek", "all"

  // Fetch all rides
  const { data: rides, isLoading: isLoadingRides } = useQuery<Ride[]>({
    queryKey: ["/api/rides"],
  });

  // Fetch rides that the user has joined (but not created)
  const { data: joinedRides, isLoading: isLoadingJoined } = useQuery<Ride[]>({
    queryKey: ["/api/rides/user/joined"],
    enabled: !!user && activeTab === 'my-rides', // Only fetch when user is logged in and on My Rides tab
  });

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<{totalRides: number, totalUsers: number, sgToFcRides: number, fcToSgRides: number}>({
    queryKey: ['/api/stats'],
  });

  // Generate shareable trip summary
  const generateTripSummary = (ride: Ride) => {
    const directionText = ride.direction === "SG->FC" ? "Singapore to Forest City" : "Forest City to Singapore";
    const dateText = new Date(ride.date).toLocaleString();
    const totalCost = ride.cost + (ride.additionalStops * 5);
    const perPersonCost = (totalCost / (ride.maxPassengers || 1)).toFixed(2);

    // Format locations based on direction with all drop-off locations
    let locationSection = '';
    if (ride.direction === "FC->SG") {
      const dropoffLocations = ride.dropoffLocations.map(loc => 
        typeof loc === 'string' ? loc : loc.location
      );
      
      locationSection = `Pickup: Forest City\nDrop-off Locations (${dropoffLocations.length}):\n`;
      
      // Number each location
      dropoffLocations.forEach((loc, index) => {
        locationSection += `${index + 1}. ${loc}\n`;
      });
    } else {
      locationSection = `Pickup Location: ${ride.pickupLocation}\nDrop-off: Forest City`;
    }

    const summary = `🚗 RideShare Trip Summary 🚗\n\n` +
      `Direction: ${directionText}\n` +
      `Date & Time: ${dateText}\n` +
      `${locationSection}\n` +
      `Passengers: ${ride.currentPassengers}/${ride.maxPassengers}\n` +
      `Total Cost: $${totalCost} SGD\n\n` +
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

  const isLoading = isLoadingRides || isLoadingStats || (activeTab === 'my-rides' && isLoadingJoined);

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

  // Helper to check if a ride is in the past
  const isRidePast = (ride: Ride) => {
    return isPastDate(new Date(ride.date));
  };

  // Helper to check if a ride is within current week
  const isRideInCurrentWeek = (ride: Ride) => {
    return isDateInCurrentWeek(new Date(ride.date));
  };

  // Filter rides based on active tab and direction
  let filteredRides = activeTab === 'all'
    ? rides
    : (activeTab === 'my-rides' ? myRides : []);

  // Apply direction filter
  if (directionFilter !== 'all') {
    filteredRides = filteredRides?.filter(ride => ride.direction === directionFilter) || [];
  }
  
  // Apply time filter
  if (timeFilter === 'upcoming') {
    // Only show upcoming (non-past) rides
    filteredRides = filteredRides?.filter(ride => !isRidePast(ride)) || [];
  } else if (timeFilter === 'thisWeek') {
    // Show only rides in the current week (both past and future)
    filteredRides = filteredRides?.filter(ride => isRideInCurrentWeek(ride)) || [];
  }

  // Sort rides
  const sortedRides = [...(filteredRides || [])].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // Remove past rides (optional, can be handled by filter too)
    const isPastA = isRidePast(a);
    const isPastB = isRidePast(b);

    // If both are past or both are future, sort according to selected option
    if (isPastA === isPastB) {
      switch (sortOption) {
        case 'dateAsc':
          return dateA.getTime() - dateB.getTime();
        case 'dateDesc':
          return dateB.getTime() - dateA.getTime();
        default:
          return dateA.getTime() - dateB.getTime();
      }
    }

    // Put future rides before past ones
    return isPastA ? 1 : -1;
  });

  // Get rides created by the user that are in the FC->SG direction
  const userFCtoSGRides = userCreatedRides.filter(ride =>
    ride.direction === "FC->SG"
  ) || [];

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">{/* Added pt-20 for navbar spacing */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-lg mx-auto">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalRides}</div>
                <p className="text-sm text-blue-600/80 mt-2 font-medium">Total Rides</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalUsers}</div>
                <p className="text-sm text-green-600/80 mt-2 font-medium">Total Users</p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Create Ride Button - only show when logged in */}
        {user && !user?.isVendor && (
          <div className="mb-8 flex justify-center">
            <Button 
              size="lg" 
              className="w-full max-w-md py-6 text-lg"
              onClick={() => setLocation("/rides/create")}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Ride
            </Button>
          </div>
        )}

        {/* Login Benefits Banner - Show only when user is not logged in */}
        {!user && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join RideShare Community
              </CardTitle>
              <CardDescription>
                Login to unlock full features and start sharing rides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-medium">Create Rides</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize your own rides and set your preferred schedule
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Join Existing Rides</h3>
                  <p className="text-sm text-muted-foreground">
                    Find and join rides that match your travel plans
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Manage Your Trips</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your rides and communicate with co-passengers
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <Button size="lg" onClick={() => setLocation("/auth")}>
                  Login or Register Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Rides</h1>
            <TabsList>
              <TabsTrigger value="all">All Rides</TabsTrigger>
              <TabsTrigger value="my-rides">My Rides</TabsTrigger>
            </TabsList>
          </div>

          {/* Filtering and Sorting Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by direction" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="SG->FC">Singapore to Forest City</SelectItem>
                  <SelectItem value="FC->SG">Forest City to Singapore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming Rides</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="all">All Rides</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort rides" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateAsc">Earliest First</SelectItem>
                  <SelectItem value="dateDesc">Latest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedRides.map((ride) => (
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
              {sortedRides.length === 0 && (
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