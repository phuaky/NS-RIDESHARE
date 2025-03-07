import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { RideCard } from "@/components/ride-card";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function VendorDashboard() {
  const [location] = useLocation();
  const { toast } = useToast();
  const rideToAssign = new URLSearchParams(location.split("?")[1]).get("rideId");

  const { data: vendorRides, isLoading: isLoadingVendorRides } = useQuery({
    queryKey: ["/api/vendor/rides"],
  });

  const { data: availableRides, isLoading: isLoadingAvailableRides } = useQuery({
    queryKey: ["/api/rides"],
  });

  const assignRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const res = await apiRequest("POST", `/api/rides/${rideId}/assign`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/rides"] });
      toast({
        title: "Success",
        description: "Ride assigned successfully",
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

  if (isLoadingVendorRides || isLoadingAvailableRides) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="assigned">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="assigned">My Rides</TabsTrigger>
            <TabsTrigger value="available">Available Rides</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vendorRides?.map((ride) => (
                <RideCard key={ride.id} ride={ride} showActions={false} />
              ))}
              {vendorRides?.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No assigned rides yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableRides
                ?.filter((ride) => ride.status === "open")
                .map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    onAssign={() => assignRideMutation.mutate(ride.id)}
                  />
                ))}
              {availableRides?.filter((ride) => ride.status === "open")
                .length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No available rides at the moment.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
