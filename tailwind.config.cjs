/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				paper: "hsl(var(--paper) / <alpha-value>)",
				ink: "hsl(var(--ink) / <alpha-value>)",
				cocoa: "hsl(var(--cocoa) / <alpha-value>)",
				saffron: "hsl(var(--saffron) / <alpha-value>)",
				clay: "hsl(var(--clay) / <alpha-value>)",
				fog: "hsl(var(--fog) / <alpha-value>)",
				olive: "hsl(var(--olive) / <alpha-value>)",
			},
			borderRadius: {
				menu: "18px",
			},
			boxShadow: {
				paper: "var(--shadow-paper)",
			},
			fontFamily: {
				display: ['"Noto Serif TC"', "serif"],
				body: ['"Noto Sans TC"', "ui-sans-serif", "system-ui"],
			},
		},
	},
	plugins: [],
};
