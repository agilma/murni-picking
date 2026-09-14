# Design Principles: Murni-Booth

The user has explicitly stated the following strict design principles for this project:

1. **Simple, Elegan, UX Oke**: The UI must always prioritize a simple, elegant appearance and excellent User Experience. Do not overcomplicate layouts.
2. **Standard Mobile UX**: Always use standard, recognizable mobile UX patterns (e.g., standard back button placements with adequate 44x44px touch targets). Do not invent non-standard UI patterns for common actions.
3. **Light Mode Only**: Do not use or configure Dark Mode media queries. The app should strictly follow the light theme variables (white/slate backgrounds, crisp blue accents) for a clean, premium look.
4. **No AI Slop**: Avoid excessive glassmorphism, over-the-top gradients, or mismatched generic colors. Stick to the design tokens already defined in `index.css`.
