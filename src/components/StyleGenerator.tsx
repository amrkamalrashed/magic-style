import React, { useState, useCallback, useMemo } from 'react';
import { Sparkles, Palette, Type, ChevronRight, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ColorToken, TextStyle } from './MagicStyles';

interface StyleGeneratorProps {
  onStylesGenerated: (tokens: ColorToken[]) => void;
  onTextStylesGenerated?: (textStyles: TextStyle[]) => void;
}

interface ColorInput {
  primary: string;
  secondary: string;
  tertiary: string;
}

interface TextStyleInput {
  fontFamily: string;
  baseFontSize: number; // in px
}

type GenerationType = 'colors' | 'text' | 'complete';

const defaultColors: ColorInput = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  tertiary: '#f59e0b'
};

const defaultTextStyleInput: TextStyleInput = {
  fontFamily: 'Inter',
  baseFontSize: 16
};

// Function to get fonts from Framer API
const getFramerFonts = async (): Promise<string[]> => {
  try {
    const isFramerEnvironment = typeof window !== 'undefined' && (window as any).framer;
    if (isFramerEnvironment && (window as any).framer.getAvailableFonts) {
      const framerFonts = await (window as any).framer.getAvailableFonts();
      return framerFonts.map((font: any) => font.family || font.name || font);
    }
  } catch (error) {
    console.warn('Could not fetch Framer fonts:', error);
  }
  
  // Fallback to popular fonts
  return [
    'Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Lato',
    'Source Sans Pro', 'Nunito Sans', 'Merriweather', 'Playfair Display',
    'Helvetica Neue', 'Arial', 'Times New Roman', 'Georgia', 'SF Pro Display'
  ];
};

