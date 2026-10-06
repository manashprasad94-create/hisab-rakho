# UI refinement

The product brief is in `PRODUCT.md`; reusable design rules are in `DESIGN.md`.
Tokens and responsive styles live in `src/index.css`. Shared controls, navigation,
feedback, headers, loading, empty states, cards, and avatars live in
`src/components`.

The refinement applies across the dashboard, friends and transaction screens,
personal expenses and notes, group funds and their deposit/expense/history/member
screens, profile, updates, receipt-processing status, landing page, and all four
authentication screens. Financial calculations, database calls, Edge Functions,
authentication handlers, and permissions were not rewritten for this work.

## Checks

- Production build and lint passed.
- Nine primary foreground/background token pairs meet at least 4.5:1 contrast.
- All 33 form controls have associated labels or accessible names.
- Selected controls expose pressed state; navigable cards have keyboard access.
- Reduced motion and mobile safe-area spacing are included.

No browser was connected during implementation. Rendered layout and interaction
checks are still required at mobile (320–390px), tablet, and desktop widths. Review
long names/amounts, focus order, loading/error states, form submission, category
selection, mobile navigation, and the desktop sidebar in a connected browser.
Use existing accounts; UI verification should not create or settle live financial
records without the user's direction.

No new database migration or Edge Function deployment is needed for this UI work.
The existing app build can be deployed through the project's current hosting
workflow. Earlier backend changes retain their separate deployment requirements.

The design-image versus direct-code workflow preference remains unset. This pass
refines existing screens directly and does not store a default for future work.
