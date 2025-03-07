import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRidePassengerSchema } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function JoinRide() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const rideId = new URLSearchParams(location.split("?")[1]).get("id");

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

  const joinRideMutation = useMutation({
    mutationFn: async (data: any) => {
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
      });
      setLocation("/");
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
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Ride not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <RideCard ride={ride} showActions={false} />

          <Card>
            <CardHeader>
              <CardTitle>Join This Ride</CardTitle>
            </CardHeader>
            <CardContent>
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
                          <Input {...field} />
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
                    Join Ride
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
