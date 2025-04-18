import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const MainSection = styled('section')({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: 'var(--bg-primary)',
});

const WaveBackground = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 0,
});

const Navbar = styled('nav')({
  position: 'relative',
  zIndex: 1,
  padding: '1rem 0',
});

const NavContent = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const NavButtons = styled('div')({
  display: 'flex',
  gap: 'var(--spacing-unit)',
});

const MainContent = styled('main')({
  position: 'relative',
  zIndex: 1,
  marginTop: '4rem',
});

const ButtonGroup = styled('div')({
  display: 'flex',
  gap: 'var(--spacing-unit)',
  marginTop: '2rem',
});

const ImageContainer = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& img': {
    maxWidth: '90%',
    height: 'auto',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
});

const ContentContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  padding: '2rem 0',
});

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <MainSection>
      <WaveBackground>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--secondary-color)" />
              <stop offset="100%" stopColor="var(--primary-color)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            fillOpacity="0.2"
            d="M0,128L48,122.7C96,117,192,107,288,122.7C384,139,480,181,576,170.7C672,160,768,96,864,80C960,64,1056,96,1152,106.7C1248,117,1344,107,1392,101.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </WaveBackground>

      <Navbar>
        <Container maxWidth="lg">
          <NavContent>
            <Typography
              variant="h5"
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { color: 'var(--primary-color)' }
              }}
              onClick={() => navigate('/')}
            >
              1SPOC
            </Typography>
            <NavButtons>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: 'var(--border-radius)',
                  '&:hover': {
                    borderColor: 'var(--primary-hover)',
                    backgroundColor: 'var(--primary-light)',
                  }
                }}
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'var(--primary-color)',
                  color: 'var(--primary-text)',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: 'var(--border-radius)',
                  '&:hover': {
                    bgcolor: 'var(--primary-hover)',
                  }
                }}
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </NavButtons>
          </NavContent>
        </Container>
      </Navbar>

      <MainContent>
        <Container maxWidth="lg">
          <Grid
            container
            spacing={8}
            alignItems="center"
            justifyContent="space-between"
            sx={{ minHeight: 'calc(100vh - 200px)', flexWrap: 'nowrap', marginRight: '244px' }}
          >
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <ContentContainer>
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    mb: 3,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Why do we use it?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'var(--text-secondary)',
                    mb: 4,
                    fontSize: '1.125rem',
                    lineHeight: 1.7,
                  }}
                >
                  A web-based platform that enables users to invite and manage users from other organizations. Invited users can create and manage databases through an intuitive UI, facilitating seamless collaboration and data management across organizations.
                </Typography>
                <ButtonGroup>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: 'var(--primary-color)',
                      color: 'var(--primary-text)',
                      textTransform: 'none',
                      px: 6,
                      py: 1.5,
                      fontSize: '1.125rem',
                      borderRadius: 'var(--border-radius)',
                      '&:hover': {
                        bgcolor: 'var(--primary-hover)',
                      },
                    }}
                    onClick={() => navigate('/login')}
                  >
                    Get Started
                  </Button>
                </ButtonGroup>
              </ContentContainer>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ImageContainer>
                <img
                  src="/assets/images/1.png"
                  alt="Landing page illustration"
                  style={{ maxWidth: '160%', height: 'auto', animation: 'float 6s ease-in-out infinite' }}
                />
              </ImageContainer>
            </Grid>
          </Grid>
        </Container>
      </MainContent>
    </MainSection>
  );
};

export default LandingPage;