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
  			DEFAULT: '0.625rem',
  			sm: 'calc(0.625rem * 0.6)',
  			md: 'calc(0.625rem * 0.8)',
  			lg: '0.625rem',
  			xl: 'calc(0.625rem * 1.4)',
  			'2xl': 'calc(0.625rem * 1.8)',
  			'3xl': 'calc(0.625rem * 2.2)',
  			'4xl': 'calc(0.625rem * 2.6)'
  		},
  		boxShadow: {
  			'mv-sm': '0 1px 2px rgba(26,30,22,.05)',
  			'mv-md': '0 2px 4px rgba(26,30,22,.04), 0 8px 20px rgba(26,30,22,.06)',
  			'mv-lg': '0 8px 16px rgba(26,30,22,.06), 0 24px 48px rgba(26,30,22,.10)'
  		},
  		fontFamily: {
  			display: [
  				'var(--font-sora)',
  				'Sora',
  				'-apple-system',
  				'sans-serif'
  			],
  			sans: [
  				'var(--font-inter)',
  				'Inter',
  				'-apple-system',
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
  			'mv-fade-in': 'mvFadeIn 0.15s ease-out forwards'
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
  			}
  		}
  	}
  },
  plugins: [],
};
