import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/components/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 기본 색상
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          hover: "hsl(var(--secondary-hover))",
          light: "hsl(var(--secondary-light))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          hover: "hsl(var(--accent-hover))",
          light: "hsl(var(--accent-light))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // 상태 색상
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          light: "hsl(var(--danger-light))",
        },
        // 포인트 컬러
        point: "hsl(var(--point))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        // 그라데이션 (통일된 Primary: #2F80ED)
        'gradient-primary': 'linear-gradient(135deg, #2F80ED 0%, #1c60b8 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #e8f2fd 0%, #dbeafe 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        'gradient-brand': 'linear-gradient(135deg, #2F80ED 0%, #14b8a6 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        'gradient-forest': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        'gradient-mesh': `
          radial-gradient(at 40% 20%, #2F80ED 0px, transparent 50%),
          radial-gradient(at 80% 0%, #14b8a6 0px, transparent 50%),
          radial-gradient(at 0% 50%, #1c60b8 0px, transparent 50%),
          radial-gradient(at 80% 50%, #06b6d4 0px, transparent 50%),
          radial-gradient(at 0% 100%, #0ea5e9 0px, transparent 50%)
        `,
        // 유리 효과
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },
      boxShadow: {
        // 3D 그림자
        '3d-sm': `
          0 1px 2px rgba(0, 0, 0, 0.02),
          0 2px 4px rgba(0, 0, 0, 0.04),
          0 4px 8px rgba(0, 0, 0, 0.06)
        `,
        '3d': `
          0 1px 2px rgba(0, 0, 0, 0.02),
          0 4px 8px rgba(0, 0, 0, 0.04),
          0 12px 24px rgba(0, 0, 0, 0.06),
          0 24px 48px rgba(0, 0, 0, 0.08)
        `,
        '3d-lg': `
          0 2px 4px rgba(0, 0, 0, 0.02),
          0 8px 16px rgba(0, 0, 0, 0.04),
          0 16px 32px rgba(0, 0, 0, 0.06),
          0 32px 64px rgba(0, 0, 0, 0.08),
          0 64px 128px rgba(0, 0, 0, 0.1)
        `,
        '3d-xl': `
          0 4px 8px rgba(0, 0, 0, 0.02),
          0 16px 32px rgba(0, 0, 0, 0.06),
          0 32px 64px rgba(0, 0, 0, 0.1),
          0 64px 128px rgba(0, 0, 0, 0.14),
          0 96px 192px rgba(0, 0, 0, 0.18)
        `,
        // 컬러 그림자 (통일된 Primary: #2F80ED)
        'primary': '0 4px 14px rgba(47, 128, 237, 0.35)',
        'primary-lg': '0 8px 30px rgba(47, 128, 237, 0.4)',
        'secondary': '0 4px 14px rgba(20, 184, 166, 0.35)',
        'secondary-lg': '0 8px 30px rgba(20, 184, 166, 0.4)',
        'accent': '0 4px 14px rgba(249, 115, 22, 0.35)',
        'accent-lg': '0 8px 30px rgba(249, 115, 22, 0.4)',
        // 뉴모피즘
        'neumorphic': `
          8px 8px 20px rgba(0, 0, 0, 0.1),
          -8px -8px 20px rgba(255, 255, 255, 0.9)
        `,
        'neumorphic-inset': `
          inset 4px 4px 10px rgba(0, 0, 0, 0.08),
          inset -4px -4px 10px rgba(255, 255, 255, 0.8)
        `,
        // 유리 효과
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        // 기본 그림자
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'pulse-3d': 'pulse3d 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(1deg)' },
          '75%': { transform: 'translateY(-5px) rotate(-1deg)' },
        },
        pulse3d: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(47, 128, 237, 0.4)' },
          '50%': { boxShadow: '0 0 0 15px transparent' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 4px 12px rgba(47, 128, 237, 0.35), 0 0 0 0 rgba(47, 128, 237, 0.4)' },
          '50%': { boxShadow: '0 4px 12px rgba(47, 128, 237, 0.35), 0 0 0 12px rgba(47, 128, 237, 0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};

export default config;
