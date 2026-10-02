Warning: Unknown toolsets: jev
GPT-6-Astra

1. Verdict

Based on the supplied brief, not a fresh inspection of the deployed site:

- The current experience leads with map controls and overlays instead of Mirai’s clear promise: help buyers picture daily life around a home.
- The hero is carrying too many competing elements. Address, categories, pins, ratings, variants, and trip controls need a hierarchy, not equal visibility.
- “Walk around the home” is currently a picture, not an experience. There is no coherent departure, visible journey, arrival, threshold, and interior.
- Variants feel like separate demonstrations. They should change the destination and lifestyle within one recognizable experience.
- Features is not yet a disciplined, centered, single-viewport composition. More content cannot compensate for incorrect proportions.
- The reference’s narrative order is essential: promise → preview → problem → process → interactive proof → audiences. It must not become a generic feature-card landing page.
- Real geography, sourced photography, generated imagery, and estimated metrics need visibly different evidence labels.
- Quality should concentrate on a few convincing journeys. More venues, pins, and superficial interactions would amplify the existing weakness.

2. Product sequence

1. Understand the promise.
   Arrive on a cream screen: “Help buyers picture life around your listing.” A live Berlin neighborhood is immediately visible, with Bergmannstraße 25 selected.

2. Orient around the home.
   Pan or rotate the real map. The home remains the anchor. Home, Coffee, Grocery, Park, and Restaurant chips expose a restrained selection of relevant places.

3. Choose one everyday destination.
   Selecting a place reveals one compact card: photograph, name, category, walking estimate, and “Experience trip.” No competing popups or variant carousel.

4. Preview the actual journey.
   The route appears on the interactive map before playback. Home and destination are both identifiable. The experience explains its stages: Street → Walk → Arrive → Inside.

5. Experience continuity.
   Start outside the home; follow the mapped route; approach the public building; cross a visually consistent threshold; explore an illustrative interior. Keep the live route accessible and visible throughout.

6. Try a different life around the same address.
   Change to a café, market hall, or gym without learning another interface. Restaurant, park pavilion, and museum use the same journey model when their assets and routes are ready.

7. Understand why this matters.
   Continue through PREVIEW, THE GAP, and PROCESS in the reference’s order. The page explains why disconnected maps and brochures are insufficient, then shows Add → Create → Share.

8. Explore five buyer questions.
   A centered dark Features screen contains one interactive window:
   Walk around the home; Life quiz; Everyday stops; Commute; Usual day.

9. Personalize without losing the place.
   Household and interests change suggested stops and the daily timeline. They do not generate fictitious businesses, ratings, routes, or neighborhood facts.

10. Share the experience.
    Copy a static-site URL that restores the supported address, chosen destination, and relevant experience state. Agents, Brokerages, and Developers close the page with distinct applications of the same product.

3. Screen inventory

“Live” below means interactive application or map behavior. It does not imply live business availability, current ratings, or real-time traffic.

State / purpose / evidence / viewport treatment:

A. Hero — default
   Establish the promise and Berlin location.
   Live: MapLibre map, OpenFreeMap tiles, address field, category selection.
   Generated: none required.
   Fit: cream first viewport; quiet copy area and large map; one selected-place card maximum.

B. Address — searching, results, empty, failure
   Resolve a real address and move the home anchor.
   Live: Photon lookup with keyboard-accessible results.
   Generated: none.
   Fit: bounded results panel attached to the address field, never covering the primary CTA or taking over the map.

C. Neighborhood — category and place selection
   Show relevant stops and select a destination.
   Live: map filtering and selection; sourced local venue records.
   Generated: none.
   Fit: limited visible pins, one active card, no stacked popups. Unknown ratings disappear rather than receiving placeholders.

D. Trip — route review
   Show where the buyer will travel before starting.
   Live: validated walking-route geometry, origin, destination, distance, and duration.
   Generated: none.
   Fit: shared experience window; map dominates; compact stage controls.

E. Trip — Street
   Establish departure from the neighborhood.
   Live: route locator and home marker.
   Generated: optional illustrative street image, explicitly labeled.
   Fit: primary image stage plus persistent live route inset.

F. Trip — Walk
   Make the path legible rather than teleporting to a venue.
   Live: interactive route map and progress marker following route geometry.
   Generated: optional supporting approach imagery.
   Fit: map becomes the primary stage. Progress is illustrative, not GPS or measured walking speed.

