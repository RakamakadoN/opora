# Mobile-First Shell Design

## Goal

Make the app readable and usable on narrow mobile viewports first, then let tablet/desktop reuse the same layout with larger constraints.

The current issue is systemic: several screens are visually clipped on the right side, the role switcher overlaps page content, and the six-item bottom navigation is too dense for narrow phones. The first implementation pass should fix the shared shell and the most visible mobile breakpoints without rewriting every feature screen.

## Scope

This pass covers:

- App shell sizing and overflow rules.
- Auth and onboarding readability.
- Top role switcher placement.
- Bottom navigation behavior.
- Shared card, form, chip, and action wrapping rules.
- Visual verification of main parent tabs: Navigator, Assistant, Tracker, Directory, Community, Profile.

This pass does not redesign product flows, change data models, or remove existing sections.

## Architecture

The implementation should keep the existing React structure and Tailwind utility style. Most changes should live in:

- `src/App.tsx` for shell and bottom navigation.
- `src/components/AuthScreen.tsx` for first-screen mobile layout.
- `src/components/Onboarding.tsx` for mobile onboarding layout.
- `src/index.css` for reusable mobile-first safeguards and shared component behavior.

If a specific tab still overflows after shared rules, apply small local class fixes in that component. Avoid broad feature refactors in this pass.

## Mobile Shell

On mobile, the app should behave as a full-width app, not as a fixed phone mockup inside another phone. The device-frame presentation can remain for larger screens.

Rules:

- Mobile container uses `width: 100%`, `max-width: none`, and `height: 100dvh`.
- Framed max-width, rounded corners, and border apply only from the `sm` breakpoint upward.
- All major layout children can shrink with `min-width: 0`.
- Text uses `overflow-wrap: anywhere` where long Russian/Kazakh/English mixed strings can otherwise force horizontal overflow.
- Page content gets enough bottom padding to avoid being hidden by bottom nav.

## Top Role Switcher

The role switcher must not be absolutely positioned over headings.

Preferred design:

- Place it in normal document flow at the top of `main`.
- Keep it compact and right-aligned where there is room.
- On very narrow screens, allow wrapping or full-width segmented behavior.

The switcher should remain visible near the top, but content readability is more important than overlay behavior.

## Bottom Navigation

The existing six parent tabs are too tight on narrow phones.

First implementation choice:

- Keep all tabs available.
- Make the nav horizontally scrollable on very narrow widths.
- Preserve stable tap targets of at least about 44px height.
- Prevent nav items from shrinking below their readable minimum.
- Hide scrollbars visually, matching the existing app style.

This avoids changing information architecture during the first pass. A four-tab plus "Еще" pattern is explicitly out of scope for this implementation and should be handled as a separate product decision if needed.

## Screen Rules

Auth and onboarding:

- No clipped headings or form controls.
- Content should scroll if vertical space is tight.
- Primary action remains reachable at the bottom without covering content.
- Long labels and segmented controls wrap cleanly.

Navigator, Assistant, Tracker:

- Cards stay one-column on mobile.
- CTA rows can wrap.
- Dense tab/chip rows can scroll horizontally or wrap, depending on the local component.

Directory:

- Search, city select, category chips, and cards must not create horizontal overflow.
- Long institution names, addresses, verification links, and descriptions wrap.
- Cards remain scannable without forcing side-by-side layout.

Community:

- Post cards and replies should fit within viewport width.
- Header actions should not push the title off-screen.
- Reply boxes and meta rows can wrap.

Profile:

- Account card, child selector, "Add child", and edit actions must wrap without clipping.
- Profile cards stay one-column.
- Form fields and journal controls fit narrow phones.

## Testing And Verification

Run:

- `npm run lint`
- `npm run build`

Visual checks:

- Open the app at a narrow mobile viewport around 297-320 CSS px.
- Confirm no document-level horizontal overflow.
- Confirm Auth and Onboarding headings are readable.
- Confirm role switcher no longer overlaps page titles.
- Confirm bottom nav is usable on all parent tabs.
- Confirm main parent tabs render without clipped primary content.

## Acceptance Criteria

- No main screen is clipped on the right at narrow mobile widths.
- Role switcher does not cover headings or primary content.
- Bottom nav remains usable with all existing tabs.
- Long Russian text, addresses, and CTA labels wrap instead of forcing overflow.
- Build and TypeScript lint pass.
