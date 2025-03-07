import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { RideCard } from "@/components/ride-card";
import { useAuth } from "@/hooks/use-auth";
import { Ride } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: rides, isLoading } = useQuery<Ride[]>({
    queryKey: ["/api/rides"],
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

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Available Rides</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rides?.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onJoin={() => setLocation(`/rides/join?id=${ride.id}`)}
              onAssign={
                user?.isVendor
                  ? () => setLocation(`/vendor?rideId=${ride.id}`)
                  : undefined
              }
            />
          ))}
          {rides?.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No rides available at the moment.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
