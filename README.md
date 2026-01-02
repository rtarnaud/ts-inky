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
const html = '<container><row><columns>Hello World!</columns></row></container>';
const output = inky.releaseTheKraken(html);
console.log(output);
```

## Features

- 🚀 Modern TypeScript implementation
- 📧 Full Inky component support
- 🎨 Responsive email templates
- ⚡ Fast and efficient parsing
- 🛠️ Type-safe API

## Configuration

You can customize the behavior by passing options:

```typescript
const inky = new Inky({
  columnCount: 12,
  components: {
    // Custom component mappings
  }
});
```

## Components

Supported Inky components:
- `<container>` - Creates a responsive container
- `<row>` - Creates a row for columns
- `<columns>` - Creates responsive columns
- `<button>` - Creates responsive buttons
- `<menu>` - Creates horizontal menus
- `<callout>` - Creates callout panels
- `<spacer>` - Adds vertical spacing

## License

CC0-1.0

## Credits

Based on the original [Inky](https://github.com/foundation/inky) project by ZURB.
