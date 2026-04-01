/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Nature Premium — Primary
        forest: {
          50:  '#EEF4F0',
          100: '#D6E8DA',
          200: '#ADD1B5',
          300: '#7BB690',
          400: '#4E9A6B',
          500: '#2D5A3D', // Forest Green — brand primary
          600: '#244A32',
          700: '#1C3A27',
          800: '#132A1C',
          900: '#0B1A11',
        },
        // Nature Premium — Background & Neutral
        cream: '#FFF8F0',
        parchment: {
          50:  '#FFFDF9',
          100: '#FFF8F0', // cream
          200: '#FAECD8',
          300: '#F3DFC0',
          400: '#EAD1A6',
        },
        // Earth tones
        earth: {
          100: '#F2E8DC',
          200: '#E4D0BB',
          300: '#C4A882',
          400: '#A07850',
          500: '#7A5230',
        },
        bark: {
          100: '#EDE0D4',
          200: '#D4B8A0',
          300: '#B8906C',
          400: '#8C6040',
          500: '#5C3820',
        },
        sage: {
          100: '#EDF2EE',
          200: '#C8DACC',
          300: '#A0BEAA',
          400: '#76A080',
          500: '#4E8060',
        },
        // Semantic
        success: '#2D5A3D',
        warning: '#C4A882',
        error: '#C0392B',
        info: '#4E8060',
      },
      fontFamily: {
        sans: ['System'],
      },
      fontSize: {
        // 4px base — scale typographique coherente
        xs:   ['12px', { lineHeight: '16px' }], // caption
        sm:   ['14px', { lineHeight: '20px' }], // small body
        base: ['16px', { lineHeight: '24px' }], // body
        lg:   ['18px', { lineHeight: '28px' }], // body large
        xl:   ['20px', { lineHeight: '30px' }], // heading 5
        '2xl': ['24px', { lineHeight: '32px' }], // heading 4
        '3xl': ['28px', { lineHeight: '36px' }], // heading 3
        '4xl': ['34px', { lineHeight: '42px' }], // heading 2
        '5xl': ['40px', { lineHeight: '48px' }], // heading 1
      },
      spacing: {
        // 4px base grid
        0.5: '2px',
        1:   '4px',
        2:   '8px',
        3:   '12px',
        4:   '16px',
        5:   '20px',
        6:   '24px',
        7:   '28px',
        8:   '32px',
        10:  '40px',
        12:  '48px',
        14:  '56px',
        16:  '64px',
        20:  '80px',
        24:  '96px',
      },
      borderRadius: {
        none: '0px',
        sm:   '4px',
        DEFAULT: '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },
      boxShadow: {
        sm:  '0 1px 2px rgba(45, 90, 61, 0.08)',
        DEFAULT: '0 2px 8px rgba(45, 90, 61, 0.12)',
        md:  '0 4px 16px rgba(45, 90, 61, 0.16)',
        lg:  '0 8px 32px rgba(45, 90, 61, 0.20)',
        xl:  '0 16px 48px rgba(45, 90, 61, 0.24)',
      },
    },
  },
  plugins: [],
};
