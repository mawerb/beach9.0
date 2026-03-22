# Conversation Helper — Frontend Architecture Plan

A complete senior-level plan for an AR-powered real-time conversation assistant. Opinionated, production-grade decisions across stack, AR architecture, accessibility, state management, and demo strategy.

| Platform | AR Layer | Realtime | Users | Demo |
|----------|----------|----------|-------|------|
| Vite + React | WebRTC + Canvas Overlay | WebSocket + Zustand | Dementia · Anxiety · Skills | Browser + Webcam |

---

## 01 — Tech Stack

**Opinionated decisions — with tradeoffs acknowledged**

### The Core Decision: Vite + React

This is a camera-dependent, real-time app that will be demoed in a browser. Vite gives you sub-second HMR, zero-config TypeScript, and the fastest dev loop available. React gives you the ecosystem depth (Zustand, Framer Motion, react-router) and the component model needed for a complex, state-driven UI. No SSR framework needed — this is a client-side SPA with a webcam feed.

| Layer | Choice | Why not alternatives |
|-------|--------|---------------------|
| **Framework** | **Vite + React 18** | Next.js adds SSR overhead you don't need. Plain CRA is deprecated. Vite is the standard for new React SPAs — instant startup, native ESM, built-in TypeScript. |
| **Camera** | **`navigator.mediaDevices.getUserMedia`** | Browser-native webcam access. No library needed. Works in Chrome, Firefox, Safari. Renders into a `<video>` element that the canvas overlay composites on top of. |
| **AR Overlay** | **HTML5 Canvas (2D context) or CSS-positioned divs** | For drawing bounding boxes and tether lines, a `<canvas>` element positioned absolutely over the `<video>` feed works at 60fps. Info cards can be plain React components with CSS `position: absolute` + `backdrop-filter: blur(16px)` — no need for WebGL or Three.js. |
| **State** | **Zustand + immer middleware** | You have a WebSocket feeding real-time updates into global state — face detections, transcript lines, suggestion lists. Redux is ceremonially expensive to wire; Context re-renders the entire tree on every transcript line; Jotai's atom model gets messy with interdependent real-time slices. Zustand gives you selector-based subscriptions that only re-render what changed. |
| **Styling** | **CSS custom properties + CSS Modules** | CSS variables give you a token system that makes user-mode switching (dementia vs anxiety vs skills) trivial — swap a `data-theme` attribute on `<html>`, sizes and spacings recalculate globally. CSS Modules scope styles per component with zero runtime cost. No Tailwind — the design system is bespoke and token-driven. |
| **Navigation** | **react-router-dom v6** | File-based routing isn't needed for 5–6 routes. react-router gives explicit route definitions, nested layouts, and `useParams` for profile/summary screens. |
| **Animation** | **Framer Motion** | Spring-based animations, `AnimatePresence` for enter/exit, `useMotionValue` for tracking interpolation. Respects `prefers-reduced-motion` with one config flag. Replaces Reanimated in the web context. |
| **Icons** | **Phosphor Icons (`@phosphor-icons/react`)** | Consistent optical weight, domain-relevant icons (mic, person, hearing, brain), duotone weight reads well at small sizes on camera feeds. |

### Complete Package List

| Package | Purpose | Critical Note |
|---------|---------|---------------|
| `vite` + `@vitejs/plugin-react` | Build + HMR dev workflow | TypeScript out of the box |
| `react` + `react-dom` v18 | UI framework | Concurrent features for smooth real-time updates |
| `zustand` + `immer` | Global state + real-time slice management | Immer makes transcript append immutable and clean |
| `react-router-dom` v6 | Client-side routing | Routes: `/`, `/camera`, `/people/:id`, `/summary/:id`, `/onboarding` |
| `framer-motion` | Spring animations, enter/exit transitions | Required for card entrance animations, drawer spring |
| `@phosphor-icons/react` | Icon system | Regular weight for UI, Bold for critical actions |
| `reconnecting-websocket` | Auto-reconnect WebSocket client | Exponential backoff — WS drops never require user action |
| CSS custom properties | Design token system + user-mode themes | Configure in `:root` and `[data-theme]` selectors |

> **On the facial recognition stub:** The backend is not ready. Do not wait for it. Define the WebSocket message contract now (see Section 07) and build a `MockFaceDetectionProvider` that emits the same shape on a timer. When the backend delivers, swap the provider — zero UI changes required.

---

## 02 — AR Overlay Design

**Spatial layout, information hierarchy, behavioral states**

### Card Position: Top-Right of Bounding Box, Anchored

The card should appear anchored to the top-right corner of the face bounding box, offset 16px above and 8px to the right. This placement is deliberate:

