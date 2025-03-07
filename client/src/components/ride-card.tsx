import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ride } from "@shared/schema";
import { MapPin, Calendar, Users, ArrowRightLeft, Info, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface RideCardProps {
  ride: Ride;
  onJoin?: () => void;
  onAssign?: () => void;
  showActions?: boolean;
  organizerName?: string;
}

export function RideCard({ ride, onJoin, onAssign, showActions = true, organizerName }: RideCardProps) {
  const isFullyBooked = ride.currentPassengers >= ride.maxPassengers;
  const costPerPerson = Math.round(
    ride.cost / (ride.currentPassengers || 1)
  );

  // Format direction for display
  const formatDirection = (direction: string) => {
    return direction === "SG->FC" ? "Singapore to Forest City" : "Forest City to Singapore";
  };

  // Format date for display
  const formatDate = (date: string) => {
    return format(new Date(date), "EEE, MMM d, h:mm a");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">{formatDirection(ride.direction)}</h3>
            <p className="text-sm text-muted-foreground">
              <User className="h-3 w-3 inline-block mr-1" />
              {organizerName || "Unknown Organizer"}
            </p>
          </div>
        </div>
        <Badge variant={isFullyBooked ? "secondary" : "default"}>
          {isFullyBooked ? "Full" : ride.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(ride.date)}
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
        <CardFooter className="flex justify-between space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/rides/${ride.id}`}>
              <Info className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          {ride.status === "open" && onAssign && (
            <Button onClick={onAssign}>Accept Ride</Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}