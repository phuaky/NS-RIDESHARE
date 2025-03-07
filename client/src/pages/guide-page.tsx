import { NavBar } from "@/components/nav-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Travel Guide</h1>
          <p className="text-muted-foreground">
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
          <Tabs defaultValue="singapore" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="singapore">From Singapore</TabsTrigger>
              <TabsTrigger value="forest-city">From Forest City</TabsTrigger>
            </TabsList>

            {/* Singapore Guide */}
            <TabsContent value="singapore">
              <Card>
                <CardHeader>
                  <CardTitle>Traveling from Singapore</CardTitle>
                  <CardDescription>
                    Public transport options and recommended routes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="bus">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4" />
                          Public Bus Options
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <h4 className="font-medium">From Jurong East</h4>
                          <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Take SBS 160 from Jurong East Bus Interchange</li>
                            <li>Journey time: ~1 hour</li>
                            <li>Fare: ~SGD 3.00</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="contacts">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Trusted Driver Contacts
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            These drivers are frequently used by our community:
                          </p>
                          <ul className="space-y-2">
                            <li className="flex items-center justify-between p-2 border rounded-md">
                              <span>Mr. Tan (SG-FC)</span>
                              <span className="text-muted-foreground">+65 9123 4567</span>
                            </li>
                            <li className="flex items-center justify-between p-2 border rounded-md">
                              <span>Mr. Lee (FC-SG)</span>
                              <span className="text-muted-foreground">+60 12-345 6789</span>
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forest City Guide */}
            <TabsContent value="forest-city">
              <Card>
                <CardHeader>
                  <CardTitle>Traveling from Forest City</CardTitle>
                  <CardDescription>
                    Common pick-up points and transportation options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="pickup">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Common Pick-up Points
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          <li className="flex items-center justify-between p-2 border rounded-md">
                            <span>Forest City Mall</span>
                            <span className="text-muted-foreground">Main Entrance</span>
                          </li>
                          <li className="flex items-center justify-between p-2 border rounded-md">
                            <span>Shattuck St. Mary's School</span>
                            <span className="text-muted-foreground">Gate 1</span>
                          </li>
                          <li className="flex items-center justify-between p-2 border rounded-md">
                            <span>Forest City Golf Resort</span>
                            <span className="text-muted-foreground">Lobby</span>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="immigration">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Immigration Process
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p>Sequential process through checkpoints:</p>
                          <ol className="list-decimal list-inside space-y-2">
                            <li>Exit Malaysian Immigration (CIQ)</li>
                            <li>Cross Second Link Bridge</li>
                            <li>Enter Singapore Immigration (Tuas)</li>
                          </ol>
                          <Alert className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Plan for 45-60 minutes during peak hours
                            </AlertDescription>
                          </Alert>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Understanding costs and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Cost Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Base Cost</span>
                    <span className="font-medium">$80 SGD</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Additional Stop Fee</span>
                    <span className="font-medium">$5 SGD / stop</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Typical Cost Per Person (4 passengers)</span>
                    <span className="font-medium">$20 SGD</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Revolut Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Revolut is the preferred payment method for ride sharing due to its ease of use and lack of transaction fees between users.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Download the Revolut app</li>
                  <li>Create an account and verify your identity</li>
                  <li>Add your username to your RideShare profile</li>
                  <li>Send payment to the ride organizer via their Revolut username</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold">Bus Travel: Singapore to Forest City</h2>
              <p className="text-sm text-muted-foreground mt-2">
                A comprehensive guide for traveling by public bus from Singapore to Forest City, Malaysia.
              </p>

              {/* Quick Summary */}
              <div className="p-4 bg-muted rounded-md mt-4">
                <h3 className="font-medium mb-2">Quick Guide</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Journey: Jurong Town Hall Bus Interchange → CIQ 2nd Link → Forest City</li>
                  <li>Buses: Take CW3/CW4/CW4S/CW6/CW7, then FC1 after immigration</li>
                  <li>Total fare: S$5 (through-ticketing available)</li>
                  <li>Payment: Cash or ManjaLink card</li>
                  <li>Travel time: ~1.5-2 hours including immigration</li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Public bus travel from Singapore to Forest City involves taking a cross-border bus from Jurong Town Hall 
                  Bus Interchange to CIQ 2nd Link, then transferring to the FC1 bus to Forest City. Through-ticketing is 
                  available with a fare of S$5.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Step 1: Getting to Jurong Town Hall Bus Interchange</h3>
                <p className="text-sm text-muted-foreground">
                  Start your journey at Jurong Town Hall Bus Interchange, located at Berth B5. You can reach it by:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Taking the MRT to Jurong East station and walking about 10 minutes</li>
                  <li>Taking other bus services that stop at the interchange</li>
                <li>
                  <img src="https://www.causewaylink.com.my/wp-content/uploads/2024/01/Relocation-photos-map-01.png" alt="Map of Bus Route" className="w-full h-auto" />
                </li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Step 2: Taking the Cross-Border Bus</h3>
                <p className="text-sm text-muted-foreground">
                  From Jurong Town Hall, take a Causeway Link cross-border bus such as CW3, CW4, CW4S, CW6, or CW7 to 
                  CIQ 2nd Link (Tuas Second Link checkpoint). Through-ticketing is available for S$5, covering both 
                  the cross-border bus and the FC1 bus to Forest City.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Step 3: Immigration at CIQ 2nd Link</h3>
                <p className="text-sm text-muted-foreground">
                  At the checkpoint, you'll need to alight, clear Singapore immigration to exit, then clear Malaysia 
                  immigration to enter. Allow 45-60 minutes during peak hours, especially weekday mornings for entering 
                  Singapore and evenings for entering Malaysia.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Step 4: Final Leg to Forest City</h3>
                <p className="text-sm text-muted-foreground">
                  After immigration, board the FC1 bus at CIQ 2nd Link to reach Forest City. The journey takes about 20 minutes.
                </p>
                <h4 className="font-medium text-sm mt-2">FC1 Bus Departure Times from CIQ 2nd Link:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm mt-1">
                  <div>6:00 AM</div>
                  <div>7:00 AM</div>
                  <div>8:00 AM</div>
                  <div>9:00 AM</div>
                  <div>10:00 AM</div>
                  <div>11:00 AM</div>
                  <div>12:00 PM</div>
                  <div>1:00 PM</div>
                  <div>2:00 PM</div>
                  <div>3:00 PM</div>
                  <div>4:00 PM</div>
                  <div>5:00 PM</div>
                  <div>6:00 PM</div>
                  <div>7:00 PM</div>
                  <div>8:30 PM (Last bus)</div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Payment Options</h3>
                <p className="text-sm text-muted-foreground">
                  You can pay with cash or use a ManjaLink card, which offers rebates and can be purchased online.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Cash payment: Prepare exact fare (S$5 for the entire journey)</li>
                  <li>ManjaLink card: Available online, supports cashless payments with up to 9TCR monthly rebates</li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Additional Tips</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Download the LUGO App for real-time updates and trip planning</li>
                  <li>Check the Causeway Link website for the latest schedules</li>
                  <li>Plan for additional time during peak immigration hours</li>
                  <li>Arrive early at Jurong Town Hall to catch a bus that aligns with FC1 departure times</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