- **Not above the head** — "above" varies wildly as people move, sit, and stand at different distances. A top-right anchor tracks the bounding box edge, which is stable.
- **Not beside (left or right)** — beside positioning fights with the edge of the frame when the subject is near the side of screen.
- **Not overlapping the face** — users with dementia need to see the face clearly to make the connection between the card name and the person in front of them.

The card connects to the face box via a **1px dashed line** from the card's bottom-left corner to the bounding box top-right corner. This visual tether is critical — without it, floating cards feel ambient and detached rather than about a specific person.

### Information Hierarchy Inside the Card

Visual hierarchy (top to bottom):

1. **Name** — 22px, semibold, full white. Always line 1. Never truncated. This is the only thing a dementia user needs.
2. **Relationship badge** — small pill beside or below the name: "Daughter", "Doctor", "Friend". Colored by category (family = sage, medical = slate, social = rose).
3. **Last conversation topic** — 14px, muted, italic. "Last talked about: Emma's recital." Shown only in anxiety and skills modes — hidden in dementia mode.
4. **Confidence indicator** (optional, demoed only): a subtle 3-dot signal-strength bar in the card's top-right corner. Shows facial match confidence. Pure UX theater for the demo.

Total card width: **220px fixed**. Height: **80px** (dementia) or **100px** (other modes). Do not let cards resize dynamically — cognitive users are disturbed by layout shifts.

### Card Behavior States

| State | Trigger | Visual Behavior | Duration |
|-------|---------|----------------|----------|
| **Entering** | Face first detected | Scale 0.88→1.0 + opacity 0→1, spring easing, card origin at anchor point | 280ms |
| **Tracking** | Person moves | Card position interpolates to new bounding box anchor with 120ms lag (feels attached, not jittery) | Continuous |
| **Occluded** | Face turns 45°+ away | Card fades to 40% opacity. Dashed tether becomes dotted, lighter. Card does not disappear — user may still want the context. | Immediate |
| **Lost** | Face leaves frame for 1.5s+ | Card slides upward and fades out (300ms). Does not vanish abruptly. Transcript saves automatically. | 300ms exit |
| **Multiple faces** | 2+ faces in frame | Show only the highest-confidence card. If confidence is equal, show the closest (largest bounding box). Never show more than 1 card simultaneously. | — |

### Visual Style of the Overlay

- **Background:** `rgba(10, 14, 20, 0.82)` — near-black with high alpha. Not pure black (harsh on camera), not semi-transparent (text unreadable over light backgrounds).
- **Backdrop blur:** `backdrop-filter: blur(16px)` on the card div. Glass-like and modern without fighting the camera image.
- **Border:** `1px solid rgba(255,255,255,0.12)`. Subtle. Just enough to define the card edge.
- **Top accent bar:** 3px height, full card width, color varies by relationship type. Only colored element on the card.
- **Corner radius:** 10px. Softer than sharp (clinical) but not pill-shaped (playful, inappropriate).
- **No drop shadow:** Shadows interact badly with moving camera feeds. The border + blur combination does the same job cleanly.

> **Never animate the info card continuously.** No floating, no pulsing, no breathing effects. Users with dementia and anxiety experience involuntary motion as agitation, not delight. Animate only on state transitions — enter, exit, occlude. Static otherwise.

---

## 03 — Response Suggestion Panel

**Position, interaction model, selection feedback, filtering**

### Position: Persistent Bottom Drawer, Not a Floating HUD

The response panel lives at the bottom of the screen, always, as a persistent drawer. It is never a floating HUD (too easy to accidentally click), a side panel (unreachable), or a modal overlay (blocks the camera). The drawer occupies a fixed **220px** from the bottom edge, giving the camera feed ~60% of the vertical space above it.

When no face is detected, the drawer collapses to a **44px handle strip** ("Waiting for someone to talk to…"). When a face is detected, it springs open. This is not a toggle the user controls — the panel open/close state is driven by face detection state.

### Panel Internal Layout

Top to bottom within the drawer:

1. **Drag handle** — 32×4px centered pill. Affordance for collapsing (click or drag down).
2. **Tone filter pills** — horizontal scroll row: All · Empathetic · Casual · Clever · Serious. Hidden entirely in dementia mode. "All" is default. Switching filters does not re-fetch — client-side filter only.
3. **Suggestion cards** — horizontal scroll row. Cards are **240px wide**, approx **140px tall**. 3 visible, others scroll into view. CSS `scroll-snap-type: x mandatory`.
4. **Scroll indicator dots** — 3–5 dots below the cards showing position.

### Suggestion Card Anatomy

Inside each 240×140px card:

