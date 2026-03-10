# Font Awesome Setup & Usage Guide

Font Awesome has been successfully set up in your Angular 21 project.

## What's Installed

- **@fortawesome/fontawesome-free** - Free icon set (5,000+ icons)
- **@fortawesome/angular-fontawesome** - Angular wrapper for Font Awesome
- **@fortawesome/fontawesome-svg-core** - Core SVG engine
- **@fortawesome/free-solid-svg-icons** - Solid style icons
- **@fortawesome/free-regular-svg-icons** - Regular style icons

## Configuration Files

### 1. **src/styles.css**
- Font Awesome CSS is imported globally
- All icons are available throughout your app

### 2. **src/app/app.ts**
- FontAwesomeModule is imported
- Icon library is initialized on app startup

### 3. **src/app/config/font-awesome.config.ts**
- Pre-configured with commonly used icons
- `FONT_AWESOME_ICONS` constant maps icon names for easy reference
- Call `initFontAwesome()` to load icons into the library

## Basic Usage

### In a Standalone Component

```typescript
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [FontAwesomeModule],
  template: `
    <fa-icon [icon]="faHome"></fa-icon>
    <fa-icon [icon]="faPlus"></fa-icon>
    <fa-icon [icon]="faEdit"></fa-icon>
  `
})
export class ExampleComponent {
  faHome = faHome;
  faPlus = faPlus;
  faEdit = faEdit;
}
```

### Icon Size Options

```html
<!-- Normal/default size -->
<fa-icon [icon]="faHome"></fa-icon>

<!-- Predefined sizes -->
<fa-icon [icon]="faHome" size="xs"></fa-icon>
<fa-icon [icon]="faHome" size="sm"></fa-icon>
<fa-icon [icon]="faHome" size="lg"></fa-icon>
<fa-icon [icon]="faHome" size="2x"></fa-icon>
<fa-icon [icon]="faHome" size="3x"></fa-icon>

<!-- Or use Tailwind classes for customized sizing -->
<fa-icon [icon]="faHome" class="text-2xl"></fa-icon>
<fa-icon [icon]="faHome" class="text-4xl"></fa-icon>
```

### Icon Colors

```html
<!-- Using Tailwind CSS classes -->
<fa-icon [icon]="faHome" class="text-blue-500"></fa-icon>
<fa-icon [icon]="faHome" class="text-red-500"></fa-icon>
<fa-icon [icon]="faHome" class="text-green-500"></fa-icon>

<!-- Using inline styles -->
<fa-icon [icon]="faHome" style="color: #327fa8;"></fa-icon>
```

### Icon Animations

```html
<!-- Spin animation -->
<fa-icon [icon]="faSpinner" [spin]="true"></fa-icon>

<!-- Pulse animation -->
<fa-icon [icon]="faSpinner" [pulse]="true"></fa-icon>
```

### Icons in Buttons

```html
<button class="btn btn-primary">
  <fa-icon [icon]="faPlus" class="mr-2"></fa-icon>
  Add New Item
</button>

<button class="btn btn-secondary">
  <fa-icon [icon]="faEdit"></fa-icon>
</button>

<button class="btn btn-danger">
  <fa-icon [icon]="faTrash"></fa-icon>
  Delete
</button>
```

### Using Pre-configured Icons

To use icons from the `FONT_AWESOME_ICONS` constant:

```typescript
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FONT_AWESOME_ICONS } from '@app/config/font-awesome.config';
import { faHome } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [FontAwesomeModule],
  template: `
    <!-- Using constant for readability -->
    <fa-icon 
      [icon]="faPlusIcon"
      [attr.aria-label]="'Add new item'"
    ></fa-icon>
  `
})
export class MyComponent {
  faPlusIcon = faPlusIcon; // Import from @fortawesome/free-solid-svg-icons
  readonly iconNames = FONT_AWESOME_ICONS;
}
```

## Adding More Icons

To add icons not in the pre-configured list:

1. **Import the icon** from @fortawesome/free-solid-svg-icons:
   ```typescript
   import { faTruck, faBox } from '@fortawesome/free-solid-svg-icons';
   ```

2. **Add to library** in src/app/config/font-awesome.config.ts:
   ```typescript
   export function initFontAwesome() {
     library.add(
       faTruck,
       faBox,
       // ... other icons
     );
   }
   ```

3. **Use in component**:
   ```typescript
   export class MyComponent {
     faTruck = faTruck;
     faBox = faBox;
   }
   ```

## Available Icon Sets

### Solid Icons (@fortawesome/free-solid-svg-icons)
The default and most comprehensive set. Examples:
- Navigation: faHome, faSearch, faBars, faChevronLeft, faChevronRight
- Actions: faPlus, faEdit, faTrash, faSave, faDownload
- Status: faCheck, faExclamationTriangle, faSpinner
- Business: faTruck, faBox, faMap, faDollarSign

### Regular Icons (@fortawesome/free-regular-svg-icons)
```typescript
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
```

## Accessibility

Always add aria-labels to icons for screen readers:

```html
<fa-icon 
  [icon]="faHome" 
  [attr.aria-label]="'Home'"
></fa-icon>

<button (click)="deleteItem()">
  <fa-icon 
    [icon]="faTrash"
    [attr.aria-label]="'Delete item'"
  ></fa-icon>
</button>
```

## Example Component

See [font-awesome-example.component.ts](../shared/components/font-awesome-example/font-awesome-example.component.ts) for a working example.

## Documentation

- [Font Awesome Official Docs](https://fontawesome.com/docs)
- [Angular Font Awesome](https://github.com/FortAwesome/angular-fontawesome)
- [Icon Search](https://fontawesome.com/icons) - Browse all available icons

## Troubleshooting

### Icons not appearing
1. Ensure `initFontAwesome()` is called in app.ts or app.config.ts
2. Check that FontAwesomeModule is imported in your component
3. Verify the icon name is correct in @fortawesome/free-solid-svg-icons

### Performance
- Only import icons you actually use
- Consider using tree-shaking to remove unused icons in production

### Version Control
If you encounter any issues, check that you're using compatible versions:
```bash
npm list @fortawesome/angular-fontawesome @angular/core
```
