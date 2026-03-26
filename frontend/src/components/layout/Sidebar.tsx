'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Drawer, Box, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, IconButton, useMediaQuery, useTheme, AppBar, Toolbar,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TableChartIcon from '@mui/icons-material/TableChart'
import MenuIcon from '@mui/icons-material/Menu'
import { getKPIs } from '@/lib/api'
import type { KPIData } from '@/lib/types'

const NAV_ITEMS = [
  { label: 'Chat', icon: <ChatIcon />, path: '/chat' },
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Data Explorer', icon: <TableChartIcon />, path: '/explorer' },
]

interface Props { width: number }

export default function Sidebar({ width }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => { getKPIs().then(setKpis).catch(() => {}) }, [])
  useEffect(() => { setOpen(!isMobile) }, [isMobile])

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      {/* Brand */}
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography fontSize="2rem">📱</Typography>
        <Typography variant="h6" sx={{ color: 'text.primary', mt: 0.5 }}>
          TelecomCo CRM
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          AI Data Assistant
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Navigation */}
      <List>
        {NAV_ITEMS.map(item => (
          <ListItemButton
            key={item.path}
            selected={pathname === item.path}
            onClick={() => { router.push(item.path); isMobile && setOpen(false) }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              },
            }}
          >
            <ListItemIcon sx={{ color: pathname === item.path ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: pathname === item.path ? 600 : 400 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* KPIs */}
      {kpis && (
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, fontSize: '0.65rem' }}>
            Dataset Overview
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
            <KPIChip label="Customers" value={kpis.total_customers.toLocaleString()} />
            <KPIChip label="Churned" value={kpis.total_churned.toLocaleString()} />
            <KPIChip label="Churn Rate" value={`${kpis.churn_rate}%`} />
            <KPIChip label="States" value={kpis.num_states.toString()} />
          </Box>
        </Box>
      )}

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" sx={{ textAlign: 'center', color: '#334155', display: 'block' }}>
        Powered by <b style={{ color: '#6366F1' }}>Claude</b> · DuckDB · Plotly
        <br />Built by Mahdi BanisharifDehkordi
      </Typography>
    </Box>
  )

  return (
    <>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ bgcolor: '#070B14', borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => setOpen(true)} edge="start">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>📱 TelecomCo CRM</Typography>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: width,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: width, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      {/* Spacer for mobile AppBar */}
      {isMobile && <Toolbar />}
    </>
  )
}

function KPIChip({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{
      p: 1, borderRadius: 2,
      bgcolor: 'rgba(17, 24, 39, 0.8)',
      border: '1px solid rgba(30, 41, 59, 0.5)',
      textAlign: 'center',
    }}>
      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
    </Box>
  )
}