- **Top row:** Tone badge (left) + Type badge (right). Tone badge color: empathetic = sage, casual = slate, clever = amber, serious = ink. Type badge: "Question ↗" or "Statement" in muted ink.
- **Response text:** 16px, 400 weight, line-height 1.5. Max 2 lines with `text-overflow: ellipsis` and `-webkit-line-clamp: 2`.
- **Click affordance:** Subtle bottom-right arrow icon. Entire card surface is the click target.

> Cards are 240px wide to allow spatial selection: left card, center card, right card. Each card maps intuitively to a position, not a label. This helps low-literacy and dementia users who navigate spatially.

### Selection Interaction Model

**Click to select. Nothing else.** Do not implement drag, voice selection, or keyboard shortcuts for the demo — these introduce failure modes in a 3-minute demo.

What happens after click (exact sequence):

1. Card border transitions to sage green (80ms). Card scales to 0.97 (press feel).
2. A "You said:" confirmation line appears in the transcript bar (300ms fade in). Green color. Closes the feedback loop.
3. The suggestion panel **does not close**. It refreshes with the next batch after a 1.2s delay.
4. The selected card animates out leftward (200ms) and is replaced by a new card at the right (slide in 200ms). Other cards remain.

### Filtering Logic

The backend sends 5–8 suggestions per batch, tagged by tone. The frontend filters in-memory — no re-fetch per tone change. Filter state lives in Zustand's `suggestionSlice` as `activeToneFilter: string | null`. `null` = show all. Filtered list is a derived selector, not stored state.

---

## 04 — User Flows

**Every screen state with sufficient detail to wireframe immediately**

### Flow 1: First Launch → Permissions → Idle

1. **Mode Selection Screen** — Full-screen. No header, no nav. Single question centered: "Who is this for?" Three cards, vertically stacked, 64px tall each with 12px gaps. Left icon (colored by mode), title, one-line description. Clicking saves `userMode` to localStorage and proceeds. No skip option.

2. **Permissions Explainer** — Single-screen. Camera icon at top. "We need your camera to identify who's nearby." "We use your microphone to follow the conversation." Single CTA: "Allow Access." On denial, show a recovery screen explaining how to grant permissions in browser settings.

3. **Idle / Camera View** — Full-screen camera feed via `<video>`. Response drawer collapsed to 44px handle at bottom. Status pill at top: pulsing dot + "Looking for someone nearby". No other UI. Should feel like a calm, clear viewfinder.

### Flow 2: Known Face Detected

1. **Recognition Event** (`face_detected`) — Bounding box draws on canvas overlay. Status pill updates to person's name. Info card enters (spring animation, 280ms). WebSocket immediately requests suggestions for this person ID.

2. **Response Panel Opens** (`suggestions`) — 500ms after recognition, panel springs up (350ms). First suggestion batch populates. Transcript bar appears with "Listening…" and recording indicator. Staggered timing: card first, then panel — never simultaneous.

3. **Conversation Loop** — User clicks a suggestion. Transcript receives new lines from STT via WebSocket. New suggestion batches arrive after each exchange. Panel, card, and transcript update independently.

4. **End Conversation** — User clicks the X in the status pill. Confirmation dialog: "End conversation?" with "Save & End" and "Cancel". On confirm: panel collapses, card exits, WebSocket sends `end_conversation`, navigate to Summary screen.

### Flow 3: Unknown Face

1. **Unknown Detection** (`face_unknown`) — Info card appears with "?" avatar and text "New person". Two actions in the card: "Add" button (sage) and "Skip" (muted text). No suggestions load until identified or skipped.

2. **Add Person — Bottom Sheet** — Sheet slides up. Fields: Name (text), Relationship (segmented control: Family / Friend / Colleague / Medical / Other), Notes (optional textarea). "Save" button. On save: profile written to localStorage, WebSocket receives `add_person`, card updates immediately.

### Flow 4: Post-Conversation Summary

Simple single-column layout: person avatar + name at top, duration chip, full transcript as a message thread (alternating "You" / person labels), topics-detected pill row (auto-extracted), and two actions: "View Profile" and "Back to Camera." Read-only.

### Flow 5: Profile & Settings Management

Accessible from a persistent bottom tab bar with three tabs: Camera (main), People (contacts list), Settings. The People tab shows stored profiles as a list — avatar, name, relationship, last conversation date. Clicking opens profile detail: interests, conversation history timeline, edit button. Deleting requires two-step confirmation and sends `delete_person` to backend.

---

## 05 — Accessibility

**WCAG AA minimum — dementia patients as the design constraint, not an afterthought**

### Color Palette — Hex Values + Contrast Ratios

