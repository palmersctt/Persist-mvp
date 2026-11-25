# Card quote without italics

`CardContent` renders the quote in italic (`CardContent.tsx:209-222`), which
conflicts with the brand rule "no italic-for-emphasis". Render it upright;
keep the curly quotes. Card system: full pipeline.
