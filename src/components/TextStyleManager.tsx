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
  category: 'heading' | 'body' | 'caption' | 'display';
}

interface TextStyleManagerProps {
  textStyles: TextStyle[];
  onTextStylesUpdate: (styles: TextStyle[]) => void;
  onApplyToFramer: () => void;
}

export const TextStyleManager: React.FC<TextStyleManagerProps> = ({
  textStyles,
  onTextStylesUpdate,
  onApplyToFramer
}) => {
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [unit, setUnit] = useState<'px' | 'rem'>('px');

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Text Styles</h3>
          <p className="text-sm text-muted-foreground">{textStyles.length} text styles</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={unit} onValueChange={(value: 'px' | 'rem') => setUnit(value)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="px">px</SelectItem>
              <SelectItem value="rem">rem</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Text Styles by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="heading">Headings</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="caption">Captions</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
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
                      <SelectItem value="display">Display</SelectItem>
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