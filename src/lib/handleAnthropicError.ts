import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

/**
 * Classifies known Anthropic SDK errors into appropriate HTTP responses.
 * Returns a NextResponse if the error is a known Anthropic error, null otherwise.
 * Use this in the catch block of any route that calls the Anthropic API.
 */
export function handleAnthropicError(err: unknown): NextResponse | null {
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: 'AI rate limit reached. Please wait a moment and try again.' },
      { status: 429 },
    )
  }

  if (err instanceof Anthropic.BadRequestError) {
    // Covers context-length-exceeded and other bad request errors
    return NextResponse.json(
      { error: 'Content is too long for AI processing. Please shorten your input and try again.' },
      { status: 400 },
    )
  }

  if (err instanceof Anthropic.InternalServerError) {
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again in a moment.' },
      { status: 503 },
    )
  }

  if (err instanceof Anthropic.APIConnectionError) {
    return NextResponse.json(
      { error: 'Could not reach AI service. Please check your connection and try again.' },
      { status: 503 },
    )
  }

  return null
}