G. Trip — Arrive
   Connect the route endpoint to the venue entrance.
   Live: destination marker and route inset.
   Sourced: verified exterior photograph where available.
   Generated: optional illustrative approach and threshold images, labeled.
   Fit: same frame and controls; no new page or modal stack.

H. Trip — Inside
   Reveal a place-specific interior experience.
   Live: persistent map inset, destination selection, replay/back/exit.
   Generated: coordinated interior stills labeled “Illustrative interior — AI-generated; not a verified depiction of this venue.”
   Fit: one main interior image, short caption, restrained scene controls.

I. PREVIEW
   Demonstrate the same journey, not a separate video product.
   Live: shared route player launched from a curated preview.
   Generated: preview imagery where labeled.
   Fit: one large composed media region with a concise introduction.

J. THE GAP
   Explain the break between a listing and everyday life.
   Live: no application behavior required.
   Generated: none required.
   Fit: editorial copy and a restrained Maps / PDFs / drive-bys composition; not another dashboard.

K. PROCESS
   Explain Add → Create → Share.
   Live: address-entry handoff, experience creation from supported data, share-link copying.
   Generated: imagery is prepared ahead of time, not falsely presented as generated on demand.
   Fit: three clear steps; no oversized cards pushing the story apart.

L. Features 1 — Walk around the home
   Host the complete street-to-interior player.
   Live: map, validated routes, controls, destination variants.
   Generated: labeled scenes.
   Fit: centered mac-style window; all stages fit the same inner frame.

M. Features 2 — Life quiz
   Household → interests → build my story → result.
   Live: deterministic personalization using available venues.
   Generated: only existing labeled imagery.
   Fit: one quiz step at a time; result stays inside the window.

N. Features 3 — Everyday stops
   Explore neighborhood photos and places.
   Live: gallery selection, place details, route-launch action.
   Sourced: existing Wikimedia photos and documented venue data.
   Fit: bounded gallery with one selected item; no masonry overflow.

O. Features 4 — Commute
   Explain travel to Alexanderplatz or another resolved destination.
   Live: supported route calculation and mode switching.
   Generated: none.
   Fit: map with one compact minutes / km / mode overlay. Unsupported modes show an explicit unavailable state.

P. Features 5 — Usual day
   Connect morning, afternoon, and evening.
   Live: selectable timeline and synchronized map stops.
   Generated: existing illustrative imagery only.
   Fit: one active time period at a time; no tall itinerary.

Q. USE CASES
   Explain Agents, Brokerages, Developers.
   Live: CTAs return to the address/demo workflow.
   Generated: optional, not necessary.
   Fit: three concise editorial treatments.

R. Shared exceptional states
   Map unavailable; no route; unsupported address; image failure; loading; share-link restoration; reduced motion.
   Live: explicit error handling and recovery.
   Generated: never substituted for missing real geography.
   Fit: local messages preserve layout. No endless spinners, broken images, or silent fake fallbacks.

4. THE BUILDER PROMPT

You are rebuilding Kiez from scratch in /root/.hermes/projects/kiez/.

Build an independent Berlin neighborhood-experience product in English, closely matching the supplied Mirai reference’s structure, visual hierarchy, proportions, and interaction pacing. This is a rebuild, not a reskin of the current cluttered implementation.

The current deployment is https://niksorokin.github.io/kiez-berlin/. Treat it as a source of reusable researched data and assets, not as the design baseline.

Deliver a working static HTML/CSS/JavaScript application. Do not stop at a mockup, screenshots, dead controls, or a written implementation plan.

A. Establish the baseline before replacing anything

Inspect the existing project, repository status, local instructions, data, image assets, and deployment configuration. Preserve unrelated user changes and retain reusable researched venue records and photo attributions.

Inspect heymirai.ai if accessible. Capture its desktop composition at 1280×720 and 1440×900, especially the hero and dark Features section. Match the reference’s spatial hierarchy, not merely its colors.

If direct reference inspection is blocked, state that limitation and follow the locked specification below. Do not claim pixel-perfect verification without comparing actual renders.

Do not copy Mirai’s horse logo, name, proprietary imagery, or investor claims. No a16z affiliation. Create a restrained Kiez wordmark.

B. Locked page structure

Use exactly this top-level story order:

1. Cream first viewport
   Headline: “Help buyers picture life around your listing.”
   Live 3D neighborhood.
   Berlin address field.
   Chips in this order: Home, Coffee, Grocery, Park, Restaurant.
   One selected place card with walking minutes.
   “Experience trip” action.

2. PREVIEW
   One strong preview of the shared neighborhood experience.

