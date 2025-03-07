import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { InsertUser } from "@shared/schema";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Registration form state
  const [registerData, setRegisterData] = useState<Partial<InsertUser>>({
    username: "",
    password: "",
    fullName: "",
    discordUsername: "",
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
      loginMutation.mutate({ username, password });
    } catch (error) {
      setError("Invalid username or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Detailed validation with specific error messages
    if (!registerData.username) {
      setError("Username is required");
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
    
    if (!registerData.fullName) {
      setError("Full name is required");
      return;
    }
    
    if (!registerData.discordUsername) {
      setError("Discord username is required");
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
      setError("Registration failed. Username may already exist.");
    }
  };
  
  const handleInputChange = (field: string, value: string | boolean) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDriverDetailsChange = (field: string, value: string) => {
    setRegisterData(prev => ({
      ...prev,
      driverDetails: {
        ...prev.driverDetails,
        [field]: value
      }
    }));
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
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
                  <Label htmlFor="username-login">Username</Label>
                  <Input
                    id="username-login"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                  <Label htmlFor="username-register">Username</Label>
                  <Input
                    id="username-register"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Password</Label>
                  <Input
                    id="password-register"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discordUsername">Discord Username</Label>
                  <Input
                    id="discordUsername"
                    type="text"
                    value={registerData.discordUsername}
                    onChange={(e) => handleInputChange("discordUsername", e.target.value)}
                    required
                  />
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
                  <p className="text-xs text-gray-500">Optional, but recommended for ride coordination</p>
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
                  <p className="text-xs text-gray-500">Optional</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revolutUsername">Revolut Username</Label>
                  <Input
                    id="revolutUsername"
                    type="text"
                    value={registerData.revolutUsername || ""}
                    onChange={(e) => handleInputChange("revolutUsername", e.target.value)}
                  />
                  <p className="text-xs text-gray-500">For payment coordination</p>
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
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={registerData.companyName || ""}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        required={registerData.isVendor}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driverName">Driver Name</Label>
                      <Input
                        id="driverName"
                        type="text"
                        value={registerData.driverDetails?.name || ""}
                        onChange={(e) => handleDriverDetailsChange("name", e.target.value)}
                        required={registerData.isVendor}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driverContact">Driver Contact</Label>
                      <Input
                        id="driverContact"
                        type="tel"
                        value={registerData.driverDetails?.contact || ""}
                        onChange={(e) => handleDriverDetailsChange("contact", e.target.value)}
                        required={registerData.isVendor}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carNumber">Car Number</Label>
                      <Input
                        id="carNumber"
                        type="text"
                        value={registerData.driverDetails?.carNumber || ""}
                        onChange={(e) => handleDriverDetailsChange("carNumber", e.target.value)}
                        required={registerData.isVendor}
                      />
                      <p className="text-xs text-gray-500">Required for MDAC/SGAC compliance</p>
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
  );
}