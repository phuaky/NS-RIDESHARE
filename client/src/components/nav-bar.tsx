import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Car, LogOut, Map, BookOpen } from "lucide-react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/">
                  <NavigationMenuLink className="flex items-center px-3 py-2 text-sm font-medium">
                    <Car className="h-4 w-4 mr-2" />
                    RideShare
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {user?.isVendor ? (
                <NavigationMenuItem>
                  <Link href="/vendor">
                    <NavigationMenuLink className="flex items-center px-3 py-2 text-sm font-medium">
                      Dashboard
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ) : (
                <>
                  <NavigationMenuItem>
                    <Link href="/rides/create">
                      <NavigationMenuLink className="flex items-center px-3 py-2 text-sm font-medium">
                        Create Ride
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/rides/join">
                      <NavigationMenuLink className="flex items-center px-3 py-2 text-sm font-medium">
                        Join Ride
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </>
              )}
              <NavigationMenuItem>
                <Link href="/guide">
                  <NavigationMenuLink className="flex items-center px-3 py-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Guide
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="ml-3"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
