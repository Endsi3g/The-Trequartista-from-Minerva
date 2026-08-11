import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { projectId, items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: 'Items payload must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalCount = items.length;
    const checkedCount = items.filter((item: { checked: boolean }) => item.checked).length;
    const scorePct = Math.round((checkedCount / totalCount) * 100);
    const isReadyForProduction = checkedCount === totalCount && totalCount >= 20;

    return new Response(
      JSON.stringify({
        projectId,
        totalCount,
        checkedCount,
        scorePct,
        isReadyForProduction,
        validatedAt: new Date().toISOString(),
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
