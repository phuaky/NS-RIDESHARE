import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ride } from "@shared/schema";
import { MapPin, Calendar, Users, ArrowRightLeft, Info, User, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { formatDate, isPastDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

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

  // Check if a ride is in the past
  const isInPast = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isPastDate(dateObj);
  };

  // Check if ride is in the past
  const ridePast = isInPast(ride.date);
  const { user } = useAuth();
  const isUserRide = user && ride.creatorId === user.id;

  return (
    <Link href={`/rides/${ride.id}`}>
      <Card className={`w-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer group ${ridePast ? 'opacity-60' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">{formatDirection(ride.direction)}</h3>
              <p className="text-sm text-muted-foreground">
                <User className="h-3 w-3 inline-block mr-1" />
                {organizerName || (ride as any).creatorName || "Unknown Organizer"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ridePast ? (
              <Badge variant="outline">Past</Badge>
            ) : isFullyBooked ? (
              <Badge variant="secondary">Full</Badge>
            ) : isUserRide ? (
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                Your Ride
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Join
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(new Date(ride.date))}
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              {ride.direction === "FC->SG" ? (
                <span>To: {
                  ride.dropoffLocations && ride.dropoffLocations.length > 0 
                    ? (typeof ride.dropoffLocations[0] === 'string' 
                        ? ride.dropoffLocations[0] 
                        : ride.dropoffLocations[0].location)
                    : "Unknown location"
                }</span>
              ) : (
                <span>From: {ride.pickupLocation}</span>
              )}
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
      </Card>
    </Link>
  );
}