| Name | Hex | Contrast on Paper |
|------|-----|-------------------|
| Paper | `#f5f3ee` | Background |
| Ink | `#1a1a1f` | 19.2:1 |
| Sage | `#4a7c6f` | 4.6:1 |
| Sage Light | `#d4e8e3` | — |
| Sage Dark | `#2d5248` | 9.1:1 (AAA) |
| Slate | `#4a5568` | 5.9:1 |
| AR Dark | `#0a0e14` | Overlay bg |
| Critical | `#c0392b` | 5.1:1 |

All text-on-background combinations exceed WCAG AA (4.5:1). Sage Dark on white exceeds AAA (7:1). The palette is deliberately de-saturated — cognitively sensitive users find high saturation colors agitating.

### Typography System

| Context | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Name on AR card | Jost | 22px (dementia: 26px) | 600 | Never truncated |
| Response text | Jost | 18px (dementia: 20px) | 400 | Never below 18px for dementia users |
| Relationship badge | Jost | 13px | 500 | Uppercase, letter-spacing 0.04em |
| Last topic | Jost | 14px | 300 | Hidden in dementia mode |
| Transcript lines | Jost | 16px | 400 | System font fallback acceptable |
| UI labels / buttons | Jost | 15px (dementia: 18px) | 500 | All button text weight 500+ |

### Cognitive Load Rules by User Mode

**Memory Support (Dementia)**

- Maximum 2 suggestions visible. Never 3–5.
- No tone filter pills. No filtering UI at all. Show only empathetic-tagged suggestions.
- Info card shows name and relationship only. No last topic, no confidence indicator.
- Transcript hidden by default. Visible only if user clicks the mic icon explicitly.
- All animations run at **1.6× duration**. Motion is slower and more predictable.
- Staggered entry: card at T+0, panel at T+1200ms. Never simultaneous reveals.
- All click targets minimum **56×56px**. Suggestion cards expand to full panel height.
- After a suggestion is selected, show "You said:" confirmation for **3s** (not 1.5s).

**Social Comfort (Anxiety)**

- 3 suggestions visible. Tone filter visible.
- Info card shows name, relationship, and last topic.
- Transcript visible and live.
- Subtle "Reading…" indicator when transcript is processing.
- Dismiss animation on selected suggestion is gentle (no flash, no sound).

**Conversation Skills**

- 5 suggestions maximum. All tone filters. Full info card including interests.
- Subtle quality indicator on each response ("This is a great follow-up question ↑").
- After selecting, briefly explain why the suggestion works (one line, 2s, then disappears). Only this mode gets this feature.

### Error States

| Error | Visual Treatment | User Action |
|-------|-----------------|-------------|
| Face not recognized | Bounding box draws in amber (not red). Card shows "New person?" prompt. | None — system handles it |
| Mic not picking up audio | Mic icon shows strikethrough. No error modal. Non-blocking. | Click mic icon |
| WebSocket disconnected | Status pill: "Reconnecting…" with spinner. Suggestions freeze. Auto-reconnect. | None |
| Low confidence recognition | Card border is dashed amber. Name shows with "?" suffix: "Margaret?" | Confirm or dismiss |
| Camera permission denied | Full-screen recovery — illustration + "Camera access is needed" + instructions. | Grant in browser settings |

### One-Handed / Accessible Use

All interactive elements within the bottom 60% of the viewport. The AR card is display-only. The response panel (bottom drawer) is the only place the user clicks. Minimum click target size: 44px (56px in dementia mode).

---

## 06 — Component Architecture

**Every component, grouped by feature, with props and responsibilities**

### AR View Layer

**`ARViewScreen`** — Route: `/camera`
Root screen. Composes `CameraFeed`, `CanvasOverlay`, `StatusPill`, `TranscriptBar`, `ResponseDrawer`. Manages face detection event routing from `useARStore`. Never renders UI directly.
Props: None — reads from Zustand.

**`CameraFeed`** — `<video>` element
Renders a `<video>` element bound to `getUserMedia` stream. Abstracted behind a provider interface so the mock swap is a one-line change.
Props: `onFrame: (FrameResult) => void`

**`CanvasOverlay`** — `<canvas>` + absolute-positioned divs
Full-viewport canvas positioned absolutely over the video feed. Draws: `BoundingBox`, `TetherLine`. Info cards are React components with CSS absolute positioning (allows `backdrop-filter` and rich text). Reads `currentFace` and `currentPerson` from Zustand.
Props: `face: FaceState | null`

**`InfoCard`** — React component (CSS positioned)
Renders rounded-rect background (CSS), accent bar, name text, relationship badge, optional last-topic text. Respects `userMode`. Position interpolated via Framer Motion `useSpring` — card tracks face with 120ms lag.
Props: `person: Person; position: { x: number; y: number }; mode: UserMode`

