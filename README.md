# Magic Styles - Framer Plugin

A powerful Framer plugin for managing color tokens and checking accessibility. Import, preview, edit, and apply design tokens directly to your Framer projects.

## Features

🎨 **Token Management**: Import JSON color tokens and preview them visually
🔍 **Accessibility Checker**: WCAG contrast ratio validation  
✨ **Framer Integration**: Apply styles directly to your Framer project
🌗 **Light/Dark Mode**: Support for dual-theme design tokens
📤 **Multi-format Export**: Export to CSS, Tailwind, SCSS, and more

## Development

### Prerequisites
- Node.js 18+
- Framer Desktop app

### Setup
1. Clone this repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. In Framer, go to Plugins → Development → Load Plugin from URL
5. Enter: `http://localhost:4321`

### Building for Production
1. Run `npm run build`
2. Upload the built files to your hosting provider
3. Update the `main` URL in `manifest.json`

## JSON Token Format

```json
{
  "colors": [
    {
      "id": "unique-id",
      "name": "Primary",
      "light": "rgb(168, 255, 214)",
      "dark": "rgb(168, 255, 214)", 
      "path": "/Brand/Primary"
    }
  ]
}
```

## Usage

1. **Import**: Upload your JSON token file or load existing Framer styles
2. **Preview**: View all tokens in an organized grid with live preview
3. **Check**: Validate accessibility with automatic contrast ratio checking
4. **Apply**: Push tokens directly to your Framer project as Color Styles
5. **Export**: Export to various formats (CSS, Tailwind, SCSS, etc.)

## Plugin Structure

- `manifest.json` - Plugin configuration and permissions
- `src/` - React application source code
- `dist/` - Built plugin files

## Permissions

This plugin requires:
- `read:styles` - To load existing Color Styles from your project  
- `write:styles` - To create and update Color Styles in your project