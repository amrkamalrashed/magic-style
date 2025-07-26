import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Edit3, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  category: 'heading' | 'body' | 'caption';
}

export interface TypeScaleRatio {
  name: string;
  value: number;
  description: string;
}

interface TextStyleManagerProps {
  textStyles: TextStyle[];
  onTextStylesUpdate: (styles: TextStyle[]) => void;
  onApplyToFramer: () => void;
}

const TYPE_SCALE_RATIOS: TypeScaleRatio[] = [
  { name: 'Minor Second', value: 1.067, description: 'Very subtle progression' },
  { name: 'Major Second', value: 1.125, description: 'Conservative scale' },
  { name: 'Minor Third', value: 1.2, description: 'Balanced scale' },
  { name: 'Major Third', value: 1.25, description: 'Classic typography' },
  { name: 'Perfect Fourth', value: 1.333, description: 'Popular web scale' },
  { name: 'Augmented Fourth', value: 1.414, description: 'More dramatic' },
  { name: 'Perfect Fifth', value: 1.5, description: 'High contrast' },
  { name: 'Golden Ratio', value: 1.618, description: 'Maximum contrast' }
];

export const TextStyleManager: React.FC<TextStyleManagerProps> = ({
  textStyles,
  onTextStylesUpdate,
  onApplyToFramer
}) => {
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [unit, setUnit] = useState<'px' | 'rem'>('px');
  const [typeScaleRatio, setTypeScaleRatio] = useState<number>(1.25);
  const [baseFontSize, setBaseFontSize] = useState<number>(16);
  const [globalFontFamily, setGlobalFontFamily] = useState<string>('Inter');
  const [fontFamilyScope, setFontFamilyScope] = useState<'headings' | 'body' | 'both'>('both');

  const updateTextStyle = (id: string, updates: Partial<TextStyle>) => {
    const updatedStyles = textStyles.map(style =>
      style.id === id ? { ...style, ...updates } : style
    );
    onTextStylesUpdate(updatedStyles);
  };

  const addNewTextStyle = () => {
    const newStyle: TextStyle = {
      id: `text-${Date.now()}`,
      name: 'New Text Style',
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: '0px',
      color: '#000000',
      category: 'body'
    };
    onTextStylesUpdate([...textStyles, newStyle]);
    setEditingStyle(newStyle.id);
  };

  const deleteTextStyle = (id: string) => {
    onTextStylesUpdate(textStyles.filter(style => style.id !== id));
  };

  const generateTypeScale = () => {
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

    const newStyles = textStyleDefinitions.map((def, index) => {
      const fontSize = Math.round(baseFontSize * Math.pow(typeScaleRatio, def.step));
      const letterSpacing = fontSize >= 24 ? '-0.02em' : fontSize >= 20 ? '-0.01em' : '0px';
      
      return {
        id: `text-${Date.now()}-${index}`,
        name: def.name,
        fontFamily: globalFontFamily,
        fontSize: unit === 'rem' ? `${(fontSize / 16).toFixed(2)}rem` : `${fontSize}px`,
        fontWeight: def.weight,
        lineHeight: def.lineHeight.toString(),
        letterSpacing,
        color: textStyles.find(ts => ts.name === 'Text Main')?.color || '#1f2937',
        category: def.category
      };
    });

    // Remove duplicates and merge with existing
    const cleanedStyles = cleanupDuplicates([...textStyles, ...newStyles]);
    onTextStylesUpdate(cleanedStyles);
  };

  const cleanupDuplicates = (styles: TextStyle[]): TextStyle[] => {
    const seen = new Map<string, TextStyle>();
    const duplicates: TextStyle[] = [];

    // First pass: identify duplicates and prefer standard names
    styles.forEach(style => {
      const key = `${style.fontSize}-${style.category}`;
      const existing = seen.get(key);
      
      if (!existing) {
        seen.set(key, style);
      } else {
        // Prefer standard names over generic ones
        const isStandardName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Body L', 'Body M', 'Sub-title', 'Caption'].includes(style.name);
        const existingIsStandardName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Body L', 'Body M', 'Sub-title', 'Caption'].includes(existing.name);
        
        if (isStandardName && !existingIsStandardName) {
          seen.set(key, style);
          duplicates.push(existing);
        } else if (!isStandardName && existingIsStandardName) {
          duplicates.push(style);
        } else {
          // Keep the first one, mark second as duplicate
          duplicates.push(style);
        }
      }
    });

    return Array.from(seen.values());
  };

  const applyGlobalFontFamily = () => {
    const updatedStyles = textStyles.map(style => {
      const shouldUpdate = fontFamilyScope === 'both' || 
        (fontFamilyScope === 'headings' && style.category === 'heading') ||
        (fontFamilyScope === 'body' && (style.category === 'body' || style.category === 'caption'));
      
      return shouldUpdate ? { ...style, fontFamily: globalFontFamily } : style;
    });
    onTextStylesUpdate(updatedStyles);
  };

  const fixLineHeights = () => {
    const updatedStyles = textStyles.map(style => {
      const fontSize = parseFloat(style.fontSize);
      let optimalLineHeight = '1.5';
      
      if (fontSize >= 32) optimalLineHeight = '1.1';
      else if (fontSize >= 24) optimalLineHeight = '1.2';
      else if (fontSize >= 18) optimalLineHeight = '1.4';
      else if (fontSize >= 14) optimalLineHeight = '1.5';
      else optimalLineHeight = '1.3';
      
      return { ...style, lineHeight: optimalLineHeight };
    });
    onTextStylesUpdate(updatedStyles);
  };

  const fixLetterSpacing = () => {
    const updatedStyles = textStyles.map(style => {
      const fontSize = parseFloat(style.fontSize);
      let optimalSpacing = '0px';
      
      if (fontSize >= 32) optimalSpacing = '-0.02em';
      else if (fontSize >= 24) optimalSpacing = '-0.01em';
      else if (fontSize >= 20) optimalSpacing = '-0.005em';
      else optimalSpacing = '0px';
      
      return { ...style, letterSpacing: optimalSpacing };
    });
    onTextStylesUpdate(updatedStyles);
  };

  const toggleUnit = () => {
    const newUnit = unit === 'px' ? 'rem' : 'px';
    setUnit(newUnit);
    
    const updatedStyles = textStyles.map(style => ({
      ...style,
      fontSize: convertUnit(style.fontSize, unit, newUnit),
      letterSpacing: style.letterSpacing.includes('px') ? 
        convertUnit(style.letterSpacing, unit, newUnit) : style.letterSpacing
    }));
    onTextStylesUpdate(updatedStyles);
  };

  const groupedStyles = textStyles.reduce((acc, style) => {
    if (!acc[style.category]) acc[style.category] = [];
    acc[style.category].push(style);
    return acc;
  }, {} as Record<string, TextStyle[]>);

  const convertUnit = (value: string, fromUnit: 'px' | 'rem', toUnit: 'px' | 'rem'): string => {
    const numValue = parseFloat(value);
    if (fromUnit === toUnit) return value;
    
    if (fromUnit === 'px' && toUnit === 'rem') {
      return `${(numValue / 16).toFixed(2)}rem`;
    } else if (fromUnit === 'rem' && toUnit === 'px') {
      return `${(numValue * 16)}px`;
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Text Styles</h3>
            <p className="text-sm text-muted-foreground">{textStyles.length} text styles</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={toggleUnit} variant="outline" size="sm">
              {unit === 'px' ? 'Switch to REM' : 'Switch to PX'}
            </Button>
            <Button onClick={addNewTextStyle} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Style
            </Button>
            <Button onClick={onApplyToFramer} size="sm" className="gap-2">
              <Type className="w-4 h-4" />
              Apply to Framer
            </Button>
          </div>
        </div>

        {/* Type Scale Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="baseFontSize" className="text-sm font-medium">Base Font Size</Label>
            <Input
              id="baseFontSize"
              type="number"
              value={baseFontSize}
              onChange={(e) => setBaseFontSize(Number(e.target.value))}
              className="mt-1"
              min="8"
              max="32"
            />
          </div>
          <div>
            <Label htmlFor="typeScale" className="text-sm font-medium">Type Scale Ratio</Label>
            <Select value={typeScaleRatio.toString()} onValueChange={(value) => setTypeScaleRatio(Number(value))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_SCALE_RATIOS.map(ratio => (
                  <SelectItem key={ratio.value} value={ratio.value.toString()}>
                    {ratio.name} ({ratio.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="globalFont" className="text-sm font-medium">Global Font Family</Label>
            <Input
              id="globalFont"
              value={globalFontFamily}
              onChange={(e) => setGlobalFontFamily(e.target.value)}
              className="mt-1"
              placeholder="Inter, Roboto, etc."
            />
          </div>
          <div>
            <Label htmlFor="fontScope" className="text-sm font-medium">Apply To</Label>
            <Select value={fontFamilyScope} onValueChange={(value: 'headings' | 'body' | 'both') => setFontFamilyScope(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="headings">Headings Only</SelectItem>
                <SelectItem value="body">Body Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateTypeScale} variant="outline" size="sm" className="gap-2">
            <Type className="w-4 h-4" />
            Regenerate Scale
          </Button>
          <Button onClick={applyGlobalFontFamily} variant="outline" size="sm">
            Apply Font Family
          </Button>
          <Button onClick={fixLineHeights} variant="outline" size="sm">
            Fix Line Heights
          </Button>
          <Button onClick={fixLetterSpacing} variant="outline" size="sm">
            Fix Letter Spacing
          </Button>
        </div>
      </div>

      {/* Text Styles by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="heading">Headings</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="caption">Captions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedStyles).map(([category, styles]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-foreground capitalize">{category}</h4>
              <div className="grid gap-3">
                {styles.map(style => (
                  <TextStyleCard
                    key={style.id}
                    style={style}
                    isEditing={editingStyle === style.id}
                    unit={unit}
                    onEdit={() => setEditingStyle(style.id)}
                    onSave={() => setEditingStyle(null)}
                    onUpdate={(updates) => updateTextStyle(style.id, updates)}
                    onDelete={() => deleteTextStyle(style.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {Object.entries(groupedStyles).map(([category, styles]) => (
          <TabsContent key={category} value={category} className="space-y-3">
            {styles.map(style => (
              <TextStyleCard
                key={style.id}
                style={style}
                isEditing={editingStyle === style.id}
                unit={unit}
                onEdit={() => setEditingStyle(style.id)}
                onSave={() => setEditingStyle(null)}
                onUpdate={(updates) => updateTextStyle(style.id, updates)}
                onDelete={() => deleteTextStyle(style.id)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface TextStyleCardProps {
  style: TextStyle;
  isEditing: boolean;
  unit: 'px' | 'rem';
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updates: Partial<TextStyle>) => void;
  onDelete: () => void;
}

const TextStyleCard: React.FC<TextStyleCardProps> = ({
  style,
  isEditing,
  unit,
  onEdit,
  onSave,
  onUpdate,
  onDelete
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={style.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={style.category}
                    onValueChange={(value: any) => onUpdate({ category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heading">Heading</SelectItem>
                      <SelectItem value="body">Body</SelectItem>
                      <SelectItem value="caption">Caption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Input
                    id="fontFamily"
                    value={style.fontFamily}
                    onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fontSize">Font Size ({unit})</Label>
                  <Input
                    id="fontSize"
                    value={style.fontSize}
                    onChange={(e) => onUpdate({ fontSize: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fontWeight">Weight</Label>
                  <Input
                    id="fontWeight"
                    type="number"
                    value={style.fontWeight}
                    onChange={(e) => onUpdate({ fontWeight: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="lineHeight">Line Height</Label>
                  <Input
                    id="lineHeight"
                    value={style.lineHeight}
                    onChange={(e) => onUpdate({ lineHeight: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="letterSpacing">Letter Spacing ({unit})</Label>
                  <Input
                    id="letterSpacing"
                    value={style.letterSpacing}
                    onChange={(e) => onUpdate({ letterSpacing: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={onSave} size="sm">Save</Button>
                <Button onClick={onDelete} variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{style.name}</h4>
                <Badge variant="outline" className="text-xs">{style.category}</Badge>
              </div>
              <div 
                className="text-2xl"
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
              <div className="text-xs text-muted-foreground">
                {style.fontFamily} • {style.fontSize} • {style.fontWeight} • {style.lineHeight} • {style.letterSpacing}
              </div>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <Button onClick={onEdit} variant="ghost" size="sm">
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TextStyleManager;