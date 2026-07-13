// Seed dictionary of well-known subscription/merchant → domain mappings. This is
// the free, instant tier of merchant resolution: a normalized name that hits
// here never touches Claude. Keys are already normalized (see normalizeKey in
// resolve.ts) — lowercase, alphanumerics + spaces only. Extend freely; anything
// missing falls through to the AI resolver and is then cached in the Merchant
// table forever.

export interface DictionaryEntry {
  displayName: string;
  domain: string;
}

/**
 * Normalize a raw merchant/institution name to a stable lookup key: lowercase,
 * strip common payment-processor prefixes, phone numbers, store/location codes,
 * and punctuation. "NETFLIX.COM 866-579-7172 CA" → "netflix". Client-safe (pure
 * string work, no server imports) so both the resolver and client UI can use it.
 */
export function normalizeKey(raw: string): string {
  let s = raw.toLowerCase();

  // Common payment-processor / aggregator prefixes (Square, Toast, PayPal, etc.)
  s = s.replace(/\b(sq|tst|paypal|pp|sp|dd| import|pos|pmnt|payment|recur(ring)?|autopay)\b\s*\*?\s*/g, " ");
  s = s.replace(/[*#]/g, " ");

  // Drop URLs/TLDs, phone numbers, and long digit runs (order/store IDs).
  s = s.replace(/https?:\/\/\S+/g, " ");
  s = s.replace(/\b[\w.-]+\.(com|net|org|io|co|tv|app|us|so|ai)\b/g, (m) => m.split(".")[0]);
  s = s.replace(/\+?\d[\d\s().-]{6,}\d/g, " "); // phone numbers
  s = s.replace(/\b\d{3,}\b/g, " "); // standalone long numbers

  // Trailing 2-letter state/province codes and generic recurring words.
  s = s.replace(/\b(inc|llc|ltd|co|corp|subscription|membership|monthly|annual|yearly)\b/g, " ");

  // Collapse to alphanumerics + single spaces.
  s = s.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  return s;
}

/**
 * Dictionary-ONLY domain lookup: no DB, no Claude. Client-safe — cheap enough to
 * run per keystroke in a form or per row of a typeahead. Well-known names get a
 * logo instantly; anything not in the seed dictionary returns null.
 */
export function dictionaryDomain(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  const key = normalizeKey(rawName);
  return (key && MERCHANT_DICTIONARY[key]?.domain) || null;
}

export const MERCHANT_DICTIONARY: Record<string, DictionaryEntry> = {
  netflix: { displayName: "Netflix", domain: "netflix.com" },
  spotify: { displayName: "Spotify", domain: "spotify.com" },
  "spotify premium": { displayName: "Spotify", domain: "spotify.com" },
  "disney plus": { displayName: "Disney+", domain: "disneyplus.com" },
  "disney+": { displayName: "Disney+", domain: "disneyplus.com" },
  hulu: { displayName: "Hulu", domain: "hulu.com" },
  "hbo max": { displayName: "Max", domain: "max.com" },
  max: { displayName: "Max", domain: "max.com" },
  "youtube premium": { displayName: "YouTube Premium", domain: "youtube.com" },
  "youtube tv": { displayName: "YouTube TV", domain: "tv.youtube.com" },
  youtube: { displayName: "YouTube", domain: "youtube.com" },
  "amazon prime": { displayName: "Amazon Prime", domain: "amazon.com" },
  "prime video": { displayName: "Prime Video", domain: "primevideo.com" },
  "amazon music": { displayName: "Amazon Music", domain: "music.amazon.com" },
  "apple music": { displayName: "Apple Music", domain: "music.apple.com" },
  "apple tv": { displayName: "Apple TV+", domain: "tv.apple.com" },
  "apple tv plus": { displayName: "Apple TV+", domain: "tv.apple.com" },
  icloud: { displayName: "iCloud+", domain: "icloud.com" },
  "icloud plus": { displayName: "iCloud+", domain: "icloud.com" },
  "apple one": { displayName: "Apple One", domain: "apple.com" },
  "google one": { displayName: "Google One", domain: "one.google.com" },
  "google storage": { displayName: "Google One", domain: "one.google.com" },
  paramount: { displayName: "Paramount+", domain: "paramountplus.com" },
  "paramount plus": { displayName: "Paramount+", domain: "paramountplus.com" },
  peacock: { displayName: "Peacock", domain: "peacocktv.com" },
  crunchyroll: { displayName: "Crunchyroll", domain: "crunchyroll.com" },
  audible: { displayName: "Audible", domain: "audible.com" },
  tidal: { displayName: "Tidal", domain: "tidal.com" },
  pandora: { displayName: "Pandora", domain: "pandora.com" },
  siriusxm: { displayName: "SiriusXM", domain: "siriusxm.com" },

  // Productivity / cloud
  notion: { displayName: "Notion", domain: "notion.so" },
  dropbox: { displayName: "Dropbox", domain: "dropbox.com" },
  "google workspace": { displayName: "Google Workspace", domain: "workspace.google.com" },
  gsuite: { displayName: "Google Workspace", domain: "workspace.google.com" },
  microsoft: { displayName: "Microsoft 365", domain: "microsoft.com" },
  "microsoft 365": { displayName: "Microsoft 365", domain: "microsoft.com" },
  "office 365": { displayName: "Microsoft 365", domain: "microsoft.com" },
  slack: { displayName: "Slack", domain: "slack.com" },
  zoom: { displayName: "Zoom", domain: "zoom.us" },
  evernote: { displayName: "Evernote", domain: "evernote.com" },
  todoist: { displayName: "Todoist", domain: "todoist.com" },
  "1password": { displayName: "1Password", domain: "1password.com" },
  lastpass: { displayName: "LastPass", domain: "lastpass.com" },
  dashlane: { displayName: "Dashlane", domain: "dashlane.com" },
  linear: { displayName: "Linear", domain: "linear.app" },
  figma: { displayName: "Figma", domain: "figma.com" },
  canva: { displayName: "Canva", domain: "canva.com" },
  grammarly: { displayName: "Grammarly", domain: "grammarly.com" },
  github: { displayName: "GitHub", domain: "github.com" },
  "github copilot": { displayName: "GitHub Copilot", domain: "github.com" },
  gitlab: { displayName: "GitLab", domain: "gitlab.com" },
  vercel: { displayName: "Vercel", domain: "vercel.com" },
  netlify: { displayName: "Netlify", domain: "netlify.com" },
  cloudflare: { displayName: "Cloudflare", domain: "cloudflare.com" },
  "aws": { displayName: "Amazon Web Services", domain: "aws.amazon.com" },
  "amazon web services": { displayName: "Amazon Web Services", domain: "aws.amazon.com" },
  digitalocean: { displayName: "DigitalOcean", domain: "digitalocean.com" },

  // AI
  "chatgpt plus": { displayName: "ChatGPT Plus", domain: "openai.com" },
  chatgpt: { displayName: "ChatGPT", domain: "openai.com" },
  openai: { displayName: "OpenAI", domain: "openai.com" },
  "claude pro": { displayName: "Claude Pro", domain: "claude.ai" },
  anthropic: { displayName: "Anthropic", domain: "anthropic.com" },
  "midjourney": { displayName: "Midjourney", domain: "midjourney.com" },
  "perplexity": { displayName: "Perplexity", domain: "perplexity.ai" },

  // Design / creative
  adobe: { displayName: "Adobe", domain: "adobe.com" },
  "adobe cc": { displayName: "Adobe Creative Cloud", domain: "adobe.com" },
  "adobe creative cloud": { displayName: "Adobe Creative Cloud", domain: "adobe.com" },
  "creative cloud": { displayName: "Adobe Creative Cloud", domain: "adobe.com" },

  // Fitness / health
  peloton: { displayName: "Peloton", domain: "onepeloton.com" },
  strava: { displayName: "Strava", domain: "strava.com" },
  calm: { displayName: "Calm", domain: "calm.com" },
  headspace: { displayName: "Headspace", domain: "headspace.com" },
  whoop: { displayName: "WHOOP", domain: "whoop.com" },
  fitbit: { displayName: "Fitbit", domain: "fitbit.com" },

  // News / reading
  "new york times": { displayName: "The New York Times", domain: "nytimes.com" },
  nyt: { displayName: "The New York Times", domain: "nytimes.com" },
  "wall street journal": { displayName: "The Wall Street Journal", domain: "wsj.com" },
  wsj: { displayName: "The Wall Street Journal", domain: "wsj.com" },
  medium: { displayName: "Medium", domain: "medium.com" },
  substack: { displayName: "Substack", domain: "substack.com" },
  economist: { displayName: "The Economist", domain: "economist.com" },
  "kindle unlimited": { displayName: "Kindle Unlimited", domain: "amazon.com" },

  // Gaming
  "xbox game pass": { displayName: "Xbox Game Pass", domain: "xbox.com" },
  "playstation plus": { displayName: "PlayStation Plus", domain: "playstation.com" },
  "nintendo switch online": { displayName: "Nintendo Switch Online", domain: "nintendo.com" },
  steam: { displayName: "Steam", domain: "steampowered.com" },
  "ea play": { displayName: "EA Play", domain: "ea.com" },
  twitch: { displayName: "Twitch", domain: "twitch.tv" },
  discord: { displayName: "Discord", domain: "discord.com" },
  "discord nitro": { displayName: "Discord Nitro", domain: "discord.com" },

  // Telecom / utilities (recurring, common on statements)
  verizon: { displayName: "Verizon", domain: "verizon.com" },
  "at t": { displayName: "AT&T", domain: "att.com" },
  att: { displayName: "AT&T", domain: "att.com" },
  "t mobile": { displayName: "T-Mobile", domain: "t-mobile.com" },
  comcast: { displayName: "Comcast", domain: "xfinity.com" },
  xfinity: { displayName: "Xfinity", domain: "xfinity.com" },

  // Food / delivery memberships
  "doordash": { displayName: "DoorDash", domain: "doordash.com" },
  "dashpass": { displayName: "DoorDash DashPass", domain: "doordash.com" },
  "uber one": { displayName: "Uber One", domain: "uber.com" },
  "instacart": { displayName: "Instacart", domain: "instacart.com" },
  "hellofresh": { displayName: "HelloFresh", domain: "hellofresh.com" },

  // Banks & financial institutions — so a synced or manual account resolves its
  // bank's logo through the same path as any merchant. Keys are normalizeKey
  // output (lowercase, alphanumerics + spaces).
  "american express": { displayName: "American Express", domain: "americanexpress.com" },
  amex: { displayName: "American Express", domain: "americanexpress.com" },
  chase: { displayName: "Chase", domain: "chase.com" },
  "jpmorgan chase": { displayName: "Chase", domain: "chase.com" },
  "bank of america": { displayName: "Bank of America", domain: "bankofamerica.com" },
  "wells fargo": { displayName: "Wells Fargo", domain: "wellsfargo.com" },
  citi: { displayName: "Citi", domain: "citi.com" },
  citibank: { displayName: "Citi", domain: "citi.com" },
  "capital one": { displayName: "Capital One", domain: "capitalone.com" },
  "us bank": { displayName: "U.S. Bank", domain: "usbank.com" },
  pnc: { displayName: "PNC", domain: "pnc.com" },
  truist: { displayName: "Truist", domain: "truist.com" },
  "td bank": { displayName: "TD Bank", domain: "td.com" },
  "td canada trust": { displayName: "TD", domain: "td.com" },
  td: { displayName: "TD", domain: "td.com" },
  "charles schwab": { displayName: "Charles Schwab", domain: "schwab.com" },
  schwab: { displayName: "Charles Schwab", domain: "schwab.com" },
  fidelity: { displayName: "Fidelity", domain: "fidelity.com" },
  vanguard: { displayName: "Vanguard", domain: "vanguard.com" },
  "goldman sachs": { displayName: "Goldman Sachs", domain: "goldmansachs.com" },
  marcus: { displayName: "Marcus", domain: "marcus.com" },
  "morgan stanley": { displayName: "Morgan Stanley", domain: "morganstanley.com" },
  discover: { displayName: "Discover", domain: "discover.com" },
  ally: { displayName: "Ally", domain: "ally.com" },
  "ally bank": { displayName: "Ally", domain: "ally.com" },
  sofi: { displayName: "SoFi", domain: "sofi.com" },
  chime: { displayName: "Chime", domain: "chime.com" },
  "regions bank": { displayName: "Regions", domain: "regions.com" },
  regions: { displayName: "Regions", domain: "regions.com" },
  "fifth third bank": { displayName: "Fifth Third Bank", domain: "53.com" },
  "fifth third": { displayName: "Fifth Third Bank", domain: "53.com" },
  "citizens bank": { displayName: "Citizens", domain: "citizensbank.com" },
  keybank: { displayName: "KeyBank", domain: "key.com" },
  "navy federal": { displayName: "Navy Federal", domain: "navyfederal.org" },
  usaa: { displayName: "USAA", domain: "usaa.com" },
  synchrony: { displayName: "Synchrony", domain: "synchrony.com" },
  robinhood: { displayName: "Robinhood", domain: "robinhood.com" },
  "e trade": { displayName: "E*TRADE", domain: "etrade.com" },
  etrade: { displayName: "E*TRADE", domain: "etrade.com" },
  venmo: { displayName: "Venmo", domain: "venmo.com" },
  "cash app": { displayName: "Cash App", domain: "cash.app" },
  paypal: { displayName: "PayPal", domain: "paypal.com" },
  hsbc: { displayName: "HSBC", domain: "hsbc.com" },
  barclays: { displayName: "Barclays", domain: "barclays.com" },
  rbc: { displayName: "RBC", domain: "rbc.com" },
  "royal bank of canada": { displayName: "RBC", domain: "rbc.com" },
  "royal bank": { displayName: "RBC", domain: "rbc.com" },
  scotiabank: { displayName: "Scotiabank", domain: "scotiabank.com" },
  "bank of nova scotia": { displayName: "Scotiabank", domain: "scotiabank.com" },
  bmo: { displayName: "BMO", domain: "bmo.com" },
  "bank of montreal": { displayName: "BMO", domain: "bmo.com" },
  cibc: { displayName: "CIBC", domain: "cibc.com" },
  "national bank of canada": { displayName: "National Bank", domain: "nbc.ca" },
  "national bank": { displayName: "National Bank", domain: "nbc.ca" },
  tangerine: { displayName: "Tangerine", domain: "tangerine.ca" },
  desjardins: { displayName: "Desjardins", domain: "desjardins.com" },
  "eq bank": { displayName: "EQ Bank", domain: "eqbank.ca" },
  wealthsimple: { displayName: "Wealthsimple", domain: "wealthsimple.com" },
  questrade: { displayName: "Questrade", domain: "questrade.com" },
  "simplii financial": { displayName: "Simplii Financial", domain: "simplii.com" },
  simplii: { displayName: "Simplii Financial", domain: "simplii.com" },
  "laurentian bank": { displayName: "Laurentian Bank", domain: "laurentianbank.ca" },
  "manulife bank": { displayName: "Manulife Bank", domain: "manulife.ca" },
  manulife: { displayName: "Manulife", domain: "manulife.ca" },
};
