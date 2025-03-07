import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Car, LogOut, LogIn, Map, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  // For SSR compatibility, default to mobile false, then update after mount
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Update mobile status after component mounts
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Close mobile menu on navigation
  useEffect(() => {
    const handleRouteChange = () => {
      setMenuOpen(false);
    };
    
    // Simple route change detection
    const observer = new MutationObserver(handleRouteChange);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo always visible */}
          <Link href="/" className="flex items-center text-sm font-medium">
            <Car className="h-5 w-5 mr-2" />
            <span className="text-lg font-semibold">RideShare</span>
          </Link>

          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          {/* Desktop navigation */}
          {!isMobile && (
            <div className="flex">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/home" className="flex items-center px-3 py-2 text-sm font-medium">
                        <Map className="h-4 w-4 mr-2" />
                        Available Rides
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  
                  {user && (
                    <>
                      {user?.isVendor ? (
                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link href="/vendor" className="flex items-center px-3 py-2 text-sm font-medium">
                              Dashboard
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      ) : (
                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Link href="/rides/create" className="flex items-center px-3 py-2 text-sm font-medium">
                              Create Ride
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )}
                    </>
                  )}
                </NavigationMenuList>
              </NavigationMenu>

              <div className="flex items-center ml-4">
                {user ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href="/auth">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile menu */}
        {isMobile && menuOpen && (
          <div className="md:hidden border-t pt-2 pb-3 space-y-1">
            <Link href="/home" className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md">
              Available Rides
            </Link>
            
            {user && (
              <>
                {user?.isVendor ? (
                  <Link href="/vendor" className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/rides/create" className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md">
                    Create Ride
                  </Link>
                )}
              </>
            )}
            
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="w-full justify-start px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="w-full justify-start px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              >
                <Link href="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
