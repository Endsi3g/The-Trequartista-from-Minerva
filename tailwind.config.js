/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			mv: {
  				green: 'var(--mv-green)',
  				'green-dark': 'var(--mv-green-dark)',
  				'green-darker': 'var(--mv-green-darker)',
  				'green-light': 'var(--mv-green-light)',
  				'green-tint': 'var(--mv-green-tint)',
  				warm: 'var(--mv-warm)',
  				'warm-dark': 'var(--mv-warm-dark)',
  				'warm-tint': 'var(--mv-warm-tint)',
  				cream: 'var(--mv-cream)',
  				'cream-soft': 'var(--mv-cream-soft)',
  				surface: 'var(--mv-surface)',
  				ink: 'var(--mv-ink)',
  				'ink-soft': 'var(--mv-ink-soft)',
  				'ink-faint': 'var(--mv-ink-faint)',
  				'ink-mute': 'var(--mv-ink-mute)',
  				border: 'var(--mv-border)',
  				'border-soft': 'var(--mv-border-soft)',
  				red: 'var(--mv-red)',
  				'red-bg': 'var(--mv-red-bg)',
  				coral: 'var(--mv-red)',
  				'coral-bg': 'var(--mv-red-bg)',
  				amber: 'var(--mv-amber)',
  				'amber-bg': 'var(--mv-amber-bg)',
  				purple: 'var(--mv-purple)',
  				'purple-bg': 'var(--mv-purple-bg)',
  				blue: 'var(--mv-blue)',
  				'blue-bg': 'var(--mv-blue-bg)',
  				'heat-1': 'var(--mv-heat-1)',
  				'heat-2': 'var(--mv-heat-2)',
  				'heat-3': 'var(--mv-heat-3)',
  				'heat-4': 'var(--mv-heat-4)',
  				'heat-5': 'var(--mv-heat-5)'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			DEFAULT: '8px',
  			sm: '4px',
  			md: '6px',
  			lg: '8px',
  			xl: '12px',
  			'2xl': '16px',
  			'3xl': '20px',
  			'4xl': '24px'
  		},
  		boxShadow: {
  			'mv-sm': '0 1px 2px rgba(26,30,22,.05)',
  			'mv-md': '0 2px 4px rgba(26,30,22,.04), 0 8px 20px rgba(26,30,22,.06)',
  			'mv-lg': '0 8px 16px rgba(26,30,22,.06), 0 24px 48px rgba(26,30,22,.10)'
  		},
  		fontFamily: {
  			display: [
  				'var(--font-inter)',
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			],
  			sans: [
  				'var(--font-inter)',
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'JetBrains Mono',
  				'monospace'
  			]
  		},
  		animation: {
  			'mv-fade-up': 'mvFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'mv-shimmer': 'mvShimmer 1.8s infinite linear',
  			'mv-leaf-breathe': 'mvLeafBreathe 4.5s infinite ease-in-out',
  			'mv-check-pop': 'mvCheckPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
  			'mv-scale-in': 'mvScaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'mv-fade-in': 'mvFadeIn 0.15s ease-out forwards',
  			'mv-mesh-drift-1': 'mvMeshDrift1 26s infinite ease-in-out',
  			'mv-mesh-drift-2': 'mvMeshDrift2 32s infinite ease-in-out',
  			'mv-mesh-drift-3': 'mvMeshDrift3 22s infinite ease-in-out'
  		},
  		keyframes: {
  			mvFadeUp: {
  				'0%': {
  					transform: 'translateY(6px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			mvShimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			mvLeafBreathe: {
  				'0%, 100%': {
  					transform: 'scale(1) rotate(0deg)'
  				},
  				'50%': {
  					transform: 'scale(1.08) rotate(2deg)'
  				}
  			},
  			mvCheckPop: {
  				'0%': {
  					transform: 'scale(0.5)',
  					opacity: '0'
  				},
  				'70%': {
  					transform: 'scale(1.15)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			mvScaleIn: {
  				'0%': {
  					transform: 'scale(0.96)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			mvFadeIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(-2px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			mvMeshDrift1: {
  				'0%, 100%': { transform: 'translate(-8%, -6%) scale(1)' },
  				'33%': { transform: 'translate(10%, 8%) scale(1.15)' },
  				'66%': { transform: 'translate(-4%, 14%) scale(0.95)' }
  			},
  			mvMeshDrift2: {
  				'0%, 100%': { transform: 'translate(12%, 10%) scale(1.1)' },
  				'50%': { transform: 'translate(-10%, -8%) scale(0.9)' }
  			},
  			mvMeshDrift3: {
  				'0%, 100%': { transform: 'translate(-6%, 12%) scale(0.9)' },
  				'40%': { transform: 'translate(8%, -10%) scale(1.2)' },
  				'75%': { transform: 'translate(4%, 4%) scale(1)' }
  			}
  		}
  	}
  },
  plugins: [],
};
