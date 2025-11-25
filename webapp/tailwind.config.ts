import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0D1117',
          surface: '#161B22',
          hover: '#1C2128',
          border: '#30363D',
        },
        blue: {
          primary: '#2F81F7',
          hover: '#1F6FEB',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#7D8590',
          tertiary: '#57606A',
        },
        status: {
          success: '#3FB950',
          error: '#F85149',
          warning: '#D29922',
        },
      },
    },
  },
  plugins: [],
};

export default config;