**`BoundingBox`** — Canvas-drawn
Draws corner brackets (not a full rect) around the face. Animated `strokeDashOffset` on entry for "scanning" sweep effect. Color shifts amber on low confidence.
Props: `box: BoundingBox; confidence: number; state: 'tracking' | 'occluded' | 'lost'`

### Response Suggestion Panel

**`ResponseDrawer`** — Framer Motion animated div
Bottom sheet with collapsed (44px) and expanded (220px) states. State driven by `arStore.panelVisible`. Spring animation on open/close. Houses `ToneFilterRow` and `SuggestionCarousel`.
Props: None — Zustand-driven.

**`SuggestionCarousel`** — Horizontal scroll container
Horizontal scroll with `scroll-snap-type: x mandatory` and `scroll-snap-align: start` on each card. Renders `SuggestionCard` for each filtered suggestion. Handles empty state (skeleton cards). `PositionDots` rendered below.
Props: `suggestions: Suggestion[]; onSelect: (id: string) => void`

**`SuggestionCard`** — 240px wide card
Renders `ToneBadge`, `TypeBadge`, response text (2-line clamp), click handler with Framer Motion scale feedback. On click: border-color animates to sage, fires `onSelect`, resets.
Props: `suggestion: Suggestion; onSelect: fn; isLoading: boolean`

**`ToneFilterRow`** — Horizontal scroll row
Row of `FilterPill` components. Hidden in dementia mode via `userMode`. Active filter in Zustand. Switching filter triggers no network request — client-side only.
Props: `tones: Tone[]; activeTone: Tone | null; onChange: fn`

**`ToneBadge` / `TypeBadge`** — Small pill components
`ToneBadge` color driven by design token map (tone → color). `TypeBadge` is always ink/muted. Accessible: `role="text"`, no interactive affordance.
Props: `tone: Tone; type: 'question' | 'statement'`

### Status & Transcript

**`StatusPill`** — Top-center absolute-positioned pill
Text transitions between: "Looking…" (pulsing dot), person name (on detection), "Reconnecting…" (on WS drop). Animated text crossfade via Framer Motion `AnimatePresence`.
Props: `status: ARStatus; personName?: string`

**`TranscriptBar`** — Collapsible bar below status pill
Shows last 2 lines of transcript. Click to expand to full transcript overlay. In dementia mode: hidden by default. Lines animate in (`translateY` from 8px, opacity 0→1).
Props: `lines: TranscriptLine[]; isLive: boolean; mode: UserMode`

### Onboarding & People Management

**`ModeSelectionScreen`** — Route: `/onboarding`
Three `ModeCard` components. Persists selection to localStorage. No skip.
Props: `onSelect: (UserMode) => void`

**`AddPersonSheet`** — Modal/bottom sheet
Name field, relationship segmented control, notes textarea. Fires `onSave` with new `Person`. Called from unknown face flow and from PeopleScreen "+" button.
Props: `faceEmbeddingId?: string; onSave: (Person) => void; onDismiss: fn`

**`PersonProfileScreen`** — Route: `/people/:id`
Avatar (initials circle), name, relationship, interests (pill row), conversation history timeline (date + summary pairs). Edit and Delete actions.
Props: `personId: string` (from route params)

**`ConversationSummaryScreen`** — Route: `/summary/:id`
Person avatar, duration, message thread transcript, topic pills, two CTA buttons. Read-only.
Props: `conversationId: string` (from route params)

---

## 07 — State Management

**Zustand slice architecture + WebSocket message contract**

### Global State Slices (Zustand)

**`arSlice`**
```
currentFace: FaceState | null
currentPerson: Person | null
detectionStatus: 'idle' | 'detecting' | 'found' | 'unknown'
panelVisible: boolean
confidenceScore: number
```
Everything about the live AR moment. Updated by WebSocket on every detection event.

**`suggestionSlice`**
```
suggestions: Suggestion[]
activeToneFilter: Tone | null
filteredSuggestions: Suggestion[]  // derived selector
isLoading: boolean
selectedId: string | null
```
`filteredSuggestions` is a Zustand selector, not stored state.

**`transcriptSlice`**
```
lines: TranscriptLine[]
isRecording: boolean
isLive: boolean
currentSpeaker: 'user' | 'them' | null
```
Append-only. New lines pushed via immer. Never replace the array — only append.

**`settingsSlice`**
```
userMode: UserMode
people: Person[]
conversations: Conversation[]
```
Persisted to localStorage via `zustand/middleware/persist`. People and conversations are the full local database.

### WebSocket Message Contract

Define this contract now and give it to your backend teammate. The frontend will mock every message type until the real backend is ready.