3. THE GAP
   Listings stop at the property line.
   Buyers jump between Maps, PDFs, and drive-bys.

4. PROCESS
   One address in, neighborhood out.
   Add / Create / Share.

5. DARK full-screen FEATURES
   Heading: “QUESTIONS YOUR BUYERS ASK”
   One centered mac-style interactive window.
   Five navigation dots and five named states:
   - Walk around the home
   - Life quiz
   - Everyday stops
   - Commute
   - Usual day

6. USE CASES
   Agents / Brokerages / Developers.

Do not insert testimonials, invented traction, pricing, oversized navigation, extra feature grids, or decorative sections between these sections.

C. Visual system

Required tokens:

    --cream: #f4f4f1;
    --ink: #100d0c;
    --features-bg: #100d0c;
    --features-text: #f4f4f1;
    --surface: #ffffff;
    --muted: #68655f;
    --line: rgba(16, 13, 12, 0.12);
    --line-on-dark: rgba(255, 255, 255, 0.14);
    --route: #315d48;

Typography:
- Golos Text for display headings and prominent labels.
- DM Sans for interface text and body copy.
- Load real font files or supported web-font stylesheets; provide sans-serif fallbacks.
- Keep headings editorial and compact. Do not use giant type that crushes the map.
- Preserve readable control labels and metric values.

Use a restrained spacing scale, consistent corner radii, structural dividers, and subtle elevation. Nested corners must be concentric. Avoid heavy shadows, gradients, pill overload, and generic SaaS decoration.

Use one consistent icon family with outline states and currentColor. No mixed emoji/icon language.

No transition: all. Motion must be interruptible. Routine map filtering should not trigger theatrical entrances. Respect prefers-reduced-motion.

D. Ruthless viewport fit

Desktop acceptance targets are 1280×720 and 1440×900 at normal browser zoom.

Hero:
- Headline, address, category chips, selected card, map, and primary action must fit the first viewport.
- The map must feel like the product, not a thumbnail behind controls.
- Keep only one place-detail surface open.
- Use a separate information rail or a carefully reserved card area instead of stacking unrelated overlays over the map.
- Hide secondary metrics until they are requested.

Features:
- Use a full-viewport dark section with a centered content group.
- Keep the heading, mac-style window, and five-dot navigation visible together.
- The window’s horizontal center must match the viewport center.
- Center the overall composition vertically; do not align a cramped window to the top.
- Suggested starting bounds: window width min(1080px, calc(100vw - 64px)); height min(620px, calc(100dvh - 176px)).
- Adjust bounds against real screenshots rather than accepting these values blindly.
- Use min-width: 0 and min-height: 0 through nested grid/flex layouts.
- Preserve the same outer window dimensions across all five states.
- No desktop nested scrollbars in the mac window.
- No clipped CTAs, hidden tabs, off-screen dots, truncated quiz controls, or cropped essential metrics.
- Shorter screens require reflow and a more compact composition, not browser zoom or shrinking the entire application with transform.

At narrow widths, use an intentional stacked layout and ordinary page scrolling. Do not force desktop geometry onto mobile. Keep controls usable and prevent horizontal overflow.

E. Files and architecture

Create or deliberately replace these files, adapting only where existing deployment requirements demand it:

    index.html
    css/tokens.css
    css/layout.css
    css/components.css
    js/app.js
    js/state.js
    js/map.js
    js/geocode.js
    js/routes.js
    js/journey.js
    js/features.js
    js/share.js
    data/places.json
    data/journeys.json
    data/assets.json
    data/routes/
    assets/fonts/
    assets/photos/
    assets/generated/
    tests/acceptance.spec.js
    package.json
    README.md
    QA.md

Use browser ES modules and plain CSS. A development test runner is fine; the deployed application must not require a server framework or runtime build service.

Use relative asset paths that work under /kiez-berlin/, not just at a domain root. Keep runtime secrets out of the client.

Document setup, serving, test commands, routing configuration, asset provenance, and deployment steps. Do not publish externally unless authorized.

F. Live map and evidence contracts

Use MapLibre GL JS with OpenFreeMap. Keep map attribution visible.

Default address: Bergmannstraße 25, Kreuzberg, Berlin. Resolve or reuse verified coordinates; do not invent them.

The map must remain a real interactive map:
- Pan, zoom, rotate, and select places.
- Use real geographic coordinates.
- Enable 3D building extrusion where supported by the selected style.
- Maintain the home anchor through category changes.
- Keep selected place, route, card, and journey destination synchronized.
- Resize map instances when hidden panels become visible.
- Avoid unnecessary WebGL contexts.

