# Minerva Design System & UX Instructions

Ce document constitue la référence absolue et impérative pour la conception, la révision et le styling de toutes les interfaces de **Minerva Trequartista**. Il s'applique à tous les layouts, composants, pages et design tokens.

---

# Visual Design Instructions

Follow these instructions whenever you build, style, or revise a user interface. They apply to layouts, components, pages, and design tokens.

Project tokens always override these defaults. If the project defines a color, type scale, spacing scale, radius, or component, use it and do not invent a parallel one.

## 0. Project Tokens (Minerva Trequartista — Mintlify Standard)

* **Accent color**:
  - Primaire / Brand : Mint Green `#0c8c5e` (`--color-mint-green`) — Liens de marque, états actifs nav, icônes de fonctionnalités, points d'eyebrow, soulignement sur références de code inline. L'unique étincelle chromatique du système.
  - Hover : `#09734d`
  - Fond Subtil / Tint : `#ecfdf5` (rgba(12, 140, 94, 0.06))
  - Bordure Subtile : `#a7f3d0`
  - Focus Ring : `ring-2 ring-[#0c8c5e] ring-offset-1`
* **Neutral scale (Mintlify Monastic White & Inks)**:
  - Background Canvas : Paper White `#ffffff` (`--color-paper-white`) — Toile blanche monastique intégrale.
  - Surfaces / Cartes : Paper White `#ffffff`
  - Diviseurs & Bordures capillaires : Mist Gray `#f2f2f2` (`--color-mist-gray`)
  - Bordures d'inputs & hover de cartes : Cloud Gray `#dddddd` (`--color-cloud-gray`)
  - Texte de Corps : True Black `#000000` (`--color-true-black`)
  - Titres Majeurs & Boutons Primaires : Ink Black `#08090a` (`--color-ink-black`)
  - Texte Secondaire : `#71717a` (`text-zinc-500`)
  - Texte Atténué / Mute : `#a1a1aa` (`text-zinc-400`)
* **Buttons & Actions**:
  - Bouton Primaire (Highest-weight action) : Fond Ink Black `#08090a`, texte blanc `#ffffff`, rayon `4px`, padding 8px 16px, Inter 14-15px weight 500. Ombre murmurée 0.03.
  - Bouton Secondaire (Ghost) : Fond transparent, texte True Black `#000000`, hover fond Mist Gray `#f2f2f2`.
  - Bouton Mint (Accent) : Fond Mint Green `#0c8c5e`, texte blanc `#ffffff`.
