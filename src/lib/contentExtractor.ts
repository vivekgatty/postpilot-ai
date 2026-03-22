import { load } from 'cheerio'
import { YoutubeTranscript } from 'youtube-transcript'
import { anthropic, AI_MODEL } from '@/lib/anthropic'
import {
  detectPlatform,
  isYouTubeUrl,
  isLinkedInUrl,
  isGoogleDocsUrl,
  extractYouTubeId,
} from '@/lib/repurposeConfig'
import type { ExtractedContent } from '@/types'

// ── YouTube extraction ────────────────────────────────────────────────────────

async function extractFromYouTube(url: string): Promise<ExtractedContent> {
  const videoId = extractYouTubeId(url)
  if (!videoId) {
    return {
      needs_manual_paste: true,
      error: 'Could not extract YouTube video ID from this URL',
      title: '',
      author: '',
      text: '',
      platform: 'youtube',
      source_type: 'youtube',
      word_count: 0,
    }
  }

  // Fetch video metadata
  let videoTitle = ''
  let channelName = ''
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const metaRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) })
    if (metaRes.ok) {
      const meta = await metaRes.json() as { title?: string; author_name?: string }
      videoTitle  = meta.title      ?? ''
      channelName = meta.author_name ?? ''
    }
  } catch {
    // Metadata fetch failed; continue anyway
  }

  // Fetch transcript
  let transcriptText = ''
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId)
    const rawText = transcriptData.map(t => t.text).join(' ')
    // Remove common annotation artifacts
    transcriptText = rawText
      .replace(/\[Music\]/gi, '')
      .replace(/\[Applause\]/gi, '')
      .replace(/\[Laughter\]/gi, '')
      .replace(/\[Music playing\]/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  } catch {
    return {
      needs_manual_paste: true,
      error: 'This video does not have captions available. Paste the transcript or show notes below.',
      title: videoTitle,
      author: channelName,
      text: '',
      platform: 'youtube',
      source_type: 'youtube',
      word_count: 0,
    }
  }

  if (!transcriptText) {
    return {
      needs_manual_paste: true,
      error: 'This video does not have captions available. Paste the transcript or show notes below.',
      title: videoTitle,
      author: channelName,
      text: '',
      platform: 'youtube',
      source_type: 'youtube',
      word_count: 0,
    }
  }

  // Check if transcript appears non-English (primarily non-Latin characters in first 200 chars)
  const sample = transcriptText.slice(0, 200)
  const nonLatinCount = (sample.match(/[^\u0000-\u007F]/g) ?? []).length
  if (nonLatinCount > sample.length * 0.4) {
    transcriptText = await translateTranscript(transcriptText)
  }

  return {
    title: videoTitle,
    author: channelName,
    text: transcriptText,
    platform: 'youtube',
    source_type: 'youtube',
    word_count: transcriptText.split(/\s+/).filter(Boolean).length,
  }
}

// ── Translation helper ────────────────────────────────────────────────────────

async function translateTranscript(text: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 4000,
      system:
        'You are a professional translator. Translate the following content to English accurately. Preserve all key information, examples, statistics, and the speaker\'s voice. Do not summarise — translate fully.',
      messages: [
        {
          role:    'user',
          content: `Translate this transcript to English:\n\n${text}`,
        },
      ],
    })
    const block = msg.content[0]
    return block.type === 'text' ? block.text : text
  } catch {
    return `[Note: Translation attempted but may be incomplete] ${text}`
  }
}

// ── Web page extraction ───────────────────────────────────────────────────────

async function extractFromWebPage(url: string): Promise<ExtractedContent> {
  let html = ''
  let responseStatus = 0
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PostPika/1.0)',
        Accept:       'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })
    responseStatus = response.status
    if (response.status === 401 || response.status === 403) {
      return {
        needs_manual_paste: true,
        error:              'This page requires login or is behind a paywall. Paste the content text below.',
        title:              '',
        author:             '',
        text:               '',
        platform:           detectPlatform(url),
        source_type:        'url',
        word_count:         0,
      }
    }
    if (!response.ok) {
      return {
        needs_manual_paste: true,
        error:              `Could not fetch this page (${response.status}). Paste the content text below.`,
        title:              '',
        author:             '',
        text:               '',
        platform:           detectPlatform(url),
        source_type:        'url',
        word_count:         0,
      }
    }
    html = await response.text()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')
    return {
      needs_manual_paste: true,
      error:              isTimeout
        ? 'This page took too long to load. Paste the content text below.'
        : `Could not fetch this page (${responseStatus || 'network error'}). Paste the content text below.`,
      title:       '',
      author:      '',
      text:        '',
      platform:    detectPlatform(url),
      source_type: 'url',
      word_count:  0,
    }
  }

  const $ = load(html)

  // Extract title
  const ogTitle   = $('meta[property="og:title"]').attr('content') ?? ''
  const titleTag  = $('title').first().text() ?? ''
  const h1Text    = $('h1').first().text() ?? ''
  const rawTitle  = ogTitle || titleTag || h1Text
  const title     = rawTitle.trim().replace(/\s+/g, ' ')

  // Extract author
  const metaAuthor    = $('meta[name="author"]').attr('content') ?? ''
  const articleAuthor = $('meta[property="article:author"]').attr('content') ?? ''
  const relAuthor     = $('[rel="author"]').first().text() ?? ''
  const classAuthor   = $('[class*="author"]').first().text() ?? ''
  const rawAuthor     = metaAuthor || articleAuthor || relAuthor || classAuthor
  const author        = rawAuthor.trim().replace(/\s+/g, ' ').slice(0, 100)

  // Remove noise
  $('script, style, nav, header, footer, [class*="sidebar"], [class*="menu"], [class*="navigation"], [class*="cookie"], [class*="popup"], [class*="modal"], [class*="advertisement"], [class*="ad-"], iframe, noscript').remove()

  // Try to find main content area
  const CONTENT_SELECTORS = [
    'article',
    '[class*="post-content"]',
    '[class*="article-body"]',
    '[class*="entry-content"]',
    'main',
    '.content',
    'body',
  ]

  let extractedText = ''
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first()
    if (!el.length) continue
    const candidate = extractTextFromElement($, el)
    if (candidate.length > 200) {
      extractedText = candidate
      break
    }
  }

  if (extractedText.length < 100) {
    return {
      needs_manual_paste: true,
      error:              'Could not extract readable content from this page. Try pasting the text directly.',
      title,
      author,
      text:               '',
      platform:           detectPlatform(url),
      source_type:        'url',
      word_count:         0,
    }
  }

  return {
    title,
    author,
    text:        extractedText,
    platform:    detectPlatform(url),
    source_type: 'url',
    word_count:  extractedText.split(/\s+/).filter(Boolean).length,
  }
}

