'use client';

import { useState } from 'react';
import { Search, Filter, MapPin, Calendar, Clock, Users, ChevronDown, X } from 'lucide-react';

const PACE_OPTIONS = [
  { value: 'casual', label: 'Casual', description: '< 20 km/h', color: 'pace-casual' },
  { value: 'moderate', label: 'Moderate', description: '20-28 km/h', color: 'pace-moderate' },
  { value: 'fast', label: 'Fast', description: '28-35 km/h', color: 'pace-fast' },
  { value: 'race', label: 'Race', description: '> 35 km/h', color: 'pace-race' },
];

const DISTANCE_OPTIONS = [
  { value: 'short', label: 'Short', description: '< 30 km' },
  { value: 'medium', label: 'Medium', description: '30-60 km' },
  { value: 'long', label: 'Long', description: '60-100 km' },
  { value: 'epic', label: 'Epic', description: '> 100 km' },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaces, setSelectedPaces] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const togglePace = (pace: string) => {
    setSelectedPaces(prev =>
      prev.includes(pace) ? prev.filter(p => p !== pace) : [...prev, pace]
    );
  };

  const toggleDistance = (distance: string) => {
    setSelectedDistances(prev =>
      prev.includes(distance) ? prev.filter(d => d !== distance) : [...prev, distance]
    );
  };

  const clearFilters = () => {
    setSelectedPaces([]);
    setSelectedDistances([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedPaces.length > 0 || selectedDistances.length > 0 || searchQuery;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Discover Rides</h1>
          <p className="text-muted-foreground">
            Find group rides near you with smart filters for pace, distance, and terrain
          </p>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="border-b border-border bg-card/50 px-4 py-4 sticky top-16 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="search-rides" className="sr-only">
              Search by location or ride name
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <input
              id="search-rides"
              type="search"
              placeholder="Search by location or ride name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-muted rounded-lg text-foreground"
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <Filter className="w-5 h-5" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {selectedPaces.length + selectedDistances.length}
              </span>
            )}
          </button>

          {/* Desktop Filter Pills */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Pace Filter Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                aria-haspopup="listbox"
              >
                Pace
                {selectedPaces.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {selectedPaces.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2" role="listbox" aria-label="Pace options">
                  {PACE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => togglePace(option.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        selectedPaces.includes(option.value)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                      role="option"
                      aria-selected={selectedPaces.includes(option.value)}
                    >
                      <span className={`w-3 h-3 rounded-full ${option.color}`} aria-hidden="true" />
                      <span className="flex-1">
                        <span className="block font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Distance Filter Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                aria-haspopup="listbox"
              >
                Distance
                {selectedDistances.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {selectedDistances.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2" role="listbox" aria-label="Distance options">
                  {DISTANCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleDistance(option.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        selectedDistances.includes(option.value)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                      role="option"
                      aria-selected={selectedDistances.includes(option.value)}
                    >
                      <span className="flex-1">
                        <span className="block font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear all filters"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div
          id="filter-panel"
          className="sm:hidden border-b border-border bg-card px-4 py-4"
          role="region"
          aria-label="Filter options"
        >
          <div className="space-y-4">
            {/* Pace */}
            <fieldset>
              <legend className="font-medium mb-2 text-foreground">Pace</legend>
              <div className="flex flex-wrap gap-2">
                {PACE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => togglePace(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedPaces.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                    aria-pressed={selectedPaces.includes(option.value)}
                  >
                    <span className={`w-2 h-2 rounded-full ${option.color}`} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Distance */}
            <fieldset>
              <legend className="font-medium mb-2 text-foreground">Distance</legend>
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleDistance(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedDistances.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                    aria-pressed={selectedDistances.includes(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="lg:flex-1 h-64 lg:h-auto bg-muted/30 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-border">
          <div className="text-center p-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <p className="text-muted-foreground">Interactive map loading...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your MAPBOX_TOKEN to enable the map
            </p>
          </div>
        </div>

        {/* Ride List */}
        <div className="lg:w-96 xl:w-[28rem] flex flex-col">
          <div className="p-4 border-b border-border bg-card">
            <h2 className="font-semibold text-foreground">Upcoming Rides</h2>
            <p className="text-sm text-muted-foreground">0 rides found</p>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {/* Empty State */}
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="font-medium text-foreground mb-2">No rides found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search in a different area
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Example Ride Card (placeholder) */}
            <div className="hidden space-y-4">
              <article className="bg-card border border-border rounded-xl p-4 card-hover">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">Sunday Morning Social</h3>
                    <p className="text-sm text-muted-foreground">Cycling Club Name</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        Sun, Jan 26
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        8:00 AM
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full pace-moderate" aria-hidden="true" />
                        Moderate
                      </span>
                      <span className="text-xs text-muted-foreground">45 km</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" aria-hidden="true" />
                        12 joined
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
