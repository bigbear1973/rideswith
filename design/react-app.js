import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const customStyles = {
  root: {
    '--bg-color': '#F9F8F6',
    '--text-primary': '#1A1A1A',
    '--text-secondary': '#767676',
    '--text-tertiary': '#999999',
    '--border-color': '#E6E4E0',
    '--accent-green': '#2E2E2E',
    '--font-family': "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    '--font-size-base': '16px',
    '--font-size-lg': '20px',
    '--font-size-xl': '32px',
    '--font-size-sm': '12px',
    '--spacing-unit': '8px',
    '--container-padding': '60px',
    '--list-item-height': '80px'
  }
};

const ridesData = [
  {
    id: 1,
    time: '06:00 AM',
    title: 'Morning Espresso Loop',
    distance: '45km',
    terrain: 'Rolling Hills',
    riders: '12 Riders'
  },
  {
    id: 2,
    time: '06:30 AM',
    title: 'Harbor Bridges Metric',
    distance: '100km',
    terrain: 'Elevation 800m',
    type: 'Drop Ride'
  },
  {
    id: 3,
    time: '07:00 AM',
    title: "Women's Social Spin",
    distance: '30km',
    terrain: 'No Drop',
    type: 'Coffee Stop'
  },
  {
    id: 4,
    time: '05:30 PM',
    title: 'After Work Crit Practice',
    distance: '1 hr',
    terrain: 'High Intensity',
    location: 'Centennial Park'
  },
  {
    id: 5,
    time: 'SAT 8:00',
    title: 'Coastal Epic Gran Fondo',
    distance: '160km',
    terrain: 'Endurance',
    type: '3 Checkpoints'
  }
];

const ArrowIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const DownArrowIcon = () => (
  <svg viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

const Header = () => (
  <header className="px-[60px] py-10 flex justify-between items-center border-b border-transparent">
    <div className="font-bold uppercase tracking-wider text-sm">RidesWith</div>
    <nav className="flex gap-8">
      <Link to="/" className="no-underline text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors hover:text-[var(--text-primary)]">Discover</Link>
      <a href="#" className="no-underline text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors hover:text-[var(--text-primary)]">Communities</a>
      <a href="#" className="no-underline text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors hover:text-[var(--text-primary)]">Create Ride</a>
      <a href="#" className="no-underline text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors hover:text-[var(--text-primary)]">Log In</a>
    </nav>
  </header>
);

const Label = ({ children, className = '' }) => (
  <span className={`text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-6 block ${className}`}>
    {children}
  </span>
);

const ListItem = ({ ride, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="grid grid-cols-[80px_1fr_auto] items-center py-8 border-b border-[var(--border-color)] cursor-pointer transition-all relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        {ride.time}
      </div>
      <div className="pr-6">
        <div className="text-[22px] font-normal uppercase mb-1 text-[var(--text-primary)]">
          {ride.title}
        </div>
        <div className="text-sm text-[var(--text-secondary)] flex gap-3 items-center">
          <span className="after:content-['•'] after:ml-3 after:opacity-40">{ride.distance}</span>
          <span className="after:content-['•'] after:ml-3 after:opacity-40">{ride.terrain}</span>
          <span>{ride.riders || ride.type || ride.location}</span>
        </div>
      </div>
      <div 
        className={`w-11 h-11 border border-[var(--text-primary)] rounded-full flex justify-center items-center transition-all ${
          isHovered ? 'bg-[var(--text-primary)]' : ''
        }`}
      >
        <ArrowIcon 
          className={`w-4 h-4 fill-none stroke-[1.5] transition-all ${
            isHovered ? 'stroke-white' : 'stroke-[var(--text-primary)]'
          }`}
        />
      </div>
    </div>
  );
};

const StatRow = ({ value, label }) => (
  <div className="flex justify-between items-baseline border-b border-[var(--border-color)] py-4">
    <span className="text-[32px] font-normal tracking-tight">{value}</span>
    <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</span>
  </div>
);

const FilterItem = ({ children, active, onClick }) => (
  <div 
    className={`text-xs font-semibold uppercase cursor-pointer pb-1 border-b-2 transition-all ${
      active 
        ? 'text-[var(--text-primary)] border-[var(--text-primary)]' 
        : 'text-[var(--text-tertiary)] border-transparent'
    }`}
    onClick={onClick}
  >
    {children}
  </div>
);

const HomePage = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Rides' },
    { id: 'near', label: 'Near Me' },
    { id: 'week', label: 'This Week' },
    { id: 'club', label: 'Club Rides' }
  ];

  const handleRideClick = (rideId) => {
    console.log('Ride clicked:', rideId);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-[60px] py-[60px] grid grid-cols-[1.2fr_0.8fr] gap-[120px]">
      <main>
        <Label>Ride Discovery</Label>
        <h1 className="text-5xl font-normal uppercase tracking-tight mb-10 leading-tight">
          Find your ride.<br />Find your people.
        </h1>

        <div className="flex gap-6 mb-8">
          {filters.map(filter => (
            <FilterItem
              key={filter.id}
              active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </FilterItem>
          ))}
        </div>

        <div className="w-full border-t border-[var(--border-color)]">
          {ridesData.map(ride => (
            <ListItem 
              key={ride.id} 
              ride={ride} 
              onClick={() => handleRideClick(ride.id)}
            />
          ))}
        </div>
      </main>

      <aside className="sticky top-10">
        <Label>Our Purpose</Label>
        
        <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed mb-6 max-w-[420px]">
          We connect and power a global cycling community that benefits everyone, everywhere by making group rides accessible, safe, and social.
        </p>
        <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed mb-6 max-w-[420px]">
          From local coffee spins to competitive gran fondos, our platform helps individuals and clubs realize their greatest potential on two wheels.
        </p>

        <a href="#" className="inline-flex items-center gap-3 mt-8 no-underline text-[var(--text-primary)] text-[13px] font-bold uppercase border-b border-[var(--text-primary)] pb-1">
          <div className="w-5 h-5 border border-[var(--text-primary)] rounded-full flex items-center justify-center">
            <DownArrowIcon />
          </div>
          View Community Manifesto
        </a>

        <div className="mt-[60px]">
          <Label>Platform Stats</Label>
          
          <StatRow value="500+" label="Active Rides" />
          <StatRow value="2,000+" label="Cyclists" />
          <StatRow value="10k+" label="Kilometers" />
          <StatRow value="100+" label="Local Clubs" />
        </div>
      </aside>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }

      body {
        background-color: #F9F8F6;
        color: #1A1A1A;
        font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
        line-height: 1.5;
        min-height: 100vh;
      }

      @media (max-width: 1024px) {
        .grid-cols-\\[1\\.2fr_0\\.8fr\\] {
          grid-template-columns: 1fr;
          gap: 60px;
          padding: 40px 24px;
        }
        aside {
          position: static;
          margin-bottom: 60px;
          order: -1;
        }
        h1 {
          font-size: 36px;
        }
      }

      @media (max-width: 768px) {
        .grid-cols-\\[80px_1fr_auto\\] {
          grid-template-columns: 1fr auto;
          gap: 12px;
          padding: 24px 0;
        }
        .grid-cols-\\[80px_1fr_auto\\] > div:first-child {
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }
        .grid-cols-\\[80px_1fr_auto\\] > div:nth-child(2) {
          grid-column: 1;
        }
        .grid-cols-\\[80px_1fr_auto\\] > div:last-child {
          grid-column: 2;
          grid-row: 2;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <div style={customStyles.root}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;