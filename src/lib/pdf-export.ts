import { ChartData, PLANET_SYMBOLS, ZODIAC_SYMBOLS, ZodiacSign } from '@/lib/astrology-types'
import { getPlanetaryDignity, getDignityDescription, HOUSE_INFO } from '@/lib/zodiac-info'
import { detectAspectPatterns } from '@/lib/aspect-patterns'
import { getAspectInterpretation } from '@/lib/aspect-interpretations'
import jsPDF from 'jspdf'
import logoImage from '@/assets/images/logo.jpg'

export interface PDFExportOptions {
  includeChartWheel: boolean
  includeHouseMeanings: boolean
  includeMajorAspects: boolean
  includeAspectPatterns: boolean
  includePlanetaryDignities: boolean
  includeInterpretation: boolean
  includePersonalHoroscope: string
  includeCompatibility: string
  includeKarmicBond: string
  includePastLife: string
  includeKarmicDebt: string
  includeFamily: string
}

export const defaultPDFOptions: PDFExportOptions = {
  includeChartWheel: true,
  includeHouseMeanings: false,
  includeMajorAspects: true,
  includeAspectPatterns: false,
  includePlanetaryDignities: false,
  includeInterpretation: true,
  includePersonalHoroscope: '',
  includeCompatibility: '',
  includeKarmicBond: '',
  includePastLife: '',
  includeKarmicDebt: '',
  includeFamily: '',
}

