import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Car, LogOut, LogIn, Map, Menu, X, Info } from "lucide-react";
import { useState, useEffect } from "react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Use a simpler approach for detecting mobile view
  const [isMobile, setIsMobile] = useState(false);

  // Set up mobile detection on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(prevState => !prevState);
  };

  return (
    <nav className="border-b bg-white fixed top-0 left-0 right-0 z-50">
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
              size="sm"
              onClick={toggleMenu}
              className="relative z-20"
              type="button"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Desktop navigation */}
          {!isMobile && (
            <div className="flex">
              <div className="flex items-center space-x-4">
                <Link href="/home" className="flex items-center px-3 py-2 text-sm font-medium">
                  <Map className="h-4 w-4 mr-2" />
                  Available Rides
                </Link>

                <Link href="/guide" className="flex items-center px-3 py-2 text-sm font-medium">
                  <Info className="h-4 w-4 mr-2" />
                  Travel Guide
                </Link>

                {user && (
                  <>
                    {user?.isVendor ? (
                      <Link href="/vendor" className="flex items-center px-3 py-2 text-sm font-medium">
                        Dashboard
                      </Link>
                    ) : (
                      <Link href="/rides/create" className="flex items-center px-3 py-2 text-sm font-medium">
                        Create Ride
                      </Link>
                    )}
                  </>
                )}
              </div>

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
          <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-50 px-4 py-4 space-y-3">
            <Link 
              href="/home" 
              className="block px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              <Map className="h-4 w-4 mr-2 inline-block" />
              Available Rides
            </Link>

            <Link 
              href="/guide" 
              className="block px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              <Info className="h-4 w-4 mr-2 inline-block" />
              Travel Guide
            </Link>

            {user && (
              <>
                {user?.isVendor ? (
                  <Link 
                    href="/vendor" 
                    className="block px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link 
                    href="/rides/create" 
                    className="block px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    Create Ride
                  </Link>
                )}
              </>
            )}

            {user ? (
              <div 
                className="block px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => {
                  logoutMutation.mutate();
                  setMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2 inline-block" />
                Logout
              </div>
            ) : (
              <Link 
                href="/auth" 
                className="block px-3 py-3 text-base font-medium hover:bg-gray-50 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                <LogIn className="h-4 w-4 mr-2 inline-block" />
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}