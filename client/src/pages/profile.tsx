import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { InsertUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Profile form state
  const [profileData, setProfileData] = useState<Partial<InsertUser>>({
    name: "",
    whatsappNumber: "",
    malaysianNumber: "",
    revolutUsername: "",
  });

  // Error message state
  const [error, setError] = useState("");

  // Load user data when component mounts
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    // Populate form with user data
    setProfileData({
      name: user.name || "",
      whatsappNumber: user.whatsappNumber || "",
      malaysianNumber: user.malaysianNumber || "",
      revolutUsername: user.revolutUsername || "",
    });
    
    setLoading(false);
  }, [user, setLocation]);

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      if (!user?.id) throw new Error("User not logged in");
      
      try {
        const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
        return await res.json();
      } catch (err) {
        console.error("Profile update error:", err);
        // If we get a HTML error response instead of JSON, provide a clearer error
        if (err instanceof Error && err.message.includes("<!DOCTYPE")) {
          throw new Error("Server error: The server returned an HTML error instead of JSON");
        }
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidate auth user instead of just users
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    },
    onError: (error: Error) => {
      console.error("Profile update error:", error);
      setError(error.message);
      
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    updateProfileMutation.mutate(profileData);
  };

  if (loading) {
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
      <main className="max-w-3xl mx-auto px-4 py-8 pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your contact information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discord-username">Discord Username</Label>
                <Input
                  id="discord-username"
                  type="text"
                  value={user?.discordUsername || ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Your Discord username cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={profileData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  placeholder="+65xxxxxxxx"
                  value={profileData.whatsappNumber || ""}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended for ride coordination
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="malaysianNumber">Malaysian Phone Number</Label>
                <Input
                  id="malaysianNumber"
                  type="tel"
                  placeholder="+60xxxxxxxx"
                  value={profileData.malaysianNumber || ""}
                  onChange={(e) => handleInputChange("malaysianNumber", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revolutUsername">Revolut Username</Label>
                <Input
                  id="revolutUsername"
                  type="text"
                  value={profileData.revolutUsername || ""}
                  onChange={(e) => handleInputChange("revolutUsername", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  For payment coordination
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}