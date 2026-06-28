# 29projects Lab

> We build the things that should exist.

The studio site for **29projects Lab** — an AI-native studio prototyping and
shipping across AI, crypto, IoT, hardware, solar, and defense. A bold,
neo-brutalist single-page site.

## What's here

A zero-dependency static site — no framework, no build step, no runtime.

| File | Purpose |
| --- | --- |
| [index.html](index.html) | Page markup (semantic HTML, styling kept inline to mirror the design). |
| [styles.css](styles.css) | Global resets, keyframes and responsive rules. |
| [app.js](app.js) | Behaviour: cold-open intro, scroll reveals, animated stat counters, hover/focus/active interactions, and the Request Board form. |
| [design/](design/) | The original Claude Design source this site was implemented from (`29projects-lab.dc.html` + its `support.js` runtime), kept for provenance. |

The site was implemented from the Claude Design document `29projects Lab.dc.html`.
The design's template-runtime features — `{{ }}` bindings, `<sc-if>` / `<sc-for>`,
`style-hover` / `style-focus` / `style-active`, and the `DCLogic` component — were
compiled down into plain HTML/CSS/JS so the page runs anywhere with no dependency
on the design runtime.

## Run it

It's a static site — open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Wiring the Request Board

The brief form currently confirms from in-session state only. To receive
submissions, POST the payload to a backend in the submit handler in
[app.js](app.js) (a Formspree endpoint or a Supabase insert both work) — see the
commented `payload` block.

## Notes

- Honors `prefers-reduced-motion` (skips the intro and entrance animations).
- Degrades gracefully without JavaScript (content stays visible; intro is hidden).
- Sections: Hero · Stats · Domains · Builds (PowerGrid, Nectar, Itô) · Process · Request Board.

Built remotely · shipping at the frontier.
