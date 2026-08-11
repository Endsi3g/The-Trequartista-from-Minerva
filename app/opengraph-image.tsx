import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';


export const alt = 'The Trequartista from Minerva — Cockpit Operations';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#14170f',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#1c9a6f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dfff5f',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f3f2ea', fontSize: '28px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            <span>MINERVA</span>
            <span style={{ color: '#1c9a6f' }}>TREQUARTISTA</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#f3f2ea',
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            Cockpit Operations, Quality Control & Team Execution
          </div>
          <div style={{ fontSize: '24px', color: '#a0a89a', maxWidth: '800px' }}>
            Command Center in-house pour la livraison de projets clients, le suivi du ROI, les checklists de lancement 20-points et la gestion 1-on-1.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              backgroundColor: '#1c9a6f',
              color: '#14170f',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Usage Exclusif In-House
          </div>
          <div style={{ color: '#6e7668', fontSize: '18px' }}>
            minervaflow.com • Powered by Minerva OS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
