import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Link: {
      variants: {
        logo: {
          textDecoration: 'none',
          _hover: {
            textDecoration: 'none',
          },
        },
        nav: {
          fontSize: '20px',
          color: 'rgba(32, 84, 178, 0.8)',
          position: 'relative',
          textDecoration: 'none',
          transition: 'all 0.3s ease',
          _hover: {
            textDecoration: 'none',
            color: '#6983FF',
          },
          _active: {
            color: '#6983FF',
          },
          '&[aria-current="page"]': {
            color: '#6983FF',
            _after: {
              content: '""',
              position: 'absolute',
              bottom: '-10px',
              left: '0',
              width: '100%',
              height: '4px',
              background: '#6983FF',
            },
          },
        },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: '600',
        _active: {
          transform: 'translateY(0)',
        },
      },
      variants: {
        violet: {
          bg: 'primary.500',
          color: 'white',
          transition: 'all 0.2s ease-in-out',
          borderRadius: '2px',
          _hover: {
            bg: 'primary.600',
            transform: 'translateY(-2px)',
            boxShadow: '0px 4px 8px rgba(105, 131, 255, 0.25)',
          },
          _active: {
            bg: 'primary.600',
            transform: 'translateY(0)',
          },
        },
        gradient: {
          color: '#6983FF',
          fontSize: '24px',
          borderRadius: '30px',
          padding: '10px 20px',
          bgGradient: 'linear(to-r, #ffffff, #B7C2F7)',
          boxShadow: '0px 4px 10px  rgba(0, 0, 0, 0.25)',
          height: 'auto',
          transition: 'all 0.3s ease-in-out',
          minW: 'none',
          _hover: {
            bgGradient: 'linear(to-r, #B7C2F7, #ffffff)',
            color: '#6983FF',
            transform: 'translateY(-2px)',
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)',
          },
          _active: {
            bgGradient: 'linear(to-r, #B7C2F7, #ffffff)',
            transform: 'translateY(0)',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
          },
        },
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
          },
          _active: {
            bg: 'blue.700',
          },
        },
        outline: {
          borderWidth: '2px',
          _hover: {
            bg: 'blue.50',
          },
        },
        ghost: {
          _hover: {
            bg: 'blue.50',
          },
        },
      },
      sizes: {
        lg: {
          fontSize: 'md',
          px: '8',
          py: '4',
        },
        md: {
          fontSize: 'sm',
          px: '6',
          py: '3',
        },
      },
      defaultProps: {
        size: 'md',
        variant: 'solid',
      },
    },
  },
  colors: {
    primary: {
      50: '#f0f3ff',
      100: '#d1d9ff',
      200: '#bac6ff',
      300: '#9bacff',
      400: '#879cff',
      500: '#6983ff',
      600: '#6077e8',
      700: '#4b5db5',
      800: '#3a488c',
      900: '#2c376b',
    },
    secondary: {
      burgundy: {
        500: '#642637', // HEX: #642637
        text: '#E7E4F4', // Text color overlay
      },
      purple: {
        500: '#30176E', // HEX: #30176E
        text: '#E7E4F4', // Text color overlay
      },
      pink: {
        500: '#E0A2AF', // HEX: #E0A2AF
        text: '#1A2026', // Text color overlay
      },
      lavender: {
        500: '#BCB5E7', // HEX: #BCB5E7
        100: 'rgba(188, 181, 231, 0.2);',
        text: '#30176E', // Text color overlay
      },
    },
    text: {
      primary: '#1A2026', // Primary text color
      secondary: '#E7E4F4', // Secondary text color for dark backgrounds
      link: '#6983FF'
    },
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
});

export default theme;
