// Direct Calendly API v2 call (Personal Access Token) -- generates a
// single-use scheduling link for the proposal's "book your second call"
// CTA. Composio's Calendly toolset (CALENDLY_CREATE_SINGLE_USE_SCHEDULING_LINK)
// is a plausible alternative once its server-callability is verified; this
// direct path works today without that dependency.
export async function createSingleUseSchedulingLink(): Promise<{ url: string | null; error?: string }> {
  const token = process.env.CALENDLY_API_TOKEN;
  const eventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI;

  if (!token || !eventTypeUri) {
    return { url: null, error: 'Calendly non configuré (CALENDLY_API_TOKEN / CALENDLY_EVENT_TYPE_URI manquants)' };
  }

  const res = await fetch('https://api.calendly.com/scheduling_links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ max_event_count: 1, owner: eventTypeUri, owner_type: 'EventType' }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { url: null, error: `Calendly a refusé la demande (${res.status}): ${errText}` };
  }

  const data = await res.json();
  return { url: data?.resource?.booking_url ?? null };
}
