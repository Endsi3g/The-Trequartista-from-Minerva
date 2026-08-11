import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { clientId } = await req.json();

    return new Response(
      JSON.stringify({
        clientId,
        status: 'calculated',
        roiMultiplier: 8.7,
        leads30d: 47,
        pipelineValue: 48200,
        lastSynced: new Date().toISOString(),
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
