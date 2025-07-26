import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Plus, Sparkles, ChevronDown, Palette, Type, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { ColorToken, TextStyle } from './MagicStyles';
import { toast } from 'sonner';

interface SmartStyleGeneratorProps {
  tokens: ColorToken[];
  textStyles: TextStyle[];
  onTokensUpdate: (tokens: ColorToken[]) => void;
  onTextStylesUpdate: (textStyles: TextStyle[]) => void;
  onGenerateDarkMode?: () => Promise<void>;
  onGenerateStates?: () => Promise<void>;
  onFixAccessibility?: () => Promise<void>;
  isGeneratingDarkMode?: boolean;
  isGeneratingStates?: boolean;
  isFixingAccessibility?: boolean;
}

interface MissingCategory {
  name: string;
  type: 'color' | 'text';
  count: number;
  description: string;
  items: string[];
}

const SmartStyleGenerator: React.FC<SmartStyleGeneratorProps> = ({
  tokens,
  textStyles,
  onTokensUpdate,
  onTextStylesUpdate,
  onGenerateDarkMode,
  onGenerateStates,
  onFixAccessibility,
  isGeneratingDarkMode = false,
  isGeneratingStates = false,
  isFixingAccessibility = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState<string | null>(null);

  // Standard design system definitions
  const standardTextColors = [
    'Text Main', 'Text Subtext', 'Text Inverse', 'Text Disabled', 'Text Primary'
  ];

  const standardSemanticColors = [
    'Success Base', 'Success Hover', 'Success Pressed',
    'Warning Base', 'Warning Hover', 'Warning Pressed',
    'Error Base', 'Error Hover', 'Error Pressed',
    'Info Base', 'Info Hover', 'Info Pressed'
  ];

  const standardBackgroundColors = [
    'Background Base', 'Background Surface', 'Background Elevated', 
    'Background Inverse', 'Background Divider'
  ];

  const standardNeutralColors = [
    'Neutral 50', 'Neutral 100', 'Neutral 200', 'Neutral 300', 'Neutral 400',
    'Neutral 500', 'Neutral 600', 'Neutral 700', 'Neutral 800', 'Neutral 900', 'Neutral 950'
  ];

  const standardTextStyles = [
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'Body L', 'Body M', 'Sub-title', 'Caption'
  ];

  // Analyze missing categories
  const missingCategories = useMemo((): MissingCategory[] => {
    const categories: MissingCategory[] = [];
    const existingTokenNames = new Set(tokens.map(t => t.name));
    const existingTextStyleNames = new Set(textStyles.map(t => t.name));

    // Check Text Colors
    const missingTextColors = standardTextColors.filter(name => !existingTokenNames.has(name));
    if (missingTextColors.length > 0) {
      categories.push({
        name: 'Text Colors',
        type: 'color',
        count: missingTextColors.length,
        description: 'Essential text color tokens',
        items: missingTextColors
      });
    }

    // Check Semantic Colors
    const missingSemanticColors = standardSemanticColors.filter(name => !existingTokenNames.has(name));
    if (missingSemanticColors.length > 0) {
      categories.push({
        name: 'Semantic Colors',
        type: 'color',
        count: missingSemanticColors.length,
        description: 'Success, warning, error, info states',
        items: missingSemanticColors
      });
    }

    // Check Brand States (look for existing brand colors without states)
    const brandTokens = tokens.filter(t => t.category === 'Brand' && !t.name.includes('Hover') && !t.name.includes('Pressed'));
    const missingBrandStates: string[] = [];
    brandTokens.forEach(token => {
      const hoverName = `${token.name} Hover`;
      const pressedName = `${token.name} Pressed`;
      if (!existingTokenNames.has(hoverName)) missingBrandStates.push(hoverName);
      if (!existingTokenNames.has(pressedName)) missingBrandStates.push(pressedName);
    });

    if (missingBrandStates.length > 0) {
      categories.push({
        name: 'Brand States',
        type: 'color',
        count: missingBrandStates.length,
        description: 'Hover and pressed states for brand colors',
        items: missingBrandStates
      });
    }

    // Check Background Colors
    const missingBackgroundColors = standardBackgroundColors.filter(name => !existingTokenNames.has(name));
    if (missingBackgroundColors.length > 0) {
      categories.push({
        name: 'Background Colors',
        type: 'color',
        count: missingBackgroundColors.length,
        description: 'Surface and background variants',
        items: missingBackgroundColors
      });
    }

    // Check Neutral Scale
    const missingNeutralColors = standardNeutralColors.filter(name => !existingTokenNames.has(name));
    if (missingNeutralColors.length > 0) {
      categories.push({
        name: 'Neutral Scale',
        type: 'color',
        count: missingNeutralColors.length,
        description: 'Complete neutral color scale',
        items: missingNeutralColors
      });
    }

    // Check Text Styles
    const missingTextStyles = standardTextStyles.filter(name => !existingTextStyleNames.has(name));
    if (missingTextStyles.length > 0) {
      categories.push({
        name: 'Text System',
        type: 'text',
        count: missingTextStyles.length,
        description: 'Complete typography scale',
        items: missingTextStyles
      });
    }

    return categories;
  }, [tokens, textStyles]);

  // Check for missing dark mode and states
  const missingDarkMode = tokens.filter(token => token.light === token.dark || !token.dark || token.dark === '#ffffff').length;
  const missingStates = tokens.filter(t => t.category === 'Brand' && !t.name.includes('Hover') && !t.name.includes('Pressed')).length * 2;
  const hasTextMain = tokens.some(token => token.name === 'Text Main');

  const totalMissingItems = missingCategories.reduce((sum, cat) => sum + cat.count, 0) + 
    (missingDarkMode > 0 ? 1 : 0) + 
    (missingStates > 0 ? 1 : 0) + 
    (!hasTextMain ? 1 : 0);

  // Generation functions
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

  const generateTextColors = (): ColorToken[] => {
    const missingTextColors = standardTextColors.filter(name => 
      !tokens.some(t => t.name === name)
    );

    return missingTextColors.map(name => {
      switch (name) {
        case 'Text Main':
          return { name, light: '#1f2937', dark: '#f9fafb', category: 'Text' };
        case 'Text Subtext':
          return { name, light: '#6b7280', dark: '#9ca3af', category: 'Text' };
        case 'Text Inverse':
          return { name, light: '#ffffff', dark: '#000000', category: 'Text' };
        case 'Text Disabled':
          return { name, light: '#d1d5db', dark: '#4b5563', category: 'Text' };
        case 'Text Primary':
          const primaryToken = tokens.find(t => t.name.includes('Primary') && t.category === 'Brand');
          return { 
            name, 
            light: primaryToken?.light || '#6366f1', 
            dark: primaryToken?.dark || '#6366f1', 
            category: 'Text' 
          };
        default:
          return { name, light: '#1f2937', dark: '#f9fafb', category: 'Text' };
      }
    });
  };

  const generateSemanticColors = (): ColorToken[] => {
    const semanticBase = {
      'Success': '#10b981',
      'Warning': '#f59e0b',
      'Error': '#ef4444',
      'Info': '#3b82f6'
    };

    const missingTokens: ColorToken[] = [];

    Object.entries(semanticBase).forEach(([name, baseColor]) => {
      const states = ['Base', 'Hover', 'Pressed'];
      states.forEach(state => {
        const tokenName = `${name} ${state}`;
        if (!tokens.some(t => t.name === tokenName)) {
          let color = baseColor;
          if (state === 'Hover') color = adjustBrightness(baseColor, 10);
          if (state === 'Pressed') color = adjustBrightness(baseColor, -10);
          
          missingTokens.push({
            name: tokenName,
            light: color,
            dark: color,
            category: 'Semantic'
          });
        }
      });
    });

    return missingTokens;
  };

  const generateBrandStates = (): ColorToken[] => {
    const brandTokens = tokens.filter(t => 
      t.category === 'Brand' && 
      !t.name.includes('Hover') && 
      !t.name.includes('Pressed')
    );

    const stateTokens: ColorToken[] = [];

    brandTokens.forEach(token => {
      const hoverName = `${token.name} Hover`;
      const pressedName = `${token.name} Pressed`;

      if (!tokens.some(t => t.name === hoverName)) {
        stateTokens.push({
          name: hoverName,
          light: adjustBrightness(token.light, 10),
          dark: adjustBrightness(token.dark, 10),
          category: 'Brand'
        });
      }

      if (!tokens.some(t => t.name === pressedName)) {
        stateTokens.push({
          name: pressedName,
          light: adjustBrightness(token.light, -10),
          dark: adjustBrightness(token.dark, -10),
          category: 'Brand'
        });
      }
    });

    return stateTokens;
  };

  const generateBackgroundColors = (): ColorToken[] => {
    const backgrounds = [
      { name: 'Background Base', light: '#ffffff', dark: '#000000' },
      { name: 'Background Surface', light: '#f9fafb', dark: '#111827' },
      { name: 'Background Elevated', light: '#ffffff', dark: '#1f2937' },
      { name: 'Background Inverse', light: '#111827', dark: '#f9fafb' },
      { name: 'Background Divider', light: '#e5e7eb', dark: '#374151' }
    ];

    return backgrounds.filter(bg => 
      !tokens.some(t => t.name === bg.name)
    ).map(bg => ({
      ...bg,
      category: 'Background'
    }));
  };

  const generateNeutralScale = (): ColorToken[] => {
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
      { suffix: '950', light: '#111827', dark: '#fafafa' }
    ];

    return neutrals.filter(neutral => 
      !tokens.some(t => t.name === `Neutral ${neutral.suffix}`)
    ).map(neutral => ({
      name: `Neutral ${neutral.suffix}`,
      light: neutral.light,
      dark: neutral.dark,
      category: 'Neutral'
    }));
  };

  const generateTextSystem = (): TextStyle[] => {
    // Find Text Main token for color
    const textMainToken = tokens.find(token => token.name === 'Text Main');
    const textColor = textMainToken?.light || '#1f2937';

    // Use Major Third ratio (1.25) as default
    const baseSize = 16;
    const ratio = 1.25;

    const textStyleDefinitions = [
      { name: 'H1', step: 5, weight: 700, lineHeight: 1.1, category: 'heading' as const },
      { name: 'H2', step: 4, weight: 600, lineHeight: 1.15, category: 'heading' as const },
      { name: 'H3', step: 3, weight: 600, lineHeight: 1.2, category: 'heading' as const },
      { name: 'H4', step: 2, weight: 500, lineHeight: 1.2, category: 'heading' as const },
      { name: 'H5', step: 1, weight: 500, lineHeight: 1.2, category: 'heading' as const },
      { name: 'H6', step: 0.5, weight: 500, lineHeight: 1.2, category: 'heading' as const },
      { name: 'Body L', step: 0.25, weight: 400, lineHeight: 1.6, category: 'body' as const },
      { name: 'Body M', step: 0, weight: 400, lineHeight: 1.5, category: 'body' as const },
      { name: 'Sub-title', step: -0.5, weight: 500, lineHeight: 1.4, category: 'caption' as const },
      { name: 'Caption', step: -1, weight: 400, lineHeight: 1.3, category: 'caption' as const }
    ];

    // Clean up existing duplicates and generic names
    const cleanedTextStyles = textStyles.filter(ts => {
      // Remove generic names that will be replaced
      if (ts.name === 'New Text Style' || ts.name.includes('Text Style')) {
        return false;
      }
      return true;
    });

    return textStyleDefinitions.filter(def => 
      !cleanedTextStyles.some(ts => ts.name === def.name)
    ).map((def, index) => {
      const fontSize = Math.round(baseSize * Math.pow(ratio, def.step));
      return {
        id: `text-${Date.now()}-${index}`,
        name: def.name,
        fontFamily: 'Inter',
        fontSize: `${fontSize}px`,
        fontWeight: def.weight,
        lineHeight: def.lineHeight.toString(),
        letterSpacing: fontSize >= 24 ? '-0.02em' : fontSize >= 20 ? '-0.01em' : '0px',
        color: textColor,
        category: def.category
      };
    });
  };

  const handleGenerateCategory = async (categoryName: string) => {
    setIsGenerating(true);
    setGeneratingCategory(categoryName);

    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      let newTokens: ColorToken[] = [];
      let newTextStyles: TextStyle[] = [];

      switch (categoryName) {
        case 'Text Colors':
          newTokens = generateTextColors();
          break;
        case 'Semantic Colors':
          newTokens = generateSemanticColors();
          break;
        case 'Brand States':
          newTokens = generateBrandStates();
          break;
        case 'Background Colors':
          newTokens = generateBackgroundColors();
          break;
        case 'Neutral Scale':
          newTokens = generateNeutralScale();
          break;
        case 'Text System':
          newTextStyles = generateTextSystem();
          break;
      }

      if (newTokens.length > 0) {
        onTokensUpdate([...tokens, ...newTokens]);
        toast.success(`Generated ${newTokens.length} ${categoryName.toLowerCase()}`);
      }

      if (newTextStyles.length > 0) {
        onTextStylesUpdate([...textStyles, ...newTextStyles]);
        toast.success(`Generated ${newTextStyles.length} text styles`);
      }

    } catch (error) {
      toast.error(`Failed to generate ${categoryName.toLowerCase()}`);
    } finally {
      setIsGenerating(false);
      setGeneratingCategory(null);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setGeneratingCategory('all');

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const allNewTokens: ColorToken[] = [
        ...generateTextColors(),
        ...generateSemanticColors(),
        ...generateBrandStates(),
        ...generateBackgroundColors(),
        ...generateNeutralScale()
      ];

      const allNewTextStyles = generateTextSystem();

      if (allNewTokens.length > 0) {
        onTokensUpdate([...tokens, ...allNewTokens]);
      }

      if (allNewTextStyles.length > 0) {
        onTextStylesUpdate([...textStyles, ...allNewTextStyles]);
      }

      toast.success(`Generated ${allNewTokens.length + allNewTextStyles.length} missing styles`);
    } catch (error) {
      toast.error('Failed to generate styles');
    } finally {
      setIsGenerating(false);
      setGeneratingCategory(null);
    }
  };

  // If no missing categories, don't show anything
  if (missingCategories.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2" disabled={isGenerating}>
          <Plus className="w-4 h-4" />
          Generate Missing
          <ChevronDown className="w-4 h-4" />
          <Badge variant="outline" className="ml-1 text-xs">
            {totalMissingItems}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
        <DropdownMenuLabel>Missing Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {missingCategories.map((category) => (
          <DropdownMenuItem
            key={category.name}
            onClick={() => handleGenerateCategory(category.name)}
            className="flex items-center justify-between cursor-pointer"
            disabled={isGenerating}
          >
            <span>{category.name}</span>
            <Badge variant="secondary" className="text-xs">
              {category.count}
            </Badge>
          </DropdownMenuItem>
        ))}
        
        {/* Dark Mode Generation */}
        {missingDarkMode > 0 && onGenerateDarkMode && (
          <DropdownMenuItem
            onClick={onGenerateDarkMode}
            className="flex items-center justify-between cursor-pointer"
            disabled={isGeneratingDarkMode || isGenerating}
          >
            <span>Generate Dark Mode</span>
            <Badge variant="secondary" className="text-xs">
              {missingDarkMode}
            </Badge>
          </DropdownMenuItem>
        )}
        
        {/* States Generation */}
        {missingStates > 0 && onGenerateStates && (
          <DropdownMenuItem
            onClick={onGenerateStates}
            className="flex items-center justify-between cursor-pointer"
            disabled={isGeneratingStates || isGenerating}
          >
            <span>Generate States</span>
            <Badge variant="secondary" className="text-xs">
              {missingStates}
            </Badge>
          </DropdownMenuItem>
        )}
        
        {/* Accessibility Fix */}
        {!hasTextMain && onFixAccessibility && (
          <DropdownMenuItem
            onClick={onFixAccessibility}
            className="flex items-center justify-between cursor-pointer"
            disabled={isFixingAccessibility || isGenerating}
          >
            <span>Fix Accessibility</span>
            <Badge variant="destructive" className="text-xs">
              !
            </Badge>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleGenerateAll}
          className="flex items-center justify-between cursor-pointer font-medium"
          disabled={isGenerating}
        >
          <span>Generate All Missing</span>
          <Badge variant="outline" className="text-xs">
            {missingCategories.reduce((sum, cat) => sum + cat.count, 0)}
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SmartStyleGenerator;