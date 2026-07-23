# Progress Tracker

## Completed Work

### Phase 1: Foundations & Authentication
- [x] Initial Next.js 16 setup with TypeScript and Tailwind CSS v4
- [x] Theme system with dark-only CSS property tokens (`app/globals.css`)
- [x] Clerk authentication and protected routing (`app/page.tsx`, middleware)

### Phase 2: Navigation & Projects
- [x] Editor navigation, layout shell, and header structure (`components/editor/editor-layout.tsx`)
- [x] React context for mock projects state and dialog hooks (`lib/project-context.tsx`)
- [x] Project dialog components: Create (with live slugify preview), Rename (with prefilled auto-focus), and Delete (destructive confirmation only) (`components/editor/project-dialogs.tsx`)
- [x] Project sidebar updates to display owned and shared tabs, wire actions, and add mobile backdrop click-outside scrim (`components/editor/project-sidebar.tsx`)
- [x] Editor home page with New Project button (`app/editor/page.tsx`)
- [x] Workspace routing and access checks (`/editor/[roomId]`) validating owners/collaborators against backend database projects (`lib/project-access.ts`, `app/editor/[roomId]/page.tsx`, `components/editor/access-denied.tsx`)
- [x] Room workspace layout with central canvas, dynamic metadata titles, and toggleable sliding AI Chat sidebar (`components/editor/room-workspace.tsx`, `components/editor/editor-navbar.tsx`)
- [x] Fixed project deletion redirect behavior: when the active project is deleted, redirect the user to the immediate next project, or back to the editor home dashboard (`/editor`) if no projects remain

### Phase 3: Database & Persistence
- [x] Database schema models: `Project` and `ProjectCollaborator` with correct relations, cascade delete, constraints, and indexes (`prisma/models/project.prisma`)
- [x] Cached Prisma Client singleton with dynamic branching logic supporting direct pg and Accelerate connections (`lib/prisma.ts`)
- [x] Run database migrations and generate client types (`prisma/migrations`)
- [x] Backend project API routes (`GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/[projectId]`, `DELETE /api/projects/[projectId]`) enforcing Clerk auth and owner permissions
- [x] Wired editor home screen dashboard, sidebar, and CRUD dialogs to the backend APIs with server-side layout fetching and Client Component state syncing

### Phase 8: Editor Workspace Shell
- [x] Main editor workspace layout with centered canvas, offsetting sliding panels, and responsive resizing boundaries
- [x] Multiline scrollable AI assistant text area with Shift+Enter carriage returns and Enter submits
- [x] Implemented dedicated interactive AI Sidebar component (`components/editor/ai-sidebar.tsx`) replacing the placeholder
- [x] Added tabbed interface separating the AI Architect chat assistant and Markdown System Specifications
- [x] Designed responsive empty states, clickable starter prompts, user vs assistant message layouts, and dynamic auto-resizing textareas
- [x] Optimized layout and spacing of empty state (logo, description, prompts) to fit perfectly on all viewports without scrolling, rendering it inside a standard non-scrollable div to bypass ScrollArea scrollbars on Brave/WebKit browsers
- [x] Integrated specification generation triggers and card previews with disabled download features


### Phase 9: Project Collaboration & Share Dialog
- [x] Project collaborator API endpoints for listing, inviting, and deleting collaborators (`app/api/projects/[projectId]/collaborators/route.ts`)
- [x] Clerk integration to enrich database email records with display names and avatars
- [x] Radix UI Share Dialog component with email invitation forms, collaborator removal controls, copy-to-clipboard actions, and visual loading states (`components/editor/share-dialog.tsx`)
- [x] Integrated Share Dialog trigger and state management into editor navigation bar (`components/editor/editor-navbar.tsx`)

### Phase 10: Liveblocks Setup
- [x] Installed `@liveblocks/node` dependency and configured `liveblocks.config.ts` defining Presence and UserMeta
- [x] Created cached Liveblocks client in `lib/liveblocks-client.ts` with deterministic user color generator
- [x] Implemented authentication route `POST /api/liveblocks-auth` to enforce project access via db helper, check room existence, and return session tokens enriched with name, avatar, and cursor color

