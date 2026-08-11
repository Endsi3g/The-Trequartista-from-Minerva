import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { memberId, memberEmail, meetingDate, summary } = await req.json();

    // Mock/Stub API integration for Google Calendar OAuth sync
    return new Response(
      JSON.stringify({
        success: true,
        calendarEventId: `gcal_${Date.now()}_${memberId}`,
        syncedEmail: memberEmail,
        meetingDate,
        summary: summary || 'Routine 1-on-1 Minerva Centurions',
        syncedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
