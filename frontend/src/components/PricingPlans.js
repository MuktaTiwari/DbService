import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    Divider,
    Chip,
    Avatar,
    AppBar,
    Toolbar,
    IconButton,
    Drawer,
    useMediaQuery,
    useTheme,
    Grow,
    Zoom,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    ListItemText
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowBack as ArrowBackIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
    Store as StoreIcon,
    Person as PersonIcon,
    CheckCircle,
    Bolt,
    Diamond,
    Star,
    WorkspacePremium,
    Logout as LogoutIcon
} from '@mui/icons-material';
import axios from "axios";

import DashboardIcon from '@mui/icons-material/Dashboard';
import axiosInstance from '../utils/axiosInstance';


const drawerWidth = 240;

const PricingPlans = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const { dbName } = location.state || {};
    const [selectedPlan, setSelectedPlan] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [animate, setAnimate] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axiosInstance.get('/api/superadmin/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data?.email) {
                    setCurrentUser({
                        email: response.data.email,
                        id: response.data.id,
                        name: response.data.name,
                    });
                } else {
                    console.error('Email missing in response:', response.data);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };

        fetchCurrentUser();
    }, [navigate]);

    useEffect(() => {
        setAnimate(true);
    }, []);

    const plans = [
        {
            title: 'Free',
            price: '$0',
            period: '',
            features: ['3 Databases',
                '3 Tables per Database',
                '5 GB Storage per Table',
                'Analytics',
                'API Access',
                '1 User',
                'Basic Support'
            ],
            cta: 'Current Plan',
            recommended: false,
            icon: <Star fontSize="large" />,
            color: '#1E88E5',
            ribbon: 'Current Plan',
            buttonText: 'Free'
        },
        {
            title: 'Pro',
            price: '$10',
            period: 'per month',
            features: [
                '10 Databases',
                '10 Tables per Database',
                '10 GB Storage per Table',
                'Analytics',
                'API Access',
                '5 Users',
                'Priority Support',
            ],
            cta: 'Contact Sales',
            recommended: true,
            icon: <Bolt fontSize="large" />,
            color: '#4CAF50',
            buttonText: 'Contact Sales'
        },
        {
            title: 'Enterprise',
            price: '$40',
            period: 'per month',
            features: [
                '20 Databases',
                '20 Tables per Database',
                '50 GB Storage per Table',
                'Analytics',
                'API Access',
                '5 Users',
                'Priority Support',
            ],
            cta: 'Contact Sales',
            recommended: false,
            icon: <Diamond fontSize="large" />,
            color: theme.palette.secondary.main,
            buttonText: 'Contact Sales'
        }
    ];

    const featuresComparison = [
        { feature: 'Tables per Database', starter: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
        { feature: 'Support', starter: 'Basic', pro: 'Priority', enterprise: '24/7 Premium' },
        { feature: 'Storage', starter: '5GB', pro: '50GB', enterprise: '1TB+' },
        { feature: 'Team Members', starter: '1', pro: '5', enterprise: 'Unlimited' },
        { feature: 'Advanced Analytics', starter: '✖', pro: '✔', enterprise: '✔' },
        { feature: 'API Access', starter: '✖', pro: '✔', enterprise: '✔' },
        { feature: 'Custom SLAs', starter: '✖', pro: '✖', enterprise: '✔' }
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        navigate("/login");
    };

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6">1SPOC DAAS</Typography>
            </Toolbar>
            <Divider />
            <List>
                <ListItem
                    button
                    onClick={() => navigate("/pricing")}
                    selected={location.pathname === "/pricing"}
                    style={{
                        color:
                            location.pathname === "/pricing"
                                ? "var(--primary-color)"
                                : "var(--text-primary)",
                        backgroundColor:
                            location.pathname === "/pricing"
                                ? "var(--primary-light)"
                                : "transparent",
                        cursor: "pointer"
                    }}
                >
                    <ListItemIcon>
                        <StoreIcon
                            style={{
                                color:
                                    location.pathname === "/pricing"
                                        ? "var(--primary-color)"
                                        : "var(--text-secondary)",
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText primary="Pricing Plans" />
                </ListItem>

                <ListItem button onClick={() => navigate("/databases")}>
                    <ListItemIcon>
                        <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary="Databases" />
                </ListItem>

                 <ListItem
                          button
                          onClick={() => navigate(`/database/${dbName}`)}
                          selected={location.pathname === `/database/${dbName}`}
                          style={{
                            color:
                              location.pathname === `/database/${dbName}`
                                ? "var(--primary-color)"
                                : "var(--text-primary)",
                            backgroundColor:
                              location.pathname === `/database/${dbName}`
                                ? "var(--primary-light)"
                                : "transparent",
                
                            cursor: "pointer"
                          }}
                        >
                          <ListItemIcon>
                            <DashboardIcon
                              style={{
                                color:
                                  location.pathname === `/database/${dbName}`
                                    ? "var(--primary-color)"
                                    : "var(--text-secondary)",
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText primary="Database Details" />
                        </ListItem>


            </List>
        </div>
    );

    const handleCardClick = (index) => {
        setSelectedPlan(index);
        const cards = document.querySelectorAll('.pricing-card');
        cards.forEach((card, idx) => {
            if (idx === index) {
                card.classList.add('card-pulse');
                setTimeout(() => card.classList.remove('card-pulse'), 1000);
            }
        });
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'var(--primary-color)',
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Pricing Plans
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ color: "var(--primary-text)", mr: 2 }}
                    >
                        {currentUser?.email || "Loading..."}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        sx={{
                            color: "var(--primary-text)",
                            borderColor: "var(--primary-text)",
                            borderRadius: "20%", // Circular shape for icon button
                            minWidth: 40, // Fixed width for circular button
                            width: 40, // Fixed width for circular button
                            height: 40, // Fixed height for circular button
                            p: 0, // Remove padding
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                borderColor: "var(--primary-text)",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                transform: "scale(1.05)", // Slight scale effect on hover
                            },
                            transition: "all 0.3s ease",
                        }}
                    >
                        <LogoutIcon fontSize="small" /> {/* Adjusted icon size */}
                    </Button>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' }
                    },
                    '@keyframes cardGlow': {
                        '0%': { boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
                        '50%': { boxShadow: '0 5px 25px rgba(104, 109, 224, 0.5)' },
                        '100%': { boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }
                    },
                    '.card-pulse': {
                        animation: 'pulse 0.5s ease-in-out'
                    },
                    '.card-glow': {
                        animation: 'cardGlow 2s infinite'
                    }
                }}
            >
                <Toolbar />
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => dbName ? navigate(`/database/${dbName}`) : navigate('/databases')}
                    sx={{ mb: 4, color: 'text.primary' }}
                >
                    Back to Databases
                </Button>

                <Container maxWidth="xl">
                    <Box textAlign="center" mb={8}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Power Up Your Database
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Choose the plan that suits your needs
                        </Typography>
                    </Box>

                    <Grid container spacing={5} justifyContent="center" alignItems="stretch" sx={{ mb: 8 }}>
                        {plans.map((plan, index) => (
                            <Grid item xs={12} md={6} lg={4} key={plan.title} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Grow
                                    in={animate}
                                    timeout={(index + 1) * 400}
                                    style={{ transformOrigin: '50% 10% 0' }}
                                >
                                    <Card
                                        className={`pricing-card ${index === 1 ? 'card-glow' : ''}`}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            width: '100%',
                                            minWidth: { xs: '320px', sm: '400px', md: '420px' },
                                            maxWidth: { xs: '100%', md: '450px' },
                                            height: '100%',
                                            position: 'relative',
                                            overflow: 'visible',
                                            border: `2px solid ${selectedPlan === index ? plan.color : theme.palette.divider}`,
                                            boxShadow: selectedPlan === index
                                                ? `0 0 20px ${plan.color}80`
                                                : theme.shadows[4],
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            cursor: 'pointer',
                                            borderRadius: '16px',
                                            background: selectedPlan === index
                                                ? `linear-gradient(145deg, ${plan.color}10 0%, ${theme.palette.background.paper} 100%)`
                                                : 'inherit',
                                            '&:hover': {
                                                transform: 'translateY(-8px) scale(1.02)',
                                                boxShadow: `0 20px 30px -10px ${plan.color}33`,
                                                border: `2px solid ${plan.color}`
                                            },
                                            '&:active': {
                                                transform: 'translateY(-2px) scale(0.98)'
                                            }
                                        }}
                                        onClick={() => handleCardClick(index)}
                                    >
                                        {plan.ribbon && (
                                            <Zoom in={animate} timeout={1200}>
                                                <Chip
                                                    icon={<WorkspacePremium />}
                                                    label={plan.ribbon}
                                                    color="primary"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: -16,
                                                        right: 20,
                                                        zIndex: 1,
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem',
                                                        height: 32,
                                                        borderRadius: 16,
                                                        bgcolor: plan.color,
                                                        color: 'white',
                                                        boxShadow: `0 4px 10px ${plan.color}40`
                                                    }}
                                                />
                                            </Zoom>
                                        )}

                                        <CardContent sx={{
                                            p: 4,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: '-50%',
                                                left: '-50%',
                                                width: '200%',
                                                height: '200%',
                                                background: `radial-gradient(circle, ${plan.color}33 0%, transparent 70%)`,
                                                transform: 'rotate(45deg)',
                                                transition: 'all 0.5s'
                                            },
                                            '&:hover:before': {
                                                transform: 'rotate(135deg)'
                                            }
                                        }}>
                                            <Box textAlign="center" mb={4}>
                                                <Avatar sx={{
                                                    bgcolor: `${plan.color}22`,
                                                    color: plan.color,
                                                    width: 80,
                                                    height: 80,
                                                    mb: 2,
                                                    mx: 'auto',
                                                    transition: 'all 0.5s',
                                                    boxShadow: selectedPlan === index ? `0 0 15px ${plan.color}80` : 'none',
                                                    '&:hover': {
                                                        transform: 'rotate(15deg) scale(1.1)',
                                                    }
                                                }}>
                                                    {plan.icon}
                                                </Avatar>
                                                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: plan.color }}>
                                                    {plan.title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                                                    <Typography variant="h3" fontWeight={800} sx={{ mr: 1 }}>
                                                        {plan.price}
                                                    </Typography>
                                                    <Typography variant="subtitle1" color="text.secondary">
                                                        {plan.period}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <List dense sx={{ mb: 3, flexGrow: 1 }}>
                                                {plan.features.map((feature) => (
                                                    <ListItem
                                                        key={feature}
                                                        sx={{
                                                            px: 0,
                                                            py: 1,
                                                            borderRadius: '8px',
                                                            transition: 'all 0.3s',
                                                            '&:hover': {
                                                                transform: 'translateX(8px)',
                                                                bgcolor: `${plan.color}10`
                                                            }
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <CheckCircle sx={{ color: plan.color }} />
                                                        </ListItemIcon>
                                                        <Typography variant="body1">
                                                            {feature}
                                                        </Typography>
                                                    </ListItem>
                                                ))}
                                            </List>

                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="large"
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 3,
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    mt: 'auto',
                                                    transition: 'all 0.3s',
                                                    color: plan.color,
                                                    borderColor: plan.color,
                                                    backgroundColor: selectedPlan === index ? `${plan.color}20` : 'transparent',
                                                    '&:after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: '-50%',
                                                        left: '-50%',
                                                        width: '200%',
                                                        height: '200%',
                                                        background: `linear-gradient(45deg, transparent, ${plan.color}44, transparent)`,
                                                        transform: 'rotate(45deg)',
                                                        transition: 'all 0.5s'
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: `${plan.color}30`,
                                                        boxShadow: `0 4px 12px ${plan.color}33`
                                                    },
                                                    '&:hover:after': {
                                                        left: '150%'
                                                    }
                                                }}
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>

                    <Divider sx={{ my: 8, borderColor: 'divider' }} />
                </Container>
            </Box>
        </Box>
    );
};

export default PricingPlans;