```typescript
// All messages follow this envelope
type WSMessage<T> = {
  type: 'face_detected' | 'face_unknown' | 'face_lost'
      | 'suggestions' | 'transcript_line'
      | 'error' | 'ack';
  payload: T;
  timestamp: number;  // Unix ms — used for lag detection
  sessionId: string;
};

// face_detected payload
{
  personId: string;
  confidence: number;           // 0.0 – 1.0
  boundingBox: {
    x: number; y: number;       // 0.0 – 1.0 (fraction of frame)
    width: number; height: number;
  };
}

// suggestions payload
{
  suggestions: {
    id: string;
    text: string;               // Max 120 chars — enforce on backend
    tone: 'empathetic' | 'casual' | 'clever' | 'serious';
    type: 'question' | 'statement';
    score: number;              // Relevance score, for sorting
  }[];
  personId: string;             // Must match current face
}

// transcript_line payload
{
  speaker: 'user' | 'them';
  text: string;
  isFinal: boolean;             // false = interim/streaming, true = committed
  lineId: string;               // For deduplication
}

// Client → Server messages
{
  type: 'suggestion_selected';
  payload: { suggestionId: string; personId: string; };
}
{
  type: 'end_conversation';
  payload: { sessionId: string; };
}
{
  type: 'add_person';
  payload: { name: string; relationship: string; notes?: string; faceEmbeddingId: string; };
}
```

### Real-time Data Strategy

WebSocket over SSE or polling. SSE is fine for transcript lines (one direction) but you also need to send `suggestion_selected` and `end_conversation` from client to server. A bidirectional WebSocket handles this cleanly. Use `reconnecting-websocket` for automatic reconnect with exponential backoff — drops must never require user action to recover.

### Loading & Pending State Handling

| Operation | Loading Treatment | Error Treatment |
|-----------|------------------|-----------------|
| Face detection → suggestions arriving | 2 skeleton cards (shimmer animation) appear immediately. Real cards replace on arrival. | After 5s timeout: "No suggestions available". Non-blocking. |
| Transcript line streaming | Interim text in italic, muted. Replace with final text when `isFinal: true`. | If transcript stops 10s, mic indicator turns amber. |
| Person profile fetch | Skeleton for avatar + name + relationship in info card. Never empty. | "Profile unavailable" with name if available. |
| App load / people list | Full-screen loader with logo fade-in. Not a spinner. | Error boundary at root. Soft reload, not crash screen. |

---

## 08 — Design System & Visual Identity

**Tokens, typography, motion, and iconography**

### Design Philosophy: Calm Utility

This app is used during high-stakes human moments — an elderly person recognizing a loved one, an anxious person summoning words they can't find, someone with dementia feeling anchored by a face and a name. The visual language must be calm, warm, and absolutely trustworthy. It should feel like a well-designed medical device, not a consumer app. No gamification, no bold brand moments, no visual noise.

The aesthetic direction is **refined restraint**: warm off-white backgrounds, de-saturated greens and slates, generous whitespace, serif display type paired with a geometric sans. The only "designed" moment is the AR overlay — which deliberately uses dark glass to contrast with the real world.

### Token System (CSS Custom Properties)

```css
/* tokens.css */
:root {
  /* Colors */
  --color-paper:      #f5f3ee;
  --color-paper2:     #edeae3;
  --color-ink:        #1a1a1f;
  --color-ink2:       #3d3d47;
  --color-ink3:       #72727f;
  --color-sage:       #4a7c6f;
  --color-sage-dark:  #2d5248;
  --color-sage-light: #d4e8e3;
  --color-slate:      #4a5568;
  --color-amber:      #92600a;
  --color-rose:       #9b4b6e;
  --color-critical:   #c0392b;
  --color-ar-bg:      rgba(10,14,20,0.82);
  --color-ar-border:  rgba(255,255,255,0.12);
  --color-ar-text:    rgba(255,255,255,0.95);
  --color-ar-muted:   rgba(255,255,255,0.52);

  /* Spacing */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-7: 32px;  --space-8: 40px;  --space-9: 48px;
  --space-10: 64px;

  /* Radius */
  --radius-sm: 4px;  --radius-md: 8px;
  --radius-lg: 12px; --radius-full: 9999px;

  /* Sizes */
  --tap-min: 44px;
  --tap-dementia: 56px;
}

/* User mode themes */
[data-theme="dementia"] {
  --font-size-body: 18px;
  --font-size-name: 26px;
  --tap-target: var(--tap-dementia);
  --suggestion-count: 2;
  --anim-duration: 500ms;
}

[data-theme="anxiety"] {
  --font-size-body: 16px;
  --font-size-name: 22px;
  --tap-target: var(--tap-min);
  --suggestion-count: 4;
  --anim-duration: 350ms;
}

[data-theme="skills"] {
  --font-size-body: 16px;
  --font-size-name: 22px;
  --tap-target: var(--tap-min);
  --suggestion-count: 5;
  --anim-duration: 280ms;
}
```

