/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gen: {
                    1: '#FFD700', // Gold
                    2: '#2196F3', // Blue
                    3: '#4CAF50', // Green
                    4: '#F44336', // Red
                    5: '#9C27B0', // Purple
                    6: '#FF9800', // Orange
                    7: '#009688', // Teal
                    8: '#3F51B5', // Indigo
                    9: '#E91E63', // Pink
                }
            }
        },
    },
    plugins: [],
}
