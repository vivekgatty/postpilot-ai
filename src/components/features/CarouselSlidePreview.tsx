'use client'

import { useEffect, useRef, useCallback } from 'react'
import { ASPECT_RATIOS, FONT_STYLES } from '@/lib/carouselConfig'
import type { CarouselSlide, CarouselTheme } from '@/types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarouselSlidePreviewProps {
  slide:              CarouselSlide
  theme:              CarouselTheme
  aspectRatio:        'square' | 'portrait'
  accentColor?:       string
  showSlideNumber?:   boolean
  showAuthorHandle?:  boolean
  showBranding?:      boolean
  totalSlides?:       number
  fontStyle?:         'professional' | 'modern' | 'bold'
  scale?:             number
  forExport?:         boolean
}

// ── Text wrap helper ──────────────────────────────────────────────────────────

function wrapText(
  ctx:      CanvasRenderingContext2D,
  text:     string,
  maxWidth: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _fontSize: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// ── Core draw function (scale-independent) ────────────────────────────────────

interface DrawOptions {
  accentColor?:       string
  showSlideNumber?:   boolean
  showAuthorHandle?:  boolean
  showBranding?:      boolean
  totalSlides?:       number
  fontStyle?:         'professional' | 'modern' | 'bold'
}

function drawSlideToContext(
  ctx:         CanvasRenderingContext2D,
  slide:       CarouselSlide,
  theme:       CarouselTheme,
  W:           number,
  H:           number,
  options:     DrawOptions,
) {
  const {
    accentColor,
    showSlideNumber,
    showAuthorHandle,
    showBranding,
    totalSlides,
    fontStyle,
  } = options

  const effectiveAccent = accentColor || theme.accent_color
  const fonts           = FONT_STYLES[fontStyle || 'professional']
  const PADDING         = 72

  // BACKGROUND
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, W, H)

  // Special background for sunset_gradient theme
  if (theme.id === 'sunset_gradient') {
    const gradient = ctx.createLinearGradient(0, 0, W, H)
    gradient.addColorStop(0,   '#FF6B35')
    gradient.addColorStop(0.5, '#E8537A')
    gradient.addColorStop(1,   '#534AB7')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, W, H)
  }

  // Dot pattern for midnight_galaxy theme
  if (theme.id === 'midnight_galaxy') {
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    for (let x = 0; x < W; x += 40) {
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Grid lines for blueprint theme
  if (theme.id === 'blueprint') {
    ctx.strokeStyle = 'rgba(0,212,255,0.08)'
    ctx.lineWidth   = 1
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0)
      ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y)
      ctx.lineTo(W, y); ctx.stroke()
    }
  }

  // Accent top bar for non-CTA slides
  if (slide.type !== 'cta') {
    ctx.fillStyle = effectiveAccent
    ctx.fillRect(0, 0, W, 8)
  }

  // Slide number top right for content slides
  if (showSlideNumber && slide.type === 'content' && totalSlides) {
    ctx.font      = `400 14px ${fonts.body}`
    ctx.fillStyle = theme.secondary_text
    ctx.textAlign = 'right'
    ctx.fillText(`${slide.slide_number} / ${totalSlides}`, W - 48, 44)
  }

  const contentWidth = W - PADDING * 2

  // ── TITLE SLIDE ─────────────────────────────────────────────────────────────
  if (slide.type === 'title') {
    ctx.font      = `700 ${theme.heading_font_size * 2.2}px ${fonts.heading}`
    ctx.fillStyle = theme.text_color
    ctx.textAlign = 'left'

    const headingLines   = wrapText(ctx, slide.heading, contentWidth, theme.heading_font_size * 2.2)
    const lineHeight     = theme.heading_font_size * 2.8
    const totalTextHeight = headingLines.length * lineHeight
    const startY         = (H - totalTextHeight) / 2

    headingLines.forEach((line, i) => {
      ctx.fillText(line, PADDING, startY + i * lineHeight)
    })

    if (slide.sub_line) {
      ctx.font      = `400 ${theme.body_font_size * 1.3}px ${fonts.body}`
      ctx.fillStyle = theme.secondary_text
      const subY    = startY + totalTextHeight + lineHeight * 0.5
      ctx.fillText(slide.sub_line, PADDING, subY)
    }

    ctx.font      = `400 14px ${fonts.body}`
    ctx.fillStyle = effectiveAccent
    ctx.textAlign = 'right'
    ctx.fillText('Swipe to read', W - PADDING, H - PADDING)
  }

  // ── CONTENT SLIDE ────────────────────────────────────────────────────────────
  if (slide.type === 'content') {
    let currentY = PADDING + 60

    if (slide.number_badge) {
      ctx.font        = `700 80px ${fonts.heading}`
      ctx.fillStyle   = effectiveAccent
      ctx.globalAlpha = 0.15
      ctx.textAlign   = 'left'
      ctx.fillText(slide.number_badge, PADDING - 8, currentY + 50)
      ctx.globalAlpha = 1.0
    }

    ctx.font      = `700 ${theme.heading_font_size * 1.4}px ${fonts.heading}`
    ctx.fillStyle = theme.text_color
    ctx.textAlign = 'left'

    const headingLines      = wrapText(ctx, slide.heading, contentWidth, theme.heading_font_size * 1.4)
    const headingLineHeight = theme.heading_font_size * 1.9
    headingLines.forEach((line, i) => {
      ctx.fillText(line, PADDING, currentY + i * headingLineHeight)
    })
    currentY += headingLines.length * headingLineHeight + 32

    ctx.fillStyle = effectiveAccent
    ctx.fillRect(PADDING, currentY, 48, 3)
    currentY += 28

    ctx.font      = `400 ${theme.body_font_size * 1.2}px ${fonts.body}`
    ctx.fillStyle = theme.secondary_text

    const bodyLines      = wrapText(ctx, slide.body, contentWidth, theme.body_font_size * 1.2)
    const bodyLineHeight = theme.body_font_size * 1.9
    bodyLines.forEach((line, i) => {
      ctx.fillText(line, PADDING, currentY + i * bodyLineHeight)
    })
  }

  // ── CTA SLIDE ────────────────────────────────────────────────────────────────
  if (slide.type === 'cta') {
    ctx.fillStyle   = effectiveAccent
    ctx.globalAlpha = 0.12
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1.0

    const centerX = W / 2
    let currentY  = H * 0.3

    ctx.font      = `700 ${theme.heading_font_size * 1.6}px ${fonts.heading}`
    ctx.fillStyle = theme.text_color
    ctx.textAlign = 'center'

    const ctaLines      = wrapText(ctx, slide.heading, contentWidth, theme.heading_font_size * 1.6)
    const ctaLineHeight = theme.heading_font_size * 2.2
    ctaLines.forEach((line, i) => {
      ctx.fillText(line, centerX, currentY + i * ctaLineHeight)
    })
    currentY += ctaLines.length * ctaLineHeight + 24

    if (slide.body || slide.cta_text) {
      ctx.font      = `400 ${theme.body_font_size * 1.2}px ${fonts.body}`
      ctx.fillStyle = theme.secondary_text
      const ctaBodyText  = slide.cta_text || slide.body
      const ctaBodyLines = wrapText(ctx, ctaBodyText, contentWidth * 0.8, theme.body_font_size * 1.2)
      const ctaBodyLineHeight = theme.body_font_size * 1.8
      ctaBodyLines.forEach((line, i) => {
        ctx.fillText(line, centerX, currentY + i * ctaBodyLineHeight)
      })
      currentY += ctaBodyLines.length * ctaBodyLineHeight + 40
    }

    if (slide.author_name && showAuthorHandle) {
      ctx.font      = `600 ${theme.body_font_size * 1.1}px ${fonts.body}`
      ctx.fillStyle = effectiveAccent
      ctx.textAlign = 'center'
      ctx.fillText(slide.author_name, centerX, currentY)
      if (slide.author_handle) {
        ctx.font      = `400 ${theme.body_font_size}px ${fonts.body}`
        ctx.fillStyle = theme.secondary_text
        ctx.fillText(slide.author_handle, centerX, currentY + 28)
      }
    }

    if (showBranding) {
      ctx.font        = `400 12px ${fonts.body}`
      ctx.fillStyle   = theme.secondary_text
      ctx.globalAlpha = 0.5
      ctx.textAlign   = 'center'
      ctx.fillText('Made with PostPika', centerX, H - 36)
      ctx.globalAlpha = 1.0
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CarouselSlidePreview({
  slide,
  theme,
  aspectRatio,
  accentColor,
  showSlideNumber,
  showAuthorHandle,
  showBranding,
  totalSlides,
  fontStyle,
  scale     = 0.4,
  forExport = false,
}: CarouselSlidePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const renderSlide = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = ASPECT_RATIOS[aspectRatio].width
    const H = ASPECT_RATIOS[aspectRatio].height
    const s = scale ?? 0.4

    canvas.width  = W * s
    canvas.height = H * s
    ctx.scale(s, s)

    drawSlideToContext(ctx, slide, theme, W, H, {
      accentColor,
      showSlideNumber,
      showAuthorHandle,
      showBranding,
      totalSlides,
      fontStyle,
    })
  }, [slide, theme, aspectRatio, accentColor,
      showSlideNumber, showAuthorHandle,
      showBranding, totalSlides, fontStyle, scale])

  useEffect(() => {
    renderSlide()
  }, [renderSlide])

  // forExport is used by the caller to know this is a high-res render;
  // we keep it in props so the parent can pass it without TS errors.
  void forExport

  const W           = ASPECT_RATIOS[aspectRatio].width
  const H           = ASPECT_RATIOS[aspectRatio].height
  const s           = scale ?? 0.4
  const canvasWidth  = W * s
  const canvasHeight = H * s

  return (
    <div
      style={{ width: canvasWidth, height: canvasHeight }}
      className="rounded-lg overflow-hidden flex-shrink-0"
    >
      <canvas ref={canvasRef} />
    </div>
  )
}

// ── Export helper for PDF / image generation ──────────────────────────────────

export async function getCanvasDataUrl(
  slide:       CarouselSlide,
  theme:       CarouselTheme,
  aspectRatio: 'square' | 'portrait',
  options: {
    accentColor?:      string
    showSlideNumber?:  boolean
    showAuthorHandle?: boolean
    showBranding?:     boolean
    totalSlides?:      number
    fontStyle?:        'professional' | 'modern' | 'bold'
  },
): Promise<string> {
  const W = ASPECT_RATIOS[aspectRatio].width
  const H = ASPECT_RATIOS[aspectRatio].height

  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context')

  drawSlideToContext(ctx, slide, theme, W, H, options)

  return canvas.toDataURL('image/png')
}
