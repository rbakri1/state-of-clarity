import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable colors (maintain compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Design System: Base Neutrals (Warm Ivory Scale)
        ivory: {
          50: '#FCFBF9',
          100: '#F7F4EF',
          200: '#F2EDE5',
          300: '#ECE7DF',
          400: '#E6DFD4',
          500: '#E1DBD2',
          600: '#CFC8BD',
          700: '#BAB0A0',
          800: '#A39785',
          900: '#8B7D6B',
        },

        // Design System: Text Colors (Soft Ink Scale)
        ink: {
          50: '#F8F9FA',
          100: '#E9EAEC',
          200: '#D1D4D7',
          300: '#B8BCC1',
          400: '#9A9E9F',
          500: '#6B6F73',
          600: '#3A3F45',
          700: '#2A2E32',
          800: '#1F2328',
          900: '#16191D',
        },

        // Design System: Primary Accent (Deep Sage)
        sage: {
          50: '#F4F6F5',
          100: '#E8EBE9',
          200: '#D1D7D3',
          300: '#B9C3BD',
          400: '#8E9B94',
          500: '#5E6F64',
          600: '#4D5B52',
          700: '#3D4842',
          800: '#2E3632',
          900: '#1F2522',
        },

        // Design System: Secondary Accent (Muted Rust)
        rust: {
          50: '#FAF6F4',
          100: '#F5EBE5',
          200: '#EBD7CC',
          300: '#D9B5A0',
          400: '#C18769',
          500: '#9A5A3A',
          600: '#7D4A2F',
          700: '#603924',
          800: '#442A1A',
          900: '#2B1A10',
        },

        // Design System: Optional Cool Accent (Smoke Blue)
        smoke: {
          50: '#F6F8F9',
          100: '#ECF0F2',
          200: '#D9E0E5',
          300: '#B8C4CC',
          400: '#92A1AD',
          500: '#6E7F8D',
          600: '#596672',
          700: '#454E57',
          800: '#32383F',
          900: '#212529',
        },

        // Design System: Semantic Colors
        success: {
          DEFAULT: '#628B70',
          light: '#E8F0EB',
          dark: '#3D5945',
        },
        warning: {
          DEFAULT: '#C89664',
          light: '#F8F1E8',
          dark: '#9A6F3D',
        },
        error: {
          DEFAULT: '#B8675E',
          light: '#F5EBE9',
          dark: '#8B4840',
        },
        info: {
          DEFAULT: '#6E7F8D',
          light: '#ECF0F2',
          dark: '#454E57',
        },

        // Political Lean Colors (Data Visualization ONLY)
        'political-left': '#C85C6B',
        'political-center-left': '#D9A0A0',
        'political-center': '#9A9E9F',
        'political-center-right': '#7FA5B8',
        'political-right': '#6B8FB3',
        'political-unknown': '#CFC8BD',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ['Canela', 'Tiempos Headline', 'Libre Baskerville', 'Georgia', 'serif'],
        body: ['Source Serif 4', 'Literata', 'Georgia', 'serif'],
        ui: ['Inter', 'Source Sans 3', '-apple-system', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      maxWidth: {
        prose: '65ch',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#1F2328',
            '--tw-prose-headings': '#1F2328',
            '--tw-prose-links': '#5E6F64',
            '--tw-prose-bold': '#2A2E32',
            '--tw-prose-counters': '#6B6F73',
            '--tw-prose-bullets': '#CFC8BD',
            '--tw-prose-hr': '#E1DBD2',
            '--tw-prose-quotes': '#3A3F45',
            '--tw-prose-quote-borders': '#5E6F64',
            '--tw-prose-captions': '#6B6F73',
            maxWidth: '65ch',
            fontSize: '18px',
            lineHeight: '1.6',
          },
        },
        custom: {
          css: {
            '--tw-prose-body': '#1F2328',
            '--tw-prose-headings': '#1F2328',
            '--tw-prose-links': '#5E6F64',
            '--tw-prose-bold': '#2A2E32',
            '--tw-prose-counters': '#6B6F73',
            '--tw-prose-bullets': '#CFC8BD',
            '--tw-prose-hr': '#E1DBD2',
            '--tw-prose-quotes': '#3A3F45',
            '--tw-prose-quote-borders': '#5E6F64',
            '--tw-prose-captions': '#6B6F73',
            maxWidth: '65ch',
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};

export default config;
