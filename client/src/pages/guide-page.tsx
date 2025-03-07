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
import { Bus, MapPin, AlertTriangle, Phone, ExternalLink } from "lucide-react";

export default function GuidePage() {
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Reminders</AlertTitle>
            <AlertDescription>
              Don't forget your passport and ensure it has at least 6 months
              validity. Immigration checks are required for both entry and exit.
            </AlertDescription>
          </Alert>

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
                          <h4 className="font-medium">From Woodlands</h4>
                          <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Take SBS 170 from Woodlands Checkpoint</li>
                            <li>Journey time: ~45 minutes</li>
                            <li>Fare: ~SGD 2.50</li>
                          </ul>
                        </div>
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

          {/* Common Drop-off Points Map */}
          <Card>
            <CardHeader>
              <CardTitle>Common Drop-off Points</CardTitle>
              <CardDescription>
                Popular destinations in both Singapore and Forest City
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Map component will be integrated here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
