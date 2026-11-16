import React, { useState } from 'react';
import { CalendarDays, Camera, Layers, MapPin, Sparkles, Truck, Utensils, Volume2 } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}

function getCategoryIcon(category?: string) {
  switch (category) {
    case 'catering':
      return Utensils;
    case 'decoration':
      return Layers;
    case 'sound/lighting':
      return Volume2;
    case 'venue':
      return MapPin;
    case 'photography':
      return Camera;
    case 'transport':
      return Truck;
    case 'makeup':
      return Sparkles;
    default:
      return CalendarDays;
  }
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-48 object-cover',
}) => {
  const [failed, setFailed] = useState(false);
  const Icon = getCategoryIcon(category);

  if (!src || failed) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/60 to-slate-200 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-900 text-slate-500 dark:text-slate-400 p-4 text-center`}
        role="img"
        aria-label={alt}
      >
        <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-2" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
