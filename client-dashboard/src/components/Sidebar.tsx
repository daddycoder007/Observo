import React from 'react';
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Tooltip,
  styled,
  Theme,
  CSSObject,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReceiptLong as LogsIcon,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  QueryStats,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Logs', icon: <LogsIcon />, path: '/logs' },
  { text: 'Analytics', icon: <QueryStats />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },

];

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, mode, toggleColorMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer variant="permanent" open={isOpen}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, ...(!isOpen && { display: 'none' }) }}>
        <QueryStats sx={{mr: 1, color: 'primary.main'}}/>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Observo
        </Typography>
      </Box>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={isOpen ? '' : item.text} placement="right">
                <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                        minHeight: 48,
                        justifyContent: isOpen ? 'initial' : 'center',
                        px: 2.5,
                        mx: 1.5,
                        my: 0.5,
                        borderRadius: 1,
                        backgroundColor: location.pathname === item.path ? 'primary.main' : 'transparent',
                        color: location.pathname === item.path ? 'white' : 'text.secondary',
                        '&:hover': {
                            backgroundColor: location.pathname !== item.path ? 'action.hover' : 'primary.dark',
                        },
                    }}
                    >
                    <ListItemIcon
                        sx={{
                        minWidth: 0,
                        mr: isOpen ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                        }}
                    >
                        {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} sx={{ opacity: isOpen ? 1 : 0 }} />
                </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto' }}>
         <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} placement="right">
            <ListItemButton
                onClick={toggleColorMode}
                sx={{
                    minHeight: 48,
                    justifyContent: 'center',
                    px: 2.5,
                    m: 1.5,
                    borderRadius: 1,
                }}
            >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: 'text.secondary' }}>
                    {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </ListItemIcon>
            </ListItemButton>
        </Tooltip>
         <Tooltip title={isOpen ? 'Collapse' : 'Expand'} placement="right">
            <ListItemButton
                onClick={toggleSidebar}
                sx={{
                    minHeight: 48,
                    justifyContent: 'center',
                    px: 2.5,
                    m: 1.5,
                    borderRadius: 1,
                }}
            >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: 'text.secondary' }}>
                    {isOpen ? <ChevronLeft /> : <ChevronRight />}
                </ListItemIcon>
            </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 