export interface InvoiceServiceItem {
  code: string
  description: string
  unit: string
  price: number // in CAD
}

export const INVOICE_SERVICES: Record<string, InvoiceServiceItem> = {
  condenser: {
    code: 'SER-89532',
    description: 'Routine Condenser Maintenance',
    unit: 'Each',
    price: 99.99
  },
  furnace: {
    code: 'SER-28739',
    description: 'Routine Furnace Maintenance', 
    unit: 'Each',
    price: 99.99
  },
  system: {
    code: 'SER-36573',
    description: 'Routine System Maintenance',
    unit: 'Each', 
    price: 199.99
  }
}

export const HST_RATE = 0.13 // 13% HST for Canada

export function getInvoiceItemsByServiceType(serviceType: string): InvoiceServiceItem[] {
  switch (serviceType) {
    case 'condenser_only':
      return [INVOICE_SERVICES.condenser]
    case 'furnace_only':
      return [INVOICE_SERVICES.furnace]
    case 'condenser+furnace':
      return [INVOICE_SERVICES.system] // Use system maintenance for combined service
    default:
      return []
  }
}

export function calculateInvoiceTotals(items: InvoiceServiceItem[]): {
  subtotal: number
  hst: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const hst = subtotal * HST_RATE
  const total = subtotal + hst
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    hst: Math.round(hst * 100) / 100,
    total: Math.round(total * 100) / 100
  }
} 