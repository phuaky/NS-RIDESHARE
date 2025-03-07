import { NavBar } from "@/components/nav-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bus, MapPin, AlertTriangle, Phone, ExternalLink, IdCard, Clock } from "lucide-react";
import { LocationMap } from "@/components/map/location-map";

export default function GuidePage() {
  // Pre-defined popular locations
  const singaporeLocations = [
    {
      id: "sg-1",
      position: [1.3521, 103.8198] as [number, number],
      name: "Jurong East MRT"
    },
    {
      id: "sg-2",
      position: [1.3644, 103.7731] as [number, number],
      name: "Boon Lay MRT"
    },
    {
      id: "sg-3",
      position: [1.4431, 103.7861] as [number, number],
      name: "Woodlands Checkpoint"
    },
    {
      id: "sg-4",
      position: [1.3387, 103.9092] as [number, number],
      name: "Changi Airport"
    }
  ];

  const forestCityLocations = [
    {
      id: "fc-1",
      position: [1.4143, 103.6357] as [number, number],
      name: "Forest City Mall"
    },
    {
      id: "fc-2",
      position: [1.4308, 103.6305] as [number, number],
      name: "Golf Resort"
    },
    {
      id: "fc-3",
      position: [1.4184, 103.6325] as [number, number],
      name: "Shattuck St. Mary's School"
    },
    {
      id: "fc-4",
      position: [1.4255, 103.6240] as [number, number],
      name: "Malaysian CIQ"
    }
  ];
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Singapore-Forest City Travel Guide</h1>
          <p className="text-muted-foreground mb-6">
            Essential information for traveling between Singapore and Forest City
          </p>
        </div>

        <div className="space-y-8">
          {/* Important Reminders */}
          <div className="grid gap-4 md:grid-cols-2">
            <Alert className="bg-amber-50 border-amber-200">
              <IdCard className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Passport Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                Ensure your passport has at least 6 months validity.
                Many travelers forget their passports - double-check before leaving!
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Immigration Timing</AlertTitle>
              <AlertDescription className="text-blue-700">
                Allow 45-60 minutes for immigration during peak hours.
                Weekday mornings (Singapore entry) and evenings (Malaysia entry) are busiest.
              </AlertDescription>
            </Alert>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="chartered-car" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chartered-car">Chartered Car</TabsTrigger>
              <TabsTrigger value="public-bus">Public Bus Options</TabsTrigger>
            </TabsList>

            {/* Public Bus Options */}
            <TabsContent value="public-bus">
              <Card>
                <CardHeader>
                  <CardTitle>Public Bus Options</CardTitle>
                  <CardDescription>
                    Bus routes and schedules between Singapore and Forest City
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">Quick Guide to Bus Travel</h4>
                    <ul className="list-disc list-inside mt-2 space-y-2">
                      <li><strong>Journey:</strong> Jurong Town Hall Bus Interchange → CIQ 2nd Link → Forest City</li>
                      <li><strong>Buses:</strong> Take CW3/CW4/CW4S/CW6/CW7, then FC1 after immigration</li>
                      <li><strong>Total fare:</strong> S$5 (through-ticketing available)</li>
                      <li><strong>Payment:</strong> Cash or ManjaLink card</li>
                      <li><strong>Travel time:</strong> ~1.5-2 hours including immigration</li>
                    </ul>
                  </div>
                  
                  <Alert className="bg-amber-50 border-amber-200 mt-4">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Important Notice</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Buses from CIQ 2nd Link depart <strong>only once per hour</strong>. Missing your bus could mean a long wait!
                    </AlertDescription>
                  </Alert>
                    
                  <div className="mt-4 space-y-2">
                    <a 
                      href="https://www.causewaylink.com.my/important-announcement-for-cw3-cw4-passengers-relocating-to-jurong-town-hall-bus-interchange/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Official CW3/CW4 Information
                    </a>
                    <a 
                      href="https://www.causewaylink.com.my/forest-city-fc1/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      FC1 Schedule Information
                    </a>
                  </div>
                  
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <a href="/bus-guide">View Full Bus Guide</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chartered Car Tab */}
            <TabsContent value="chartered-car">
              <Card>
                <CardHeader>
                  <CardTitle>Chartered Car Services</CardTitle>
                  <CardDescription>
                    Trusted driver contacts for direct transportation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    These trusted drivers are frequently used by our community for transportation between Singapore and Forest City:
                  </p>

                  <div className="space-y-4 mt-4">
                    <h3 className="font-medium">Singapore to Forest City</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex flex-col">
                          <span className="font-medium">Carol</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            <p>Trip: SGD 75 • Additional stop: SGD 5</p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <a 
                              href="https://sgmytaxi288service.com" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-blue-500 hover:underline flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Website
                            </a>
                            <a 
                              href="https://wa.me/60192551688" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-green-500 hover:underline flex items-center"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                        <span className="text-muted-foreground">+60 19-255 1688</span>
                      </li>
                      <li className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex flex-col">
                          <span className="font-medium">Ah Liang</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            <p>Trip: SGD 80 • Additional stop: SGD 10</p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <a 
                              href="https://wa.me/60167244913" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-green-500 hover:underline flex items-center"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                        <span className="text-muted-foreground">+60 16-724 4913</span>
                      </li>
                    </ul>
                  </div>

                  <Alert className="mt-4">
                    <AlertDescription>
                      Have a trusted driver contact to share?{" "}
                      <a 
                        href="https://discordapp.com/users/474860619217108992"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Message me
                      </a>{" "}
                      to add them to this list.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">              
              <div className="space-y-2">
                <h3 className="font-medium">Ride Sharing Payments</h3>
                <div className="bg-slate-50 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Payment Options</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>BNPL:</strong> Awaiting Shawn's implementation.</li>
                    <li><strong>Revolut:</strong> Preferred method - fee-free transfers between users</li>
                    <li><strong>Cryptocurrency:</strong> USDC on BASE or SOL, for peer-to-peer payments</li>
                    <li><strong>Cash:</strong> Pay in SGD or RM depending on driver preference</li>
                  </ul>
                </div>

                <h3 className="font-medium mt-6">Bus Payments</h3>
                <div className="bg-slate-50 p-3 rounded-md">
                  <ul className="space-y-2 text-sm">
                    <li><strong>ManjaLink Card:</strong> Cashless payment option for regular commuters</li>
                    <li><strong>Cash: </strong>Not tested.</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <a 
                    href="https://www.causewaylink.com.my/cashless-travel/?utm_source=cwl_homepage_shortcut&utm_medium=cwl_homepage_shortcut&utm_campaign=cwl_homepage_shortcut" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline text-sm"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Learn About Bus Cashless Payment Options
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
