import jsPDF from 'jspdf'
import { getCanvasDataUrl } from '@/components/features/CarouselSlidePreview'
import { ASPECT_RATIOS } from '@/lib/carouselConfig'
import type { CarouselData, CarouselTheme } from '@/types'

export async function exportCarouselToPdf(
  carousel:    CarouselData,
  theme:       CarouselTheme,
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  const { width, height } = ASPECT_RATIOS[carousel.aspect_ratio]

  const pdf = new jsPDF({
    orientation: 'p',
    unit:        'px',
    format:      [width, height],
    hotfixes:    ['px_scaling'],
  })

  for (let index = 0; index < carousel.slides.length; index++) {
    const slide = carousel.slides[index]

    if (onProgress) onProgress(index + 1, carousel.slides.length)

    const dataUrl = await getCanvasDataUrl(
      slide,
      theme,
      carousel.aspect_ratio,
      {
        accentColor:       carousel.accent_color,
        showSlideNumber:   carousel.show_slide_numbers,
        showAuthorHandle:  carousel.show_author_handle,
        showBranding:      carousel.show_branding,
        fontStyle:         carousel.font_style as 'professional' | 'modern' | 'bold',
        totalSlides:       carousel.slides.length,
      },
    )

    if (index > 0) {
      pdf.addPage([width, height])
    }

    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
  }

  return pdf.output('blob')
}
