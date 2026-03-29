import { ChartData } from '@/lib/astrology-types'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

export async function exportChartToPDF(chart: ChartData, chartSvgElement: SVGSVGElement | null, interpretation?: string) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPos = 20

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(24)
    pdf.setTextColor(120, 100, 220)
    pdf.text('Celestial Charts', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    pdf.setFontSize(18)
    pdf.setTextColor(60, 50, 110)
    pdf.text(chart.name, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 15
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Birth: ${chart.date} at ${chart.time}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    pdf.text(`Location: ${chart.location}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    pdf.text(`Lat: ${chart.latitude.toFixed(4)}° | Long: ${chart.longitude.toFixed(4)}°`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 15

    if (chartSvgElement) {
      try {
        const svgString = new XMLSerializer().serializeToString(chartSvgElement)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = 500
            canvas.height = 500
            if (ctx) {
              ctx.fillStyle = '#1a1440'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0)
            }
            resolve()
          }
          img.onerror = () => reject(new Error('Failed to load SVG'))
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
        })
        
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 120
        const imgHeight = 120
        pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight)
        yPos += imgHeight + 10
      } catch (error) {
        console.error('Error rendering chart:', error)
      }
    }

    pdf.addPage()
    yPos = 20

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(120, 100, 220)
    pdf.text('Planetary Positions', 14, yPos)
    yPos += 10

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Planet', 14, yPos)
    pdf.text('Sign', 50, yPos)
    pdf.text('Degree', 90, yPos)
    pdf.text('House', 130, yPos)
    pdf.text('Longitude', 160, yPos)
    yPos += 2
    pdf.setDrawColor(120, 100, 220)
    pdf.line(14, yPos, pageWidth - 14, yPos)
    yPos += 6

    pdf.setFont('helvetica', 'normal')
    chart.planets.forEach(planet => {
      if (yPos > pageHeight - 20) {
        pdf.addPage()
        yPos = 20
      }
      pdf.text(planet.name, 14, yPos)
      pdf.text(planet.sign, 50, yPos)
      pdf.text(`${planet.degree.toFixed(2)}°`, 90, yPos)
      pdf.text(planet.house.toString(), 130, yPos)
      pdf.text(`${planet.longitude.toFixed(2)}°`, 160, yPos)
      yPos += 7
    })

    yPos += 10
    if (yPos > pageHeight - 60) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(120, 100, 220)
    pdf.text('House Cusps', 14, yPos)
    yPos += 10

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('House', 14, yPos)
    pdf.text('Sign', 50, yPos)
    pdf.text('Cusp', 120, yPos)
    yPos += 2
    pdf.line(14, yPos, pageWidth - 14, yPos)
    yPos += 6

    pdf.setFont('helvetica', 'normal')
    chart.houses.forEach(house => {
      if (yPos > pageHeight - 20) {
        pdf.addPage()
        yPos = 20
      }
      pdf.text(`House ${house.number}`, 14, yPos)
      pdf.text(house.sign, 50, yPos)
      pdf.text(`${house.cusp.toFixed(2)}°`, 120, yPos)
      yPos += 7
    })

    yPos += 10
    if (yPos > pageHeight - 60) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(120, 100, 220)
    pdf.text('Major Aspects', 14, yPos)
    yPos += 10

    if (chart.aspects.length === 0) {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('No major aspects found within orb', 14, yPos)
    } else {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Planet 1', 14, yPos)
      pdf.text('Aspect', 60, yPos)
      pdf.text('Planet 2', 100, yPos)
      pdf.text('Orb', 150, yPos)
      yPos += 2
      pdf.line(14, yPos, pageWidth - 14, yPos)
      yPos += 6

      pdf.setFont('helvetica', 'normal')
      chart.aspects.forEach(aspect => {
        if (yPos > pageHeight - 20) {
          pdf.addPage()
          yPos = 20
        }
        pdf.text(aspect.planet1, 14, yPos)
        pdf.text(aspect.type, 60, yPos)
        pdf.text(aspect.planet2, 100, yPos)
        pdf.text(`${aspect.orb.toFixed(2)}°`, 150, yPos)
        yPos += 7
      })
    }

    if (chart.notes) {
      yPos += 10
      if (yPos > pageHeight - 40) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(120, 100, 220)
      pdf.text('Notes', 14, yPos)
      yPos += 10

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      const noteLines = pdf.splitTextToSize(chart.notes, pageWidth - 28)
      noteLines.forEach((line: string) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage()
          yPos = 20
        }
        pdf.text(line, 14, yPos)
        yPos += 5
      })
    }

    if (interpretation) {
      pdf.addPage()
      yPos = 20

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(120, 100, 220)
      pdf.text('AI Chart Interpretation', 14, yPos)
      yPos += 5
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Professional astrological analysis powered by AI', 14, yPos)
      yPos += 10

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      const interpretationLines = pdf.splitTextToSize(interpretation, pageWidth - 28)
      interpretationLines.forEach((line: string) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage()
          yPos = 20
        }
        
        if (line.match(/^[0-9]+\./)) {
          yPos += 3
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(120, 100, 220)
        } else if (line.match(/^[A-Z\s]+:$/)) {
          yPos += 3
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(60, 50, 110)
        } else {
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
        }
        
        pdf.text(line, 14, yPos)
        yPos += 5
      })
    }

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(150, 150, 150)
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.text(
        `Generated by Celestial Charts | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    pdf.save(`${chart.name.replace(/[^a-z0-9]/gi, '_')}_chart.pdf`)
    const message = interpretation 
      ? 'PDF exported successfully with chart interpretation!' 
      : 'PDF exported successfully!'
    toast.success(message)
  } catch (error) {
    console.error('PDF export error:', error)
    toast.error('Failed to export PDF. Please try again.')
  }
}