### Typography

- **Display / headings:** Fraunces (variable, optical size aware — renders beautifully at 22px and 48px alike).
- **Body / UI:** Jost (geometric, highly legible at small sizes, wide character shapes aid low-vision users).
- **Mono / labels:** IBM Plex Mono (badge text, status labels, data-adjacent information).

This trio covers every context with purpose — no font is decorative.

### Icon System

Use **Phosphor Icons** (`@phosphor-icons/react`). Consistent optical weight, includes domain-relevant icons (mic, person, hearing, brain), duotone weight reads well at small sizes. Regular weight for all UI icons, Bold only for critical actions (end conversation, delete person).

### Animation Philosophy

Rules — apply without exception:

1. **Animate only transitions, never loops.** No breathing, no floating, no idle animations. Cognitively sensitive users experience looping motion as noise.
2. **Spring easing everywhere.** Not ease-in-out, not linear. Spring (stiffness: 180, damping: 24) feels physical. Tween easing feels like a loading screen.
3. **Duration budget:** Enter = 280ms, exit = 200ms, state change = 150ms. Dementia mode multiplies all by **1.6×**.
4. **Never animate simultaneously with a content update.** If the person's name changes, show the new name instantly — do not animate it.
5. **Motion direction is semantic:** entering from bottom (response panel), exiting upward (card on face lost), status changes in-place.
6. **Respect `prefers-reduced-motion`.** Wrap all Framer Motion animations with a check. On reduced motion: instant state changes only.

---

## 09 — Build Plan

**Sequenced by risk, not by feature. Build the hardest integration first.**

> **Principle:** The riskiest part of this build is the camera + canvas overlay working together in the browser. Everything else is UI. De-risk the camera integration in the first 3 hours.

### Phase 1 — Camera Integration (0–3h)

**Camera feed live in browser + canvas confirmed rendering over video**

`npm create vite@latest` with React + TypeScript. Get `getUserMedia` rendering into a `<video>` element. Confirm a `<canvas>` draws a test rectangle over the video feed. This is your proof-of-concept. If this doesn't work, nothing else matters.

### Phase 2 — AR Overlay Core (3–6h)

**InfoCard + BoundingBox on canvas + MockFaceDetectionProvider**

Build `MockFaceDetectionProvider` emitting hardcoded `FaceState` on a 3s timer. Build `BoundingBox` (canvas-drawn) and `InfoCard` (React component, CSS-positioned). Wire together — when mock fires, bounding box and card appear at mocked coordinates. Add Framer Motion spring position interpolation. This is your demo's money shot.

### Phase 3 — Response Panel (6–10h)

**ResponseDrawer + SuggestionCarousel + selection feedback**

Build the bottom drawer with Framer Motion. Populate with mock suggestions. Wire `SuggestionCard` click → selection animation → Zustand update → "You said:" in `TranscriptBar`. Add `ToneFilterRow` (client-side filter against mock data). Full interaction loop must work end-to-end with mock data before touching WebSocket.

### Phase 4 — WebSocket Integration (10–13h)

**MockWebSocket → real WebSocket swap + Zustand wiring**

Replace mocks with a real WebSocket client using the agreed message contract. If backend isn't ready, build the mock to emit the exact same message shapes over a `ws://` connection. Add `reconnecting-websocket`. Wire `transcript_line` events into `TranscriptBar`.

### Phase 5 — Navigation + Secondary Screens (13–17h)

**react-router setup, onboarding, summary, people list**

Set up react-router routes. Build `ModeSelectionScreen` (onboarding). Build `ConversationSummaryScreen` with mock transcript. Build PeopleScreen list view. Build `PersonProfileScreen`. Standard React UI — no camera complexity.

### Phase 6 — User Mode System + Accessibility (17–20h)

**CSS theme switching, dementia mode rules, error states**

Wire `userMode` to `data-theme` attribute on `<html>`. Test dementia mode: 2 suggestions, no filter, larger text, staggered timing. Test anxiety mode. Add error state treatments (WS drop indicator, mic strikethrough, low confidence amber box). Run through all three modes.

### Phase 7 — Polish + Demo Rehearsal (20–24h)

**Recognition sweep animation, demo script, cut list**

Add the `BoundingBox` sweep animation (canvas `strokeDashOffset`). Seed mock data with Margaret Chen and Dr. Reyes profiles. Rehearse the 3-minute demo flow 5 times. Time each section. Cut anything that introduces demo risk.

