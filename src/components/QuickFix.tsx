import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, CheckCircle, AlertTriangle } from 'lucide-react';

interface QuickFixProps {
  failedCount: number;
  onFixAll: () => void;
  isFixing?: boolean;
  onShowDetails?: () => void;
}

interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  grade: 'excellent' | 'good' | 'poor' | 'fail';
}

export const QuickFix: React.FC<QuickFixProps> = ({
  failedCount,
  onFixAll,
  isFixing = false,
  onShowDetails
}) => {
  if (failedCount === 0) {
    return (
      <Alert className="bg-success/10 border-success/20">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          All color combinations meet WCAG accessibility standards!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-warning/10 border-warning/20">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-warning">
          {failedCount} color combination{failedCount > 1 ? 's' : ''} need{failedCount === 1 ? 's' : ''} accessibility improvements
        </span>
        <div className="flex gap-2">
          {onShowDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowDetails}
              className="h-7 px-3 text-xs"
            >
              View Details
            </Button>
          )}
          <Button
            size="sm"
            onClick={onFixAll}
            disabled={isFixing}
            className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="h-3 w-3 mr-1" />
            {isFixing ? 'Fixing...' : 'Fix All Issues'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Utility functions for accessibility fixes
export const fixColorContrast = (
  foregroundColor: string,
  backgroundColor: string,
  targetRatio: number = 4.5
): string => {
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const adjustBrightness = (hex: string, factor: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (value: number) => Math.max(0, Math.min(255, value * factor));
    
    return rgbToHex(
      adjust(rgb.r),
      adjust(rgb.g),
      adjust(rgb.b)
    );
  };

  // Try to fix by darkening or lightening the foreground
  let currentRatio = getContrastRatio(foregroundColor, backgroundColor);
  let adjustedColor = foregroundColor;
  
  // If ratio is too low, try making foreground darker or lighter
  if (currentRatio < targetRatio) {
    const bgRgb = hexToRgb(backgroundColor);
    if (!bgRgb) return foregroundColor;
    
    const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    // If background is dark, make foreground lighter
    // If background is light, make foreground darker
    const shouldLighten = bgLuminance < 0.5;
    
    let factor = shouldLighten ? 1.2 : 0.8;
    let attempts = 0;
    
    while (currentRatio < targetRatio && attempts < 10) {
      adjustedColor = adjustBrightness(adjustedColor, factor);
      currentRatio = getContrastRatio(adjustedColor, backgroundColor);
      factor = shouldLighten ? factor * 1.1 : factor * 0.9;
      attempts++;
    }
  }
  
  return adjustedColor;
};

export default QuickFix;