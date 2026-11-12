// Logos drawn in plain black vanish on ink surfaces. Invert only those, in dark
// scopes, and leave every brand-coloured logo untouched.
const MONO_LOGOS = [
  "/logos/openai.svg",
  "/logos/github.svg",
  "/logos/browse.svg",
  "/logos/fetch.svg",
  "/logos/search.svg",
];

export const logoClass = (src: string) =>
  MONO_LOGOS.includes(src) ? "dark:invert" : undefined;
