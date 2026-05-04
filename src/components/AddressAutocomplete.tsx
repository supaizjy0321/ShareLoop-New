import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  reverseGeocode,
  searchAddress,
  type GeocodeResult,
} from '@/lib/geocode';

export interface AddressValue {
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  placeholder?: string;
  className?: string;
  /** When true, hides the "Use my current location" shortcut. */
  hideGeolocate?: boolean;
}

const DEBOUNCE_MS = 350;

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search address…',
  className,
  hideGeolocate = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = window.setTimeout(async () => {
      try {
        const found = await searchAddress(trimmed, controller.signal);
        if (!controller.signal.aborted) setResults(found);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setError('Could not load suggestions. Try again.');
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const handleSelect = (result: GeocodeResult) => {
    onChange({
      address: result.display_name,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
    setResults([]);
  };

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available in this browser.');
      return;
    }
    setGeolocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await reverseGeocode(
            coords.latitude,
            coords.longitude,
          );
          if (result) {
            handleSelect(result);
          } else {
            onChange({
              address: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            setOpen(false);
          }
        } catch {
          setError('Could not look up your address.');
        } finally {
          setGeolocating(false);
        }
      },
      err => {
        setGeolocating(false);
        setError(err.message || 'Location permission denied.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  };

  const triggerLabel = useMemo(() => {
    if (!value) return placeholder;
    return value.address;
  }, [value, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-start rounded-xl text-left font-normal h-auto py-2.5',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <MapPin className="mr-2 h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate flex-1">{triggerLabel}</span>
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear address"
              onClick={handleClear}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="ml-2 rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X size={14} strokeWidth={2} />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[280px] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type a street, city, postcode…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!hideGeolocate && (
              <CommandGroup>
                <CommandItem
                  value="__use_current_location"
                  onSelect={handleUseCurrentLocation}
                  className="gap-2"
                >
                  {geolocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" strokeWidth={2} />
                  )}
                  <span>Use my current location</span>
                </CommandItem>
              </CommandGroup>
            )}
            {loading && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}
            {error && !loading && (
              <div className="px-3 py-3 text-sm text-destructive">{error}</div>
            )}
            {!loading && !error && results.length === 0 && query.trim().length >= 3 && (
              <CommandEmpty>No results in Finland for "{query}".</CommandEmpty>
            )}
            {!loading && !error && query.trim().length < 3 && (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Type at least 3 characters.
              </div>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Suggestions">
                {results.map(r => (
                  <CommandItem
                    key={`${r.latitude},${r.longitude},${r.display_name}`}
                    value={r.display_name}
                    onSelect={() => handleSelect(r)}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                    <span className="truncate">{r.display_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