* **Semantic & Status hues (Strictement réservés aux statuts & badges métiers)**:
  - Succès / Validé : `#0c8c5e` (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - En cours / Warning / Attention : `#d97706` (`bg-amber-50 text-amber-700 border-amber-200`)
  - Erreur / Alerte critique / Bloqué : `#ef4444` (`bg-red-50 text-red-700 border-red-200`)
  - Information / Tech / Système : `#2563eb` (`bg-blue-50 text-blue-700 border-blue-200`)
  - Guide Fondatrice / VIP : `#7c3aed` (`bg-purple-50 text-purple-700 border-purple-200`)
* **Typeface**:
  - `Inter` universel pour toute l'interface (titres, corps, nav, boutons, inputs, code).
  - Poids : 400 (regular), 500 (medium), 600 (semibold).
  - OpenType : `"ss01" on, "cv11" on`.
  - Chiffres Financiers & Compteurs : `Inter` / `JetBrains Mono` (`font-mono tabular-nums`).
* **Type scale**:
  - `13px` (`--text-caption`, 1.5 leading, +0.65px tracking) : Eyebrow labels en uppercase, micro-labels
  - `14px` : Boutons, navigation, inputs
  - `16px` (`--text-body`, 1.5 leading, -0.16px tracking) : Corps de texte de lecture
  - `20px` (`--text-subheading`, 1.3 leading, -0.2px tracking) : Sous-titres
  - `24px` (`--text-heading-sm`, 1.33 leading, -0.24px tracking) : Titres de cartes et sections
  - `40px` (`--text-heading`, 1.15 leading, -0.4px tracking) : Grands titres
  - `57px` (`--text-display`, 1.1 leading, -1.14px tracking) : Display hero
* **Spacing scale**:
  - `4px, 5px, 6px, 7px, 8px, 10px, 12px, 16px, 24px, 28px, 32px, 48px, 64px, 72px, 96px, 201px`.
* **Corner radius (Mintlify Square Geometry)**:
  - Boutons, Inputs, Tags & Badges : `4px` (`rounded`)
  - Cartes : `16px` (`rounded-2xl`)
  - Grands Conteneurs & Modales : `24px` (`rounded-3xl`)
  - Règle stricte : Pas de boutons pilules, pas de rayons 9999px ni d'avatars arrondis (avatars en carrés doux 4px ou 16px). Inter pour 100% de l'interface sans police display concurrente.
* **Shadow (Whispered Elevation)**:
  - Élévation légère 0.03 : `0 2px 4px 0 rgba(0, 0, 0, 0.03)` (`--shadow-sm`)
  - Cartes & surfaces élevées 0.05 : `0 2px 4px 0 rgba(0, 0, 0, 0.05)` (`--shadow-sm-2`)
* **Icon library**:
  - `lucide-react` exclusivement (16px inline `w-4 h-4`, 20px boutons `w-5 h-5`, 24px standalone `w-6 h-6`).
* **Component library or directory**:
  - `components/` (avec `components/ui/`, `components/shared/` et primitives Radix UI).

---

## 1. Color

Color carries meaning. Use as little of it as possible so the meaning stays legible.

* Use one accent color. It marks the primary action and active states, nothing else.
* Everything else is a neutral scale: one background, one surface, one border, two text colors (primary and secondary).
* Semantic colors (success, warning, error) exist only for status and validation. Never use them decoratively.
* Text contrast is at least 4.5:1 against its background. Large text and icons are at least 3:1.
* Never convey state with color alone. Pair it with text, an icon, or a shape.
* Define every color once as a token. No hard-coded hex values in components.
* Support light and dark themes through tokens, not through duplicated styles.

## 2. Typography

Type is most of the interface. Get the scale right and most hierarchy problems disappear.

* Use one typeface family for the interface. A second family is allowed only for code, or for a deliberate editorial contrast defined in the project tokens.
* Use a single modular type scale with a ratio of at least 1.25. Default: 14, 16, 20, 25, 31, 39.
* Body text is 16px or larger. Small labels are never below 12px.
* The page's top heading is at least twice the body size.
* Use at most three font weights: regular, medium, bold.
* Body line height is 1.5 or more. Heading line height is 1.1 to 1.25.
* Reading text has a maximum measure of 65 to 75 characters.
* Left-align interface text. Center text only for short standalone lines such as an empty state or a hero heading.
* Use sentence case for labels, buttons, and headings unless the project specifies otherwise.
* Uppercase is for micro-labels only, at 12 to 13px with letter-spacing of 0.05em or more.

## 3. Spacing and Grid

Consistent spacing is the difference between one object and a pile of parts.

* Every margin, padding, gap, and size is a multiple of 8px. 4px is allowed inside compact components.
* Use one spacing scale: 4, 8, 16, 24, 32, 48, 64, 96. No other values.
* Related elements sit closer together than unrelated ones. The gap between groups is at least twice the gap within a group.
* Whitespace increases with hierarchy. Section gaps are larger than block gaps, which are larger than element gaps.
* Align everything to a shared left edge. Ragged left edges read as mistakes.
* Vertical rhythm follows the spacing scale. Do not eyeball it.

## 4. Layout and Width

Width is a readability decision, not a screen decision.

* Constrain content width. Default maximum for reading layouts is 720px. Default maximum for application layouts is 1280px.
* Use a 12-column grid for page layouts and CSS grid or flexbox for components. Do not mix ad hoc pixel positioning with either.
* Build one responsive layout with breakpoints. Do not build separate mobile and desktop versions.
* Default breakpoints: 640, 768, 1024, 1280.
* Content reflows at breakpoints. Nothing is hidden on mobile that the user needs to complete the task.
* Sticky elements are limited to one header and, at most, one action bar.

## 5. Hierarchy

The user should know what matters most within one second.

* Each view has one visually dominant element. Usually the heading or the primary action.
* Establish hierarchy with size and weight first, then space, then color. Decoration is last and usually unnecessary.
* Use at most three levels of visual hierarchy on a single view.
* Secondary information uses the secondary text color and a smaller size, not a lighter weight of the same size.
* De-emphasize before you emphasize. Quieting everything else is cheaper than making one thing louder.

## 6. Containers, Borders, Shadows, and Radii

Containers are for grouping, not decoration.

* Separate groups with space first. Add a border or background only when space alone leaves the grouping ambiguous.
* Do not wrap every section in a card. A card is for a repeated, self-contained unit such as a list item or a product.
* Never nest a card inside a card.
* Use one corner radius token for components and at most one larger token for containers and modals.
* Use one shadow token, or none. If the project's aesthetic is flat or brutalist, use borders and no shadows.
* Borders are 1px and use the border token. Never use borders thicker than 2px for grouping.
* Dividers replace neither spacing nor headings. Use them only in dense lists and tables.

## 7. Buttons and Actions

One view, one primary action.

* Each view has exactly one primary button. It uses the accent color as its fill.
* Secondary actions are outline or ghost buttons in neutral colors. Tertiary actions are text links.
* Destructive actions use the error color and never sit beside the primary action without spacing.
* Button labels are verbs. "Save changes", not "OK". "Delete project", not "Confirm".
* Button height is 40px by default, 32px in compact contexts, 48px on touch-first screens.
* Interactive elements have a minimum target of 44 by 44px, using padding if the visual is smaller.
* Do not use an icon as the only content of a button unless it has a visible label on hover and an aria-label always.

## 8. Interaction States

An element without states is a mockup.

* Every interactive element has hover, focus-visible, active, and disabled states.
* Every asynchronous element has loading, empty, error, and success states.
* Focus rings are visible, at least 2px, and use the accent color. Never remove the outline without replacing it.
* Disabled elements are visibly disabled, at reduced opacity, and are not focusable.
* Hover changes are subtle: a background shift, an underline, or a border. Do not change size or layout on hover.
* Loading states preserve layout. Use skeletons or fixed-height placeholders instead of collapsing content.
* Selected and active states are distinct from hover.

## 9. Icons

Icons support labels. They rarely replace them.

* Use one icon library for the entire product.
* One stroke weight and one size per context. Default sizes: 16px inline, 20px in buttons and inputs, 24px standalone.
* Icons align to the text baseline or center of the line they sit with.
* Icons that carry meaning have a text label or an aria-label. Decorative icons are aria-hidden.
* Do not mix filled and outlined styles from the same library in one view.
* Do not use emoji as icons in the interface.

## 10. Forms and Inputs

Forms are where most interfaces fail.

* Labels sit above inputs, left-aligned, always visible. Placeholder text is not a label.
* Input height matches button height. Default 40px.
* One column. Multi-column forms are allowed only for short related fields such as city and postal code.
* Group fields with headings and spacing. Break long forms into steps at logical boundaries.
* Show validation inline, next to the field, after the user leaves the field. Never only at the top of the form.
* Error messages say what went wrong and how to fix it, in plain language.
* Required fields are the default. Mark optional fields instead.
* The submit button sits directly below the last field, left-aligned with the inputs.

## 11. Tables and Data

Density is fine. Noise is not.

* Numbers are right-aligned and use tabular figures. Text is left-aligned.
* Use row spacing or subtle row backgrounds instead of vertical borders.
* Column headers are visually distinct through weight or case, not through a colored background.
* Keep row height consistent. Default 48px, compact 40px.
* Truncate long text with an ellipsis and show the full value on hover or focus.
* Empty tables show an empty state with a clear next action, not a blank grid.

## 12. Motion

Motion explains change. It does not decorate.

* Use motion only to show where something came from or went to, or to confirm an action.
* UI feedback transitions are 100 to 200ms. Layout transitions are 200 to 300ms. Nothing in the interface exceeds 400ms.
* Use ease-out for elements entering and ease-in for elements leaving.
* Respect prefers-reduced-motion. Reduce or remove all non-essential motion when it is set.
* Do not animate on page load. Do not animate continuously.

## 13. Imagery and Empty States

Every screen has a state where the content is missing.

* Every list, table, and dashboard has a designed empty state with one sentence and one action.
* Images have a fixed aspect ratio and a placeholder background so layout never shifts while loading.
* Do not use stock illustrations or decorative images to fill space. Space is fine.
* Avatars and thumbnails are one consistent size and radius per context.

## 14. Consistency and Components

Reuse before you create.

* Check the project's existing components before building anything. Reuse them. Extend them only when necessary.
* Similar things look the same. Different things look different. Never reuse a visual treatment for a different meaning.
* Every value in a stylesheet comes from a token. If you need a value that has no token, add the token first.
* Name components and tokens by role, not by appearance. "surface", not "light-gray". "primary-button", not "blue-button".
* One pattern per problem. If the codebase has two ways to do the same thing, use the more common one and flag the other.

## 15. Accessibility

Accessible is the baseline, not a feature.

* Use semantic HTML: headings in order, lists as lists, buttons as buttons, links as links.
* Every image has alt text or is marked decorative.
* Every input has an associated label.
* Every interactive element is reachable and operable by keyboard, in a logical order.
* Contrast, focus, target size, and motion rules above are requirements, not preferences.
* Test at 200 percent zoom. Nothing overlaps, nothing is cut off.

## Finish Pass

Before declaring any interface complete, do this review and fix what fails:

1. Count the accent colors on screen. The answer is one.
2. Count the distinct font sizes. The answer is five or fewer.
3. Count the primary buttons in the view. The answer is one.
4. Check every spacing value against the scale. Remove any that are not on it.
5. Find every card. For each one, ask whether spacing alone would have grouped it. Remove the ones where the answer is yes.
6. Find every interactive element. Confirm hover, focus-visible, active, and disabled states exist.
7. Find every asynchronous element. Confirm loading, empty, and error states exist.
8. Tab through the whole view. Confirm focus is visible and the order is logical.
9. Resize to 375px wide. Confirm nothing overflows and the primary action is still reachable.
10. Remove anything left that does not help the user complete the primary action.

When rules conflict, prioritize in this order: legibility, accessibility, the project's existing patterns, then these defaults. Do not apply these rules mechanically. Use them to make deliberate decisions for the user's context and goal.

---

# UX Design Instructions

Follow these instructions whenever you design, build, or revise a user interface. Apply them across layouts, navigation, onboarding, forms, settings, dashboards, and interactive flows.

Your goal is to minimize confusion, reduce effort, prevent mistakes, and help users complete their intended task as quickly as possible.

## 1. Reduce Choices per Screen: Hick's Law

The time required to make a decision increases with the number and complexity of available choices.

* Give each screen one clear purpose.
* Remove irrelevant or low-priority options.
* Break complicated decisions into smaller steps.
* Recommend an option when users may struggle to choose.

## 2. Make Targets Large: Fitts's Law

Large, nearby targets are faster and easier to interact with.

* Make buttons and controls easy to click or tap.
* Give interactive elements sufficient spacing.
* Avoid tiny icons as the only interaction target.
* Increase the clickable area around important controls.

## 3. Follow Familiar Patterns: Jakob's Law

Users expect your product to work like products they already understand.

* Use established interface conventions.
* Place navigation, search, settings, and account controls where users expect them.
* Use familiar icons and interaction patterns.
* Do not invent a new pattern unless it provides a meaningful advantage.

## 4. Group Related Information: Law of Proximity

Elements positioned near one another are perceived as related.

* Place related labels, controls, and information together.
* Use spacing to communicate relationships.
* Separate unrelated groups with additional space.
* Do not rely on borders when spacing can establish the hierarchy.

## 5. Break Content Into Chunks: Miller's Law

Working memory can only process a limited amount of information at once.

* Divide long content into small, meaningful groups.
* Break complex forms and tasks into manageable steps.
* Use headings, sections, and concise labels.
* Avoid asking users to remember information between screens.

## 6. Respond Within 400 Milliseconds: Doherty Threshold

Interfaces feel more productive when feedback appears within approximately 400 milliseconds.

* Acknowledge every user action immediately.
* Show loading, processing, or success states when results are not instant.
* Use optimistic updates when they are safe.
* Never leave users wondering whether their action registered.

## 7. Highlight the Primary Action: Von Restorff Effect

An element that visually differs from surrounding elements receives more attention.

* Give the primary action the strongest visual emphasis.
* Use one dominant call to action per section.
* Keep secondary actions visually quieter.
* Avoid making every button compete for attention.

## 8. Place Key Actions Nearby: Fitts's Law

Interaction becomes faster when important targets are close to the user's current focus.

* Place actions beside the content they affect.
* Keep form submission near the final input.
* Position frequent actions within easy reach.
* Avoid forcing unnecessary cursor or eye movement.

## 9. Put Essentials First: Serial Position Effect

People remember the first and last items in a sequence most clearly.

* Put the most important information first.
* Place the final action or takeaway at the end.
* Keep lower-priority information in the middle.
* Order navigation and lists according to user importance.

## 10. End Flows Memorably: Peak-End Rule

Users judge an experience largely by its most intense moment and how it ends.

* Create a clear and satisfying completion state.
* Confirm what the user accomplished.
* Explain what happens next.
* Avoid ending flows on an empty or ambiguous screen.

## 11. Show Visible Progress: Zeigarnik Effect

Incomplete tasks remain mentally active and encourage users to return.

* Clearly show completed and unfinished steps.
* Save progress whenever possible.
* Make it easy to resume interrupted tasks.
* Use checklists or completion states for multi-step work.

## 12. Simplify Complex Interfaces: Law of Prägnanz

People interpret complex or ambiguous designs in the simplest form possible.

* Prefer simple structures and recognizable shapes.
* Remove unnecessary decoration and visual noise.
* Create an obvious visual hierarchy.
* Make the interface understandable at a glance.

## 13. Use Sensible Defaults: Hick's Law

Helpful defaults reduce the number of decisions users must make.

* Preselect the safest and most common option.
* Use existing context to reduce unnecessary input.
* Never use defaults that create unexpected commitments.
* Make every default easy to change.

## 14. Prevent Errors Proactively: Postel's Law

Interfaces should accept reasonable variations in user input while producing clear, predictable results.

* Accept common input formats and variations.
* Explain requirements before submission.
* Disable impossible or unavailable actions.
* Warn users before risky or destructive actions.

## 15. Make Errors Recoverable: Postel's Law

The interface should handle user mistakes gracefully without creating unnecessary failure.

* Preserve the user's work after an error.
* Explain what went wrong in plain language.
* Tell the user exactly how to fix it.
* Provide undo, retry, restore, or cancel options where appropriate.

## 16. Maintain Pattern Consistency: Law of Similarity

Elements that look similar are perceived as having related purposes.

* Give similar components the same appearance and behavior.
* Use consistent colors, labels, icons, spacing, and interaction states.
* Do not use the same visual treatment for different actions.
* Reuse established components before creating new ones.

## 17. Connect Related Elements Visually: Law of Uniform Connectedness

Visually connected elements are perceived as more closely related.

* Use containers, lines, backgrounds, or shared states to show relationships.
* Visually connect controls to the content they affect.
* Keep unrelated elements visually separate.
* Use connection deliberately, not decoratively.

## 18. Reduce Task Completion Time: Parkinson's Law

Tasks tend to expand to consume the time made available for them.

* Minimize the number of steps required.
* Remove unnecessary confirmations and screens.
* Prefill information the user has already provided.
* Offer shortcuts for frequent or repeat actions.

## 19. Reveal Complexity Gradually: Tesler's Law

Every system contains some complexity that cannot be removed, only managed or transferred.

* Show essential controls first.
* Reveal advanced options only when relevant.
* Let the system handle complexity whenever possible.
* Do not force users to understand internal technical details.

## 20. Make Completion Feel Closer: Goal-Gradient Effect

Motivation increases as users perceive themselves getting closer to a goal.

* Show progress throughout multi-step flows.
* Divide long tasks into visible milestones.
* Emphasize progress already made.
* Make the remaining work feel specific and achievable.

## Implementation Requirements

When creating or revising an interface:

1. Identify the user's primary goal.
2. Design the shortest clear path to that goal.
3. Make the next action visually obvious.
4. Remove anything that distracts from task completion.
5. Provide immediate feedback after every interaction.
6. Prevent errors before they occur.
7. Preserve user work when something goes wrong.
8. Confirm clearly when the goal has been completed.

When laws appear to conflict, prioritize clarity, accessibility, user control, and successful task completion. Do not apply these laws mechanically. Use them to make deliberate decisions based on the user's context and goal.

---

## 21. Mobile Navigation & Thumb Ergonomics Standard (uxpeak Masterclass)

La barre de navigation inférieure mobile (`MobileBottomNav`) représente l'épine dorsale structurelle de l'application sur smartphone. Elle doit obéir à des règles strictes d'ergonomie physique et d'accessibilité :

* **Rôle Exclusif des Destinations Clés** :
  - Conserver uniquement les 4 destinations structurelles à haute fréquence (`Accueil`, `Leads`, `Tâches`, `Menu`) plus 1 action centrale.
  - Exclure rigoureusement les utilitaires secondaires (FAQ, mentions légales, boutons de déconnexion, flèches de retour).
* **Zone de Confort du Pouce & Bouton Central d'Action (Center CTA)** :
  - Positionner un bouton d'action central surélevé en **Ink Black `#08090a`** avec icône `+` blanche.
  - Le Center CTA se trouve directement dans la zone d'atteinte naturelle du pouce et ouvre un tiroir d'actions rapides (Quick Action Sheet) sans forcer l'utilisateur à repositionner sa main.
* **Zone de Sécurité Home Indicator (34px Safe Zone)** :
  - Sur les smartphones récents bord-à-bord (iOS et Android), réserver impérativement 34px de marge inférieure (`pb-[max(0.75rem,env(safe-area-inset-bottom,34px))]`).
  - Aucun élément cliquable ni icône ne doit chevaucher la barre de balayage d'accueil de l'OS sous peine de déclencher des fermetures accidentelles d'application.
* **Normalisation des Tailles & Textes d'Accessibilité** :
  - Icônes standardisées à 20-24px (`w-5 h-5` ou `w-6 h-6`) avec épaisseur de trait cohérente.
  - Labels textuels systématiques de 10px à 12px positionnés sous chaque icône. Jamais de barre "icônes seules" afin d'éviter toute ambiguïté cognitive.
* **Contraste d'État & Micro-Interactions** :
  - Respect du ratio de contraste WCAG ≥ 3:1 pour les états inactifs (`text-zinc-500` / `#71717a`).
  - État actif marqué par la teinte **Mint Green `#0c8c5e`** avec indicateur animé glissant sous/sur l'onglet.
  - Retour tactile haptique immédiat (`triggerHaptic('light')`) lors de chaque tapotement sur un onglet ou sur le bouton central.

---

## 22. E-Commerce, Product Pages & Sticky Ordering Standard (uxpeak Masterclass)

Pour toutes les fiches d'offres, forfaits de services (Studio Packages), devis et pages de commande client (`Minerva Flow`), les principes de conversion sans friction doivent être appliqués :

* **Contraste des Icônes sur Images (Icon Backplate Containers)** :
  - Ne jamais superposer des icônes ou des boutons de navigation nus directement sur des photos ou des visuels pleins.
  - Encapsuler chaque icône dans une boîte de contraste dépolie (`bg-white/85 backdrop-blur-xs border border-white/60 text-[#08090a] rounded p-1.5`) assurant une lisibilité parfaite quel que soit le fond.
* **Sélecteur de Quantité Adjacent & Prix Dynamique dans le Bouton** :
  - Ne jamais éloigner le sélecteur de quantité du bouton d'achat.
  - Placer les commandes de quantité (`-` [qté] `+`) immédiatement adjacentes au bouton d'action principal.
  - Intégrer le montant total calculé directement à l'intérieur du bouton d'achat principal en Ink Black : `Ajouter au Panier • 38,00 $` ou `Commander • 62,50 $`.
* **Chips de Quantité Prédéfinis (Predefined Quantity Chips)** :
  - Proposer des boutons de sélection rapide à 4px (`1 portion`, `2 portions`, `3 portions`) pour permettre un choix en un seul tap tout en conservant le sélecteur manuel personnalisé.
* **Barre d'Achat Collante (Sticky Purchase Bar)** :
  - Ancrer la barre d'achat au bas du viewport (`sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#f2f2f2]`) dès qu'au moins 1 article est sélectionné ou dans les fiches détaillées.
  - L'utilisateur peut ainsi faire défiler la page, consulter les descriptions, allergènes et avis sans jamais perdre de vue le coût total ni l'action de confirmation.
* **Badges & Labels Dé-saturés** :
  - Géométrie carrée 4px (`rounded`), texte majuscule avec espacement généreux (`tracking-wider text-[10px]`).
  - Éviter les couleurs rougeoyantes saturées au profit de teintes douces intégrées au canvas Paper White (`#ecfdf5`, `#f4f4f5`, `#fef3c7`).
* **Carte Coulissante sur le Hero (Slide-up Card Layout)** :
  - Présenter les détails de l'article dans une carte douce qui coulisse par-dessus l'en-tête visuel lors du défilement, maintenant le titre et le prix visibles à tout moment.

