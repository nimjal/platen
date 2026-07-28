/**
 * The letter pairs and triples English is actually made of, most frequent
 * first.
 *
 * Speed is not made of keys, it is made of the joins between them: a typist
 * who knows `th` and `er` as single movements is faster than one who knows
 * `t`, `h`, `e` and `r` as four. The Links drill draws from these lists,
 * filtered to what the learner has been taught, so every chapter practises the
 * joins its new keys create rather than the keys on their own.
 *
 * Ordered by frequency in written English, so a chapter that can only use the
 * first few still gets the ones worth having.
 */

/** Two-letter sequences, commonest first. */
export const PAIRS: string[] = [
  'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd',
  'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar',
  'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le',
  've', 'co', 'me', 'de', 'hi', 'ri', 'ro', 'ic', 'ne', 'ea',
  'ra', 'ce', 'li', 'ch', 'll', 'be', 'ma', 'si', 'om', 'ur',
  'ca', 'el', 'ta', 'la', 'ns', 'di', 'fo', 'ho', 'pe', 'ec',
  'pr', 'no', 'ct', 'us', 'ac', 'ot', 'il', 'tr', 'ly', 'nc',
  'et', 'ut', 'ss', 'so', 'rs', 'un', 'lo', 'wa', 'ge', 'ie',
  'ee', 'wi', 'em', 'ad', 'ol', 'rt', 'po', 'we', 'na', 'ul',
  'ni', 'ts', 'mo', 'ow', 'pa', 'im', 'mi', 'ai', 'sh', 'ir',
  'su', 'id', 'os', 'iv', 'ia', 'am', 'fi', 'ci', 'vi', 'pl',
  'ig', 'tu', 'ev', 'ld', 'ry', 'mp', 'fe', 'bl', 'ab', 'gh',
  'ty', 'op', 'wo', 'sa', 'ay', 'ex', 'ki', 'fr', 'oo', 'av',
  'ag', 'if', 'ap', 'gr', 'od', 'bo', 'sp', 'rd', 'do', 'uc',
  'bu', 'ei', 'ov', 'by', 'rm', 'ep', 'tt', 'ok', 'af', 'pu'
]

/** Three-letter sequences, commonest first. */
export const TRIPLES: string[] = [
  'the', 'and', 'ing', 'ion', 'tio', 'ent', 'ati', 'for', 'her', 'ter',
  'hat', 'tha', 'ere', 'con', 'res', 'ver', 'all', 'ons', 'nce', 'men',
  'ith', 'ted', 'ers', 'pro', 'thi', 'wit', 'are', 'ess', 'not', 'ive',
  'was', 'ect', 'rea', 'com', 'eve', 'per', 'int', 'est', 'ous', 'dis',
  'ain', 'one', 'ust', 'ted', 'oul', 'ave', 'anc', 'ill', 'ort', 'pre',
  'ove', 'sti', 'str', 'end', 'ant', 'ide', 'ure', 'lin', 'som', 'nde'
]

/**
 * Contractions and compounds, for the chapter that teaches the apostrophe and
 * the hyphen. Filtered against the taught set like everything else, so the
 * ones using letters that come later simply do not appear.
 */
export const MARKED_WORDS: string[] = [
  "don't", "isn't", "it's", "can't", "won't", "didn't", "hasn't", "wasn't",
  "he'll", "she'd", "there's", "what's", "that's", "we're", "aren't",
  "couldn't", "shouldn't", "we'll", "you'd", "they're", "here's", "who's",
  "one's", "world's", "doesn't", "haven't", "let's", "i'd", "she'll",
  'up-to-date', 'well-known', 'part-time', 'full-time', 'short-term',
  'left-hand', 'right-hand', 'off-hand', 'so-called', 'half-hour',
  'north-east', 'second-hand', 'hard-won', 'clear-cut', 'first-rate',
  'well-worn', 'long-term', 'on-screen', 'hand-held', 'self-taught'
]