export async function exportChartToPDF(
  chart: ChartData, 
  chartSvgElement: SVGSVGElement | null, 
  interpretation?: string,
  options: PDFExportOptions = defaultPDFOptions
) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    let useCustomFonts = false
    
    console.log('Custom fonts disabled for stability - using system fonts')

    const elementCount = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
    const modalityCount = { Cardinal: 0, Fixed: 0, Mutable: 0 }

    chart.planets.forEach(p => {
      if (['Aries', 'Leo', 'Sagittarius'].includes(p.sign)) elementCount.Fire++
      if (['Taurus', 'Virgo', 'Capricorn'].includes(p.sign)) elementCount.Earth++
      if (['Gemini', 'Libra', 'Aquarius'].includes(p.sign)) elementCount.Air++
      if (['Cancer', 'Scorpio', 'Pisces'].includes(p.sign)) elementCount.Water++

      if (['Aries', 'Cancer', 'Libra', 'Capricorn'].includes(p.sign)) modalityCount.Cardinal++
      if (['Taurus', 'Leo', 'Scorpio', 'Aquarius'].includes(p.sign)) modalityCount.Fixed++
      if (['Gemini', 'Virgo', 'Sagittarius', 'Pisces'].includes(p.sign)) modalityCount.Mutable++
    })

    pdf.setFillColor(68, 21, 104)
    pdf.rect(0, 0, pageWidth, 50, 'F')

    yPos += 5
    pdf.setFont('times', 'italic')
    pdf.setFontSize(36)
    pdf.setTextColor(255, 255, 255)
    pdf.text('Psychic Link Charts', pageWidth / 2, yPos + 10, { align: 'center' })
    
    yPos += 20
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(230, 230, 230)
    pdf.text('What Do The Stars Say About You?', pageWidth / 2, yPos, { align: 'center' })
    
    yPos = 60

    pdf.setFont('times', 'italic')
    pdf.setFontSize(28)
    pdf.setTextColor(68, 21, 104)
    pdf.text(chart.name, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    pdf.setFontSize(11)
    pdf.setTextColor(80, 80, 80)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${chart.date} at ${chart.time}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    pdf.text(chart.location, pageWidth / 2, yPos, { align: 'center' })

    yPos += 8
    pdf.setFontSize(9)
    pdf.setTextColor(120, 120, 120)
    const latDir = chart.latitude >= 0 ? 'N' : 'S'
    const lonDir = chart.longitude >= 0 ? 'E' : 'W'
    pdf.text(`${Math.abs(chart.latitude).toFixed(4)}°${latDir} / ${Math.abs(chart.longitude).toFixed(4)}°${lonDir} • Timezone: UTC${chart.timezone}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 12

    try {
      const logoWidth = 80
      const logoHeight = 80
      pdf.addImage(logoImage, 'JPEG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight)
      yPos += logoHeight + 12
    } catch (error) {
      console.error('Error adding logo:', error)
      yPos += 12
    }
    
    pdf.addPage()
    yPos = margin

    const sun = chart.planets.find(p => p.name === 'Sun')
    const moon = chart.planets.find(p => p.name === 'Moon')
    const risingSign = chart.houses.find(h => h.number === 1)?.sign || 'Unknown'

    if (sun || moon || risingSign) {
      if (yPos > pageHeight - 50) {
        pdf.addPage()
        yPos = margin
      }

      pdf.setFillColor(250, 248, 253)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F')
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(68, 21, 104)
      pdf.text('CORE IDENTITY', margin + 5, yPos + 7)
      
      yPos += 14
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(60, 60, 60)
      
      if (sun) {
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Sun Sign:`, margin + 5, yPos)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${sun.sign} (${sun.degree.toFixed(1)}° in House ${sun.house})`, margin + 30, yPos)
        yPos += 6
      }
      
      if (moon) {
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Moon Sign:`, margin + 5, yPos)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${moon.sign} (${moon.degree.toFixed(1)}° in House ${moon.house})`, margin + 30, yPos)
        yPos += 6
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Rising Sign:`, margin + 5, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${risingSign} (Ascendant at ${chart.ascendant.toFixed(1)}°)`, margin + 30, yPos)
      yPos += 10
    }

    yPos += 5
    if (yPos > pageHeight - 50) {
      pdf.addPage()
      yPos = margin
    }

    pdf.setFillColor(245, 250, 255)
    pdf.roundedRect(margin, yPos, (pageWidth - 2 * margin - 5) / 2, 40, 3, 3, 'F')
    pdf.setFillColor(250, 245, 255)
    pdf.roundedRect(margin + (pageWidth - 2 * margin + 5) / 2, yPos, (pageWidth - 2 * margin - 5) / 2, 40, 3, 3, 'F')
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(68, 21, 104)
    pdf.text('ELEMENT DISTRIBUTION', margin + 5, yPos + 7)
    
    yPos += 13
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(60, 60, 60)
    pdf.text(`Fire: ${elementCount.Fire} planets`, margin + 5, yPos)
    yPos += 5
    pdf.text(`Earth: ${elementCount.Earth} planets`, margin + 5, yPos)
    yPos += 5
    pdf.text(`Air: ${elementCount.Air} planets`, margin + 5, yPos)
    yPos += 5
    pdf.text(`Water: ${elementCount.Water} planets`, margin + 5, yPos)
    
    yPos -= 20
    const xPos2 = margin + (pageWidth - 2 * margin + 5) / 2
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(68, 21, 104)
    pdf.text('MODALITY DISTRIBUTION', xPos2 + 5, yPos)
    
    yPos += 13
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(60, 60, 60)
    pdf.text(`Cardinal: ${modalityCount.Cardinal} planets`, xPos2 + 5, yPos)
    yPos += 5
    pdf.text(`Fixed: ${modalityCount.Fixed} planets`, xPos2 + 5, yPos)
    yPos += 5
    pdf.text(`Mutable: ${modalityCount.Mutable} planets`, xPos2 + 5, yPos)
    
    yPos += 15

    if (options.includeChartWheel && chartSvgElement) {
      try {
        console.log('Starting chart wheel capture for PDF...')
        const svgClone = chartSvgElement.cloneNode(true) as SVGSVGElement
        svgClone.setAttribute('width', '800')
        svgClone.setAttribute('height', '800')
        
        const svgString = new XMLSerializer().serializeToString(svgClone)
        console.log('SVG serialized, length:', svgString.length)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            console.log('SVG image loaded successfully')
            canvas.width = 800
            canvas.height = 800
            if (ctx) {
              ctx.drawImage(img, 0, 0, 800, 800)
            }
            resolve()
          }
          img.onerror = (e) => {
            console.error('SVG image load error:', e)
            reject(new Error('Failed to load SVG into image'))
          }
          
          try {
            const encodedSvg = btoa(unescape(encodeURIComponent(svgString)))
            img.src = 'data:image/svg+xml;base64,' + encodedSvg
          } catch (encodeError) {
            console.error('SVG encoding error:', encodeError)
            reject(encodeError)
          }
        })
        
        const imgData = canvas.toDataURL('image/png')
        console.log('Canvas converted to PNG, data URL length:', imgData.length)
        
        const imgWidth = 140
        const imgHeight = 140
        
        pdf.setFillColor(250, 250, 255)
        pdf.roundedRect((pageWidth - imgWidth - 6) / 2, yPos - 3, imgWidth + 6, imgHeight + 6, 3, 3, 'F')
        
        pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight)
        console.log('Chart wheel added to PDF successfully')
        yPos += imgHeight + 15
      } catch (error) {
        console.error('Error rendering chart wheel to PDF:', error)
        console.error('Error details:', error instanceof Error ? error.message : String(error))
        
        pdf.setFillColor(250, 248, 253)
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 2, 2, 'F')
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(120, 120, 120)
        pdf.text('Chart wheel could not be rendered in PDF.', pageWidth / 2, yPos + 10, { align: 'center' })
        pdf.text('Please use the print function for visual chart output.', pageWidth / 2, yPos + 18, { align: 'center' })
        yPos += 40
      }
    }

    pdf.addPage()
    yPos = margin

    pdf.setFillColor(68, 21, 104)
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('PLANETARY POSITIONS', margin + 3, yPos + 8)
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

    if (options.includePlanetaryDignities) {
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
      pdf.text('PLANETARY DIGNITIES', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFillColor(245, 245, 250)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 1, 1, 'F')

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(68, 21, 104)
      pdf.text('Planet', margin + 3, yPos + 5.5)
      pdf.text('Sign', margin + 50, yPos + 5.5)
      pdf.text('Dignity', margin + 100, yPos + 5.5)
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
        
        const dignity = getPlanetaryDignity(planet.name, planet.sign as ZodiacSign)
        
        pdf.setFont('helvetica', 'bold')
        pdf.text(planet.name, margin + 3, yPos)
        pdf.setFont('helvetica', 'normal')
        pdf.text(planet.sign, margin + 50, yPos)
        pdf.text(dignity || 'Peregrine', margin + 100, yPos)
        yPos += 7
      })
    }

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
    pdf.text('HOUSE CUSPS', margin + 3, yPos + 8)
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

    if (options.includeHouseMeanings) {
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
      pdf.text('HOUSE MEANINGS', margin + 3, yPos + 8)
      yPos += 18

      for (let houseNum = 1; houseNum <= 12; houseNum++) {
        const houseInfo = HOUSE_INFO[houseNum]
        
        if (yPos > pageHeight - 50) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFillColor(250, 248, 253)
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, -1, 2, 2, 'F')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(68, 21, 104)
        pdf.text(houseInfo.name, margin + 3, yPos + 6)
        yPos += 10

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(60, 60, 60)
        const descLines = pdf.splitTextToSize(houseInfo.description, pageWidth - 2 * margin - 6)
        
        const boxHeight = 10 + (descLines.length * 4)
        pdf.setFillColor(250, 248, 253)
        pdf.roundedRect(margin, yPos - 10, pageWidth - 2 * margin, boxHeight, 2, 2, 'F')
        
        descLines.forEach((line: string) => {
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin
          }
          pdf.text(line, margin + 3, yPos)
          yPos += 4
        })
        yPos += 8
      }
    }

    if (options.includeMajorAspects) {
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
      pdf.text('MAJOR ASPECTS', margin + 3, yPos + 8)
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
    }

    if (options.includeAspectPatterns) {
      const patterns = detectAspectPatterns(chart.planets, chart.aspects)
      
      if (patterns.length > 0) {
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
        pdf.text('ASPECT PATTERNS', margin + 3, yPos + 8)
        yPos += 18

        patterns.forEach((pattern) => {
          if (yPos > pageHeight - 50) {
            pdf.addPage()
            yPos = margin
          }

          pdf.setFillColor(250, 248, 253)
          pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, -1, 2, 2, 'F')

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(11)
          pdf.setTextColor(68, 21, 104)
          pdf.text(pattern.type, margin + 3, yPos + 6)
          yPos += 10

          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor(60, 60, 60)
          
          pdf.setFont('helvetica', 'bold')
          pdf.text('Planets:', margin + 3, yPos)
          pdf.setFont('helvetica', 'normal')
          pdf.text(pattern.planets.join(', '), margin + 20, yPos)
          yPos += 5

          const interpLines = pdf.splitTextToSize(pattern.interpretation, pageWidth - 2 * margin - 6)
          const boxHeight = 15 + (interpLines.length * 4)
          pdf.setFillColor(250, 248, 253)
          pdf.roundedRect(margin, yPos - 15, pageWidth - 2 * margin, boxHeight, 2, 2, 'F')
          
          interpLines.forEach((line: string) => {
            if (yPos > pageHeight - 25) {
              pdf.addPage()
              yPos = margin
            }
            pdf.text(line, margin + 3, yPos)
            yPos += 4
          })
          yPos += 8
        })
      }
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
      pdf.text('NOTES', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFillColor(250, 248, 253)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, -1, 2, 2, 'F')
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(60, 60, 60)
      const noteLines = pdf.splitTextToSize(chart.notes, pageWidth - 2 * margin - 6)
      
      const notesBoxHeight = 10 + (noteLines.length * 5)
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

    if (interpretation && options.includeInterpretation) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.rect(0, 0, pageWidth, 45, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      pdf.setTextColor(255, 255, 255)
      pdf.text('CHART INTERPRETATION', pageWidth / 2, yPos + 6, { align: 'center' })
      
      yPos += 12
      pdf.setFontSize(10)
      pdf.setTextColor(230, 230, 230)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Comprehensive astrological analysis by The Psychic Link', pageWidth / 2, yPos, { align: 'center' })
      
      yPos = 55

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      
      const iconMap: { [key: string]: string } = {
        '☉': '☀',  
        '☽': '🌙',  
        '☿': '☿',  
        '♀': '♀',  
        '♂': '♂',  
        '♃': '♃',  
        '♄': '♄',  
        '♅': '♅',  
        '♆': '♆',  
        '♇': '♇',  
        '⚸': '⚷',  
        '♈': 'Aries',
        '♉': 'Taurus',
        '♊': 'Gemini',
        '♋': 'Cancer',
        '♌': 'Leo',
        '♍': 'Virgo',
        '♎': 'Libra',
        '♏': 'Scorpio',
        '♐': 'Sagittarius',
        '♑': 'Capricorn',
        '♒': 'Aquarius',
        '♓': 'Pisces'
      }
      
      let processedInterpretation = interpretation
        .replace(/^##\s+(.+)$/gm, '\n=SECTION_HEADER=$1')
        .replace(/^###\s+(.+)$/gm, '\n=SUBSECTION_HEADER=$1')
        .replace(/####\s+(.+)$/gm, '\n=MINOR_HEADER=$1')
      
      Object.keys(iconMap).forEach(icon => {
        const replacement = iconMap[icon]
        processedInterpretation = processedInterpretation.replace(new RegExp(icon, 'g'), replacement)
      })
      
      const interpretationLines = pdf.splitTextToSize(processedInterpretation, pageWidth - 2 * margin)
      
      for (let i = 0; i < interpretationLines.length; i++) {
        const line = interpretationLines[i]
        
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin + 5
        }
        
        if (line.startsWith('=SECTION_HEADER=')) {
          if (yPos > margin + 10) {
            yPos += 8
          }
          if (yPos > pageHeight - 30) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(14)
          pdf.setTextColor(68, 21, 104)
          const headerText = line.replace('=SECTION_HEADER=', '').trim()
          pdf.text(headerText, margin, yPos)
          yPos += 8
        } else if (line.startsWith('=SUBSECTION_HEADER=')) {
          if (yPos > margin + 10) {
            yPos += 6
          }
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(12)
          pdf.setTextColor(90, 40, 120)
          const headerText = line.replace('=SUBSECTION_HEADER=', '').trim()
          pdf.text(headerText, margin, yPos)
          yPos += 7
        } else if (line.startsWith('=MINOR_HEADER=')) {
          yPos += 4
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(10)
          pdf.setTextColor(90, 40, 120)
          const headerText = line.replace('=MINOR_HEADER=', '').trim()
          pdf.text(headerText, margin, yPos)
          yPos += 6
        } else if (line.match(/^(Sun Sign|Moon Sign|Rising Sign|Planetary Positions|House Analysis|Major Aspects|Aspect Patterns|Life Purpose|Career|Relationships|Challenges|Strengths|Spiritual Path|Personality|Emotions|Communication|Love|Career Path|Home Life|Creative Expression|Daily Life|Relationships & Partnerships|Transformation|Philosophy|Career Ambitions|Community|Spirituality):/)) {
          if (yPos > margin + 10) {
            yPos += 6
          }
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(11)
          pdf.setTextColor(68, 21, 104)
          pdf.text(line, margin, yPos)
          yPos += 7
        } else if (line.match(/^\*\*[0-9]+\.\s/)) {
          if (yPos > margin + 10) {
            yPos += 5
          }
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(11)
          pdf.setTextColor(68, 21, 104)
          const cleanLine = line.replace(/\*\*/g, '')
          pdf.text(cleanLine, margin, yPos)
          yPos += 7
        } else if (line.match(/^\*\*[A-Z\s&]+:\s*\*\*/)) {
          yPos += 3
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(10)
          pdf.setTextColor(90, 40, 120)
          const cleanLine = line.replace(/\*\*/g, '').trim()
          pdf.text(cleanLine, margin, yPos)
          yPos += 6
        } else if (line.match(/^\*\*[^*]+\*\*$/)) {
          yPos += 2
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.setTextColor(60, 60, 60)
          const cleanLine = line.replace(/\*\*/g, '')
          pdf.text(cleanLine, margin, yPos)
          yPos += 5
        } else if (line.trim() === '') {
          yPos += 2
        } else {
          if (yPos > pageHeight - 25) {
            pdf.addPage()
            yPos = margin + 5
          }
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(9)
          pdf.setTextColor(50, 50, 50)
          const cleanLine = line.replace(/\*\*/g, '').replace(/^[-•]\s*/, '  • ')
          pdf.text(cleanLine, margin, yPos)
          yPos += 5
        }
      }
    }

    if (options.includePersonalHoroscope) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('PERSONAL HOROSCOPE', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      const horoscopeLines = pdf.splitTextToSize(options.includePersonalHoroscope, pageWidth - 2 * margin)
      horoscopeLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin, yPos)
        yPos += 5
      })
    }

    if (options.includeCompatibility) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('ROMANTIC COMPATIBILITY', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      const compatLines = pdf.splitTextToSize(options.includeCompatibility, pageWidth - 2 * margin)
      compatLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin, yPos)
        yPos += 5
      })
    }

    if (options.includeKarmicBond) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('KARMIC BOND', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      const karmicLines = pdf.splitTextToSize(options.includeKarmicBond, pageWidth - 2 * margin)
      karmicLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin, yPos)
        yPos += 5
      })
    }

    if (options.includePastLife) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('PAST LIFE', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      const pastLifeLines = pdf.splitTextToSize(options.includePastLife, pageWidth - 2 * margin)
      pastLifeLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin, yPos)
        yPos += 5
      })
    }

    if (options.includeKarmicDebt) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('KARMIC DEBT', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      const debtLines = pdf.splitTextToSize(options.includeKarmicDebt, pageWidth - 2 * margin)
      debtLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin, yPos)
        yPos += 5
      })
    }

    if (options.includeFamily) {
      pdf.addPage()
      yPos = margin

      pdf.setFillColor(68, 21, 104)
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F')
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('FAMILY DYNAMICS', margin + 3, yPos + 8)
      yPos += 18

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(40, 40, 40)
      const familyLines = pdf.splitTextToSize(options.includeFamily, pageWidth - 2 * margin)
      familyLines.forEach((line: string) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage()
          yPos = margin
        }
        pdf.text(line, margin, yPos)
        yPos += 5
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
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  }
}
