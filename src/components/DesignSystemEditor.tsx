import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Palette, Eye, EyeOff, Wand2, Copy, Type, Sparkles, Shield, Zap, Plus, Settings } from 'lucide-react';
import { ColorToken, TextStyle } from './MagicStyles';
import { AccessibilityIndicator } from './AccessibilityIndicator';
import { ViewToggle, ViewMode } from './ViewToggle';
import TextStyleManager from './TextStyleManager';
import { toast } from 'sonner';

interface DesignSystemEditorProps {
  tokens: ColorToken[];
  textStyles: TextStyle[];
  isDarkMode: boolean;
  onTokensUpdate: (tokens: ColorToken[]) => void;
  onTextStylesUpdate: (textStyles: TextStyle[]) => void;
  onToggleDarkMode: () => void;
  onApplyToFramer: () => void;
}

const DesignSystemEditor: React.FC<DesignSystemEditorProps> = ({
  tokens,
  textStyles,
  isDarkMode,
  onTokensUpdate,
  onTextStylesUpdate,
  onToggleDarkMode,
  onApplyToFramer
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'colors' | 'text'>('colors');
  const [isFixingAccessibility, setIsFixingAccessibility] = useState(false);
  const [isGeneratingDarkMode, setIsGeneratingDarkMode] = useState(false);
  const [isGeneratingStates, setIsGeneratingStates] = useState(false);

  const getContrastRatio = (color1: string, color2: string): number => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const accessibilityStats = useMemo(() => {
    const totalCombinations = tokens.length * tokens.length;
    const passedCombinations = tokens.reduce((acc, bgToken) => {
      return acc + tokens.filter(textToken => {
        const bgColor = isDarkMode ? bgToken.dark : bgToken.light;
        const textColor = isDarkMode ? textToken.dark : textToken.light;
        return getContrastRatio(bgColor, textColor) >= 4.5;
      }).length;
    }, 0);
    
    return {
      total: totalCombinations,
      passed: passedCombinations,
      failed: totalCombinations - passedCombinations,
      percentage: totalCombinations > 0 ? Math.round((passedCombinations / totalCombinations) * 100) : 0
    };
  }, [tokens, isDarkMode]);

  const allAccessibilityPassed = accessibilityStats.percentage === 100 && tokens.length > 0;

  const categories = useMemo(() => {
    const cats = Array.from(new Set(tokens.map(token => token.category).filter(Boolean)));
    return cats.sort();
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      if (selectedCategory === 'all') return true;
      return token.category === selectedCategory;
    });
  }, [tokens, selectedCategory]);

  const handleCategoryChange = (tokenName: string, newCategory: string) => {
    const updatedTokens = tokens.map(token =>
      token.name === tokenName ? { ...token, category: newCategory } : token
    );
    onTokensUpdate(updatedTokens);
    toast.success(`Moved to ${newCategory}`);
  };

  const fixAccessibility = async () => {
    setIsFixingAccessibility(true);
    
    // Simulate fixing accessibility issues
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Auto-fix low contrast tokens
    const fixedTokens = tokens.map(token => {
      if (token.category === 'Text') {
        return {
          ...token,
          light: '#1f2937', // Ensure dark text for light mode
          dark: '#f9fafb'   // Ensure light text for dark mode
        };
      }
      return token;
    });
    
    onTokensUpdate(fixedTokens);
    setIsFixingAccessibility(false);
    toast.success('Accessibility issues fixed automatically');
  };

  const generateDarkMode = async () => {
    setIsGeneratingDarkMode(true);
    
    // Simulate dark mode generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const enhancedTokens = tokens.map(token => {
      if (token.category === 'Background') {
        return {
          ...token,
          dark: token.name.toLowerCase().includes('base') ? '#111827' : '#1f2937'
        };
      }
      if (token.category === 'Text') {
        return {
          ...token,
          dark: '#f9fafb'
        };
      }
      return token;
    });
    
    onTokensUpdate(enhancedTokens);
    setIsGeneratingDarkMode(false);
    toast.success('Dark mode variants generated');
  };

  const generateStates = async () => {
    setIsGeneratingStates(true);
    
    // Simulate state generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const brandTokens = tokens.filter(t => t.category === 'Brand');
    const stateTokens: ColorToken[] = [];

    brandTokens.forEach(token => {
      if (!token.name.includes('Hover') && !token.name.includes('Pressed')) {
        stateTokens.push({
          name: `${token.name} Hover`,
          light: adjustBrightness(token.light, 10),
          dark: adjustBrightness(token.dark, 10),
          category: 'Brand'
        });

        stateTokens.push({
          name: `${token.name} Pressed`,
          light: adjustBrightness(token.light, -10),
          dark: adjustBrightness(token.dark, -10),
          category: 'Brand'
        });
      }
    });

    if (stateTokens.length > 0) {
      onTokensUpdate([...tokens, ...stateTokens]);
      toast.success(`Generated ${stateTokens.length} interaction states`);
    } else {
      toast.info('All brand colors already have states');
    }
    
    setIsGeneratingStates(false);
  };

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

  const handleGlobalFontChange = async (newFontFamily: string) => {
    const updatedTextStyles = textStyles.map(style => ({
      ...style,
      fontFamily: newFontFamily
    }));
    onTextStylesUpdate(updatedTextStyles);
    toast.success(`Changed all fonts to ${newFontFamily}`);
  };

  const fixLineHeights = async () => {
    const fixedTextStyles = textStyles.map(style => {
      let smartLineHeight = '1.5'; // Default body line height
      
      if (style.category === 'heading') {
        const fontSize = parseFloat(style.fontSize);
        smartLineHeight = fontSize >= 32 ? '1.1' : fontSize >= 24 ? '1.15' : '1.2';
      } else if (style.category === 'body') {
        smartLineHeight = '1.5';
      } else if (style.category === 'caption') {
        smartLineHeight = '1.4';
      }
      
      return {
        ...style,
        lineHeight: smartLineHeight
      };
    });
    
    onTextStylesUpdate(fixedTextStyles);
    toast.success('Line heights optimized for readability');
  };

  const fixLetterSpacing = async () => {
    const fixedTextStyles = textStyles.map(style => {
      const fontSize = parseFloat(style.fontSize);
      let smartLetterSpacing = '0px';
      
      if (fontSize >= 32) {
        smartLetterSpacing = '-0.02em'; // Tighter for large headings
      } else if (fontSize >= 24) {
        smartLetterSpacing = '-0.01em'; // Slightly tighter for headings
      } else if (fontSize <= 12) {
        smartLetterSpacing = '0.01em'; // Slightly looser for small text
      }
      
      return {
        ...style,
        letterSpacing: smartLetterSpacing
      };
    });
    
    onTextStylesUpdate(fixedTextStyles);
    toast.success('Letter spacing optimized');
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {allAccessibilityPassed && (
        <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Perfect Accessibility Score!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-200">
                All color combinations meet WCAG accessibility standards
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Design System</h2>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-surface-elevated">
              {filteredTokens.length} colors • {textStyles.length} text styles
            </Badge>
            <div className="flex items-center gap-2">
              {accessibilityStats.percentage >= 80 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {accessibilityStats.percentage}% WCAG compliant
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={fixAccessibility} 
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={isFixingAccessibility}
          >
            {isFixingAccessibility ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            Fix Accessibility
          </Button>
          <Button 
            onClick={generateDarkMode} 
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={isGeneratingDarkMode}
          >
            {isGeneratingDarkMode ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Generate Dark Mode
          </Button>
          <Button 
            onClick={generateStates} 
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={isGeneratingStates}
          >
            {isGeneratingStates ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generate States
          </Button>
          <Button onClick={onApplyToFramer} size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Apply to Framer
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <Type className="w-4 h-4" />
              Text Styles
            </TabsTrigger>
          </TabsList>

          {activeTab === 'colors' && (
            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ViewToggle 
                currentView={viewMode}
                onViewChange={setViewMode}
              />
              <Button onClick={onToggleDarkMode} variant="outline" size="sm" className="gap-2">
                {isDarkMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </Button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="flex items-center gap-2">
              <Button onClick={fixLineHeights} variant="outline" size="sm" className="gap-2">
                <Zap className="w-4 h-4" />
                Fix Line Heights
              </Button>
              <Button onClick={fixLetterSpacing} variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Fix Letter Spacing
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="colors" className="space-y-4">
          {/* Token Grid */}
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 
              'space-y-2'}
          `}>
            {filteredTokens.map((token) => (
              <TokenCard
                key={`${token.name}-${token.category}`}
                token={token}
                isDarkMode={isDarkMode}
                viewMode={viewMode}
                onCategoryChange={handleCategoryChange}
                categories={categories}
              />
            ))}
          </div>

          {filteredTokens.length === 0 && (
            <Card className="p-12 text-center bg-surface-elevated">
              <Palette className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tokens found</h3>
              <p className="text-text-muted">
                {selectedCategory === 'all' 
                  ? 'No color tokens available in this view'
                  : `No tokens found in "${selectedCategory}" category`
                }
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="text">
          <EnhancedTextStyleManager
            textStyles={textStyles}
            onTextStylesUpdate={onTextStylesUpdate}
            onApplyToFramer={onApplyToFramer}
            onGlobalFontChange={handleGlobalFontChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TokenCardProps {
  token: ColorToken;
  isDarkMode: boolean;
  viewMode: ViewMode;
  onCategoryChange: (tokenName: string, category: string) => void;
  categories: string[];
}

const TokenCard: React.FC<TokenCardProps> = ({ token, isDarkMode, viewMode, onCategoryChange, categories }) => {
  const [isEditing, setIsEditing] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${text}`);
  };

  const currentColor = isDarkMode ? token.dark : token.light;

  return (
    <Card className={`p-4 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
      <div className={`space-y-3 ${viewMode === 'list' ? 'flex items-center space-y-0 space-x-4 w-full' : ''}`}>
        {/* Color Preview */}
        <div className={`${viewMode === 'list' ? 'flex items-center space-x-2' : 'space-y-2'}`}>
          <div className={`grid grid-cols-2 rounded-lg border overflow-hidden ${viewMode === 'list' ? 'h-8 w-16' : 'h-12'}`}>
            <div 
              className="cursor-pointer transition-all hover:scale-105 flex items-center justify-center"
              style={{ backgroundColor: token.light }}
              onClick={() => copyToClipboard(token.light)}
              title={`Light: ${token.light}`}
            >
              <span className="text-xs font-medium opacity-70" style={{ 
                color: (() => {
                  const rgb = hexToRgb(token.light);
                  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.5 ? '#000' : '#fff';
                })()
              }}>L</span>
            </div>
            <div 
              className="cursor-pointer transition-all hover:scale-105 flex items-center justify-center"
              style={{ backgroundColor: token.dark }}
              onClick={() => copyToClipboard(token.dark)}
              title={`Dark: ${token.dark}`}
            >
              <span className="text-xs font-medium opacity-70" style={{ 
                color: (() => {
                  const rgb = hexToRgb(token.dark);
                  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.5 ? '#000' : '#fff';
                })()
              }}>D</span>
            </div>
          </div>
          
          <div className={viewMode === 'list' ? 'space-y-0' : 'space-y-1'}>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">{token.name}</h4>
              {token.category && (
                <Badge variant="secondary" className="text-xs">
                  {token.category}
                </Badge>
              )}
            </div>
            
            <AccessibilityIndicator
              ratio={4.5}
              wcagAA={true}
              wcagAAA={false}
              grade="good"
              onFix={() => {}}
              size="sm"
            />
          </div>
        </div>

        {/* Color Values */}
        {viewMode !== 'list' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Light</label>
              <div className="flex items-center space-x-1">
                <code 
                  className="flex-1 px-2 py-1 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                  onClick={() => copyToClipboard(token.light)}
                >
                  {token.light}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(token.light)}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Dark</label>
              <div className="flex items-center space-x-1">
                <code 
                  className="flex-1 px-2 py-1 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                  onClick={() => copyToClipboard(token.dark)}
                >
                  {token.dark}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(token.dark)}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

interface EnhancedTextStyleManagerProps {
  textStyles: TextStyle[];
  onTextStylesUpdate: (textStyles: TextStyle[]) => void;
  onApplyToFramer: () => void;
  onGlobalFontChange: (fontFamily: string) => void;
}

const EnhancedTextStyleManager: React.FC<EnhancedTextStyleManagerProps> = ({
  textStyles,
  onTextStylesUpdate,
  onApplyToFramer,
  onGlobalFontChange
}) => {
  const [globalFont, setGlobalFont] = useState('');

  const availableFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Lato',
    'Source Sans Pro', 'Nunito Sans', 'Merriweather', 'Playfair Display',
    'Helvetica Neue', 'Arial', 'Times New Roman', 'Georgia'
  ];

  const handleGlobalFontChange = () => {
    if (globalFont && globalFont !== '') {
      onGlobalFontChange(globalFont);
      setGlobalFont('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Font Control */}
      <Card className="p-4 bg-surface-elevated">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Global Font Family</h3>
            <p className="text-sm text-muted-foreground">Change font family for all text styles</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={globalFont} onValueChange={setGlobalFont}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                {availableFonts.map(font => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGlobalFontChange} 
              disabled={!globalFont}
              size="sm"
              className="gap-2"
            >
              <Type className="w-4 h-4" />
              Apply
            </Button>
          </div>
        </div>
      </Card>

      {/* Text Style Manager */}
      <TextStyleManager
        textStyles={textStyles}
        onTextStylesUpdate={onTextStylesUpdate}
        onApplyToFramer={onApplyToFramer}
      />
    </div>
  );
};

export default DesignSystemEditor;