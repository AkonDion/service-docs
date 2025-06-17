import { ServiceItem, ServiceType } from "../types/service"

// Service-specific checklist items
export const condenserServices: ServiceItem[] = [
  {
    item: "Refrigerant System Inspection",
    status: "Completed",
    notes:
      "System pressures, superheat, and subcooling confirmed within optimal range. No signs of refrigerant loss. System operating at target capacity under current load conditions.",
  },
  {
    item: "Electrical Connections Inspection",
    status: "Completed",
    notes:
      "All wire terminals inspected and secured. Connections are clean, tight, and free of oxidation or heat discoloration.",
  },
  {
    item: "Coil Cleaning – Indoor & Outdoor",
    status: "Completed",
    notes:
      "Outdoor condenser coil power-washed using Nu-Brite™ non-acid, alkaline-based cleaner to restore heat transfer performance. Indoor coil inspected and cleared of dust and debris.",
  },
  {
    item: "System Component Testing",
    status: "Completed",
    notes:
      "Measured component resistance values (compressor, fan motors, etc.) using multimeter. All readings fall within manufacturer specifications.",
  },
  {
    item: "System Power & Controls Check",
    status: "Completed",
    notes:
      "System energized and tested through thermostat. Verified safe operation and cycling through heating/cooling modes.",
  },
  {
    item: "Valve Stem Maintenance",
    status: "Completed",
    notes:
      "LeakLock® sealant reapplied to refrigerant service valve stems and caps to ensure secure sealing and prevent refrigerant leakage.",
  },
  {
    item: "Refrigerant Line Weatherproofing",
    status: "Completed",
    notes:
      "Inspected exterior wall penetration where refrigerant lines enter the building. Caulking and sealant are intact, with no signs of air or moisture infiltration.",
  },
]

export const furnaceServices: ServiceItem[] = [
  {
    item: "Gas Valve & Burner Inspection",
    status: "Completed",
    notes:
      "Burners cleaned and visually inspected for proper flame pattern. Gas valve operation tested and confirmed within manufacturer's pressure specifications.",
  },
  {
    item: "Heat Exchanger Inspection",
    status: "Completed",
    notes:
      "Primary and secondary heat exchangers inspected for cracks, corrosion, and blockages. No visible damage found; heat exchanger airflow verified.",
  },
  {
    item: "Ignition System Test",
    status: "Completed",
    notes:
      "Verified ignition sequence, flame sensor response time, and safe shutdown. Sensor performance confirmed.",
  },
  {
    item: "Flame Sensor Cleaning",
    status: "Completed",
    notes:
      "Flame sensor removed, cleaned, and reinstalled. Ensures reliable flame detection and proper furnace ignition.",
  },
  {
    item: "Vent System & Combustion Air Check",
    status: "Completed",
    notes:
      "Inspected exhaust vent for proper slope, clearances, and obstructions. Confirmed combustion air source is unobstructed and meets code.",
  },
  {
    item: "Blower Assembly Inspection",
    status: "Completed",
    notes:
      "Inspected and cleaned blower wheel. Motor amperage draw tested and confirmed within rated range. No imbalance or noise present.",
  },
  {
    item: "Electrical & Control Wiring Check",
    status: "Completed",
    notes:
      "All low- and high-voltage connections inspected, tightened, and verified clean. Control board and safety circuits tested for reliable operation.",
  },
]

// Helper function to get services based on service type
export const getServicesByType = (serviceType: ServiceType): { services: ServiceItem[], equipment: string[] } => {
  switch (serviceType) {
    case "condenser_only":
      return {
        services: condenserServices,
        equipment: ["condenser"]
      }
    case "furnace_only":
      return {
        services: furnaceServices,
        equipment: ["furnace"]
      }
    case "condenser+furnace":
      return {
        services: [...condenserServices, ...furnaceServices],
        equipment: ["condenser", "furnace"]
      }
    default:
      return {
        services: [],
        equipment: []
      }
  }
} 