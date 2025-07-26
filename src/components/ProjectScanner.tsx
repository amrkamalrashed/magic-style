import React, { useState, useCallback, useEffect } from 'react';
import { Scan, Zap, Palette, Eye, RefreshCw, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ColorToken } from './MagicStyles';

interface ProjectScannerProps {
  onStylesScanned: (tokens: ColorToken[]) => void;
  isFramerReady: boolean;
}

interface FramerStyle {
  id: string;
  name: string;
  light?: string;
  dark?: string;
  path?: string;
}

interface ScanResult {
  colorStyles: FramerStyle[];
  textStyles: FramerStyle[];
  folders: string[];
  issues: string[];
}

const mockFramer = {
  getColorStyles: () => Promise.resolve([
    { id: '1', name: 'Primary', light: '#6366f1', dark: '#818cf8', path: '/Brand/Primary' },
    { id: '2', name: 'Secondary', light: '#8b5cf6', dark: '#a78bfa', path: '/Brand/Secondary' },
    { id: '3', name: 'Text', light: '#1f2937', dark: '#f9fafb', path: '/Text/Body' },
    { id: '4', name: 'Background', light: '#ffffff', dark: '#111827', path: '/Background/Base' }
  ]),
  getTextStyles: () => Promise.resolve([])
};

