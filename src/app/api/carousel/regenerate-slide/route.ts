export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { regenerateSingleSlide } from '@/lib/carouselGenerator'
import type { CarouselSlide } from '@/types'

// ── POST /api/carousel/regenerate-slide ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      carousel_id: string
      slide_id:    string
      topic:       string
      niche:       string
      tone_id:     string
    }

    const { carousel_id, slide_id, topic, niche, tone_id } = body

    if (!carousel_id || !slide_id || !topic) {
      return NextResponse.json({ error: 'carousel_id, slide_id, and topic are required' }, { status: 400 })
    }

    // Fetch carousel and verify ownership
    const { data: carousel, error: fetchErr } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', carousel_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    const slides = (carousel.slides ?? []) as CarouselSlide[]
    const slideIndex = slides.findIndex(s => s.id === slide_id)

    if (slideIndex === -1) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    const slide = slides[slideIndex]

    // Build context from adjacent slide headings
    const adjacentHeadings = slides
      .filter((_, i) => i !== slideIndex)
      .map(s => s.heading)
      .join(', ')

    const updatedSlide = await regenerateSingleSlide(
      slide,
      topic,
      niche   ?? carousel.niche   ?? 'Other',
      tone_id ?? carousel.tone_id ?? 'professional',
      adjacentHeadings,
    )

    // Replace slide in array
    const updatedSlides = slides.map((s, i) => (i === slideIndex ? updatedSlide : s))

    const { error: patchErr } = await supabase
      .from('carousels')
      .update({
        slides:     updatedSlides,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carousel_id)
      .eq('user_id', user.id)

    if (patchErr) throw patchErr

    return NextResponse.json({ slide: updatedSlide })
  } catch (err) {
    console.error('[POST /api/carousel/regenerate-slide]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to regenerate slide' }, { status: 500 })
  }
}
