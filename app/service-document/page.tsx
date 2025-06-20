"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CheckCircle,
  Download,
  FileText,
  Wrench,
  Calendar,
  User,
  Shield,
  Filter,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CreditCard,
  Archive,
  AirVent,
  Flame,
  Droplets,
  PowerOff,
  Lightbulb,
  Share2,
  Wind
} from "lucide-react"
import { Suspense, useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { generateShareUrl } from "../utils/sharing"
import { toast } from "sonner"
import type { ServiceDocument } from "../types/service"

const serviceTips = [
  {
    icon: Filter,
    title: "Filter Replacement",
    content:
      'A clean filter is your system\'s first line of defense. 5" filters should be replaced every 8–12 months. 1" filters should be replaced every 2–3 months.',
    note: "Regular replacement helps prevent airflow restriction, which can lead to blower motor failure.",
    color: "text-sky-600",
  },
  {
    icon: Wrench,
    title: "Outdoor Unit Maintenance",
    content:
      "During your annual service, we thoroughly clean the outdoor coil. Between visits, gently rinse the coil with a garden hose to remove debris. This helps maintain system efficiency.",
    color: "text-green-600",
  },
  {
    icon: Droplets,
    title: "Check for Water Around the System",
    content:
      "When changing your filter, inspect for water or moisture around your furnace/air handler. Contact us immediately if noticed—this could indicate a drainage issue.",
    color: "text-yellow-600",
  },
  {
    icon: PowerOff,
    title: "Loss of Thermostat Power",
    content:
      "If your thermostat display is blank, check your breaker panel and ensure the furnace wall switch (often mistaken for a light switch) is on.",
    color: "text-red-600",
  },
  {
    icon: Lightbulb,
    title: "Condensate Pump Care",
    content:
      "To prevent bacterial buildup, pour one capful of bleach into your condensate pump's reservoir once per year. This extends pump life and prevents blockages.",
    color: "text-purple-600",
  },
  {
    icon: Wind,
    title: "Summer HRV Usage",
    content:
      "Running your HRV in the summer can bring in hot, humid air and reduce your system's efficiency. Unless required for specific ventilation needs, it's best to turn off or limit HRV use during warmer months.",
    color: "text-orange-600",
  },
]

const InfoItem = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between items-start py-2 info-item">
    <span className="text-brand-text-secondary">{label}</span>
    <span className={`text-right font-medium text-brand-text-primary ${mono ? "font-mono" : ""}`}>{value}</span>
  </div>
)

function ServiceDocumentContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [currentEquipmentIndex, setCurrentEquipmentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [serviceData, setServiceData] = useState<ServiceDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchServiceDocument = async () => {
      if (!token) {
        setError('No service document token provided. Please access this page with a valid token parameter.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/service-document/${token}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setServiceData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching service document:', err)
        setError('Failed to load service document. Please check the token and try again.')
        setServiceData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchServiceDocument()
  }, [token])

  const currentEquipment = useMemo(() => {
    if (!serviceData?.equipment?.length) return null
    return serviceData.equipment[currentEquipmentIndex]
  }, [serviceData, currentEquipmentIndex])

  const handleNextEquipment = () => {
    if (serviceData?.equipment) {
      setCurrentEquipmentIndex((prevIndex) => (prevIndex + 1) % serviceData.equipment.length)
    }
  }

  const handlePrevEquipment = () => {
    if (serviceData?.equipment) {
      setCurrentEquipmentIndex(
        (prevIndex) => (prevIndex - 1 + serviceData.equipment.length) % serviceData.equipment.length,
      )
    }
  }

  const handlePayNow = () => {
    if (serviceData?.stripeLink) {
      // Open Stripe payment link
      window.open(serviceData.stripeLink, '_blank')
    } else if (serviceData?.invoice?.total) {
      // Fallback message if no Stripe link is set
      alert(`Stripe payment link not configured for this invoice of CA$${serviceData.invoice.total.toFixed(2)}`)
    }
  }

  const generatePDF = async () => {
    // Ensure we're running in the browser and client is mounted
    if (!isClient || typeof window === 'undefined') {
      console.error('PDF generation attempted on server side or before client mount')
      return
    }

    if (!serviceData || !currentEquipment) {
      alert('No service data available for PDF generation')
      return
    }

    setIsGeneratingPDF(true)
    try {
      const requestData = {
        documentNumber: serviceData.documentNumber,
        serviceDate: serviceData.serviceDate,
        customer: {
          name: serviceData.customer.name,
          email: serviceData.customer.email,
          phone: serviceData.customer.phone,
          address: serviceData.customer.address
        },
        equipment: serviceData.equipment.map(eq => ({
          name: eq.name,
          model: eq.model,
          serialNumber: eq.serialNumber,
          installationDate: eq.installationDate,
          warrantyExpires: eq.warrantyExpires,
          warranty: eq.warranty
        })),
        serviceDescription: serviceData.invoice.items[0]?.description || 'Routine Maintenance',
        serviceCode: serviceData.invoice.items[0]?.code || 'SER-00000',
        technician_name: serviceData.technician_name
      }

      console.log('Calling PDF generation API...')
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      })
      
      console.log('PDF API response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      console.log('Content-Type:', response.headers.get('content-type'))
      console.log('Content-Length:', response.headers.get('content-length'))
      console.log('Content-Disposition:', response.headers.get('content-disposition'))
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      console.log('Converting response to blob...')
      const blob = await response.blob()
      console.log('Blob created, size:', blob.size)
      console.log('Blob type:', blob.type)
      
      console.log('Starting client-side download...')
      console.log('Creating download URL...')
      const url = window.URL.createObjectURL(blob)
      console.log('Download URL created:', url.substring(0, 50) + '...')
      
      // Try multiple download methods without DOM manipulation
      const filename = `service-document-${serviceData.documentNumber}-${currentEquipment.name.replace(/\s+/g, "_")}.pdf`
      
      console.log('Attempting download methods...')
      
      // Method 1: Try File System Access API (modern browsers)
      if ('showSaveFilePicker' in window) {
        try {
          console.log('Trying File System Access API...')
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PDF files',
              accept: { 'application/pdf': ['.pdf'] }
            }]
          })
          const writableStream = await fileHandle.createWritable()
          await writableStream.write(blob)
          await writableStream.close()
          console.log('File saved successfully with File System Access API!')
          
          // Clean up
          window.URL.revokeObjectURL(url)
          console.log('PDF download completed successfully!')
          return
        } catch (fsError) {
          console.log('File System Access API failed or cancelled:', fsError)
        }
      } else {
        console.log('File System Access API not supported in this browser')
      }
      
      // Method 2: Try traditional download (most compatible for automatic downloads)
      try {
        console.log('Trying traditional download method...')
        
        // Create download link with proper user gesture context
        const downloadLink = window.document.createElement('a')
        downloadLink.href = url
        downloadLink.download = filename
        downloadLink.style.display = 'none'
        
        // Add to DOM temporarily
        window.document.body.appendChild(downloadLink)
        
        // Trigger download in user gesture context
        downloadLink.click()
        
        // Clean up immediately
        window.document.body.removeChild(downloadLink)
        
        console.log('Traditional download triggered successfully!')
        
        // Clean up URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          console.log('Blob URL revoked')
        }, 1000)
        
        console.log('PDF download completed successfully!')
        return
        
      } catch (traditionalError) {
        console.log('Traditional download failed:', traditionalError)
      }
      
      // Method 3: Try window.open (view in new tab)
      try {
        console.log('Trying window.open method...')
        const newWindow = window.open(url, '_blank')
        if (newWindow) {
          console.log('Opened PDF in new window successfully!')
          // Set a title for the new window
          setTimeout(() => {
            try {
              newWindow.document.title = filename
            } catch (e) {
              // Ignore cross-origin errors
            }
          }, 100)
        } else {
          throw new Error('Popup blocked')
        }
      } catch (windowError) {
        console.log('window.open failed:', windowError)
        
        // Method 4: Direct navigation fallback
        try {
          console.log('Trying direct navigation fallback...')
          window.location.href = url
          console.log('Navigated to PDF URL')
        } catch (navError) {
          console.error('All download methods failed:', navError)
          throw new Error(`Unable to download PDF: ${navError instanceof Error ? navError.message : String(navError)}`)
        }
      }
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        console.log('Blob URL revoked')
      }, 5000)
      
      console.log('PDF download initiated successfully!')
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert((error as Error).message || "Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleShare = async () => {
    if (token) {
      const shareUrl = generateShareUrl(token)
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Share link copied to clipboard!")
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark-bg text-brand-text-primary font-sans p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-semibold mb-4">Loading service document...</div>
          <div className="text-brand-text-secondary">Please wait while we fetch your data.</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark-bg text-brand-text-primary font-sans p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-2xl font-semibold mb-4">Error Loading Document</div>
          <div className="text-brand-text-secondary mb-6">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-brand-primary-accent text-white hover:bg-[hsl(168,70%,42%)]"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No data state
  if (!serviceData || !currentEquipment) {
    return (
      <div className="min-h-screen bg-brand-dark-bg text-brand-text-primary font-sans p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-4">No Service Document Found</div>
          <div className="text-brand-text-secondary">The requested service document could not be found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark-bg text-brand-text-primary font-sans p-4 sm:p-8 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-brand-text-primary mb-2">Service Report</h1>
          <p className="text-lg text-brand-primary-accent font-semibold">{serviceData.documentNumber}</p>
        </header>

        <section className="grid md:grid-cols-3 gap-6 mb-12 text-center">
          <Card className="bg-brand-card-bg border-border card-print-no-break">
            <CardContent className="p-6">
              <Calendar className="mx-auto w-8 h-8 text-brand-primary-accent mb-3" />
              <p className="text-brand-text-secondary text-sm">Service Date</p>
              <p className="text-brand-text-primary font-semibold text-lg">{serviceData.serviceDate}</p>
            </CardContent>
          </Card>
          <Card className="bg-brand-card-bg border-brand-primary-accent/50 shadow-glow-accent-light card-print-no-break">
            <CardContent className="p-6">
              <Shield className="mx-auto w-8 h-8 text-brand-primary-accent mb-3" />
              <p className="text-brand-text-secondary text-sm">Warranty Status</p>
              <p className="text-brand-text-primary font-semibold text-lg">
                {serviceData.equipment[0].warranty.status}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-brand-card-bg border-border card-print-no-break">
            <CardContent className="p-6">
              <ChevronRight className="mx-auto w-8 h-8 text-brand-primary-accent mb-3" />
              <p className="text-brand-text-secondary text-sm">Next Service Due</p>
              <p className="text-brand-text-primary font-semibold text-lg">{serviceData.nextService}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-8 mb-12 customer-equipment-section-wrapper">
          <Card className="bg-brand-card-bg border-border card-print-no-break md:col-span-1">
            <CardHeader>
              <CardTitle className="text-2xl text-brand-primary-accent flex items-center">
                <User className="mr-3" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Name" value={serviceData.customer.name} />
              <InfoItem label="Address" value={serviceData.customer.address} />
              <InfoItem label="Contact" value={`${serviceData.customer.phone} | ${serviceData.customer.email}`} />
            </CardContent>
          </Card>

          <Card className="bg-brand-card-bg border-border card-print-no-break md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl text-brand-primary-accent flex items-center">
                {currentEquipment.name === 'Condenser' ? (
                  <AirVent className="mr-3 h-6 w-6" />
                ) : (
                  <Flame className="mr-3 h-6 w-6" />
                )}
                Equipment
              </CardTitle>
              {serviceData.equipment.length > 1 && (
                <div className="flex items-center gap-2 print-hidden">
                  <Button variant="ghost" size="icon" onClick={handlePrevEquipment} aria-label="Previous Equipment">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm text-brand-text-secondary whitespace-nowrap">
                    {currentEquipmentIndex + 1} of {serviceData.equipment.length}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleNextEquipment} aria-label="Next Equipment">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-center font-semibold text-brand-text-primary print-hidden">
                {currentEquipment.name}
              </div>
              <InfoItem label="Model" value={currentEquipment.model} />
              <InfoItem label="Serial #" value={currentEquipment.serialNumber} mono />
              <InfoItem label="Warranty Expires" value={currentEquipment.warrantyExpires} />
            </CardContent>
          </Card>
        </section>

        <section className="mb-12">
          <Card className="bg-brand-card-bg border-border card-print-no-break">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-brand-text-primary flex items-center">
                <Wrench className="mr-4 text-brand-primary-accent" />
                Service Checklist{" "}
                <span className="text-xl font-medium text-brand-text-secondary ml-2">({currentEquipment.name})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border/50">
                    <TableHead className="text-brand-primary-accent">Service Item</TableHead>
                    <TableHead className="text-brand-primary-accent w-36 text-center">Status</TableHead>
                    <TableHead className="text-brand-primary-accent">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEquipment.services.map((service, index) => (
                    <TableRow key={index} className="border-b-border/30">
                      <TableCell className="font-medium text-brand-text-primary">{service.item}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${service.status === "Completed" ? "bg-brand-primary-accent/10 text-brand-primary-accent" : "bg-sky-500/10 text-sky-400"}`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1.5" />
                          {service.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-brand-text-secondary text-sm notes-cell-content">
                        {service.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="mb-12">
          <Card className="bg-brand-card-bg border-border card-print-no-break">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-brand-text-primary flex items-center">
                <FileText className="mr-4 text-brand-primary-accent" />
                Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border/50">
                    <TableHead className="text-brand-primary-accent">Description</TableHead>
                    <TableHead className="text-brand-primary-accent">Code</TableHead>
                    <TableHead className="text-center text-brand-primary-accent">Unit</TableHead>
                    <TableHead className="text-center text-brand-primary-accent">Qty</TableHead>
                    <TableHead className="text-right text-brand-primary-accent">Unit Price</TableHead>
                    <TableHead className="text-right text-brand-primary-accent">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceData.invoice.items.map((item, index) => (
                    <TableRow key={index} className="border-b-border/30">
                      <TableCell className="font-medium text-brand-text-primary">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-brand-text-secondary font-mono">
                        {item.code}
                      </TableCell>
                      <TableCell className="text-center text-brand-text-secondary">
                        {item.unit}
                      </TableCell>
                      <TableCell className="text-center text-brand-text-secondary">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-brand-text-primary">
                        CA$ {item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-brand-text-primary text-lg">
                        CA$ {item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-6 bg-border/50" />
              <div className="space-y-3 text-lg px-4">
                <div className="flex justify-between invoice-summary-row">
                  <span className="text-brand-text-secondary">Subtotal</span>
                  <span className="font-medium text-brand-text-primary">
                    CA$ {serviceData.invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between invoice-summary-row">
                  <span className="text-brand-text-secondary">HST (13%)</span>
                  <span className="font-medium text-brand-text-primary">CA$ {serviceData.invoice.hst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold pt-2 border-t border-border/50 mt-4 invoice-summary-row">
                  <span className="text-brand-primary-accent">Total Due</span>
                  <span className="text-brand-primary-accent">CA$ {serviceData.invoice.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-8 text-center print-hidden">
                <Button
                  onClick={handlePayNow}
                  size="lg"
                  className="bg-brand-primary-accent text-white font-bold hover:bg-[hsl(168,70%,42%)] active:bg-[hsl(168,70%,38%)] shadow-glow-accent px-10 py-6 text-lg transition-colors duration-150"
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  Pay Invoice Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-12">
          <Card className="bg-brand-card-bg border-border card-print-no-break">
            <CardHeader>
              <CardTitle className="text-2xl text-brand-text-primary flex items-center">
                <Archive className="mr-3 text-brand-primary-accent" />
                Our Commitment to Your Warranty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-brand-text-secondary">
              {serviceData.equipment.length === 1 ? (
                <p>
                  This report confirms that your{" "}
                  <strong>
                    {serviceData.equipment[0].name} (Model: {serviceData.equipment[0].model}, Serial #: {serviceData.equipment[0].serialNumber})
                  </strong>{" "}
                  received the services listed from Comfort Hub on {serviceData.serviceDate}.
                </p>
              ) : (
                <div>
                  <p>This report confirms that the following equipment received the services listed from Comfort Hub on {serviceData.serviceDate}:</p>
                  <ul className="list-disc list-inside ml-4 mt-3 space-y-2">
                    {serviceData.equipment.map((equipment) => (
                      <li key={equipment.id} className="text-brand-text-secondary">
                        <strong className="text-brand-text-primary">
                          {equipment.name}
                        </strong>{" "}
                        <span className="text-sm">
                          (Model: {equipment.model}, Serial #: {equipment.serialNumber})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p>
                To simplify your warranty process, Comfort Hub securely stores a copy of this service report and all
                related maintenance details for each of your serviced units. Should your warranty require proof of service for a
                claim, we will provide this information directly to the relevant manufacturer on your
                behalf.
              </p>
              <p>
                Regular professional maintenance, as performed by our team, is key to keeping your equipment operating
                at its best and helps satisfy typical warranty conditions.
              </p>
              <p>
                We trust these services were completed to your satisfaction. If you have any questions about this report
                or the work performed, please don't hesitate to contact us.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-brand-text-primary text-center mb-8 flex items-center justify-center">
            <Sparkles className="mr-4 text-brand-primary-accent" />
            Pro Tips for System Health
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceTips.map((tip, index) => (
              <Card key={index} className="bg-brand-card-bg border-border p-6 text-center card-print-no-break">
                <tip.icon className="w-10 h-10 text-brand-primary-accent mx-auto mb-4" />
                <h3 className="font-semibold text-brand-text-primary text-lg mb-2">{tip.title}</h3>
                <p className="text-brand-text-secondary text-sm">{tip.content}</p>
              </Card>
            ))}
          </div>
        </section>

        <footer className="text-center border-t border-border/50 pt-8">
          <h3 className="text-2xl font-bold text-brand-text-primary mb-2">Need Support?</h3>
          <p className="text-brand-text-secondary mb-4">We're here to help 24/7. Reach out anytime.</p>
          <div className="flex justify-center items-center gap-6">
            <a href="tel:615-581-1770ext2" className="text-xl font-semibold text-brand-primary-accent hover:underline">
              615-581-1770 x 2
            </a>
            <a
              href="mailto:support@comforthub.ca"
              className="text-xl font-semibold text-brand-primary-accent hover:underline"
            >
              support@comforthub.ca
            </a>
          </div>
          <p className="text-xs text-brand-text-secondary/70 mt-8">&copy; {new Date().getFullYear()} Comfort Hub</p>
        </footer>

        <div className="fixed bottom-6 right-6 print-hidden">
                      <Button
             onClick={generatePDF}
            size="lg"
            className="bg-brand-primary-accent text-white font-bold hover:bg-[hsl(168,70%,42%)] active:bg-[hsl(168,70%,38%)] shadow-glow-accent transition-colors duration-150"
            disabled={isGeneratingPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>
        </div>

        <div className="flex justify-center items-center gap-2 mt-6">
          <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceDocumentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Service Document...</h1>
          <p className="text-gray-600">Please wait while we load your service document.</p>
        </div>
      </div>
    }>
      <ServiceDocumentContent />
    </Suspense>
  )
}
