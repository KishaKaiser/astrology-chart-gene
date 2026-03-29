# Planning Guide

A professional astrology software platform called "Psychic Link Charts" that generates accurate natal charts with comprehensive planetary calculations, house systems, and aspects, allowing astrologers to save, edit, and export charts in PDF format for client readings.

**Experience Qualities**:
1. **Mystical yet Professional** - Combines celestial aesthetics with clean, business-ready presentation that balances spiritual wonder with technical precision
2. **Intuitive and Accessible** - Complex astrological calculations presented through clear visualizations that both professional astrologers and clients can understand
3. **Empowering and Precise** - Provides complete control over chart details with accurate astronomical data that inspires confidence in readings

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a sophisticated tool requiring astronomical calculations, data visualization, persistent storage, PDF generation, and multiple editing capabilities. It combines computational complexity with rich user interaction across chart generation, editing, and export workflows.

## Essential Features

**Chart Generation**
- Functionality: Calculate and display natal chart based on birth date, time, and location with planetary positions, houses, and aspects
- Purpose: Core feature that provides the foundational astrological data for readings
- Trigger: User inputs birth details (date, time, location) and clicks generate
- Progression: Input form → Location validation → Astronomical calculation → Visual chart rendering → Display chart with data tables
- Success criteria: Chart displays accurate planetary positions (within 1° accuracy), correct house cusps for selected system, and major aspects with orbs

**Transit Tracking**
- Functionality: Calculate and display current planetary positions overlaid on natal charts with visual distinction between natal and transit positions
- Purpose: Allows astrologers to analyze current planetary influences on natal chart positions for predictive readings
- Trigger: User toggles "Show Transits" switch on chart view
- Progression: Chart view → Enable transits → Calculate current positions → Overlay on chart wheel → Display transit table
- Success criteria: Transit planets appear in distinct color/style, correct house placement relative to natal chart, timestamp shows calculation time, seamless toggle on/off

**Chart Library Management**
- Functionality: Save generated charts with client names and notes, view all saved charts, search and filter charts
- Purpose: Enables astrologers to build a client database for ongoing readings and reference
- Trigger: User clicks save button on generated chart or accesses library view
- Progression: Save: Chart view → Name/notes dialog → Save to storage → Confirmation → Library: Main view → Charts grid → Click chart → Load chart details
- Success criteria: Charts persist between sessions, searchable by name, load correctly with all original calculations intact

**Chart Editing**
- Functionality: Modify chart details (name, notes, birth data), recalculate with different house systems, adjust orb settings
- Purpose: Allows refinement of charts and exploration of different astrological techniques
- Trigger: User clicks edit button on saved chart
- Progression: Chart view → Edit mode → Modify fields → Apply changes → Recalculate if needed → Save updated chart
- Success criteria: Changes persist correctly, recalculation updates all dependent data, original chart preserved until save

**PDF Export**
- Functionality: Generate professional PDF document with chart wheel, aspect grid, planetary positions table, and custom notes
- Purpose: Creates shareable, printable documents for client delivery and physical records
- Trigger: User clicks export/print button on chart view
- Progression: Chart view → Export options dialog → Select elements to include → Generate PDF → Download/print dialog
- Success criteria: PDF contains high-quality chart image, readable tables, maintains branding, prints correctly

## Edge Case Handling

- **Invalid Birth Data**: Display clear validation errors for impossible dates, future dates, or missing required fields with helpful correction prompts
- **Location Lookup Failures**: Provide manual latitude/longitude input fallback when city search fails or returns no results
- **Midnight/Boundary Times**: Handle births at exactly 00:00 or during timezone transitions with clear date disambiguation
- **Southern Hemisphere**: Correctly calculate house systems and seasonal considerations for southern latitudes
- **Missing Birth Time**: Offer solar chart option (noon) with clear indication that houses are approximate
- **PDF Generation Errors**: Gracefully handle browser limitations, show progress indicators, offer retry options
- **Large Chart Libraries**: Implement pagination or virtual scrolling for users with 100+ saved charts
- **Concurrent Edits**: Prevent data loss by saving chart state before navigation or showing unsaved changes warning

## Design Direction

The design should evoke celestial wonder and ancient wisdom while maintaining modern professional credibility. Think of a contemporary observatory meets luxury stationery - deep cosmic backgrounds with precise technical overlays, elegant typography that feels both timeless and refined, and interactions that feel like navigating through the stars themselves.

## Color Selection

A sophisticated celestial palette anchored by deep cosmic blues and purples with luminous accent highlights that evoke starlight and planetary energies.