Photon:
- Debounce search.
- Cancel or discard stale results.
- Support loading, empty, error, keyboard navigation, and selection.
- Prefer Berlin results without pretending arbitrary searches have curated Berlin assets.

Venue data:
- Reuse existing researched Google ratings only where their provenance can be recovered.
- Store rating source and research date when available.
- Missing or unverified ratings are omitted.
- Never imply stored ratings are fetched live.
- Popularity and safety, if retained, must say “Estimate” directly beside the value and have a documented basis. Otherwise omit them.
- Do not put safety scores in the hero.

Photos:
- Reuse appropriate existing Wikimedia photographs.
- Record source URL, author, license, and required attribution.
- Verify that a photograph depicts the claimed place before naming it as that place.
- Do not scrape or impersonate Google Street View.

G. Walking routes: no counterfeit pedestrian routing

Use OSRM with an endpoint genuinely configured for pedestrian routing.

Do not assume changing a URL segment to “walking” or “foot” changes a server’s routing profile. Verify the configured service and inspect routes for pedestrian plausibility.

For curated journeys, checked-in GeoJSON responses from a verified pedestrian-configured OSRM instance are acceptable. Record origin, destination, source, routing profile, and capture date. These are precomputed routes displayed on a live map, not live recalculations.

If route duration is calculated from distance and an assumed walking pace, label it “Estimated walk” and document the assumption.

Do not:
- Relabel driving routes as walks.
- Draw a straight line and call it a walking route.
- Invent successful responses when routing fails.
- Reuse the default home’s route after an address change.

If live pedestrian routing fails, use a verified cached route only for the exact supported origin/destination pair. Otherwise show an honest unavailable state.

For Commute, expose only modes with a valid routing/data basis. Do not invent public-transport times from OSRM.

H. One journey engine, several venue variants

Implement a shared state machine:

    idle → route-review → street → walk → arrive → inside → complete

Supported controls:
- Start / pause / resume.
- Previous / next stage.
- Replay.
- Change destination.
- Exit / return to map.

Primary experience:
1. Show the complete walking route before starting.
2. Establish the street outside the home or an explicitly illustrative neighborhood departure.
3. Follow the actual route geometry on the live map.
4. Arrive at the selected venue’s mapped entrance or documented nearest routable access point.
5. Show a consistent approach and threshold.
6. Reveal a composed interior sequence.

The route must remain visible throughout. During image stages, show a live map inset with home, route, destination, and current stage marker. During Walk, promote the map to the main stage.

Do not make the route an animated background video. Playback progress represents a preview, not the buyer’s live location.

Use coherent cuts and restrained crossfades. Do not imply a continuous photographic recording when the experience is a sequence of stills.

Changing destination must cancel pending playback and stale route requests. Exiting must stop timers and animations. Returning to the journey must have a defined, predictable state.

Hero, PREVIEW, gallery, and timeline must all invoke this same engine. Hero/PREVIEW actions can scroll to Features and activate Walk; do not create disconnected players with different behavior.

I. Venue scope and generated shots

The journey schema must support:
- Café.
- Market hall.
- Gym.
- Restaurant.
- Park pavilion.
- Museum.

Mandatory finished launch journeys:
- One café.
- One market hall.
- One gym.

Choose actual public venues from verified local data. Confirm coordinates and general visitor accessibility. A gym may require membership; do not imply unrestricted entry. Do not invent admission, opening hours, or availability.

Additional types appear as playable only when their routes, evidence labels, and scenes are complete. No weak filler journeys or dead “coming soon” controls.

For each finished journey, request a coordinated image set:

1. Street establishing shot.
   Berlin neighborhood scale, credible architecture, eye-level walking perspective. If the exact address is not verified in the imagery, describe and label it as illustrative rather than documentary.

2. Destination approach.
   Camera nearing a plausible entrance, matching the exterior reference where one is legitimately available.

3. Threshold.
   View through an open doorway, maintaining entrance materials, light, camera direction, and architectural continuity.

4. Interior reveal.
   A wide composition with an obvious connection to the threshold.

5. Interior detail.
   A closer view that reinforces the venue type without resetting the design.

Venue-specific interiors:
- Café: espresso counter, warm wood, neighborhood seating, daylight.
- Market hall: covered aisles, produce stalls, steel or masonry structure.
- Gym: credible circulation, training equipment, restrained industrial materials.
- Restaurant: dining room, tables, bar or kitchen threshold.
- Park pavilion: open-sided shelter and park context; do not force a sealed-room interior.
- Museum: foyer and gallery, generic exhibits, no invented branded collection.