### Phase 11: Base Collaborative Canvas
- [x] Shared canvas types definition (`types/canvas.ts`)
- [x] Custom Error Boundary and premium reconnect fallback UI (`components/editor/canvas-error-boundary.tsx`, `components/editor/canvas-error-fallback.tsx`)
- [x] Skeleton loading placeholder representing active connection (`components/editor/canvas-loading-state.tsx`)
- [x] Collaborative canvas implementation utilizing Liveblocks React Flow integrations and Cursors (`components/editor/collaborative-canvas.tsx`)
- [x] Refactored `RoomWorkspace` to wrap the collaborative elements in Liveblocks room providers and client-side suspense (`components/editor/room-workspace.tsx`, `components/editor/collaborative-workspace.tsx`)

### Phase 12: Shape Panel
- [x] Added custom theme tokens and Tailwind utility configuration to `app/globals.css`
- [x] Created `CustomNode` custom React Flow node component with 4 hoverable connection handles (`components/editor/custom-node.tsx`)
- [x] Updated `CollaborativeCanvas` to support `ReactFlowProvider`, custom node type registration, and canvas projected drop mapping (`components/editor/collaborative-canvas.tsx`)
- [x] Created `ShapePanel` floating, collapsible, glassmorphic shape toolbar with HTML5 drag and drop payload mapping (`components/editor/shape-panel.tsx`)
- [x] Integrated `ShapePanel` into the `CollaborativeWorkspace` canvas area (`components/editor/collaborative-workspace.tsx`)
- [x] Prevented auto-zooming out and jumping of the canvas viewport on shape drops by implementing a custom programmatic `fitView` that runs only on initial load for existing nodes, leaving empty canvas instances at a normal zoom level (1.0).

### Phase 13: Node Shape Rendering & Drag Preview
- [x] Replaced placeholder rectangular node styling with dynamic shape-specific renders:
  - CSS styling for `rectangle`, `pill`, and `circle` shapes
  - Scalable SVG renderers with `vector-effect="non-scaling-stroke"` for `diamond`, `hexagon`, and `cylinder` shapes
  - Subtle borders at rest and brand-accent highlight (`--accent-primary`) when selected
- [x] Implemented custom shape-specific drag preview using HTML5 `setDragImage` with dynamic off-screen preview element creation and clean-up on drag conclusion
- [x] Verified type-safety and Next.js project compilation via `npm run build`

### Phase 14: Node Resizing & Inline Label Editing
- [x] Added custom-styled `<NodeResizer>` with no minimum constraints (supports scaling down to 1px) and subtle selection highlights (thinner 0.5px dashed border, circular 6px handle controls)
- [x] Integrated custom double-click handler to trigger inline editing state
- [x] Implemented absolute-centered auto-adjusting textarea overlay with `nodrag nopan` preventing canvas conflicts
- [x] Implemented line-clamp multiline ellipsis layout truncation (`...`) preventing text overflow outside node shapes
- [x] Wired real-time sync via React Flow `updateNodeData` updating on every character change
- [x] Added keyboard listeners on Escape (discard/exit), Enter (submit/exit), and Blur to gracefully exit editing state
- [x] Refined shape sizing, padding, and text weight: shrunk default shape template dimensions by ~40%, reduced custom node padding to `p-0.5`, and set text styling to `text-[10px]` with `font-light` weight.
- [x] Increased font size of node labels from `text-[6.4px]` to `text-[12.1px]` (bold with `lineHeight: 14px`) and edge labels from `text-[10px]` to `text-[15.7px]` (bold) to improve readability.
- [x] Changed all selection outline indicators to an ultra-thin white style, including 4px circular white dots and thin 0.5px white dashed selection borders for resizer controls.
- [x] Resized connection handles (`Handle`) to 1.5px (6px) and styled them solid white to sit flush on selection outlines when selected or hovered.

### Phase 15: Nodes Color Toolbar
- [x] Added floating color swatch toolbar above selected canvas nodes
- [x] Configured 8 predefined background/text color pairs with tight, controlled hover glow matching the respective text colors
- [x] Standardized swatch borders to display active selection states (1.5px borders matching text color, inner dot representation, and active glow effects)
- [x] Added `nodrag` and `nopan` helpers along with event bubbling prevention to prevent node dragging or canvas panning conflicts
- [x] Enabled instant reactive updates by wiring selected swatches to React Flow's `updateNodeData` updating the collaborative state