export const ProjectScanner: React.FC<ProjectScannerProps> = ({ 
  onStylesScanned, 
  isFramerReady 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<Set<string>>(new Set());

  const categorizeStyle = (styleName: string, path: string = ''): string => {
    const fullName = `${path}/${styleName}`.toLowerCase();
    
    if (fullName.includes('brand') || fullName.includes('primary') || fullName.includes('secondary')) return 'Brand';
    if (fullName.includes('text') || fullName.includes('foreground')) return 'Text';
    if (fullName.includes('background') || fullName.includes('surface') || fullName.includes('bg')) return 'Background';
    if (fullName.includes('neutral') || fullName.includes('gray') || fullName.includes('grey')) return 'Neutral';
    if (fullName.includes('semantic') || fullName.includes('success') || fullName.includes('error') || fullName.includes('warning')) return 'Semantic';
    if (fullName.includes('border') || fullName.includes('divider')) return 'Border';
    
    return 'Other';
  };

  const scanProject = useCallback(async () => {
    setIsScanning(true);
    
    try {
      const isFramerEnvironment = typeof window !== 'undefined' && (window as any).framer;
      const framerAPI = isFramerEnvironment ? (window as any).framer : mockFramer;
      
      const [colorStyles, textStyles] = await Promise.all([
        framerAPI.getColorStyles(),
        framerAPI.getTextStyles()
      ]);

      // Extract unique folders
      const folders = Array.from(new Set([
        ...colorStyles.map((s: FramerStyle) => s.path?.split('/')[1]).filter(Boolean),
        ...textStyles.map((s: FramerStyle) => s.path?.split('/')[1]).filter(Boolean)
      ]));

      // Identify issues
      const issues: string[] = [];
      
      // Check for missing hover/pressed states
      const brandColors = colorStyles.filter((s: FramerStyle) => 
        categorizeStyle(s.name, s.path) === 'Brand'
      );
      
      brandColors.forEach((color: FramerStyle) => {
        const hasHover = colorStyles.some((s: FramerStyle) => 
          s.name.toLowerCase().includes(color.name.toLowerCase()) && 
          s.name.toLowerCase().includes('hover')
        );
        const hasPressed = colorStyles.some((s: FramerStyle) => 
          s.name.toLowerCase().includes(color.name.toLowerCase()) && 
          (s.name.toLowerCase().includes('pressed') || s.name.toLowerCase().includes('active'))
        );
        
        if (!hasHover) issues.push(`Missing hover state for ${color.name}`);
        if (!hasPressed) issues.push(`Missing pressed state for ${color.name}`);
      });

      // Check for dark mode variants
      const hasConsistentDarkMode = colorStyles.every((s: FramerStyle) => s.dark && s.dark !== s.light);
      if (!hasConsistentDarkMode) {
        issues.push('Some styles are missing dark mode variants');
      }

      setScanResult({
        colorStyles,
        textStyles,
        folders,
        issues
      });

    } catch (error) {
      console.error('Failed to scan project:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isFramerReady]);

  const handleEnhancementToggle = (enhancement: string) => {
    const newSelected = new Set(selectedEnhancements);
    if (newSelected.has(enhancement)) {
      newSelected.delete(enhancement);
    } else {
      newSelected.add(enhancement);
    }
    setSelectedEnhancements(newSelected);
  };

  const applyEnhancements = () => {
    if (!scanResult) return;

    let enhancedTokens: ColorToken[] = scanResult.colorStyles.map(style => ({
      name: style.name,
      light: style.light || '#ffffff',
      dark: style.dark || style.light || '#ffffff',
      category: categorizeStyle(style.name, style.path)
    }));

    // Apply selected enhancements
    if (selectedEnhancements.has('accessibility')) {
      // Apply accessibility fixes (simplified for demo)
      enhancedTokens = enhancedTokens.map(token => ({
        ...token,
        // Ensure minimum contrast ratios
        light: token.category === 'Text' ? '#1f2937' : token.light,
        dark: token.category === 'Text' ? '#f9fafb' : token.dark
      }));
    }

    if (selectedEnhancements.has('darkMode')) {
      // Generate proper dark mode variants
      enhancedTokens = enhancedTokens.map(token => ({
        ...token,
        dark: token.category === 'Background' 
          ? (token.name.toLowerCase().includes('base') ? '#111827' : '#1f2937')
          : token.dark
      }));
    }

    if (selectedEnhancements.has('states')) {
      // Generate hover and pressed states for brand colors
      const brandTokens = enhancedTokens.filter(t => t.category === 'Brand');
      const stateTokens: ColorToken[] = [];

      brandTokens.forEach(token => {
        // Generate hover state (lighter)
        stateTokens.push({
          name: `${token.name} Hover`,
          light: adjustBrightness(token.light, 10),
          dark: adjustBrightness(token.dark, 10),
          category: 'Brand'
        });

        // Generate pressed state (darker)
        stateTokens.push({
          name: `${token.name} Pressed`,
          light: adjustBrightness(token.light, -10),
          dark: adjustBrightness(token.dark, -10),
          category: 'Brand'
        });
      });

      enhancedTokens = [...enhancedTokens, ...stateTokens];
    }

    onStylesScanned(enhancedTokens);
  };

  // Helper function to adjust brightness
  const adjustBrightness = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  useEffect(() => {
    if (isFramerReady) {
      scanProject();
    }
  }, [isFramerReady, scanProject]);

  if (!scanResult && !isScanning) {
    return (
      <div className="text-center py-12">
        <Card className="p-8 max-w-md mx-auto bg-surface-elevated">
          <Scan className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Scan</h3>
          <p className="text-text-muted mb-6">
            Scan your Framer project to discover existing styles and get enhancement suggestions.
          </p>
          <Button onClick={scanProject} className="gap-2" disabled={!isFramerReady}>
            <Scan className="w-4 h-4" />
            Scan Project
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Scanner</h2>
          <p className="text-text-muted">
            Review your existing styles and apply enhancements
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={scanProject} 
          disabled={isScanning}
          className="gap-2"
        >
          {isScanning ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isScanning ? 'Scanning...' : 'Rescan'}
        </Button>
      </div>

      {scanResult && (
        <>
          {/* Scan Results Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-surface-elevated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Color Styles</p>
                  <p className="text-2xl font-bold text-foreground">{scanResult.colorStyles.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-surface-elevated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Text Styles</p>
                  <p className="text-2xl font-bold text-foreground">{scanResult.textStyles.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-surface-elevated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Issues Found</p>
                  <p className="text-2xl font-bold text-foreground">{scanResult.issues.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhancement Options */}
          <Card className="p-6 bg-surface-elevated">
            <h3 className="text-lg font-semibold text-foreground mb-4">Available Enhancements</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accessibility"
                  checked={selectedEnhancements.has('accessibility')}
                  onChange={() => handleEnhancementToggle('accessibility')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="accessibility" className="font-medium text-foreground cursor-pointer">
                    Make Colors Accessible
                  </label>
                  <p className="text-sm text-text-muted">
                    Adjust colors to meet WCAG AA contrast standards
                  </p>
                </div>
                <Badge variant="outline">Recommended</Badge>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={selectedEnhancements.has('darkMode')}
                  onChange={() => handleEnhancementToggle('darkMode')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="darkMode" className="font-medium text-foreground cursor-pointer">
                    Generate Dark Mode
                  </label>
                  <p className="text-sm text-text-muted">
                    Create proper dark mode variants following design standards
                  </p>
                </div>
                {scanResult.issues.some(issue => issue.includes('dark mode')) && (
                  <Badge variant="destructive">Needed</Badge>
                )}
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="states"
                  checked={selectedEnhancements.has('states')}
                  onChange={() => handleEnhancementToggle('states')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="states" className="font-medium text-foreground cursor-pointer">
                    Generate Hover & Pressed States
                  </label>
                  <p className="text-sm text-text-muted">
                    Add interaction states for brand colors with proper shades
                  </p>
                </div>
                {scanResult.issues.some(issue => issue.includes('hover') || issue.includes('pressed')) && (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-text-muted">
                {selectedEnhancements.size} enhancement{selectedEnhancements.size !== 1 ? 's' : ''} selected
              </p>
              <Button 
                onClick={applyEnhancements}
                disabled={selectedEnhancements.size === 0}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Apply & Continue
              </Button>
            </div>
          </Card>

          {/* Issues List */}
          {scanResult.issues.length > 0 && (
            <Card className="p-6 bg-surface-elevated border-warning/20">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Issues Detected
              </h3>
              <ul className="space-y-2">
                {scanResult.issues.map((issue, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-warning/60" />
                    {issue}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
};