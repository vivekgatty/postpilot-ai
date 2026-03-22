export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractFromUrl, extractFromPdf, cleanExtractedText } from '@/lib/contentExtractor'
import { REPURPOSE_LIMITS, detectPlatform } from '@/lib/repurposeConfig'
import type { PlanType } from '@/types'

// ── POST /api/repurpose/extract ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user profile for plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan       = (profile?.plan ?? 'free') as PlanType
    const limits     = REPURPOSE_LIMITS[plan]
    const isPaidPlan = plan !== 'free'

    // Check daily rate limit
    if (limits.sessions_per_day > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('repurpose_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())

      if ((count ?? 0) >= limits.sessions_per_day) {
        return NextResponse.json(
          { error: 'DAILY_LIMIT', message: 'Upgrade to repurpose more content today' },
          { status: 403 },
        )
      }
    }

    const contentType = req.headers.get('content-type') ?? ''
    const extracted = {
      title:              '',
      author:             '',
      text:               '',
      platform:           'website',
      source_type:        'text',
      word_count:         0,
      error:              undefined as string | undefined,
      needs_manual_paste: false,
    }
    let sourceUrl: string | null = null

    // ── PDF upload ────────────────────────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      if (!limits.pdf) {
        return NextResponse.json(
          { error: 'PDF_NOT_AVAILABLE', message: 'PDF upload is available on Starter plan and above' },
          { status: 403 },
        )
      }

      const formData  = await req.formData()
      const file      = formData.get('file') as File | null
      const manualUrl = formData.get('url') as string | null

      if (file) {
        const maxMb  = isPaidPlan ? (plan === 'starter' ? 5 : 20) : 5
        const maxBytes = maxMb * 1024 * 1024
        if (file.size > maxBytes) {
          return NextResponse.json(
            { error: 'FILE_TOO_LARGE', message: `File size exceeds ${maxMb}MB limit` },
            { status: 400 },
          )
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer      = Buffer.from(arrayBuffer)
        const pdfResult   = await extractFromPdf(buffer)
        Object.assign(extracted, pdfResult)
      } else if (manualUrl) {
        sourceUrl = manualUrl
        const urlResult = await extractFromUrl(manualUrl)
        Object.assign(extracted, urlResult)
      }
    } else {
      // ── JSON body ─────────────────────────────────────────────────────────
      let body: { url?: string; text?: string }
      try { body = await req.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
      }

      if (body.url) {
        sourceUrl = body.url
        const urlResult = await extractFromUrl(body.url)
        Object.assign(extracted, urlResult)
      } else if (body.text) {
        const wordCount = body.text.split(/\s+/).filter(Boolean).length
        Object.assign(extracted, {
          title:       'Pasted text',
          author:      '',
          text:        body.text,
          platform:    'text',
          source_type: 'text',
          word_count:  wordCount,
        })
      } else {
        return NextResponse.json({ error: 'Provide a URL, text, or PDF file' }, { status: 400 })
      }
    }

    // ── Manual paste required ─────────────────────────────────────────────────
    if (extracted.needs_manual_paste) {
      return NextResponse.json({
        needs_manual_paste: true,
        error:   extracted.error,
        partial: { title: extracted.title, platform: extracted.platform },
      })
    }

    const cleanedText = cleanExtractedText(extracted.text)

    // ── Create session ────────────────────────────────────────────────────────
    const sourceTypeMap: Record<string, string> = {
      youtube:     'youtube',
      twitter:     'twitter',
      substack:    'newsletter',
      beehiiv:     'newsletter',
      google_docs: 'google_docs',
      pdf:         'pdf',
      text:        'text',
    }
    const sessionSourceType = (
      sourceTypeMap[extracted.source_type] ??
      sourceTypeMap[extracted.platform] ??
      'url'
    ) as 'url' | 'text' | 'pdf' | 'youtube' | 'twitter' | 'newsletter' | 'google_docs'

    const { data: session, error: sessionError } = await supabase
      .from('repurpose_sessions')
      .insert({
        user_id:          user.id,
        source_type:      sessionSourceType,
        source_url:       sourceUrl,
        source_title:     extracted.title || null,
        source_author:    extracted.author || null,
        source_platform:  extracted.platform || detectPlatform(sourceUrl ?? ''),
        extracted_text:   cleanedText,
        extracted_topics: [],
        word_count:       extracted.word_count,
        settings:         {},
        posts_generated:  0,
        posts_saved:      0,
        status:           'extracted',
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'repurpose_extract',
      tokens_used: 0,
      metadata:    { source_type: sessionSourceType, word_count: extracted.word_count },
    })

    return NextResponse.json({
      session_id:         session.id,
      title:              extracted.title,
      author:             extracted.author,
      platform:           extracted.platform,
      word_count:         extracted.word_count,
      text_preview:       cleanedText.slice(0, 500),
      needs_manual_paste: false,
    })
  } catch (err) {
    console.error('[POST /api/repurpose/extract]', err)
    const msg = err instanceof Error ? err.message : 'Failed to extract content'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
