---
name: useDebounce hook — QMS search debouncing
description: Where the hook lives and how it is wired into all list pages
---

## Rule
All search inputs that drive API calls must use `useDebounce(search, 400)` so a query fires only after the user pauses typing, not on every keystroke.

**Why:** Without debounce, every keystroke triggers a separate network request, causing unnecessary server load and flickering results in the UI.

**How to apply:**
- Import: `import { useDebounce } from "@/hooks/use-debounce";`
- Add `const debouncedSearch = useDebounce(search, 400);` inside the component
- Replace `search` with `debouncedSearch` in the `params` / query-key object passed to the React Query hook
- Pages already wired: `deviations/list.tsx`, `capa/list.tsx`, `change-control/list.tsx`, `audit-trail.tsx`, `users.tsx`
- When adding a clear (×) button to a search input, also call `setPage(1)` so the user lands on page 1 of fresh results
