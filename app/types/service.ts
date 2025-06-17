import { LucideIcon } from "lucide-react"

export type ServiceType = 'condenser_only' | 'furnace_only' | 'condenser+furnace'

export interface ServiceItem {
  item: string
  status: string
  notes: string
}

export interface Warranty {
  type: string
  coverageStart: string
  coverageEnd: string
  servicesRemaining: number
  status: string
}

export interface Equipment {
  id: string
  name: string
  icon: LucideIcon
  model: string
  serialNumber: string
  installationDate: string
  warrantyExpires: string
  warranty: {
    type: string
    coverageStart: string
    coverageEnd: string
    servicesRemaining: number
    status: string
  }
  equipment_type: 'condenser' | 'furnace'
  services: ServiceItem[]
}

export interface Customer {
  name: string
  address: string
  phone: string
  email: string
}

export interface InvoiceItem {
  description: string
  code: string
  unit: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  items: InvoiceItem[]
  subtotal: number
  hst: number
  total: number
}

export interface ServiceDocument {
  documentNumber: string
  serviceDate: string
  nextService: string
  customer: Customer
  equipment: Equipment[]
  invoice: Invoice
} 