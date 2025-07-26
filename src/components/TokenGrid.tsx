import React, { useState, useMemo } from 'react';
import { Palette, Edit2, Copy, Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ColorToken } from './MagicStyles';

interface TokenGridProps {
  tokens: ColorToken[];
  isDarkMode: boolean;
  onTokensUpdate: (tokens: ColorToken[]) => void;
}

interface TokenCardProps {
  token: ColorToken;
  isDarkMode: boolean;
  onUpdate: (updatedToken: ColorToken) => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, isDarkMode, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ light: token.light, dark: token.dark });
  const [copied, setCopied] = useState<'light' | 'dark' | null>(null);

  const currentColor = isDarkMode ? token.dark : token.light;
  const currentValue = isDarkMode ? editValues.dark : editValues.light;

  const handleSave = () => {
    onUpdate({ ...token, ...editValues });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({ light: token.light, dark: token.dark });
    setIsEditing(false);
  };

  const copyToClipboard = async (value: string, type: 'light' | 'dark') => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 1000);
  };

  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  return (
    <Card className="p-4 bg-surface-elevated border-border hover:shadow-medium transition-all">
      <div className="space-y-3">
        {/* Color Preview */}
        <div 
          className="w-full h-24 rounded-lg border-2 border-border relative overflow-hidden"
          style={{ backgroundColor: currentColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
          <div className="absolute top-2 left-2">
            <Badge 
              variant="secondary" 
              className="bg-black/30 text-white border-white/20 backdrop-blur-sm"
            >
              {isDarkMode ? 'Dark' : 'Light'}
            </Badge>
          </div>
        </div>

        {/* Token Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-foreground">{token.name}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
          
          {token.category && (
            <Badge variant="outline" className="text-xs mb-2">
              {token.category}
            </Badge>
          )}
        </div>

        {/* Color Values */}
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-text-muted">Light Mode</Label>
              <Input
                value={editValues.light}
                onChange={(e) => setEditValues(prev => ({ ...prev, light: e.target.value }))}
                className={`font-mono text-sm ${!isValidHex(editValues.light) ? 'border-destructive' : ''}`}
                placeholder="#ffffff"
              />
            </div>
            <div>
              <Label className="text-xs text-text-muted">Dark Mode</Label>
              <Input
                value={editValues.dark}
                onChange={(e) => setEditValues(prev => ({ ...prev, dark: e.target.value }))}
                className={`font-mono text-sm ${!isValidHex(editValues.dark) ? 'border-destructive' : ''}`}
                placeholder="#000000"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-border" style={{ backgroundColor: token.light }}></div>
                <code className="text-xs font-mono text-text-muted">{token.light}</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(token.light, 'light')}
                className="h-6 w-6 p-0"
              >
                {copied === 'light' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-border" style={{ backgroundColor: token.dark }}></div>
                <code className="text-xs font-mono text-text-muted">{token.dark}</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(token.dark, 'dark')}
                className="h-6 w-6 p-0"
              >
                {copied === 'dark' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export const TokenGrid: React.FC<TokenGridProps> = ({ tokens, isDarkMode, onTokensUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(tokens.map(token => token.category || 'Other'))];
    return cats.sort();
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || token.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tokens, searchTerm, selectedCategory]);

  const handleTokenUpdate = (updatedToken: ColorToken) => {
    const updatedTokens = tokens.map(token => 
      token.name === updatedToken.name ? updatedToken : token
    );
    onTokensUpdate(updatedTokens);
  };

  if (tokens.length === 0) {
    return (
      <Card className="p-12 text-center bg-surface-elevated">
        <Palette className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No tokens to preview</h3>
        <p className="text-text-muted">Import some color tokens to see them here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Token Preview</h2>
          <p className="text-text-muted">
            Viewing in {isDarkMode ? 'dark' : 'light'} mode • {filteredTokens.length} of {tokens.length} tokens
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-surface-elevated"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              <Filter className="w-3 h-3 mr-1" />
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Token Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTokens.map(token => (
          <TokenCard
            key={token.name}
            token={token}
            isDarkMode={isDarkMode}
            onUpdate={handleTokenUpdate}
          />
        ))}
      </div>

      {filteredTokens.length === 0 && tokens.length > 0 && (
        <Card className="p-8 text-center bg-surface-elevated">
          <h3 className="text-lg font-semibold text-foreground mb-2">No tokens match your filters</h3>
          <p className="text-text-muted mb-4">Try adjusting your search or category filter</p>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
};