### What to Cut First (in order)

1. Settings screen — PeopleScreen list is enough.
2. Add-person consent flow — hardcode 2 known people.
3. Tone filter pills — hardcode the "All" view.
4. Transcript bar — mock a static transcript line.
5. Mode switching during demo — launch in dementia mode and stay there.

**Never cut:** the AR card, the bounding box, the response panel, and the suggestion selection interaction. These four are the demo.

---

## 10 — Demo Polish & Wow Moments

**The specific details that make judges feel something**

### The Recognition Sweep

When the face is detected, the bounding box corners don't just appear — they draw themselves in. A scanning line (1px horizontal stroke, sage color, 30% opacity) sweeps top-to-bottom across the face box over 600ms using an animated canvas clip rect. As it completes, the corner brackets lock solid and the info card springs in simultaneously. Total duration from trigger to fully-visible card: **880ms**. This deliberate pause between "detected" and "revealed" makes it feel like AI is working, not just a database lookup. Do not make it instant. The anticipation is the magic.

### The Contextual Memory Detail

The first suggestion after Margaret Chen is recognized must include a specific personal detail: *"How are the grandkids doing? Last time you mentioned Emma had a recital."* The word "Emma" — a name never shown in the info card — appears in the suggestion. Judges will understand immediately: the app doesn't just know who this person is, it knows what they last talked about. This is the emotional core. It must be the first suggestion. Pre-seed in mock data and hardcode it to always appear first.

### The Mode Switch Demonstration

During the demo, say: "Let me show you how this adapts." Switch from skills mode to dementia mode in settings. The panel visibly changes: fewer cards, larger text, slower animation. Then say: *"For someone living with memory loss, we show only two responses, no filtering, and give them an extra second before the panel opens — because the most important thing is that the face and the name register first."* This moment demonstrates more UX depth than the entire AR layer. It shows you understand your users, not just your technology.

### Pre-Seeded Mock Data

```typescript
const MOCK_PEOPLE: Person[] = [
  {
    id: 'p_margaret',
    name: 'Margaret Chen',
    relationship: 'Daughter',
    relationshipType: 'family',
    interests: ['gardening', 'cooking', 'crossword puzzles', 'classical music'],
    lastConversationTopic: "Emma's school recital",
    notes: 'Visits every Sunday. Brings homemade soup in winter.',
    conversationHistory: [
      { date: '2025-03-14', summary: "Talked about Emma's recital and the garden roses" },
      { date: '2025-02-28', summary: 'Discussed holiday plans' },
    ],
  },
  {
    id: 'p_reyes',
    name: 'Dr. Reyes',
    relationship: 'Doctor',
    relationshipType: 'medical',
    interests: ['hiking', 'chess'],
    lastConversationTopic: 'Medication review in April',
    conversationHistory: [
      { date: '2025-03-01', summary: 'Routine check-in, blood pressure stable' },
    ],
  },
];

const MOCK_SUGGESTIONS_MARGARET: Suggestion[] = [
  { id: 's1', text: 'How are the grandkids doing? Last time you mentioned Emma had a recital.', tone: 'empathetic', type: 'question', score: 0.97 },
  { id: 's2', text: 'Did the roses in your garden bloom this spring?', tone: 'casual', type: 'question', score: 0.88 },
  { id: 's3', text: "It's so good to see you. I've been looking forward to this.", tone: 'empathetic', type: 'statement', score: 0.82 },
  { id: 's4', text: 'Have you finished that crossword book you mentioned?', tone: 'casual', type: 'question', score: 0.79 },
  { id: 's5', text: "What have you been cooking lately? You always make the best food.", tone: 'casual', type: 'question', score: 0.74 },
];
```

### Demo Script (3-Minute Structure)

| Time | Action | What Judge Sees |
|------|--------|----------------|
| 0:00 – 0:30 | Open app, show mode selection, pick "Memory Support" | Clean onboarding, clear purpose statement |
| 0:30 – 1:00 | Enter camera view, point at face, trigger detection (spacebar or pre-wired timer) | Scanning sweep → card springs in → Margaret Chen, Daughter |
| 1:00 – 1:30 | Response panel opens, read first suggestion aloud, click it | Emma's recital detail in the suggestion — contextual memory |
| 1:30 – 2:00 | Show transcript bar updating, show second suggestion batch | Live transcription + adaptive suggestions |
| 2:00 – 2:30 | Switch to "Conversation Skills" mode in settings | 5 suggestions, tone filter, full card with interests — visible diff |
| 2:30 – 3:00 | Switch back to "Memory Support", explain dementia design decisions | 2 suggestions, slow animation, no filter — the accessibility story |