- **Primary Color**: Deep Cosmic Indigo (oklch(0.25 0.08 270)) - Represents the depth of space and mystical knowledge, used for primary actions and chart backgrounds
- **Secondary Colors**: Rich Midnight Blue (oklch(0.18 0.05 260)) for cards and panels, Soft Celestial Purple (oklch(0.35 0.06 285)) for secondary UI elements
- **Accent Color**: Luminous Star Gold (oklch(0.78 0.15 85)) - Bright celestial highlight for CTAs, active states, and key planetary markers that draws the eye like a bright star
- **Foreground/Background Pairings**: 
  - Background Deep Indigo (oklch(0.15 0.08 270)): White text (oklch(0.98 0 0)) - Ratio 11.2:1 ✓
  - Primary Cosmic Indigo (oklch(0.25 0.08 270)): White text (oklch(0.98 0 0)) - Ratio 7.8:1 ✓
  - Card Midnight Blue (oklch(0.18 0.05 260)): White text (oklch(0.98 0 0)) - Ratio 9.5:1 ✓
  - Accent Star Gold (oklch(0.78 0.15 85)): Deep Indigo text (oklch(0.15 0.08 270)) - Ratio 8.1:1 ✓

## Font Selection

Typography should bridge ancient astronomical texts with modern technical precision, using a distinctive serif for headings that evokes classical star charts and a clean technical sans-serif for data that ensures readability of complex calculations.

- **Typographic Hierarchy**: 
  - H1 (App Title/Page Headers): Crimson Pro SemiBold/32px/tight letter-spacing (-0.02em) - Elegant serif that references historical astronomical manuscripts
  - H2 (Section Headers): Crimson Pro SemiBold/24px/normal letter-spacing
  - H3 (Chart Names/Subsections): Crimson Pro Medium/18px/normal letter-spacing
  - Body (Data Tables/Forms): IBM Plex Sans Regular/15px/relaxed line-height (1.6) - Technical clarity for numerical data
  - Labels/Captions: IBM Plex Sans Medium/13px/normal letter-spacing - Clear hierarchy for form fields
  - Data Values: IBM Plex Mono Regular/14px/tabular figures - Precise alignment for degrees, coordinates, times

## Animations

Animations should feel cosmic and fluid - planets gliding into position, charts rotating gently as they render, and modal transitions that feel like opening ancient tomes or gazing through a telescope. Chart generation should include a subtle sequential reveal of elements (wheel structure → planets → aspects) to create a sense of calculation and cosmic alignment. Hover states on planetary symbols should pulse very subtly like distant stars. All transitions should use gentle easing (0.3-0.4s) to maintain the contemplative, mystical atmosphere while keeping interactions responsive.

## Component Selection

- **Components**: 
  - Dialog for chart creation form and editing workflows with custom backdrop blur
  - Card components for chart library grid with hover elevation effects
  - Tabs for switching between chart view, aspect table, and planetary positions
  - Form components (Input, Label, Select) for birth data entry with validation
  - Button variants: primary (Star Gold) for generate/save, secondary (Midnight) for cancel, ghost for icon actions
  - Scroll Area for long data tables and chart lists
  - Popover for quick info tooltips on planetary symbols and aspects
  - Separator for dividing sections within chart data displays
  - Badge for aspect types (conjunction, trine, square, etc.) with color coding

- **Customizations**: 
  - Custom SVG chart wheel component for zodiac circle with houses, planets, and aspect lines
  - Aspect grid table with colored cells indicating aspect types
  - Location autocomplete search input (using native datalist or custom combobox)
  - PDF preview modal before export
  - Custom loading spinner with rotating celestial motif

- **States**: 
  - Buttons: default (subtle glow), hover (brightness increase + subtle scale 1.02), active (slight press inset), disabled (reduced opacity 0.5)
  - Inputs: default (subtle border), focus (gold ring + border color shift), error (red border + shake animation), filled (slight background tint)
  - Chart cards: default (subtle border), hover (elevation lift + gold border glow), selected (gold border solid)

- **Icon Selection**: 
  - @phosphor-icons/react: Plus for new chart, FloppyDisk for save, PencilSimple for edit, DownloadSimple for PDF export, Printer for print, MagnifyingGlass for search, X for close, Star for favorites, Calendar for date, Clock for time, MapPin for location, List for library view, Grid for grid view

- **Spacing**: 
  - Page padding: p-6 on mobile, p-8 on tablet, p-12 on desktop
  - Card padding: p-6 for content, p-4 for compact lists
  - Form spacing: space-y-4 for form fields, gap-6 for form sections
  - Grid gaps: gap-4 for chart library grid on mobile, gap-6 on desktop
  - Component spacing: gap-2 for button groups, gap-3 for icon+text buttons

- **Mobile**: 
  - Chart creation form: Full-screen dialog on mobile (< 768px) with bottom sheet feel
  - Chart wheel: Scales to fit viewport width with touch zoom/pan gestures disabled initially
  - Library view: Single column grid on mobile, 2 columns on tablet (768px+), 3 columns on desktop (1024px+)
  - Data tables: Horizontal scroll with sticky first column for planetary positions
  - Action buttons: Fixed bottom bar on mobile with primary actions, overflow menu for secondary actions
  - Navigation: Collapsible sidebar on desktop, bottom tab bar on mobile