export const StyleGenerator: React.FC<StyleGeneratorProps> = ({ onStylesGenerated, onTextStylesGenerated }) => {
  const [step, setStep] = useState<'input' | 'preview' | 'customize'>(('input'));
  const [generationType, setGenerationType] = useState<GenerationType>('complete');
  const [colors, setColors] = useState<ColorInput>(defaultColors);
  const [textStyleInput, setTextStyleInput] = useState<TextStyleInput>(defaultTextStyleInput);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  // Load fonts from Framer on component mount
  React.useEffect(() => {
    getFramerFonts().then(setAvailableFonts);
  }, []);

  // Generate semantic color system from primary, secondary, and tertiary
  const generateColorSystem = useCallback((primary: string, secondary: string, tertiary: string): ColorToken[] => {
    const tokens: ColorToken[] = [];

    // Helper function to convert hex to HSL
    const hexToHsl = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return [h * 360, s * 100, l * 100];
    };

    // Helper function to convert HSL to hex
    const hslToHex = (h: number, s: number, l: number): string => {
      h /= 360; s /= 100; l /= 100;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;

      if (0 <= h && h < 1/6) { r = c; g = x; b = 0; }
      else if (1/6 <= h && h < 2/6) { r = x; g = c; b = 0; }
      else if (2/6 <= h && h < 3/6) { r = 0; g = c; b = x; }
      else if (3/6 <= h && h < 4/6) { r = 0; g = x; b = c; }
      else if (4/6 <= h && h < 5/6) { r = x; g = 0; b = c; }
      else if (5/6 <= h && h < 1) { r = c; g = 0; b = x; }

      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);

      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    };

    // Generate lighter/darker variants
    const adjustLightness = (hex: string, adjustment: number): string => {
      const [h, s, l] = hexToHsl(hex);
      return hslToHex(h, s, Math.max(0, Math.min(100, l + adjustment)));
    };

    // Brand Colors - Primary, Secondary, and Tertiary with states
    tokens.push(
      // Primary
      { name: 'Primary Base', light: primary, dark: primary, category: 'Brand' },
      { name: 'Primary Hover', light: adjustLightness(primary, 10), dark: adjustLightness(primary, 10), category: 'Brand' },
      { name: 'Primary Pressed', light: adjustLightness(primary, -10), dark: adjustLightness(primary, -10), category: 'Brand' },
      
      // Secondary
      { name: 'Secondary Base', light: secondary, dark: secondary, category: 'Brand' },
      { name: 'Secondary Hover', light: adjustLightness(secondary, 10), dark: adjustLightness(secondary, 10), category: 'Brand' },
      { name: 'Secondary Pressed', light: adjustLightness(secondary, -10), dark: adjustLightness(secondary, -10), category: 'Brand' },
      
      // Tertiary (Accent)
      { name: 'Tertiary Base', light: tertiary, dark: tertiary, category: 'Brand' },
      { name: 'Tertiary Hover', light: adjustLightness(tertiary, 10), dark: adjustLightness(tertiary, 10), category: 'Brand' },
      { name: 'Tertiary Pressed', light: adjustLightness(tertiary, -10), dark: adjustLightness(tertiary, -10), category: 'Brand' }
    );

    // Neutrals - Light to Dark scale
    const neutrals = [
      { suffix: '50', light: '#ffffff', dark: '#000000' },
      { suffix: '100', light: '#f9fafb', dark: '#1a1a1a' },
      { suffix: '200', light: '#f3f4f6', dark: '#262626' },
      { suffix: '300', light: '#e5e7eb', dark: '#404040' },
      { suffix: '400', light: '#d1d5db', dark: '#525252' },
      { suffix: '500', light: '#9ca3af', dark: '#737373' },
      { suffix: '600', light: '#6b7280', dark: '#a3a3a3' },
      { suffix: '700', light: '#4b5563', dark: '#d4d4d4' },
      { suffix: '800', light: '#374151', dark: '#e5e5e5' },
      { suffix: '900', light: '#1f2937', dark: '#f5f5f5' },
      { suffix: '950', light: '#111827', dark: '#fafafa' },
      { suffix: '1000', light: '#000000', dark: '#ffffff' }
    ];

    neutrals.forEach(({ suffix, light, dark }) => {
      tokens.push({ 
        name: `Neutral ${suffix}`, 
        light, 
        dark, 
        category: 'Neutral' 
      });
    });

    // Semantic Colors - Base, Hover, Pressed for each
    const semanticColors = [
      { name: 'Success', base: '#10b981' },
      { name: 'Warning', base: '#f59e0b' },
      { name: 'Error', base: '#ef4444' },
      { name: 'Info', base: '#3b82f6' }
    ];

    semanticColors.forEach(({ name, base }) => {
      tokens.push(
        { name: `${name} Base`, light: base, dark: base, category: 'Semantic' },
        { name: `${name} Hover`, light: adjustLightness(base, 10), dark: adjustLightness(base, 10), category: 'Semantic' },
        { name: `${name} Pressed`, light: adjustLightness(base, -10), dark: adjustLightness(base, -10), category: 'Semantic' }
      );
    });

    // Text Colors
    tokens.push(
      { name: 'Text Primary', light: primary, dark: primary, category: 'Text' },
      { name: 'Text Main', light: '#1f2937', dark: '#f9fafb', category: 'Text' },
      { name: 'Text Subtext', light: '#6b7280', dark: '#9ca3af', category: 'Text' },
      { name: 'Text Inverse', light: '#ffffff', dark: '#000000', category: 'Text' },
      { name: 'Text Disabled', light: '#d1d5db', dark: '#4b5563', category: 'Text' }
    );

    // Background Colors
    tokens.push(
      { name: 'Background Base', light: '#ffffff', dark: '#000000', category: 'Background' },
      { name: 'Background Surface', light: '#f9fafb', dark: '#111827', category: 'Background' },
      { name: 'Background Elevated', light: '#ffffff', dark: '#1f2937', category: 'Background' },
      { name: 'Background Inverse', light: '#111827', dark: '#f9fafb', category: 'Background' },
      { name: 'Background Primary', light: adjustLightness(primary, 40), dark: '#1f2937', category: 'Background' },
      { name: 'Background Secondary', light: adjustLightness(secondary, 40), dark: '#262626', category: 'Background' },
      { name: 'Background Divider', light: '#e5e7eb', dark: '#374151', category: 'Background' }
    );

    return tokens;
  }, []);

  // Generate smart text styles based on base font size and font family
  const generateSmartTextStyles = useCallback((fontFamily: string, baseFontSize: number): TextStyle[] => {
    const textStyles: TextStyle[] = [];
    
    // Smart typography scale - using mathematical relationships
    const textStyleDefinitions = [
      { name: 'H1', multiplier: 3, weight: 700, lineHeight: 1.1, category: 'heading' as const },
      { name: 'H2', multiplier: 2.25, weight: 600, lineHeight: 1.15, category: 'heading' as const },
      { name: 'H3', multiplier: 1.875, weight: 600, lineHeight: 1.2, category: 'heading' as const },
      { name: 'H4', multiplier: 1.5, weight: 500, lineHeight: 1.2, category: 'heading' as const },
      { name: 'H5', multiplier: 1.25, weight: 500, lineHeight: 1.2, category: 'heading' as const },
      { name: 'H6', multiplier: 1.125, weight: 500, lineHeight: 1.2, category: 'heading' as const },
      { name: 'Body L', multiplier: 1.125, weight: 400, lineHeight: 1.6, category: 'body' as const },
      { name: 'Body M', multiplier: 1, weight: 400, lineHeight: 1.5, category: 'body' as const },
      { name: 'Sub-title', multiplier: 0.875, weight: 500, lineHeight: 1.4, category: 'caption' as const },
      { name: 'Caption', multiplier: 0.75, weight: 400, lineHeight: 1.3, category: 'caption' as const }
    ];

    textStyleDefinitions.forEach((def, index) => {
      const fontSize = Math.round(baseFontSize * def.multiplier);
      
      textStyles.push({
        id: `text-${index}`,
        name: def.name,
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: def.weight,
        lineHeight: def.lineHeight.toString(),
        letterSpacing: fontSize >= 24 ? '-0.02em' : '0px', // Tighter spacing for larger text
        color: colors.primary,
        category: def.category
      });
    });

    return textStyles;
  }, [colors.primary]);

  const generatedTokens = useMemo(() => {
    if (generationType === 'text') return [];
    return generateColorSystem(colors.primary, colors.secondary, colors.tertiary);
  }, [colors, generateColorSystem, generationType]);

  const generatedTextStyles = useMemo(() => {
    if (generationType === 'colors') return [];
    return generateSmartTextStyles(textStyleInput.fontFamily, textStyleInput.baseFontSize);
  }, [textStyleInput, generateSmartTextStyles, generationType]);

  const handleColorChange = (type: keyof ColorInput, value: string) => {
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setColors(prev => ({ ...prev, [type]: value }));
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStep('preview');
    setIsGenerating(false);
  };

  const handleApply = () => {
    if (generationType !== 'text') {
      onStylesGenerated(generatedTokens);
    }
    if (generationType !== 'colors' && onTextStylesGenerated) {
      onTextStylesGenerated(generatedTextStyles);
    }
  };

  const handleRandomize = () => {
    const randomColors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
      '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#c084fc', '#d946ef', '#ec4899', '#f43f5e'
    ];
    
    const randomPrimary = randomColors[Math.floor(Math.random() * randomColors.length)];
    let randomSecondary = randomColors[Math.floor(Math.random() * randomColors.length)];
    while (randomSecondary === randomPrimary) {
      randomSecondary = randomColors[Math.floor(Math.random() * randomColors.length)];
    }
    let randomTertiary = randomColors[Math.floor(Math.random() * randomColors.length)];
    while (randomTertiary === randomPrimary || randomTertiary === randomSecondary) {
      randomTertiary = randomColors[Math.floor(Math.random() * randomColors.length)];
    }
    
    setColors({ primary: randomPrimary, secondary: randomSecondary, tertiary: randomTertiary });
  };

  const getTokensByCategory = (category: string) => {
    return generatedTokens.filter(token => token.category === category);
  };

  const getTextStylesByCategory = (category: string) => {
    return generatedTextStyles.filter(style => style.category === category);
  };

  if (step === 'input') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Generate Style System</h2>
          <p className="text-text-muted">
            Choose what to generate and configure your design system
          </p>
        </div>

        <Card className="p-8 max-w-2xl mx-auto bg-surface-elevated">
          <div className="space-y-6">
            {/* Generation Type Selection */}
            <div>
              <Label className="text-foreground font-medium">What do you want to generate?</Label>
            <Tabs value={generationType} onValueChange={(value: GenerationType) => setGenerationType(value)} className="mt-3">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="colors" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Color System
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2">
                  <Type className="w-4 h-4" />
                  Type System
                </TabsTrigger>
                <TabsTrigger value="complete" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Complete System
                </TabsTrigger>
              </TabsList>
            </Tabs>
            </div>

            <Separator />

            {/* Colors Configuration */}
            {(generationType === 'colors' || generationType === 'complete') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Color Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primary" className="text-foreground">Primary Color</Label>
                    <div className="flex gap-3 mt-2">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-border shadow-soft"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <Input
                        id="primary"
                        value={colors.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        placeholder="#6366f1"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary" className="text-foreground">Secondary Color</Label>
                    <div className="flex gap-3 mt-2">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-border shadow-soft"
                        style={{ backgroundColor: colors.secondary }}
                      />
                      <Input
                        id="secondary"
                        value={colors.secondary}
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                        placeholder="#8b5cf6"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tertiary" className="text-foreground">Tertiary Color (Accent)</Label>
                    <div className="flex gap-3 mt-2">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-border shadow-soft"
                        style={{ backgroundColor: colors.tertiary }}
                      />
                      <Input
                        id="tertiary"
                        value={colors.tertiary}
                        onChange={(e) => handleColorChange('tertiary', e.target.value)}
                        placeholder="#f59e0b"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleRandomize}
                  className="w-full gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Randomize Colors
                </Button>
              </div>
            )}

            {/* Text Styles Configuration */}
            {(generationType === 'text' || generationType === 'complete') && (
              <>
                {(generationType === 'complete') && <Separator />}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fontFamily" className="text-foreground">Font Family</Label>
                      <Select 
                        value={textStyleInput.fontFamily} 
                        onValueChange={(value) => setTextStyleInput(prev => ({ ...prev, fontFamily: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFonts.map(font => (
                            <SelectItem key={font} value={font}>
                              <span style={{ fontFamily: font }}>{font}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                        <p className="text-xs text-muted-foreground mt-1">
                          {availableFonts.length > 15 ? 'Loaded from Framer' : 'Using fallback fonts'}
                        </p>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="baseFontSize" className="text-foreground">Base Font Size</Label>
                      <Input
                        id="baseFontSize"
                        value={textStyleInput.baseFontSize.toString()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 8 && value <= 72) {
                            setTextStyleInput(prev => ({ ...prev, baseFontSize: value }));
                          }
                        }}
                        placeholder="16"
                        className="mt-2"
                        type="number"
                        min="8"
                        max="72"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 14-20px
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-background/50 rounded-lg border border-border">
                    <p className="text-sm text-text-muted mb-2">Typography Preview:</p>
                    <div className="space-y-1">
                      <div style={{ fontFamily: textStyleInput.fontFamily, fontSize: `${textStyleInput.baseFontSize * 3}px`, fontWeight: 700, lineHeight: 1.1 }}>
                        H1 Heading ({textStyleInput.baseFontSize * 3}px)
                      </div>
                      <div style={{ fontFamily: textStyleInput.fontFamily, fontSize: `${textStyleInput.baseFontSize}px`, fontWeight: 400, lineHeight: 1.5 }}>
                        Body M Text ({textStyleInput.baseFontSize}px)
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate {generationType === 'colors' ? 'Color System' : generationType === 'text' ? 'Text Styles' : 'Complete System'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'preview') {
    const totalItems = generatedTokens.length + generatedTextStyles.length;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Generated Style System</h2>
            <p className="text-text-muted">
              {totalItems} items generated • Review and apply when ready
            </p>
          </div>
          <div className="flex gap-2">
            {generatedTokens.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="gap-2"
              >
                {isDarkMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isDarkMode ? 'Light' : 'Dark'} Preview
              </Button>
            )}
            <Button onClick={handleApply} className="gap-2">
              <ChevronRight className="w-4 h-4" />
              Apply System
            </Button>
          </div>
        </div>

        <Tabs defaultValue={generationType === 'text' ? 'text' : 'colors'} className="w-full">
          <TabsList>
            {generatedTokens.length > 0 && <TabsTrigger value="colors">Colors</TabsTrigger>}
            {generatedTextStyles.length > 0 && <TabsTrigger value="text">Text Styles</TabsTrigger>}
          </TabsList>

          {/* Color Tokens */}
          {generatedTokens.length > 0 && (
            <TabsContent value="colors" className="space-y-6">
              {['Brand', 'Neutral', 'Semantic', 'Text', 'Background'].map(category => {
                const categoryTokens = getTokensByCategory(category);
                if (categoryTokens.length === 0) return null;

                return (
                  <Card key={category} className="p-6 bg-surface-elevated">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {category === 'Brand' && <Sparkles className="w-4 h-4 text-primary" />}
                        {category === 'Text' && <Type className="w-4 h-4 text-primary" />}
                        {category !== 'Brand' && category !== 'Text' && <Palette className="w-4 h-4 text-primary" />}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                      <Badge variant="outline">{categoryTokens.length} tokens</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryTokens.map((token, index) => (
                        <div key={index} className="space-y-2">
                          <div 
                            className="w-full h-16 rounded-lg border border-border shadow-soft"
                            style={{ backgroundColor: isDarkMode ? token.dark : token.light }}
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground truncate">{token.name}</p>
                            <p className="text-xs text-text-muted font-mono">
                              {isDarkMode ? token.dark : token.light}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
          )}

          {/* Text Styles */}
          {generatedTextStyles.length > 0 && (
            <TabsContent value="text" className="space-y-6">
              {['heading', 'body', 'caption'].map(category => {
                const categoryStyles = getTextStylesByCategory(category);
                if (categoryStyles.length === 0) return null;

                return (
                  <Card key={category} className="p-6 bg-surface-elevated">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Type className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground capitalize">{category}s</h3>
                      <Badge variant="outline">{categoryStyles.length} styles</Badge>
                    </div>

                    <div className="space-y-4">
                      {categoryStyles.map((style) => (
                        <div key={style.id} className="p-4 border border-border rounded-lg bg-background/50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">{style.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {style.fontSize} • {style.fontWeight} • {style.lineHeight}
                            </Badge>
                          </div>
                          <div 
                            className="mb-2"
                            style={{
                              fontFamily: style.fontFamily,
                              fontSize: style.fontSize,
                              fontWeight: style.fontWeight,
                              lineHeight: style.lineHeight,
                              letterSpacing: style.letterSpacing,
                              color: style.color
                            }}
                          >
                            The quick brown fox jumps over the lazy dog
                          </div>
                          <p className="text-xs text-text-muted">
                            {style.fontFamily} • {style.fontSize} • Weight {style.fontWeight} • Line Height {style.lineHeight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
          )}
        </Tabs>

        {/* System Features */}
        <Card className="p-6 bg-surface-elevated border-accent/20">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Smart Generation Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              {generatedTokens.length > 0 && (
                <>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Hover & pressed states for brand colors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Complete neutral scale (50-1000)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Semantic colors with states
                  </li>
                </>
              )}
              {generatedTextStyles.length > 0 && (
                <>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Mathematical type scale (H1-H6, Body L/M)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Optimized line heights (1.1-1.2 headings, 1.5-1.6 body)
                  </li>
                </>
              )}
            </ul>
            <ul className="space-y-2">
              {generatedTokens.length > 0 && (
                <>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Text hierarchy system
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Background surface system
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    WCAG AA compliant contrast
                  </li>
                </>
              )}
              {generatedTextStyles.length > 0 && (
                <>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Smart letter spacing for readability
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Professional typography hierarchy
                  </li>
                </>
              )}
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};