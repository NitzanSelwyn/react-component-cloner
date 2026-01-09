# React Component Cloner

A Chrome extension that clones React components from any website using React Fiber internals to create 1:1 JSX copies.

## Features (Planned)

- 🔍 **Visual Inspector** - Hover and click to select React components on any page
- ⚛️ **Fiber-based Extraction** - Uses React Fiber internals for accurate component cloning
- 📝 **JSX Generation** - Generates clean, formatted JSX/TSX code
- 🎨 **Style Extraction** - Captures styles (inline, CSS modules, styled-components, Tailwind)
- 👁️ **Live Preview** - Preview cloned components before copying
- 📋 **Copy to Clipboard** - One-click copy with multiple export formats
- 🔧 **Customizable Output** - Choose between JavaScript/TypeScript, styling approaches

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Chrome browser (or any Chromium-based browser)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-component-cloner
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

### Development Mode

Run in development mode with hot reload:
```bash
npm run dev
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project

### Project Structure

```
react-component-cloner/
├── src/
│   ├── content/          # Content scripts (injected into web pages)
│   ├── background/       # Background service worker
│   ├── popup/            # Extension popup UI
│   ├── components/       # Shared React components
│   ├── lib/              # Core libraries
│   │   ├── fiber-utils/      # React Fiber utilities
│   │   ├── code-generator/   # JSX/code generation
│   │   └── style-extractor/  # CSS/style extraction
│   └── types/            # TypeScript type definitions
├── public/
│   ├── icons/            # Extension icons
│   └── manifest.json     # Chrome extension manifest
├── dist/                 # Build output (generated)
└── WORK_PLAN.md         # Detailed implementation plan
```

## How It Works

1. **React Detection** - Detects React on the page via `__reactFiber$` properties on DOM nodes
2. **Fiber Tree Traversal** - Navigates the React Fiber tree to extract component information
3. **Component Analysis** - Extracts props, state, children, and component metadata
4. **Style Extraction** - Captures computed styles and detects styling approach
5. **Code Generation** - Converts Fiber nodes to clean JSX/TSX code
6. **Preview & Export** - Shows live preview and provides copy/export options

## Technology Stack

- **TypeScript** - Type-safe development
- **React** - UI for popup and preview panels
- **Vite** - Fast build tool
- **Prettier** - Code formatting for generated code
- **Babel Parser** - AST generation and manipulation
- **PostCSS** - CSS parsing and manipulation

## Development Roadmap

See [WORK_PLAN.md](./WORK_PLAN.md) for the complete development plan.

### ✅ Completed Phases

**Phase 1: Project Setup** - [Details](./PHASE_1_COMPLETE.md)
- [x] Project structure
- [x] TypeScript configuration
- [x] Build setup (Vite)
- [x] Chrome extension manifest

**Phase 2: React Fiber Access & Detection** - [Details](./PHASE_2_COMPLETE.md)
- [x] Fiber accessor utilities (get fiber from DOM)
- [x] Fiber tree traversal functions
- [x] Component type identifier
- [x] Metadata extractor (props, state, context)
- [x] Hooks state extractor
- [x] Content script integration

**Phase 3: Component Inspector UI** - [Details](./PHASE_3_COMPLETE.md)
- [x] Visual overlay with hover highlighting
- [x] Component tooltip on hover
- [x] Click to select components
- [x] Component information panel
- [x] Keyboard shortcuts (ESC, arrow keys)
- [x] Parent/child component navigation

**Phase 4: Style Extraction System** - [Details](./PHASE_4_COMPLETE.md)
- [x] Style extractor (inline, computed, classes)
- [x] Styling strategy detector (Tailwind, CSS Modules, styled-components)
- [x] CSS code generator (5 formats)
- [x] Asset extractor (images, fonts)
- [x] CSS optimization and grouping
- [x] Integration with ComponentInfo

### Current Phase: Phase 5 - Code Generation Engine 🚧

### Next Steps

- [ ] Phase 5: Code Generation Engine
- [ ] Phase 6: Live Preview Feature
- [ ] Phase 7: Copy & Export Functionality

## Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Production build
- `npm run type-check` - TypeScript type checking
- `npm run lint` - Lint code with ESLint

## Contributing

This project is currently in early development. Contributions, ideas, and feedback are welcome!

## License

MIT

## Disclaimer

This extension is for learning and development purposes. Always respect intellectual property and licensing when using cloned components. Use cloned components as reference/starting point, not for production copy-paste.

---

**Note:** This project is under active development. Many features are planned but not yet implemented. See WORK_PLAN.md for details.
