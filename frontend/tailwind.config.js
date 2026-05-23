
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',
        './src/app/**/*.{js,jsx,ts,tsx}',
        './src/lib/**/*.{js,jsx,ts,tsx}',
        './src/hooks/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                dark: {
                    100: '#1e1e2e',
                    200: '#181825',
                    300: '#11111b',
                    400: '#0d0d18',
                },
                /* Calendar feature tokens */
                ink: '#11181c',
                canvas: '#fafaf9',
                line: '#e5e7eb',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                panel: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                soft: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
                floating: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                rise: 'rise 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                pulseLine: 'pulseLine 2.4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
                slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                rise: {
                    '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                pulseLine: {
                    '0%, 100%': { opacity: '0.55' },
                    '50%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
