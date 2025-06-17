'use client'

import { useState, useEffect } from 'react'
import { ServiceDocument } from '@/app/types/service'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  Wind,
} from "lucide-react"

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

export default function SharedDocumentContent({ token }: { token: string }) {
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<ServiceDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentEquipmentIndex, setCurrentEquipmentIndex] = useState(0)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/service-document/${token}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setDocument(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching document:', err)
        setError('Failed to load service document')
        setDocument(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [token])

  if (loading) {
    return <div className="animate-pulse">Loading document...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!document) {
    return <div>No document found</div>
  }

  const currentEquipment = document.equipment[currentEquipmentIndex]

  const handleNextEquipment = () => {
    setCurrentEquipmentIndex((prevIndex) => (prevIndex + 1) % document.equipment.length)
  }

  const handlePrevEquipment = () => {
    setCurrentEquipmentIndex(
      (prevIndex) => (prevIndex - 1 + document.equipment.length) % document.equipment.length,
    )
  }

  const handlePayNow = () => {
    if (document?.stripeLink) {
      // Open Stripe payment link
      window.open(document.stripeLink, '_blank')
    } else if (document?.invoice?.total) {
      // Fallback message if no Stripe link is set
      alert(`Stripe payment link not configured for this invoice of CA$${document.invoice.total.toFixed(2)}`)
    }
  }

  const generatePDF = async () => {
    // Ensure we're running in the browser
    if (typeof window === 'undefined') {
      console.error('PDF generation attempted on server side')
      return
    }

    setIsGeneratingPDF(true)
    try {
      // Ensure we have all required customer data
      if (!document.customer?.address) {
        throw new Error('Customer address is required for PDF generation')
      }

      const requestData = {
        documentNumber: document.documentNumber,
        serviceDate: document.serviceDate,
        customer: {
          name: document.customer.name,
          email: document.customer.email,
          phone: document.customer.phone,
          address: document.customer.address
        },
        equipment: document.equipment.map(eq => ({
          name: eq.name,
          model: eq.model,
          serialNumber: eq.serialNumber,
          installationDate: eq.installationDate,
          warrantyExpires: eq.warrantyExpires,
          warranty: eq.warranty
        })),
        serviceDescription: document.invoice.items[0]?.description || 'Routine Maintenance',
        serviceCode: document.invoice.items[0]?.code || 'SER-00000',
        technician_name: document.technician_name
      }

      // Validate required fields before sending
      if (!requestData.customer.name || !requestData.customer.address) {
        throw new Error('Customer name and address are required')
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
      
      console.log('Creating download URL...')
      const url = URL.createObjectURL(blob)
      console.log('Download URL created:', url.substring(0, 50) + '...')
      
      console.log('Creating download link...')
      const a = document.createElement('a')
      console.log('Link element created')
      
      a.style.display = 'none'
      console.log('Link style set to none')
      
      a.href = url
      console.log('Link href set')
      
      a.download = `service-document-${requestData.documentNumber}-${currentEquipment.name.replace(/\s+/g, "_")}.pdf`
      console.log('Download filename set:', a.download)
      
      console.log('Triggering download...')
      document.body.appendChild(a)
      console.log('Link appended to body')
      
      a.click()
      console.log('Link clicked')
      
      // Clean up
      setTimeout(() => {
        try {
          if (a.parentNode) {
            document.body.removeChild(a)
            console.log('Link removed from DOM')
          }
          URL.revokeObjectURL(url)
          console.log('Download cleanup completed')
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError)
        }
      }, 100)
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert((error as Error).message || "Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <>
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-brand-text-primary mb-2">Service Report</h1>
        <p className="text-lg text-brand-primary-accent font-semibold">{document.documentNumber}</p>
      </header>

      <section className="grid md:grid-cols-3 gap-6 mb-12 text-center">
        <Card className="bg-brand-card-bg border-border card-print-no-break">
          <CardContent className="p-6">
            <Calendar className="mx-auto w-8 h-8 text-brand-primary-accent mb-3" />
            <p className="text-brand-text-secondary text-sm">Service Date</p>
            <p className="text-brand-text-primary font-semibold text-lg">{document.serviceDate}</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg border-brand-primary-accent/50 shadow-glow-accent-light card-print-no-break">
          <CardContent className="p-6">
            <Shield className="mx-auto w-8 h-8 text-brand-primary-accent mb-3" />
            <p className="text-brand-text-secondary text-sm">Warranty Status</p>
            <p className="text-brand-text-primary font-semibold text-lg">
              {document.equipment[0].warranty.status}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg border-border card-print-no-break">
          <CardContent className="p-6">
            <ChevronRight className="mx-auto w-8 h-8 text-brand-primary-accent mb-3" />
            <p className="text-brand-text-secondary text-sm">Next Service Due</p>
            <p className="text-brand-text-primary font-semibold text-lg">{document.nextService}</p>
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
            <InfoItem label="Name" value={document.customer.name} />
            <InfoItem label="Address" value={document.customer.address} />
            <InfoItem label="Contact" value={`${document.customer.phone} | ${document.customer.email}`} />
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
            {document.equipment.length > 1 && (
              <div className="flex items-center gap-2 print-hidden">
                <Button variant="ghost" size="icon" onClick={handlePrevEquipment} aria-label="Previous Equipment">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-brand-text-secondary whitespace-nowrap">
                  {currentEquipmentIndex + 1} of {document.equipment.length}
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
                {document.invoice.items.map((item, index) => (
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
                  CA$ {document.invoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between invoice-summary-row">
                <span className="text-brand-text-secondary">HST (13%)</span>
                <span className="font-medium text-brand-text-primary">CA$ {document.invoice.hst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-2 border-t border-border/50 mt-4 invoice-summary-row">
                <span className="text-brand-primary-accent">Total Due</span>
                <span className="text-brand-primary-accent">CA$ {document.invoice.total.toFixed(2)}</span>
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
            {document.equipment.length === 1 ? (
              <p>
                This report confirms that your{" "}
                <strong>
                  {document.equipment[0].name} (Model: {document.equipment[0].model}, Serial #: {document.equipment[0].serialNumber})
                </strong>{" "}
                received the services listed from Comfort Hub on {document.serviceDate}.
              </p>
            ) : (
              <div>
                <p>This report confirms that the following equipment received the services listed from Comfort Hub on {document.serviceDate}:</p>
                <ul className="list-disc list-inside ml-4 mt-3 space-y-2">
                  {document.equipment.map((equipment) => (
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
    </>
  )
} 