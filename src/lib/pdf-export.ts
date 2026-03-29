import { ChartData } from '@/lib/astrology-types'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

export async function exportChartToPDF(chart: ChartData, chartSvgElement: SVGSVGElement | null, interpretation?: string) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    pdf.setFillColor(68, 21, 104)
    pdf.rect(0, 0, pageWidth, 45, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(32)
    pdf.setTextColor(255, 255, 255)
    pdf.text('Psychic Link Charts', pageWidth / 2, yPos + 5, { align: 'center' })
    
    yPos += 12
    pdf.setFontSize(12)
    pdf.setTextColor(230, 230, 230)
    pdf.text('Professional Astrology Software', pageWidth / 2, yPos, { align: 'center' })
    
    yPos = 55

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(24)
    pdf.setTextColor(68, 21, 104)
    pdf.text(chart.name, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    pdf.setFontSize(11)
    pdf.setTextColor(80, 80, 80)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${chart.date} at ${chart.time}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    pdf.text(chart.location, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    pdf.setFontSize(9)
    pdf.setTextColor(120, 120, 120)
    pdf.text(`${chart.latitude.toFixed(4)}°N / ${chart.longitude.toFixed(4)}°E • Timezone: ${chart.timezone}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 15

    if (chartSvgElement) {
      try {
        const svgString = new XMLSerializer().serializeToString(chartSvgElement)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = 600
            canvas.height = 600
            if (ctx) {
              ctx.fillStyle = '#0f0820'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0)
            }
            resolve()
          }
          img.onerror = () => reject(new Error('Failed to load SVG'))
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
        })
        
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 140
        const imgHeight = 140
        
        pdf.setFillColor(250, 250, 255)
        pdf.roundedRect((pageWidth - imgWidth - 6) / 2, yPos - 3, imgWidth + 6, imgHeight + 6, 3, 3, 'F')
        
        pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight)
        yPos += imgHeight + 15
      } catch (error) {
        console.error('Error rendering chart:', error)
      }
    }

    pdf.addPage()
    yPos = margin

    pdf.setFillColor(68, 21, 104)
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('Planetary Positions', margin + 3, yPos + 8)
    yPos += 18

    pdf.setFillColor(245, 245, 250)
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 1, 1, 'F')

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(68, 21, 104)
    pdf.text('Planet', margin + 3, yPos + 5.5)
    pdf.text('Sign', margin + 38, yPos + 5.5)
    pdf.text('Degree', margin + 78, yPos + 5.5)
    pdf.text('House', margin + 108, yPos + 5.5)
    pdf.text('Longitude', margin + 138, yPos + 5.5)
    yPos += 10

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(40, 40, 40)
    chart.planets.forEach((planet, index) => {
      if (yPos > pageHeight - 25) {
        pdf.addPage()
        yPos = margin
      }
      
      if (index % 2 === 0) {
        pdf.setFillColor(252, 252, 254)
        pdf.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, 7, 1, 1, 'F')
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.text(planet.name, margin + 3, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text(planet.sign, margin + 38, yPos)
      pdf.text(`${planet.degree.toFixed(2)}°`, margin + 78, yPos)
      pdf.text(planet.house.toString(), margin + 108, yPos)
      pdf.text(`${planet.longitude.toFixed(2)}°`, margin + 138, yPos)
      yPos += 7
    })

    yPos += 12
    if (yPos > pageHeight - 80) {
      pdf.addPage()
      yPos = margin
    }

    pdf.setFillColor(68, 21, 104)
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('House Cusps', margin + 3, yPos + 8)
    yPos += 18

    pdf.setFillColor(245, 245, 250)
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 1, 1, 'F')

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(68, 21, 104)
    pdf.text('House', margin + 3, yPos + 5.5)
    pdf.text('Sign', margin + 58, yPos + 5.5)
    pdf.text('Cusp', margin + 138, yPos + 5.5)
    yPos += 10

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(40, 40, 40)
    chart.houses.forEach((house, index) => {
      if (yPos > pageHeight - 25) {
        pdf.addPage()
        yPos = margin
      }
      
      if (index % 2 === 0) {
        pdf.setFillColor(252, 252, 254)
        pdf.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, 7, 1, 1, 'F')
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.text(`House ${house.number}`, margin + 3, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text(house.sign, margin + 58, yPos)
      pdf.text(`${house.cusp.toFixed(2)}°`, margin + 138, yPos)
      yPos += 7
    })

    yPos += 12
    if (yPos > pageHeight - 80) {
      pdf.addPage()
      yPos = margin
    }

    pdf.setFillColor(68, 21, 104)
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('Major Aspects', margin + 3, yPos + 8)
    yPos += 18

    if (chart.aspects.length === 0) {
      pdf.setFillColor(250, 248, 253)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F')
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(120, 120, 120)
      pdf.text('No major aspects found within orb', pageWidth / 2, yPos + 10, { align: 'center' })
      yPos += 20
    } else {
      pdf.setFillColor(245, 245, 250)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 1, 1, 'F')

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(68, 21, 104)
      pdf.text('Planet 1', margin + 3, yPos + 5.5)
      pdf.text('Aspect', margin + 48, yPos + 5.5)
      pdf.text('Planet 2', margin + 98, yPos + 5.5)
      pdf.text('Orb', margin + 148, yPos + 5.5)
      yPos += 10

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      chart.aspects.forEach((aspect, index) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        
        if (index % 2 === 0) {
          pdf.setFillColor(252, 252, 254)
          pdf.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, 7, 1, 1, 'F')
        }
        
        pdf.text(aspect.planet1, margin + 3, yPos)
        pdf.text(aspect.type, margin + 48, yPos)
        pdf.text(aspect.planet2, margin + 98, yPos)
        pdf.text(`${aspect.orb.toFixed(2)}°`, margin + 148, yPos)
        yPos += 7
      })
    }

    if (chart.notes) {
      yPos += 12
      if (yPos > pageHeight - 50) {
        pdf.addPage()
        yPos = margin
      }

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('Notes', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFillColor(250, 248, 253)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, -1, 2, 2, 'F')
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(60, 60, 60)
      const noteLines = pdf.splitTextToSize(chart.notes, pageWidth - 2 * margin - 6)
      
      let notesBoxHeight = 10 + (noteLines.length * 5)
      pdf.setFillColor(250, 248, 253)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, notesBoxHeight, 2, 2, 'F')
      
      yPos += 6
      noteLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin + 3, yPos)
        yPos += 5
      })
      yPos += 5
    }

    if (interpretation) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.rect(0, 0, pageWidth, 45, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      pdf.setTextColor(255, 255, 255)
      pdf.text('Chart Interpretation', pageWidth / 2, yPos + 6, { align: 'center' })
      
      yPos += 12
      pdf.setFontSize(10)
      pdf.setTextColor(230, 230, 230)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Comprehensive astrological analysis by The Psychic Link', pageWidth / 2, yPos, { align: 'center' })
      
      yPos = 55

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      
      const interpretationLines = pdf.splitTextToSize(interpretation, pageWidth - 2 * margin)
      interpretationLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        
        if (line.match(/^\*\*[0-9]+\.\s/)) {
          yPos += 4
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(11)
          pdf.setTextColor(68, 21, 104)
          const cleanLine = line.replace(/\*\*/g, '')
          pdf.text(cleanLine, margin, yPos)
          yPos += 6
        } else if (line.match(/^\*\*[A-Z\s]+:/)) {
          yPos += 3
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.setTextColor(90, 40, 120)
          const cleanLine = line.replace(/\*\*/g, '')
          pdf.text(cleanLine, margin, yPos)
          yPos += 5
        } else if (line.match(/^\*\*/)) {
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.setTextColor(40, 40, 40)
          const cleanLine = line.replace(/\*\*/g, '')
          pdf.text(cleanLine, margin, yPos)
          yPos += 5
        } else if (line.trim() === '') {
          yPos += 2
        } else {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(9)
          pdf.setTextColor(50, 50, 50)
          const cleanLine = line.replace(/\*\*/g, '')
          pdf.text(cleanLine, margin, yPos)
          yPos += 5
        }
      })
    }

    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      
      pdf.setFillColor(245, 245, 250)
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F')
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        'Generated by Psychic Link Charts',
        margin,
        pageHeight - 8
      )
      
      pdf.setTextColor(120, 120, 120)
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      )
    }

    pdf.save(`${chart.name.replace(/[^a-z0-9]/gi, '_')}_natal_chart.pdf`)
    const message = interpretation 
      ? 'PDF exported successfully with comprehensive interpretation!' 
      : 'PDF exported successfully!'
    toast.success(message)
  } catch (error) {
    console.error('PDF export error:', error)
    toast.error('Failed to export PDF. Please try again.')
  }
}