Global generation requirements:
- Landscape compositions with safe crop areas.
- One coherent time of day and lighting direction per journey.
- Consistent entrance geometry, materials, and visual identity across shots.
- No readable text, logos, watermarks, fake signage, or recognizable private individuals.
- No claims of exact venue interiors without verified photography.
- Persistent on-image label: “Illustrative · AI-generated.”
- Interior disclosure: “Not a verified depiction of this venue.”
- Prompts and generation provenance recorded in data/assets.json.

Generate a small set well. Review the shots together as a sequence, not as isolated images.

If image generation is unavailable, report the blocker and try an available legitimate generation path. Verified, licensed interior photographs may be used with correct attribution. Do not fabricate generation results or mark unfinished journeys complete.

J. Five Features interaction contracts

Use five semantic tabs with five visible dot indicators. Give every tab an accessible name, selected state, keyboard navigation, and focus treatment. No automatic tab rotation.

1. Walk around the home
   Default to the best finished journey.
   Include a compact destination selector inside the window.
   All journey stages must fit without changing the window bounds.

2. Life quiz
   Household → interests → “Build my story.”
   Validate selections.
   Build a deterministic recommendation from actual available places.
   Show the result and “Experience this day.”
   No pretend AI loading sequence or claim of fresh image generation.

3. Everyday stops
   Sourced photo gallery with place names and categories.
   Selecting a photo shows its details and the related map location.
   “Experience trip” opens its completed journey where available.
   Other places can offer “View route” without falsely promising interiors.

4. Commute
   Default destination: Alexanderplatz.
   Show minutes, km, and mode.
   Keep values synchronized with the selected route and mode.
   Mark estimates and cached data.
   Unsupported modes must explain their limitation instead of displaying invented numbers.

5. Usual day
   Morning / afternoon / evening selector.
   Each period highlights actual stops and available journey actions.
   Quiz preferences update recommendations.
   No fabricated opening hours or claims that a business is currently open.

Persist appropriate state across tabs without letting hidden views continue playback.

K. Sharing and recovery

Use a versioned URL hash or query state suitable for static hosting.

Restore supported address, selected venue, active feature, and quiz selections without requiring a backend.

Validate incoming state. Unknown IDs, invalid coordinates, or corrupt state fall back safely with a clear message.

Copy-link behavior must work through the Clipboard API where available, with a visible manual-copy fallback.

Changing to a new address invalidates incompatible routes and curated departure imagery. Explain when cinematic sequences are available only for the curated Berlin demo. Do not pretend pre-generated imagery dynamically depicts any address.

L. Acceptance tests and evidence

Implement automated browser checks and perform visual review.

Required functional checks:
- Static site works at both local root and a /kiez-berlin/ base path.
- Default Berlin map loads, supports interaction, and displays attribution.
- All five hero chips work; only one detail card is active.
- Photon success, empty, failure, and stale-response handling work.
- Every route has an auditable pedestrian-routing basis.
- At least three distinct venues complete street → walk → arrive → inside.
- The route remains visible during image stages.
- Start, pause, resume, back, next, replay, change destination, and exit work.
- Rapidly changing destinations cannot restore an old route or continue old playback.
- All five Features states work within the same outer frame.
- Quiz results reference actual available places.
- Gallery and timeline actions open the correct destination.
- Commute metrics and mode labels are truthful.
- Share links restore state; malformed links fail safely.
- Route, tile, geocoder, and image failures produce explicit recoverable states.
- No uncaught application exceptions, missing local assets, or leaked secrets.

Required visual checks:
- Capture hero and every Features state at 1280×720 and 1440×900.
- Capture every stage of the three finished journeys at the smaller desktop size.
- Compare the reference and rebuild for section order, spacing, map prominence, window placement, and text wrapping.
- Verify full Features fit with bounding-box assertions and screenshots, not merely overflow: hidden.
- Verify controls and indicators are visible, not just that the outer container fits.
- Check a narrow mobile viewport for readable content and no horizontal overflow.
- Verify keyboard access, focus visibility, image disclosures, attribution, contrast, and reduced motion.

Record exact commands, observed results, screenshots, known limitations, and provenance in QA.md. Do not say tests passed unless they actually ran.

Completion means an exercised application, not a promising layout. If a genuine external dependency blocks completion, disclose it; never replace missing proof with simulated success.

Do not stop until the live map, 5 Features states, and at least 3 street→interior sequences work.
