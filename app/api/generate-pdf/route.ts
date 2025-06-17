import { NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log('Received data:', data)
    
    // Validate required fields
    const requiredFields = ['documentNumber', 'serviceDate', 'customer', 'equipment']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      console.error('Missing fields:', missingFields)
      return new NextResponse(JSON.stringify({ 
        error: "Missing required data",
        missingFields 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate nested objects
    if (!data.customer?.name || !data.customer?.address) {
      console.error('Missing customer fields')
      return new NextResponse(JSON.stringify({ 
        error: "Missing customer data",
        required: ['name', 'address']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!data.equipment || !Array.isArray(data.equipment) || data.equipment.length === 0) {
      console.error('Missing or invalid equipment array')
      return new NextResponse(JSON.stringify({ 
        error: "Missing equipment data",
        required: ['equipment array with at least one item']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Debug: Log the service data to see where the unwanted link is coming from
    console.log('PDF Generation Debug:')
    console.log('Service Description:', data.serviceDescription)
    console.log('Service Code:', data.serviceCode)
    
    // Helper function to escape HTML and prevent unwanted links
    const escapeHtml = (text: string): string => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/http:\/\/[^\s\|]+/gi, '') // Remove any http links (including before |)
        .replace(/https:\/\/[^\s\|]+/gi, '') // Remove any https links (including before |)
        .replace(/www\.[^\s\|]+/gi, '') // Remove any www links (including before |)
        .replace(/b\.com/gi, '') // Specifically remove b.com
        .replace(/\s+\|\s+/g, ' | ') // Clean up spacing around pipes
        .replace(/^\s*\|\s*/, '') // Remove leading pipe
        .replace(/\s*\|\s*$/, '') // Remove trailing pipe
        .trim();
    };
    
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <title>Maintenance Service Certificate</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', sans-serif;
              line-height: 1.5;
              color: #1a2b3b;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
            .certificate {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              padding: 40px;
              box-sizing: border-box;
              background: #fff;
              position: relative;
            }
            .border {
              position: absolute;
              top: 20px;
              left: 20px;
              right: 20px;
              bottom: 20px;
              border: 2px solid #8B5CF6;
              border-radius: 12px;
              padding: 40px;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              position: relative;
              padding-bottom: 25px;
            }
            .header:after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 80%;
              height: 2px;
              background: linear-gradient(to right, transparent, #8B5CF6, transparent);
            }
            .logo {
              max-height: 65px;
              margin-bottom: 20px;
            }
            .title {
              font-family: 'Montserrat', sans-serif;
              font-size: 32px;
              color: #1a2b3b;
              margin: 0;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 15px;
              color: #4a5568;
              margin: 8px 0 0;
              font-weight: 500;
            }
            .content {
              display: grid;
              grid-template-columns: 1fr;
              gap: 20px;
              margin-top: 16px;
            }
            .section {
              margin-bottom: 10px;
            }
            .section-title {
              font-family: 'Montserrat', sans-serif;
              font-size: 16px;
              color: #8B5CF6;
              margin: 0 0 12px;
              font-weight: 600;
              display: flex;
              align-items: center;
            }
            .section-title:after {
              content: '';
              flex: 1;
              height: 1px;
              background: #e2e8f0;
              margin-left: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 140px 1fr;
              gap: 12px;
              font-size: 15px;
            }
            .equipment-container {
              display: grid;
              grid-template-columns: 1fr;
              gap: 16px;
            }
            .equipment-container.dual {
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .equipment-item {
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              background: #fafafa;
            }
            .equipment-title {
              font-family: 'Montserrat', sans-serif;
              font-size: 14px;
              color: #1a2b3b;
              margin: 0 0 8px;
              font-weight: 600;
              text-align: center;
              padding-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
            }
            .equipment-container .info-grid {
              grid-template-columns: 100px 1fr;
              gap: 8px;
              font-size: 13px;
            }
            .label {
              color: #4a5568;
              font-weight: 500;
            }
            .value {
              color: #1a2b3b;
              font-weight: 400;
            }
            .certification-text {
              text-align: center;
              font-size: 14px;
              margin: 20px 0;
              color: #1a2b3b;
              line-height: 1.5;
              padding: 0 40px;
            }

            .footer {
              position: absolute;
              bottom: 40px;
              left: 60px;
              right: 60px;
              text-align: center;
              font-size: 13px;
              color: #4a5568;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            .footer strong {
              color: #1a2b3b;
              font-family: 'Montserrat', sans-serif;
              font-weight: 600;
              font-size: 14px;
              display: block;
              margin-bottom: 5px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 150px;
              color: rgba(139, 92, 246, 0.02);
              font-weight: 700;
              font-family: 'Montserrat', sans-serif;
              white-space: nowrap;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="border">
              <div class="watermark">COMFORT HUB</div>
              <div class="header">
                <img class="logo" src="https://ftcafonmwukvumvmejeg.supabase.co/storage/v1/object/public/images/ICON.png" alt="Comfort Hub Logo">
                <h1 class="title">Certificate of Maintenance</h1>
                <p class="subtitle">Service Record ID: ${escapeHtml(data.documentNumber)}</p>
              </div>

              <div class="content">
                <div class="section">
                  <h2 class="section-title">Client Information</h2>
                  <div class="info-grid">
                    <div class="label">Name:</div>
                    <div class="value">${escapeHtml(data.customer.name)}</div>
                    <div class="label">Address:</div>
                    <div class="value">${escapeHtml(data.customer.address)}</div>
                    <div class="label">Phone:</div>
                    <div class="value">${escapeHtml(data.customer.phone || 'N/A')}</div>
                    <div class="label">Email:</div>
                    <div class="value">${escapeHtml(data.customer.email || 'N/A')}</div>
                  </div>
                </div>

                <div class="section">
                  <h2 class="section-title">Equipment Details</h2>
                  <div class="equipment-container ${data.equipment.length > 1 ? 'dual' : ''}">
                    ${data.equipment.map(equipment => `
                      <div class="equipment-item">
                        <h3 class="equipment-title">${escapeHtml(equipment.name)}</h3>
                        <div class="info-grid">
                          <div class="label">Model:</div>
                          <div class="value">${escapeHtml(equipment.model)}</div>
                          <div class="label">Serial Number:</div>
                          <div class="value">${escapeHtml(equipment.serialNumber)}</div>
                          <div class="label">Installation Date:</div>
                          <div class="value">${escapeHtml(equipment.installationDate || 'N/A')}</div>
                          <div class="label">Warranty Expires:</div>
                          <div class="value">${escapeHtml(equipment.warrantyExpires || 'N/A')}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div class="section">
                  <h2 class="section-title">Service Information</h2>
                  <div class="info-grid">
                    <div class="label">Service Date:</div>
                    <div class="value">${escapeHtml(data.serviceDate)}</div>
                    <div class="label">Technician:</div>
                    <div class="value">${escapeHtml(data.technician_name || 'N/A')}</div>
                    <div class="label">Service Performed:</div>
                    <div class="value">${escapeHtml(data.serviceDescription || 'Routine Maintenance')} | ${escapeHtml(data.serviceCode || 'SER-00000')}</div>
                  </div>
                </div>

                <div class="certification-text">
                  This certifies that the above equipment has been serviced according to manufacturer specifications
                  and industry best practices. All work has been performed by licensed and certified technicians.
                </div>

                <div class="footer">
                  <strong>Comfort Hub Inc</strong>
                  Daikin Comfort Pro • 613-581-1770 • support@comforthub.ca
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })
    const page = await browser.newPage()
    await page.setContent(certificateHtml, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4' })
    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="service-document-${data.documentNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// If you prefer GET requests for simplicity and no body is needed:
export async function GET(request: Request) {
  return POST(request) // Delegate to POST or implement separately
}
