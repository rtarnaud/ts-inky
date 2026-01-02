# @rtarnaud/ts-inky

A modern TypeScript implementation of [Inky](https://get.foundation/emails), the templating language used to create responsive HTML emails with Foundation for Emails.

## Installation

```bash
npm install @rtarnaud/ts-inky
```

## Usage

```typescript
import Inky from '@rtarnaud/ts-inky';

const inky = new Inky();
const html = '<container><row><columns>Put content in me!</columns></row></container>';
const output = inky.releaseTheKraken(html);
console.log(output);
```

This will transform your Inky markup into responsive HTML tables suitable for email clients:

```html
<table align="center" class="container">
  <tbody>
    <tr>
      <td>
        <table class="row">
          <tbody>
            <tr>
              <th class="small-12 large-12 columns first last">
                <table>
                  <tbody>
                    <tr>
                      <th>Put content in me!</th>
                      <th class="expander"></th>
                    </tr>
                  </tbody>
                </table>
              </th>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
```

## Features

- 🚀 Modern TypeScript implementation with full type safety
- 📧 Full Inky component support
- 🎨 Responsive email templates optimized for all email clients
- ⚡ Fast and efficient parsing using Cheerio
- 🛠️ Type-safe API with comprehensive TypeScript definitions
- ✅ Extensively tested with Jest

## Configuration

You can customize the behavior by passing options to the Inky constructor:

```typescript
const inky = new Inky({
  columnCount: 12,        // Number of columns in the grid (default: 12)
  components: {           // Optional: Custom component tag names
    button: 'my-button',
    row: 'my-row',
    // ... other component overrides
  },
  cheerio: {}             // Optional: Custom Cheerio options
});
```

All options are optional. The default configuration uses 12 columns and standard Inky component names (`button`, `row`, `columns`, `container`, `callout`, `menu`, `spacer`, `wrapper`, `center`, `block-grid`, `h-line`, `item`).

## Components

Supported Inky components:

- `<container>` - Creates a responsive container (max-width: 580px)
- `<row>` - Creates a row for columns
- `<columns>` - Creates responsive columns (supports `small`, `large` attributes)
- `<button>` - Creates responsive buttons with proper email styling
- `<menu>` - Creates horizontal menus for navigation
- `<menu-item>` - Individual menu items
- `<callout>` - Creates callout panels for highlighting content
- `<spacer>` - Adds vertical spacing (supports `size`, `size-sm`, `size-lg` attributes)
- `<wrapper>` - Creates a wrapper element for full-width sections
- `<center>` - Centers content
- `<block-grid>` - Creates block grids for image galleries
- `<h-line>` - Creates horizontal lines

## API Reference

### `new Inky(options?)`

Creates a new Inky instance with optional configuration.

### `inky.releaseTheKraken(htmlString: string): string`

Transforms Inky markup into responsive HTML. Pass your HTML string containing Inky components, and it returns the compiled HTML suitable for email clients.

## Development

### Building

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist` directory.

### Testing

```bash
npm test
```

Runs the Jest test suite.

### Formatting

```bash
npm run format
```

Formats code using Prettier.

## Repository

- **GitHub**: [rtarnaud/ts-inky](https://github.com/rtarnaud/ts-inky)
- **Issues**: [Report bugs](https://github.com/rtarnaud/ts-inky/issues)

## License

[CC0-1.0](LICENSE) - Public Domain

## Credits

Based on the original [Inky](https://github.com/foundation/inky) project by ZURB. Reimplemented in modern TypeScript by [rtarnaud](https://github.com/rtarnaud).
