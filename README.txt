The Self, Rewoven — interactive web prototype

Open index.html in a browser, or serve the folder locally.

Implemented:
- landing page with random C4D preview
- click to enter Core_C4D directly
- timed pauses and clickable framed hotspots
- nested scene flow for Core / Baroque / Dopamine / Wabi-sabi
- full-viewport video playback with white overlay controls and persona-only headings
- separate user-provided music tracks: main music for the site and C4D scenes; AIGC/TD music only while a weave is visible
- smooth crossfades between the two music tracks
- AIGC scenes start with the unmodified AIGC video; the first click activates a full-frame weave
- each subsequent click increases the weave density across the entire frame, up to 6 levels
- AIGC forms horizontal weft strips and TD forms vertical warp strips, with alternating over-under intersections
- uneven strip widths create a less mechanical, woven appearance
- a 300 ms click debounce and a maximum density level help prevent excessive rapid changes
- exit button follows the return logic described by the user

Audio files are stored in assets/audio. Video files are stored in assets/videos.
