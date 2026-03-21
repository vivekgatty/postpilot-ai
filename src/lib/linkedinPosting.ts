// ─── LinkedIn Posting Service ─────────────────────────────────────────────────
// Handles direct LinkedIn API calls via the UGC Posts (Share) API.

// ── Post to LinkedIn ──────────────────────────────────────────────────────────

export async function postToLinkedIn(
  accessToken: string,
  linkedinUrn: string,
  content: string,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
): Promise<{ success: boolean; linkedinPostId?: string; postUrl?: string; error?: string }> {
  try {
    const body = {
      author: `urn:li:person:${linkedinUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    }

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization:                  `Bearer ${accessToken}`,
        'Content-Type':                 'application/json',
        'X-Restli-Protocol-Version':    '2.0.0',
      },
      body: JSON.stringify(body),
    })

    if (res.status === 401) {
      return { success: false, error: 'TOKEN_EXPIRED' }
    }

    if (res.status === 429) {
      return { success: false, error: 'RATE_LIMITED' }
    }

    if (res.status === 201) {
      // Post ID comes in the x-restli-id header or the response body
      const postId = res.headers.get('x-restli-id') ?? ''
      let linkedinPostId = postId

      // If header was empty, try to parse body
      if (!linkedinPostId) {
        try {
          const json = await res.json() as { id?: string }
          linkedinPostId = json.id ?? ''
        } catch {
          // ignore JSON parse errors
        }
      }

      const postUrl = linkedinPostId
        ? `https://www.linkedin.com/feed/update/${linkedinPostId}`
        : undefined

      return { success: true, linkedinPostId: linkedinPostId || undefined, postUrl }
    }

    // Other errors
    let errorMessage = `LinkedIn API error: ${res.status}`
    try {
      const errJson = await res.json() as { message?: string }
      if (errJson.message) errorMessage = errJson.message
    } catch {
      // ignore
    }

    return { success: false, error: errorMessage }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// ── Token validity check ──────────────────────────────────────────────────────
// LinkedIn OAuth tokens last 60 days and cannot be auto-refreshed.
// Returns true if the token is still valid, false if expired or expiring very soon.

export async function refreshLinkedInToken(
  _userId: string,
  tokenExpiresAt: string,
): Promise<boolean> {
  const expiresAt = new Date(tokenExpiresAt).getTime()
  const now       = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000

  // Return false if already expired or expiring within 7 days
  return expiresAt > now + sevenDays
}

// ── LinkedIn OAuth URL builder ────────────────────────────────────────────────

export function getLinkedInAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINKEDIN_CLIENT_ID ?? '',
    redirect_uri:  redirectUri,
    state,
    scope:         'openid profile email w_member_social',
  })

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}
