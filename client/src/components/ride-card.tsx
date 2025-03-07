import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ride } from "@shared/schema";
import { MapPin, Calendar, Users, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";

interface RideCardProps {
  ride: Ride;
  onJoin?: () => void;
  onAssign?: () => void;
  showActions?: boolean;
}

export function RideCard({ ride, onJoin, onAssign, showActions = true }: RideCardProps) {
  const isFullyBooked = ride.currentPassengers >= ride.maxPassengers;
  const costPerPerson = Math.round(
    ride.cost / (ride.currentPassengers || 1)
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="h-4 w-4" />
          <h3 className="font-semibold">{ride.direction}</h3>
        </div>
        <Badge variant={ride.status === "open" ? "default" : "secondary"}>
          {ride.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {format(new Date(ride.date), "PPP p")}
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            <span>From: {ride.pickupLocation}</span>
          </div>
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2" />
            {ride.currentPassengers} / {ride.maxPassengers} passengers
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">
              Cost per person: ${costPerPerson} SGD
            </p>
            {ride.additionalStops > 0 && (
              <p className="text-xs text-muted-foreground">
                +${ride.additionalStops * 5} SGD for {ride.additionalStops} additional stops
              </p>
            )}
          </div>
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex justify-end space-x-2">
          {ride.status === "open" && onJoin && !isFullyBooked && (
            <Button onClick={onJoin}>Join Ride</Button>
          )}
          {ride.status === "open" && onAssign && (
            <Button onClick={onAssign}>Accept Ride</Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
