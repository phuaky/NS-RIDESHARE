import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { InsertUser } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  // Login form state
  const [discordUsername, setDiscordUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Registration form state
  const [registerData, setRegisterData] = useState<Partial<InsertUser>>({
    discordUsername: "",
    password: "",
    name: "",
    whatsappNumber: "",
    malaysianNumber: "",
    revolutUsername: "",
    isVendor: false,
    companyName: "",
    driverDetails: {
      name: "",
      contact: "",
      carNumber: ""
    }
  });

  const { loginMutation, registerMutation, user } = useAuth();
  const [, setLocation] = useLocation();

  // Handle authentication state changes
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      loginMutation.mutate({ discordUsername, password });
    } catch (error) {
      setError("Invalid Discord username or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Detailed validation with specific error messages
    if (!registerData.discordUsername) {
      setError("Discord username is required");
      return;
    }

    if (!registerData.password) {
      setError("Password is required");
      return;
    }

    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate vendor specific fields if user is registering as vendor
    if (registerData.isVendor) {
      if (!registerData.companyName) {
        setError("Company name is required for vendors");
        return;
      }

      if (!registerData.driverDetails?.name) {
        setError("Driver name is required for vendors");
        return;
      }

      if (!registerData.driverDetails?.contact) {
        setError("Driver contact is required for vendors");
        return;
      }

      if (!registerData.driverDetails?.carNumber) {
        setError("Car number is required for vendors");
        return;
      }
    }

    try {
      registerMutation.mutate(registerData as InsertUser);
    } catch (error) {
      setError("Registration failed. Discord username may already exist.");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  const handleDriverDetailsChange = (field: string, value: string) => {
    setRegisterData(prev => {
      const newDriverDetails = {
        ...prev.driverDetails,
        [field]: value
      };

      // Ensure all required fields are present
      if (!newDriverDetails.name) newDriverDetails.name = "";
      if (!newDriverDetails.contact) newDriverDetails.contact = "";
      if (!newDriverDetails.carNumber) newDriverDetails.carNumber = "";

      return {
        ...prev,
        driverDetails: newDriverDetails
      };
    });
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome to NS RideShare</CardTitle>
            <CardDescription>
              Login or register to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              {error && (
                <div className="bg-red-100 text-red-600 p-2 rounded mt-4 text-sm">
                  {error}
                </div>
              )}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord-username-login">Discord Username</Label>
                    <Input
                      id="discord-username-login"
                      type="text"
                      value={discordUsername}
                      onChange={(e) => setDiscordUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <Input
                      id="password-login"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord-username-register" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Discord Username
                    </Label>
                    <Input
                      id="discord-username-register"
                      type="text"
                      value={registerData.discordUsername}
                      onChange={(e) => handleInputChange("discordUsername", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be your login identifier
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Password
                    </Label>
                    <Input
                      id="password-register"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Optional</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      placeholder="+65xxxxxxxx"
                      value={registerData.whatsappNumber || ""}
                      onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Optional, but recommended for ride coordination</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="malaysianNumber">Malaysian Phone Number</Label>
                    <Input
                      id="malaysianNumber"
                      type="tel"
                      placeholder="+60xxxxxxxx"
                      value={registerData.malaysianNumber || ""}
                      onChange={(e) => handleInputChange("malaysianNumber", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Optional</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revolutUsername">Revolut Username</Label>
                    <Input
                      id="revolutUsername"
                      type="text"
                      value={registerData.revolutUsername || ""}
                      onChange={(e) => handleInputChange("revolutUsername", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Optional, for payment coordination</p>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox 
                      id="isVendor" 
                      checked={registerData.isVendor}
                      onCheckedChange={(checked) => handleInputChange("isVendor", Boolean(checked))}
                    />
                    <Label htmlFor="isVendor">Register as a vendor/driver</Label>
                  </div>

                  {registerData.isVendor && (
                    <div className="space-y-4 border-t pt-4 mt-4">
                      <h3 className="font-medium">Vendor Information</h3>
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Company Name
                        </Label>
                        <Input
                          id="companyName"
                          type="text"
                          value={registerData.companyName || ""}
                          onChange={(e) => handleInputChange("companyName", e.target.value)}
                          required={registerData.isVendor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="driverName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Driver Name
                        </Label>
                        <Input
                          id="driverName"
                          type="text"
                          value={registerData.driverDetails?.name || ""}
                          onChange={(e) => handleDriverDetailsChange("name", e.target.value)}
                          required={registerData.isVendor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="driverContact" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Driver Contact
                        </Label>
                        <Input
                          id="driverContact"
                          type="tel"
                          value={registerData.driverDetails?.contact || ""}
                          onChange={(e) => handleDriverDetailsChange("contact", e.target.value)}
                          required={registerData.isVendor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="carNumber" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Car Number
                        </Label>
                        <Input
                          id="carNumber"
                          type="text"
                          value={registerData.driverDetails?.carNumber || ""}
                          onChange={(e) => handleDriverDetailsChange("carNumber", e.target.value)}
                          required={registerData.isVendor}
                        />
                        <p className="text-xs text-muted-foreground">Required for MDAC/SGAC compliance</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full mt-6"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}