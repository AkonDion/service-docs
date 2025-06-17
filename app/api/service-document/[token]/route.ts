import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@/utils/supabase/server"
import { AirVent, Flame } from "lucide-react"
import type { ServiceDocument } from "@/app/types/service"
import { getServicesByType } from "@/app/utils/serviceItems"
import { getInvoiceItemsByServiceType, calculateInvoiceTotals } from "@/app/utils/invoiceItems"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createSupabaseClient()
    const { token } = await params

    if (!token || typeof token !== 'string') {
      return new NextResponse('Invalid token', { status: 400 })
    }

    // Fetch service document with customer and equipment data
    const { data: rawDocument, error: serviceError } = await supabase
      .from('service_documents')
      .select(`
        *,
        customer:all_customers(*),
        equipment(*)
      `)
      .eq('sharing_token', token)
      .single()

    if (serviceError) {
      console.error('Error fetching service document:', serviceError)
      return new NextResponse('Error fetching service document', { status: 500 })
    }

    if (!rawDocument) {
      return new NextResponse('Service document not found', { status: 404 })
    }

    // Generate document number if not exists
    const documentNumber = `CH-${new Date(rawDocument.service_date).getFullYear()}-${rawDocument.id.slice(0, 6).toUpperCase()}`

    // Get hardcoded service items based on service type
    const { services: hardcodedServices } = getServicesByType(rawDocument.service_type)

    // Get invoice items based on service type
    const invoiceServices = getInvoiceItemsByServiceType(rawDocument.service_type)
    const invoiceTotals = calculateInvoiceTotals(invoiceServices)

    // Transform the data to match our TypeScript types
    const transformedDocument: ServiceDocument = {
      documentNumber,
      serviceDate: new Date(rawDocument.service_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      nextService: new Date(new Date(rawDocument.service_date).setMonth(new Date(rawDocument.service_date).getMonth() + 6)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      customer: {
        name: rawDocument.customer?.name || 'Unknown Customer',
        address: rawDocument.customer?.address || 'Address not provided',
        phone: rawDocument.customer?.phone || 'Phone not provided',
        email: rawDocument.customer?.email || 'Email not provided'
      },
      equipment: rawDocument.equipment.map((equipment: any) => ({
        id: equipment.id,
        name: equipment.equipment_type === 'condenser' ? 'Condenser' : 'Gas Furnace',
        icon: equipment.equipment_type === 'condenser' ? AirVent : Flame,
        model: equipment.model,
        serialNumber: equipment.serial_number,
        installationDate: equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Unknown',
        warrantyExpires: equipment.warranty_expires ? new Date(equipment.warranty_expires).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Unknown',
        equipment_type: equipment.equipment_type,
        warranty: {
          type: equipment.equipment_type === 'condenser' ? 'Comfort Hub Premium 10-Year' : 'Daikin Furnace 10-Year Parts',
          coverageStart: equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Unknown',
          coverageEnd: equipment.warranty_expires ? new Date(equipment.warranty_expires).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Unknown',
          servicesRemaining: 8,
          status: 'Active & Current',
        },
        // Use hardcoded services based on equipment type
        services: equipment.equipment_type === 'condenser' 
          ? hardcodedServices.filter(() => rawDocument.service_type === 'condenser_only' || rawDocument.service_type === 'condenser+furnace')
          : hardcodedServices.filter(() => rawDocument.service_type === 'furnace_only' || rawDocument.service_type === 'condenser+furnace')
      })),
      invoice: {
        items: invoiceServices.map(service => ({
          description: service.description,
          code: service.code,
          unit: service.unit,
          quantity: 1,
          unitPrice: service.price,
          total: service.price
        })),
        subtotal: invoiceTotals.subtotal,
        hst: invoiceTotals.hst,
        total: invoiceTotals.total,
      },
    }

    // Fix services based on service type
    if (rawDocument.service_type === 'condenser_only') {
      transformedDocument.equipment = transformedDocument.equipment.filter(eq => eq.equipment_type === 'condenser')
      transformedDocument.equipment.forEach(eq => {
        if (eq.equipment_type === 'condenser') {
          eq.services = hardcodedServices
        }
      })
    } else if (rawDocument.service_type === 'furnace_only') {
      transformedDocument.equipment = transformedDocument.equipment.filter(eq => eq.equipment_type === 'furnace')
      transformedDocument.equipment.forEach(eq => {
        if (eq.equipment_type === 'furnace') {
          eq.services = hardcodedServices
        }
      })
    } else if (rawDocument.service_type === 'condenser+furnace') {
      // For combined service, each equipment gets its own service items
      transformedDocument.equipment.forEach(eq => {
        if (eq.equipment_type === 'condenser') {
          eq.services = getServicesByType('condenser_only').services
        } else if (eq.equipment_type === 'furnace') {
          eq.services = getServicesByType('furnace_only').services
        }
      })
    }

    return NextResponse.json(transformedDocument)
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 