### Phase 16: Edge Behavior & Inline Labels
- [x] Customized connection handles in `CustomNode` with ultra-subtle base border styling (`!border-[#080809]`) and 6px size flush on selection outlines.
- [x] Built `CustomEdge` component with right-angle step routing (`getSmoothStepPath` with 8px border radius), Rest vs Active styling (#505060 vs #f8fafc), and custom SVG `<defs>` arrowhead marker that scales dynamically.
- [x] Integrated custom interactive double-click handler for inline edge label editing with auto-growing input.
- [x] Configured pill badges for saved labels and dashed hint badges for active edges without labels.
- [x] Registered custom edge renderer and configured `defaultEdgeOptions` in `CollaborativeCanvas`.
- [x] Fixed edge lag/after-effect during node movement by scoping the CSS transition in `CustomEdge` specifically to `stroke,stroke-width` instead of `all` to prevent animating the SVG path coordinate modifications.
- [x] Configured `LiveblocksProvider` throttle option to `16` (60FPS updates) in `RoomWorkspace` to keep real-time position updates completely smooth.
- [x] Verified full type-safety and successful clean build.

### Phase 17: Canvas Ergonomics & Control Bar
- [x] Created bottom-left floating pill-shaped Control Bar with zoom (in/out/fit) and undo/redo buttons (`components/editor/control-bar.tsx`)
- [x] Made the zoom percentage indicator editable as a direct text input that doubles as an interactive presets dropdown (modifying preset value directly)
- [x] Built the `useKeyboardShortcuts` hook (`hooks/use-keyboard-shortcuts.ts`) to map keys: `+`/`=` for Zoom In, `-` for Zoom Out, `Cmd/Ctrl+Z` for Undo, and `Cmd/Ctrl+Shift+Z`/`Cmd/Ctrl+Y` for Redo
- [x] Ignored keyboard shortcuts while typing inside inputs, textareas, and contenteditable elements to prevent keystroke collisions
- [x] Removed `MiniMap` from the collaborative canvas layout
- [x] Verified full type-safety and successful clean production build

### Phase 18: Node Deletion Context Menu
- [x] Implemented right-click (desktop) and long-press (mobile) `onNodeContextMenu` handler
- [x] Fixed context menu unmounting issue by replacing the generic click listener with a ref-based check on `mousedown`
- [x] Wired deletion to Liveblocks' `onDelete` mutation API to resolve node and connected edge removal from room storage
- [x] Created a sleek, ultra-minimal floating delete context menu positioned fixed at the mouse coordinates
- [x] Verified full type-safety and successful clean production build

### Phase 19: Starter Template Library
- [x] Created starter templates data structure with Microservices, CI/CD Pipeline, and Event-Driven System architectures (`components/editor/starter-templates.ts`)
- [x] Designed responsive `StarterTemplatesModal` with scaled custom SVG preview canvas, shape rendering, and interactive triggers (`components/editor/starter-templates-modal.tsx`)
- [x] Added entry point button trigger to editor navbar (`components/editor/editor-navbar.tsx`)
- [x] Wired template loading callback to Liveblocks storage mutation for collaborative clear-and-set data execution and automatic center zoom (`components/editor/collaborative-canvas.tsx`)
- [x] Resolved template import runtime crash (`TypeError: nodesMap.clear is not a function`) by iterating and deleting keys individually via `Array.from(map.keys())`
- [x] Registered fallback schema in `liveblocks.config.ts` and set `initialStorage` in `room-workspace.tsx` for type-safety
- [x] Verified full type-safety and successful clean production build

### Phase 20: Stability & Quality Improvements (Bug Fixes)
- [x] Secured `app/api/liveblocks-auth/route.ts` by adding explicit project access validation (checking if the user is the project owner or listed in collaborators) before permitting room access
- [x] Distinguished backend errors from forbidden errors in `app/api/liveblocks-auth/route.ts` by checking `access.error` and returning `500` for database/server failures and `404` for missing projects
- [x] Resolved room storage reset/overwrite during reconnection or remounting in `components/editor/room-workspace.tsx` using a `<RoomStorageInitializer>` wrapper to perform a read-before-write validation on map keys
- [x] Resolved undo/redo history sync mismatch by migrating `components/editor/collaborative-canvas.tsx` and `components/editor/control-bar.tsx` from deprecated standalone hooks (`useUndo`/`useRedo`/`useCanUndo`/`useCanRedo`) to a single synchronized `useHistory()` context
- [x] Audited performance selectors to guarantee no broad/unoptimized `useStorage` or `useOthers` hooks exist in client code, ensuring maximum render performance
- [x] Verified full type-safety and successful Next.js production build compilation

### Phase 21: Presence Avatars & Live Cursors
- [x] Updated Liveblocks `Presence` definition (`liveblocks.config.ts`) and initial state (`room-workspace.tsx`) to support `thinking: boolean` and `cursor` coordinates
- [x] Created custom `PresenceAvatars` component absolute-positioned inside the editor room view (`components/editor/presence-avatars.tsx`)
- [x] Integrated Clerk `useUser` and `UserButton` to represent the current user at size `28px` to align perfectly with collaborator avatars
- [x] Managed list of active participants, deduplicated by user ID, filtered out the current user, and limited overlap stack display to 5 with an overflow chip
- [x] Suppressed navbar-level `UserButton` inside the room view while keeping it active in the editor home dashboard (`components/editor/editor-navbar.tsx`)
- [x] Hooked mouse/pointer-movement tracking on React Flow pane, projecting coords using `screenToFlowPosition` and clearing cursor to null on mouse leave (`components/editor/collaborative-canvas.tsx`)
- [x] Styled custom small, modern cursors with participant presence colors and tiny name badge pills
- [x] Verified successful production compilation with zero TypeScript or build errors via `npm run build`

### Phase 22: Canvas Autosave & Loading
- [x] Installed `@vercel/blob` dependency for cloud file storage
- [x] Added `canvasSaveStatus` state and setter to `ProjectProvider` (`lib/project-context.tsx`)
- [x] Implemented API endpoints `GET` and `PUT` at `/api/projects/[projectId]/canvas` using Clerk authentication, project access controls, and private Vercel Blob storage persistence (utilizing the SDK's type-safe `get()` method with cache-busting suffixes and async deletion of old blobs)
- [x] Created debounced autosave React hook (`hooks/use-canvas-autosave.ts`) to track canvas modifications and dispatch manual trigger events
- [x] Updated editor navbar (`components/editor/editor-navbar.tsx`) to show real-time save states ("Saved", "Saving...", "Error (Retry)") and dispatch manual trigger events
- [x] Updated collaborative workspace and canvas components (`components/editor/collaborative-workspace.tsx`, `components/editor/collaborative-canvas.tsx`) to fetch and load saved state if the room is empty on mount
- [x] Generalised right-click context menu in `<ReactFlow />` (`onSelectionContextMenu`) to show a dynamic "Delete Selected (N)" option when multiple elements are selected
- [x] Configured global window event listeners in `hooks/use-keyboard-shortcuts.ts` to trigger selection deletion when pressing `Backspace` or `Delete` on active canvas components
- [x] Verified full type-safety and successful production build with zero compilation errors

### Phase 23: Trigger.dev Setup
- [x] Installed pinned version of `@trigger.dev/sdk@4.4.6`
- [x] Configured `trigger.config.ts` with project identifier `proj_tgggziraaqcgbemiivke`, default node runtime, and execution timeout parameters
- [x] Created `trigger/` task directory with sample `helloWorldTask` background job inside `trigger/example.ts`
- [x] Appended `TRIGGER_SECRET_KEY` env placeholder to project `.env`
- [x] Successfully verified task worker bundler and task discovery daemon build via `npx trigger.dev dev`

### Phase 24: Design Agent API & Trigger Wiring
- [x] Created `TaskRun` database model in `prisma/models/task_run.prisma` to track background execution runs and verify ownership.
- [x] Generated database migration and regenerated Prisma Client to synchronize models.
- [x] Created `design-agent` task in `trigger/design-agent.ts` with basic log/echo behavior.
- [x] Implemented route `POST /api/ai/design` validating user credentials, checking workspace access, scheduling the background task, and storing the run tracker.
- [x] Implemented route `POST /api/ai/design/token` issuing scoped read-only public tokens restricted to specific run and task IDs for client-side subscription.
- [x] Verified full type-safety and successful production compilation.

### Phase 25: Design Agent Logic & Collaborative Simulation
- [x] Defined Zod validation schemas (`AiStatusMessageSchema` and `AiChatMessageSchema`) in `types/tasks.ts`
- [x] Initialized collaborative status and chat feeds in `RoomProvider` storage and schema definitions (`components/editor/room-workspace.tsx`, `liveblocks.config.ts`)
- [x] Implemented multi-key Google AI failover model client in `lib/google-failover.ts` with automatic rate-limit rotation
- [x] Completed trigger task runner in `trigger/design-agent.ts` with step-by-step element rendering, presence/cursor updates, status updates, and final assistant recap messages
- [x] Verified full type-safety and successful clean Next.js build compilation

### Phase 26: AI Presence State
- [x] Subscribed to Liveblocks storage `ai-status-feed` in AI Sidebar and validated latest messages with `AiStatusMessageSchema`
- [x] Added dynamic status indicator strip to sidebar chat area displaying active AI generation states
- [x] Disabled chat input and rendered loading spinner on Send button during active generation
- [x] Updated collaborative canvas `CustomCursor` component to display a thinking spinner inside collaborator badges when `thinking: true` is present

### Phase 27: Sidebar Collaborative Chat Feed
- [x] Subscribed to Liveblocks storage `ai-chat` in AI Sidebar and validated messages with Zod `AiChatMessageSchema`
- [x] Rendered own messages on right, collaborators and assistant on left with formatted timestamps and sender name badges
- [x] Wired input form to Liveblocks `useMutation` to push user messages onto the room storage list
- [x] Handled error state boundary during submission failure and styled error warnings in the input footer
- [x] Verified full type-safety and successful clean Next.js build compilation

### Phase 28: Design Agent Frontend & API Integration
- [x] Updated design API endpoint (`app/api/ai/design/route.ts`) to return run-scoped public tokens and support optional `projectId`.
- [x] Integrated `useRealtimeRun` in `components/editor/ai-sidebar.tsx` to track execution terminal states and errors.
- [x] Wired `handleSend` to submit user prompt, handle submission failures, and track background run IDs.
- [x] Custom styled user chat messages with green accent (`#62C073`) background and contrast dark text.
- [x] Styled submit button and status indicator strip to use green accents and custom spinner states.
- [x] Fixed stale status feed behavior by introducing client-side `clearStatusFeed` mutation on prompt submission.
- [x] Resolved Prisma database `TaskRun` undefined error by regenerating Prisma Client in `app/generated/prisma`.
- [x] Excluded `"ai-agent"` from top-right collaborator avatar list in `PresenceAvatars` to avoid duplicate avatar confusion.
- [x] Fixed chat message bubble overflow and scrollbar overlapping in AI Sidebar by shifting ScrollArea padding inwards and applying `break-words` and `min-w-0` layout wraps.
- [x] Fixed loading spinner and input block lockup on fast or instant task completions (like conversational prompts) by using a centralized React `useEffect` to watch terminal run states, handling both transitions and already-completed run mounts.
- [x] Updated canvas node dimensions to be larger (roughly double) and increased custom node label font size from 12.1px to 13.5px for improved text readability.
- [x] Aligned manual shape templates in the editor shape panel with the new, larger default node sizes.
- [x] Resolved missing edge labels by supporting root-level `label` props in `CustomEdge` and updating `design-agent` to write labels under both root `label` and `data.label` paths.
- [x] Refactored design agent spacing instructions to lay out nodes compactly (240px-280px center-to-center) and mandated descriptive connection labels in Gemini prompts.
- [x] Verified full type-safety and successful clean Next.js build compilation.

### Phase 29: Spec Generation Flow
- [x] Created `POST /api/ai/spec` — validates input with Zod, resolves project from `roomId` only (no client-supplied `projectId`), triggers `generate-spec` task, persists `TaskRun` record, returns `runId` and run-scoped public token
- [x] Created `POST /api/ai/spec/token` — validates `runId`, verifies `TaskRun` ownership by authenticated user, issues a 1-hour scoped public access token
- [x] Created `trigger/generate-spec.ts` — Zod-validated payload, builds structured Gemini prompt from nodes/edges/chat history, calls `generateText` via `runWithFailover`, updates run metadata for realtime tracking, returns plain Markdown output
- [x] Verified full type-safety and successful clean Next.js production build compilation

### Phase 30: Spec Persistence & Download
- [x] Created `ProjectSpec` Prisma model (`prisma/models/project_spec.prisma`) with `id`, `projectId` (FK → Project with cascade delete), `filePath`, and `createdAt`
- [x] Added `specs ProjectSpec[]` back-relation to `Project` model
- [x] Ran migration `20260604220714_add_project_spec` and regenerated Prisma Client
- [x] Updated `trigger/generate-spec.ts` to upload Markdown spec to Vercel Blob at `specs/{projectId}/{specId}.md`, persist `ProjectSpec` record with blob URL, and expose `specId` in run metadata and task output
- [x] Created `GET /api/projects/[projectId]/specs/[specId]/download` — authenticates user, verifies project access via `checkProjectAccess`, confirms spec belongs to project, fetches private blob, streams as `Content-Disposition: attachment` Markdown file
- [x] Verified full type-safety and successful clean Next.js production build (exit code 0)

### Phase 31: Spec UI Integration
- [x] Installed `react-markdown` and `remark-gfm` for client-side Markdown rendering
- [x] Created `GET /api/projects/[projectId]/specs` — authenticates via `checkProjectAccess`, returns list of spec metadata (`id`, `filename`, `createdAt`) ordered newest-first
- [x] Created `components/editor/spec-preview-modal.tsx` — Dialog-based modal that fetches spec content through the existing download endpoint (not Blob directly), renders it as styled Markdown with GFM tables/links, and exposes a Download action
- [x] Updated Specs tab in `ai-sidebar.tsx`: replaced static demo card with a live spec list, added fetch-on-tab-activate pattern via `useCallback`/`useEffect`, wired clickable items to preview modal, per-item download button (revealed on hover), empty/loading/error states, and refresh control
- [x] Wired `handleGenerateSpec` to the real `POST /api/ai/spec` endpoint with a 3-second delayed spec list refresh
- [x] Verified zero TypeScript errors (`tsc --noEmit` exit code 0)

### Phase 32: Spec Section Overhaul — One Spec Per Project
- [x] Enforced one-spec-per-project in `trigger/generate-spec.ts` by deleting existing specs (blob + DB) before creating the new one
- [x] Replaced multi-spec "Saved Specs" list in `ai-sidebar.tsx` with a single spec card per project
- [x] Added spec generation run tracking via `useRealtimeRun` so the loading indicator stays active until the background task reaches a terminal state (not just the trigger request)
- [x] Auto-refreshes the current spec card on successful generation completion
- [x] Added `projectId`-change effect to clear spec state for proper project isolation
- [x] Button dynamically shows "Regenerate Tech Spec" when a spec already exists
- [x] Added live generation status indicator strip with pulsing dot during spec generation
- [x] Fixed spec preview modal scrollability by replacing `ScrollArea` with native `overflow-y-auto` on the dialog body
- [x] Removed unused `ScrollArea` import from `spec-preview-modal.tsx`
- [x] Verified full type-safety with zero TypeScript errors (`tsc --noEmit` exit code 0)

### Phase 33: Design Agent — Label Separation & Layout Improvement
- [x] Rewrote the AI system prompt to strictly separate node labels (component names ONLY) from edge labels (protocol/relationship ONLY, max 1-3 words)
- [x] Added explicit good/bad examples in the prompt to prevent verbose labels like "HTTPS/View Courses" or "Writes/Reads User Data"
- [x] Increased minimum node spacing from 240-280px to 350px horizontal / 300px vertical to prevent edge labels from overlapping node boxes
- [x] Added edge routing rules: distribute handles across different sides of the same node when it has multiple connections
- [x] Added `labelOffsetPct` field to edge schema so the AI can stagger labels at 0.3/0.5/0.7 along a path instead of all sitting at the midpoint
- [x] Updated `custom-edge.tsx` to support offset-based label positioning via `data.labelOffsetPct`
- [x] Updated edge storage patch to persist `labelOffsetPct` alongside label in edge data
- [x] Verified full type-safety with zero TypeScript errors (`tsc --noEmit` exit code 0)

### Phase 34: Light/Dark Theme Toggle
- [x] Created `components/theme-provider.tsx` client-side theme context and hook to manage and persist theme choice in `localStorage`.
- [x] Integrated `ThemeProvider` in `app/layout.tsx`, removed hardcoded `"dark"` class, and added head inline script for FOUC prevention.
- [x] Updated `app/globals.css` with a premium light theme design token variable set in `:root` and moved dark values to `.dark`.
- [x] Placed Sun/Moon toggle button in `components/editor/editor-navbar.tsx` right-side buttons.
- [x] Refactored `components/editor/custom-node.tsx` to dynamically resolve node backgrounds/text using theme-aware colors, adaptive selection outlines, and handle colors.
- [x] Updated custom connection handles to display high-contrast styling (`!bg-[var(--text-primary)] !border-[var(--bg-base)]`) in both modes.
- [x] Refactored `components/editor/custom-edge.tsx` to use theme variables (`var(--text-primary)`, `var(--text-faint)`) for active/inactive strokes.
- [x] Linked React Flow's `colorMode` directly to active theme, corrected wrapper background, and bound grid dots color in `components/editor/collaborative-canvas.tsx`.
- [x] Refactored `components/editor/starter-templates-modal.tsx` to use theme variables for modal dialogs and template previews.
- [x] Verified full type-safety and successful clean Next.js build compilation.

## Next Steps
- [ ] Continue with the next phase of system enhancements.
