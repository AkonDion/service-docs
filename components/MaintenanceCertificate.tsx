import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Calendar, User, Wrench } from "lucide-react"

interface MaintenanceCertificateProps {
  documentNumber: string;
  serviceDate: string;
  customer: {
    name: string;
    address: string;
  };
  equipment: {
    name: string;
    model: string;
    serialNumber: string;
    services: Array<{
      item: string;
      status: string;
    }>;
  };
}

const MaintenanceCertificate: React.FC<MaintenanceCertificateProps> = ({
  documentNumber,
  serviceDate,
  customer,
  equipment,
}) => {
  return (
    <div className="min-h-[1056px] w-[816px] bg-white text-black p-12 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Certificate of Maintenance</h1>
        <p className="text-lg text-gray-600">{documentNumber}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-12">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Calendar className="mr-3 h-5 w-5 text-blue-600" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Service Date</p>
            <p className="font-semibold mb-4">{serviceDate}</p>
            <p className="text-sm text-gray-600 mb-1">Certificate Number</p>
            <p className="font-semibold">{documentNumber}</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <User className="mr-3 h-5 w-5 text-blue-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Name</p>
            <p className="font-semibold mb-4">{customer.name}</p>
            <p className="text-sm text-gray-600 mb-1">Address</p>
            <p className="font-semibold">{customer.address}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 mb-12">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Wrench className="mr-3 h-5 w-5 text-blue-600" />
            Equipment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Equipment</p>
              <p className="font-semibold mb-4">{equipment.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Model</p>
              <p className="font-semibold mb-4">{equipment.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Serial Number</p>
              <p className="font-semibold">{equipment.serialNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Shield className="mr-3 h-5 w-5 text-blue-600" />
            Maintenance Certification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            This certifies that the above equipment has been professionally maintained according to manufacturer specifications
            and industry best practices. The following maintenance services were performed:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            {equipment.services.map((service, index) => (
              <li key={index} className="text-gray-800">
                {service.item}
              </li>
            ))}
          </ul>
          <div className="mt-12 pt-12 border-t">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certified By</p>
                <div className="w-48 h-0.5 bg-gray-400"></div>
                <p className="text-sm text-gray-600 mt-1">Authorized Technician</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <div className="w-48 h-0.5 bg-gray-400"></div>
                <p className="text-sm text-gray-600 mt-1">{serviceDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceCertificate; 