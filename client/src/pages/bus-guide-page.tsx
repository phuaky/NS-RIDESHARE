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
import { Bus, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BusGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="container mx-auto py-6 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Complete Bus Travel Guide</h1>
        
        <div className="mb-6">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Important Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              Buses from CIQ 2nd Link depart <strong>only once per hour</strong>. If you miss your bus, you may need to wait up to an hour for the next one.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Official Resources</h2>
          <div className="space-y-2">
            <a 
              href="https://www.causewaylink.com.my/important-announcement-for-cw3-cw4-passengers-relocating-to-jurong-town-hall-bus-interchange/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              CW3 & CW4 Routes: Jurong Town Hall Bus Interchange Information
            </a>
            <a 
              href="https://www.causewaylink.com.my/forest-city-fc1/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Forest City FC1 Bus Information
            </a>
          </div>
        </div>
        
        <div className="mb-6 border rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-3 bg-slate-50">FC1 Bus Route Map</h2>
          <div className="relative">
            <img 
              src="https://www.causewaylink.com.my/wp-content/uploads/2023/12/FC1-Map-free-parking-1024x787.jpg" 
              alt="FC1 Bus Route Map with Free Parking Locations" 
              className="w-full h-auto"
            />
            <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 px-2 py-1 text-xs rounded">
              Source: <a href="https://www.causewaylink.com.my/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Causeway Link</a>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="singapore" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="singapore">Singapore to Forest City</TabsTrigger>
            <TabsTrigger value="forest-city">Forest City to Singapore</TabsTrigger>
          </TabsList>

          {/* Singapore to Forest City */}
          <TabsContent value="singapore">
            <Card>
              <CardHeader>
                <CardTitle>Singapore to Forest City Bus Guide</CardTitle>
                <CardDescription>
                  Detailed information on taking public buses from Singapore
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-4">Quick Reference</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Journey:</strong> Jurong Town Hall Bus Interchange → CIQ 2nd Link → Forest City</li>
                    <li><strong>Buses:</strong> Take CW3/CW4/CW4S/CW6/CW7, then FC1 after immigration</li>
                    <li><strong>Total fare:</strong> S$5 (through-ticketing available)</li>
                    <li><strong>Payment:</strong> Cash or ManjaLink card</li>
                    <li><strong>Travel time:</strong> ~1.5-2 hours including immigration</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">Boarding Options</h3>
                  <ul className="list-disc list-inside space-y-4">
                    <li>
                      <div className="mb-2">
                        <strong>From Jurong East:</strong> Take CW3, CW4, or CW4S from Jurong Town Hall Bus Interchange
                      </div>
                      <a href="https://maps.app.goo.gl/nEHmgo2aobpzA1vZA" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Maps
                      </a>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong>From Boon Lay MRT:</strong> Take CW6
                      </div>
                      <a href="https://maps.app.goo.gl/JXuyU3oe5eK2LGCT8" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Maps
                      </a>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong>From Kranji MRT:</strong> Take CW7
                      </div>
                      <a href="https://maps.app.goo.gl/8VQP7iGQZaBJTubo7" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Maps
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">Immigration Process</h3>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <strong>Singapore Exit:</strong> Alight at checkpoint, go through Singapore immigration, then board the same bus.
                    </li>
                    <li>
                      <strong>Malaysian Entry:</strong> Alight at 2nd Link CIQ, clear Malaysian immigration.
                    </li>
                    <li>
                      <strong>To Forest City:</strong> After clearing immigration, take the FC1 bus to Forest City.
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">FC1 Bus Schedule from CIQ 2nd Link</h3>
                  <div className="bg-slate-50 p-4 rounded-md mb-4">
                    <div className="font-medium text-red-600 flex items-center mb-3">
                      <Clock className="h-4 w-4 mr-2" />
                      Note: Buses depart ONLY once per hour. Plan accordingly!
                    </div>
                    <p className="mb-4">Buses run from 6:00 AM to 8:30 PM with hourly departures. Check the official schedule for the most up-to-date information.</p>
                    <div className="space-y-2">
                      <a 
                        href="https://www.causewaylink.com.my/forest-city-fc1/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Official FC1 Bus Schedule
                      </a>
                      <a 
                        href="https://www.causewaylink.com.my/cashless-travel/?utm_source=cwl_homepage_shortcut&utm_medium=cwl_homepage_shortcut&utm_campaign=cwl_homepage_shortcut" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn About Cashless Payment Options
                      </a>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Drop-off Location in Forest City</h4>
                    <p className="mb-2">The FC1 bus will alight passengers at:</p>
                    <a 
                      href="https://maps.app.goo.gl/kLJeAV6Mq6NiaooZ7" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Drop-off Location on Google Maps
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Forest City to Singapore */}
          <TabsContent value="forest-city">
            <Card>
              <CardHeader>
                <CardTitle>Forest City to Singapore Bus Guide</CardTitle>
                <CardDescription>
                  Detailed information on taking public buses from Forest City
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-4">Quick Reference</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Journey:</strong> Forest City → CIQ 2nd Link → Singapore</li>
                    <li><strong>Buses:</strong> Take FC1 to CIQ, then CW3/CW4/CW4S/CW6/CW7 after immigration</li>
                    <li><strong>Total fare:</strong> MYR 5 (through-ticketing available)</li>
                    <li><strong>Payment:</strong> Cash or ManjaLink card</li>
                    <li><strong>Travel time:</strong> ~1.5-2 hours including immigration</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">Boarding Points</h3>
                  <ul className="list-disc list-inside space-y-4">
                    <li>
                      <div className="mb-2">
                        <strong>From Forest City Mall:</strong> Take FC1 from the bus station in front
                      </div>
                      <a href="https://maps.app.goo.gl/2dafz1uCyMhBGHK3A" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Maps
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">Immigration Process</h3>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <strong>Malaysian Exit:</strong> Alight at 2nd Link CIQ, go through Malaysian immigration.
                    </li>
                    <li>
                      <strong>To Singapore:</strong> After clearing immigration, take the corresponding bus (CW3/CW4/CW4S/CW6/CW7) to your destination in Singapore.
                    </li>
                    <li>
                      <strong>Singapore Entry:</strong> The bus will stop at Singapore checkpoint. Clear immigration and re-board the same bus.
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">FC1 Bus Schedule from Forest City</h3>
                  <div className="bg-slate-50 p-4 rounded-md mb-4">
                    <div className="font-medium text-red-600 flex items-center mb-3">
                      <Clock className="h-4 w-4 mr-2" />
                      Note: Buses depart ONLY once per hour. Plan accordingly!
                    </div>
                    <p className="mb-4">Buses run from 5:30 AM to 7:30 PM with hourly departures. Check the official schedule for the most up-to-date information.</p>
                    <div className="space-y-2">
                      <a 
                        href="https://www.causewaylink.com.my/forest-city-fc1/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Official FC1 Bus Schedule
                      </a>
                      <a 
                        href="https://www.causewaylink.com.my/cashless-travel/?utm_source=cwl_homepage_shortcut&utm_medium=cwl_homepage_shortcut&utm_campaign=cwl_homepage_shortcut" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn About Cashless Payment Options
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 