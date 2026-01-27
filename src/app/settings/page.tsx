'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUnits, Language } from '@/components/providers/units-provider';
import { Globe, Thermometer, Ruler, Clock, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pt', label: 'Português' },
];

const COMMON_TIMEZONES = [
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const {
    unitSystem,
    setUnitSystem,
    language,
    setLanguage,
    timezone,
    setTimezone,
    temperatureUnit,
    setTemperatureUnit,
    formatDistance,
    formatSpeed,
    formatElevation,
    formatTemperature,
  } = useUnits();

  // Redirect if not logged in
  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Customize your RidesWith experience
          </p>
        </div>

        {/* Units & Measurements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Units & Measurements
            </CardTitle>
            <CardDescription>
              Choose how distances, speeds, and elevations are displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Unit System</Label>
              <RadioGroup
                value={unitSystem}
                onValueChange={(value) => setUnitSystem(value as 'metric' | 'imperial')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metric" id="metric" />
                  <Label htmlFor="metric" className="font-normal cursor-pointer">
                    Metric (km, m, °C)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imperial" id="imperial" />
                  <Label htmlFor="imperial" className="font-normal cursor-pointer">
                    Imperial (mi, ft, °F)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Distance:</span>{' '}
                  <span className="font-medium">{formatDistance(45)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Speed:</span>{' '}
                  <span className="font-medium">{formatSpeed(25)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Elevation:</span>{' '}
                  <span className="font-medium">{formatElevation(320)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Temperature:</span>{' '}
                  <span className="font-medium">{formatTemperature(18)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Temperature
            </CardTitle>
            <CardDescription>
              Override temperature display independently of unit system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={temperatureUnit}
              onValueChange={(value) => setTemperatureUnit(value as 'celsius' | 'fahrenheit')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="celsius" id="celsius" />
                <Label htmlFor="celsius" className="font-normal cursor-pointer">
                  Celsius (°C)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fahrenheit" id="fahrenheit" />
                <Label htmlFor="fahrenheit" className="font-normal cursor-pointer">
                  Fahrenheit (°F)
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>
              Select your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timezone
            </CardTitle>
            <CardDescription>
              All ride times will be shown in this timezone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Ride Snippets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ride Snippets
            </CardTitle>
            <CardDescription>
              Create reusable text blocks for ride descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/snippets"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm">Manage your ride description snippets</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Settings are saved automatically to your browser
        </p>
      </div>
    </div>
  );
}