function extractTextFromElement(
  $: ReturnType<typeof load>,
  el: ReturnType<ReturnType<typeof load>>,
): string {
  const lines: string[] = []

  el.find('h1, h2, h3, h4, h5, h6, p, li, blockquote').each((_, node) => {
    const text = $(node).text().trim().replace(/\s+/g, ' ')
    if (text.length < 20) return
    const tagName = (node as { tagName?: string }).tagName?.toLowerCase() ?? ''
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      lines.push(`\n${text}\n`)
    } else {
      lines.push(text)
    }
  })

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Google Docs extraction ────────────────────────────────────────────────────

async function extractFromGoogleDocs(url: string): Promise<ExtractedContent> {
  try {
    const exportUrl = url
      .replace(/\/edit.*$/, '/export?format=txt')
      .replace(/\/view.*$/, '/export?format=txt')
      .replace(/\/pub.*$/, '/export?format=txt')

    const response = await fetch(exportUrl, {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      return {
        needs_manual_paste: true,
        error:              'Could not access this Google Doc. Make sure it is set to "Anyone with link can view".',
        title:              '',
        author:             '',
        text:               '',
        platform:           'google_docs',
        source_type:        'url',
        word_count:         0,
      }
    }
    const text = await response.text()
    const cleaned = cleanExtractedText(text)
    return {
      title:       'Google Doc',
      author:      '',
      text:        cleaned,
      platform:    'google_docs',
      source_type: 'google_docs',
      word_count:  cleaned.split(/\s+/).filter(Boolean).length,
    }
  } catch {
    return {
      needs_manual_paste: true,
      error:              'Could not fetch this Google Doc. Paste the content text below.',
      title:              '',
      author:             '',
      text:               '',
      platform:           'google_docs',
      source_type:        'url',
      word_count:         0,
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  if (isLinkedInUrl(url)) {
    return {
      needs_manual_paste: true,
      error:              'LinkedIn pages cannot be fetched automatically. Please paste the post text below.',
      title:              '',
      author:             '',
      text:               '',
      platform:           'linkedin',
      source_type:        'url',
      word_count:         0,
    }
  }

  if (isYouTubeUrl(url)) {
    return extractFromYouTube(url)
  }

  if (isGoogleDocsUrl(url)) {
    return extractFromGoogleDocs(url)
  }

  return extractFromWebPage(url)
}

export async function extractFromPdf(buffer: Buffer): Promise<ExtractedContent> {
  try {
    // Dynamic import to avoid Next.js build-time issues with pdf-parse
    const pdfParseModule = await import('pdf-parse')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule
    const data = await pdfParse(buffer)

    const rawText = data.text ?? ''

    // Clean the text
    const cleaned = rawText
      .split('\n')
      .map((line: string) => line.trim())
      // Remove lines that are only numbers (page numbers)
      .filter((line: string) => !/^\d+$/.test(line))
      // Remove lines under 15 chars (likely headers/footers)
      .filter((line: string) => line.length >= 15 || line === '')
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const info = data.info as Record<string, string> | undefined
    const pdfTitle  = info?.Title  ?? ''
    const pdfAuthor = info?.Author ?? ''

    return {
      title:       pdfTitle  || 'Uploaded PDF',
      author:      pdfAuthor || '',
      text:        cleaned,
      platform:    'pdf',
      source_type: 'pdf',
      word_count:  cleaned.split(/\s+/).filter(Boolean).length,
    }
  } catch {
    throw new Error('Could not read this PDF. Make sure it is a text-based PDF and not a scanned image.')
  }
}

export function cleanExtractedText(text: string): string {
  const BOILERPLATE = [
    /subscribe to (our )?newsletter/gi,
    /share this article/gi,
    /leave a comment/gi,
    /related articles/gi,
    /read more/gi,
    /follow us on/gi,
    /click here to/gi,
    /sign up for free/gi,
    /get our newsletter/gi,
    /privacy policy/gi,
    /terms of service/gi,
    /all rights reserved/gi,
    /copyright \d{4}/gi,
  ]

  let cleaned = text
  for (const pattern of BOILERPLATE) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
