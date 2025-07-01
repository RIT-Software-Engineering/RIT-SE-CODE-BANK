'use client';
import React from "react";
import Link from "next/link";

const NavButton = ({ href, children }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F76902',
    color: 'white',
    borderRadius: '9999px',
    padding: '8px 24px',
    fontWeight: 500,
    minWidth: '100px',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const [hover, setHover] = React.useState(false);

  return (
    <Link
      href={href}
      role="button"
      style={{
        ...baseStyle,
        backgroundColor: hover ? '#d95e00' : '#F76902',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
};

const App = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'black',
        color: 'white',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#333333',
          padding: '16px 24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          zIndex: 50,
        }}
      >
        <NavButton href="/application">Apply</NavButton>
        <NavButton href="/scoopdinator/applications">Scoopdinator</NavButton>
      </nav>

      <div style={{ height: '64px' }} />

      <main
        style={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src="/RIT_rgb_vert_w.png"
          alt="RIT Logo"
          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
        />
      </main>
    </div>
  );
};

export default App;