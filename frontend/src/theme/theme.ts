'use client'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366F1' },
    secondary: { main: '#3B82F6' },
    error: { main: '#EF4444' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    background: {
      default: '#070B14',
      paper: '#111827',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
    divider: 'rgba(30, 41, 59, 0.6)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    body2: { color: '#94A3B8' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #111827 0%, #0D1321 100%)',
          border: '1px solid rgba(30, 41, 59, 0.7)',
          transition: 'all 0.25s ease',
          '&:hover': {
            borderColor: 'rgba(99, 102, 241, 0.5)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #070B14 0%, #0F1629 50%, #131B2E 100%)',
          borderRight: '1px solid rgba(30, 41, 59, 0.5)',
        },
      },
    },
  },
})

export default theme
