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
import { Loader2, UserCog, Lock, KeyRound } from "lucide-react";

function PasswordResetCard() {
  const { resetPasswordMutation } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [resetError, setResetError] = useState("");
  
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    
    // Validation
    if (!passwordData.currentPassword) {
      setResetError("Please enter your current password");
      return;
    }
    
    if (!passwordData.newPassword) {
      setResetError("Please enter a new password");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setResetError("New password must be at least 8 characters long");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setResetError("New passwords do not match");
      return;
    }
    
    // Submit password reset
    resetPasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }, {
      onSuccess: () => {
        // Clear form fields after successful password reset
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Password Settings
        </CardTitle>
        <CardDescription>
          Change your account password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resetError && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {resetError}
          </div>
        )}
        
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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
      <main className="max-w-3xl mx-auto px-4 py-8 pt-20 space-y-6">
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
        
        <PasswordResetCard />
      </main>
    </div>
  );
}