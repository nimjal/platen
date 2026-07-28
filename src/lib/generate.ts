/**
 * Lesson text is calculated, not stored.
 *
 * Every chapter declares the keys it introduces; this module turns that into
 * five drills built on top of everything taught before it. Two rules hold:
 *
 *  1. A lesson may only use characters the learner has already met. This is
 *     guaranteed by construction — every pool is filtered by the taught set
 *     before anything is assembled — and checked again by the test suite.
 *  2. The five drills form an arc from the key to the sentence, and each one
 *     trains a different thing:
 *
 *     Reach   finding the new key from the anchors around it, and coming back
 *     Links   the letter joins the new key creates, which is where speed lives
 *     Shapes  families of words sharing the new key, so the hand generalises
 *     Prose   ordinary sentences using everything available
 *     Run     one continuous piece, which decides whether the chapter is done
 */
import { MARKED_WORDS, PAIRS, TRIPLES } from '../data/links'
import { PASSAGES, WORDS } from '../data/words'
import { HOME_KEYS, baseKeyFor, fingerFor, homeKeyFor } from './layout'
import { makeRand, type Rand } from './random'
import type { ChapterSpec, Lesson } from '../types'

/** Roughly how many characters each drill should run to. */
const LENGTH = {
  reach: 170,
  links: 160,
  shapes: 170,
  prose: 200,
  run: 260
} as const

const HOME = HOME_KEYS.split('')
const LEFT_HOME = 'asdf'
const RIGHT_HOME = 'jkl;'

// ------------------------------------------------------------------ text --

function tidy (text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Repeats `parts` in order until the text is long enough. */
function joinTo (parts: string[], min: number): string {
  if (parts.length === 0) return ''
  const out: string[] = []
  let length = 0
  for (let i = 0; length < min; i++) {
    const part = parts[i % parts.length]
    out.push(part)
    length += part.length + 1
  }
  return tidy(out.join(' '))
}

/** Draws from `parts` without repeating one until the bag is empty. */
function shuffleTo (parts: string[], min: number, rand: Rand): string {
  if (parts.length === 0) return ''
  const out: string[] = []
  let bag: string[] = []
  let length = 0
  while (length < min) {
    if (bag.length === 0) bag = rand.shuffled(parts)
    const part = bag.pop() as string
    out.push(part)
    length += part.length + 1
  }
  return tidy(out.join(' '))
}

/** A short nonsense cluster, never repeating a character twice in a row. */
function cluster (pool: string[], rand: Rand, min: number, max: number): string {
  const size = min + rand.int(max - min + 1)
  let out = ''
  let last = ''
  for (let i = 0; i < size; i++) {
    let next = rand.pick(pool)
    if (next === last && pool.length > 1) next = rand.pick(pool)
    out += next
    last = next
  }
  return out
}

function hand (key: string): 'left' | 'right' | null {
  return fingerFor(baseKeyFor(key))?.hand ?? null
}

function typeable (text: string, taught: string): boolean {
  return [...text].every((char) => taught.includes(char))
}

// ----------------------------------------------------------------- words --

/** Every word that can be typed with the characters taught so far. */
export function wordsFor (taught: string): string[] {
  return WORDS.filter((word) => typeable(word, taught))
}

function featuring (pool: string[], chars: string[]): string[] {
  if (chars.length === 0) return pool
  return pool.filter((word) => chars.some((char) => word.includes(char)))
}

/**
 * Words for a drill: those using the new keys first, then the wider pool,
 * because a chapter's own alphabet is often too thin to fill a drill alone.
 */
function drillWords (pool: string[], keys: string[], rand: Rand, count: number): string[] {
  const letters = keys.filter((key) => /^[a-z]$/.test(key))
  const focused = rand.shuffled(featuring(pool, letters))
  const seen = new Set(focused)
  const rest = rand.shuffled(pool.filter((word) => !seen.has(word)))
  const out = [...focused, ...rest].slice(0, count)
  return out.length > 0 ? out : ['a']
}

// ---------------------------------------------------------- sentence form --

interface SentenceOptions {
  /** How often to slip a number in between the words, 0 to 1. */
  numbers?: number
  /** Extra words — contractions, compounds — to mix into the draw. */
  marked?: string[]
}

/**
 * Word groups that look more like writing as more punctuation is taught: bare
 * groups at first, then semicolons, then full stops, commas and capitals.
 *
 * Words are drawn from a bag rather than at random, so the whole pool is used
 * before any word comes round again. Reading `question falls question falls`
 * teaches nothing except how to read `question falls`.
 */
function sentences (
  pool: string[],
  taught: string,
  rand: Rand,
  min: number,
  options: SentenceOptions = {}
): string {
  const canStop = taught.includes('.')
  const canPause = taught.includes(',')
  const canCap = taught.includes('A')
  const marked = options.marked ?? []
  const out: string[] = []
  let length = 0
  let bag: string[] = []

  const draw = (): string => {
    if (marked.length > 0 && rand.next() < 0.22) return rand.pick(marked)
    if (bag.length === 0) bag = rand.shuffled(pool)
    return bag.pop() as string
  }

  while (length < min) {
    const size = 4 + rand.int(4)
    const words: string[] = []
    for (let i = 0; i < size; i++) {
      if (options.numbers !== undefined && rand.next() < options.numbers) {
        words.push(numberChunk(rand, 1, 3))
      }
      let word = draw()
      if (canPause && i > 1 && i < size - 1 && rand.next() < 0.16) word += ','
      words.push(word)
    }
    if (canCap) words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
    let text = words.join(' ')
    text += canStop ? '.' : taught.includes(';') ? ';' : ''
    out.push(text)
    length += text.length + 1
  }

  return tidy(out.join(' '))
}

// ---------------------------------------------------------------- drills --

/**
 * Reach: find the new key from every anchor the same hand offers, and come
 * back to the home row each time.
 *
 * A reach is easy; it is the return that decides whether the next keystroke
 * lands. So the key is struck from its own home key first, then from each of
 * the other three fingers' keys on that hand, and only then against the other
 * hand — by which point the finger should be finding it without the wrist.
 */
function reachDrill (keys: string[], rand: Rand): string {
  const reaches = keys.filter((key) => homeKeyFor(key) !== key)
  if (reaches.length === 0) return homeDrill(rand)

  const parts: string[] = []

  for (const key of reaches) {
    const home = homeKeyFor(key)
    // Out and back from its own anchor, which is the movement being learned.
    parts.push(`${home}${key}${home}`, `${home}${key}${home}${key}${home}`)
    // Then from each neighbour, so the reach does not depend on one start.
    const side = hand(key) === 'left' ? LEFT_HOME : RIGHT_HOME
    parts.push([...side].map((anchor) => anchor + key).join(' '))
    parts.push([...side].reverse().map((anchor) => key + anchor).join(' '))
  }

  // New keys against each other across the hands, which is how words feel.
  const left = reaches.filter((key) => hand(key) === 'left')
  const right = reaches.filter((key) => hand(key) === 'right')
  for (const a of left) {
    for (const b of right) parts.push(`${a}${b}${a}${b}`)
  }

  // Every new key gets the whole treatment: trimming this to a length budget
  // would quietly short-change whichever key happened to be declared last.
  const body = tidy(parts.join(' '))

  const blend = [...reaches, ...reaches, ...HOME]
  const settle: string[] = []
  for (let i = 0; i < 12; i++) settle.push(cluster(blend, rand, 3, 5))

  return tidy(`${body} ${shuffleTo(settle, Math.max(40, LENGTH.reach - body.length), rand)}`)
}

/** The home row has no reaches: the drill is the position itself. */
function homeDrill (rand: Rand): string {
  const parts = [
    'ff jj dd kk ss ll aa ;;',
    'fj dk sl a;',
    'fdsa jkl;',
    'fjfj dkdk slsl a;a;',
    'afjs kdla',
    'sad lad ask fall'
  ]
  const settle: string[] = []
  for (let i = 0; i < 14; i++) settle.push(cluster(HOME, rand, 3, 5))
  return tidy(`${joinTo(parts, 110)} ${shuffleTo(settle, 70, rand)}`)
}

/**
 * Links: the letter joins the new keys create.
 *
 * Drawn from the frequency lists, keeping only what is typeable and preferring
 * joins that actually involve a new key — those are the ones this chapter is
 * responsible for. Pairs come before triples, and a few whole words made of
 * them close the drill so the joins are seen in place.
 */
function linkDrill (taught: string, keys: string[], pool: string[], rand: Rand): string {
  const letters = keys.filter((key) => /^[a-z]$/.test(key))
  const has = (link: string): boolean =>
    letters.length === 0 || letters.some((letter) => link.includes(letter))

  const usable = (list: string[]): string[] => list.filter((link) => typeable(link, taught))
  const pairs = usable(PAIRS)
  const triples = usable(TRIPLES)

  // Joins this chapter is responsible for, then the rest as padding.
  const freshPairs = pairs.filter(has)
  const freshTriples = triples.filter(has)
  const chosenPairs = [...freshPairs, ...pairs.filter((link) => !has(link))].slice(0, 18)
  const chosenTriples = [...freshTriples, ...triples.filter((link) => !has(link))].slice(0, 12)

  // The first chapters have almost no real joins available — the home row
  // yields one usable triple — so top up from the taught letters. Without this
  // the drill repeats its single find until the length is met.
  const chars = [...taught].filter((char) => /[a-z]/.test(char))
  const madeOf = (size: number, count: number): string[] => {
    const out: string[] = []
    for (let i = 0; i < count; i++) out.push(cluster(chars, rand, size, size))
    return out
  }

  const pairParts = chosenPairs.length >= 8 ? chosenPairs : [...chosenPairs, ...madeOf(2, 14)]
  const tripleParts = chosenTriples.length >= 6 ? chosenTriples : [...chosenTriples, ...madeOf(3, 12)]
  const words = drillWords(pool, keys, rand, 8)

  return tidy(
    [
      shuffleTo(pairParts.map((link) => `${link} ${link}`), 70, rand),
      shuffleTo(tripleParts, 50, rand),
      shuffleTo(words, 50, rand)
    ].join(' ')
  )
}

/**
 * Shapes: families of words that share the new key in the same surroundings.
 *
 * `note tone stone atone` is one movement learned four times, which is worth
 * more than four unrelated words each learned once. Families are found by
 * grouping words on the letters either side of the new key.
 */
function shapeDrill (pool: string[], keys: string[], rand: Rand): string {
  const letters = keys.filter((key) => /^[a-z]$/.test(key))
  const families = new Map<string, string[]>()

  for (const letter of letters.length > 0 ? letters : ['a']) {
    for (const word of pool) {
      const at = word.indexOf(letter)
      if (at < 0) continue
      // The letter plus whatever sits next to it: the shape the hand makes.
      const key = word.slice(Math.max(0, at - 1), at + 2)
      if (key.length < 2) continue
      const group = families.get(key) ?? []
      if (!group.includes(word)) group.push(word)
      families.set(key, group)
    }
  }

  const useful = [...families.values()].filter((group) => group.length >= 2)
  const chosen = rand.shuffled(useful).slice(0, 10).map((group) => rand.shuffled(group).slice(0, 4).join(' '))

  // A chapter whose letters make no families still needs a words drill.
  if (chosen.length < 4) {
    const words = drillWords(pool, keys, rand, 12)
    return joinTo(words.map((word) => `${word} ${word}`), LENGTH.shapes)
  }

  return joinTo(chosen, LENGTH.shapes)
}

/** Ordinary sentences, with the new keys pushed to the front of the pool. */
function proseDrill (
  pool: string[],
  keys: string[],
  taught: string,
  rand: Rand,
  min: number,
  options: SentenceOptions = {}
): string {
  const fresh = drillWords(pool, keys, rand, 12)
  const mixed = rand.shuffled([...fresh, ...fresh, ...rand.shuffled(pool).slice(0, 40)])
  return sentences(mixed, taught, rand, min, options)
}

// ---------------------------------------------------------- punctuation --

/** Commas doing their two jobs: separating a list, and holding a clause open. */
function clauseDrill (pool: string[], taught: string, rand: Rand): string {
  const words = rand.shuffled(pool.filter((word) => word.length >= 3))
  const parts: string[] = []

  for (let i = 0; i + 3 < words.length && parts.length < 10; i += 4) {
    const [a, b, c, d] = words.slice(i, i + 4)
    parts.push(rand.next() < 0.5
      ? `${a}, ${b} and ${c}.`
      : `${a}, ${b}, ${c} and ${d}.`)
  }

  return joinTo(parts.length > 0 ? parts : [sentences(pool, taught, rand, 60)], LENGTH.shapes)
}

/** The apostrophe and the hyphen, in the words that need them. */
function markedDrill (taught: string, rand: Rand): string {
  const usable = MARKED_WORDS.filter((word) => typeable(word, taught))
  if (usable.length === 0) return ''
  const parts = usable.map((word) => `${word} ${word}`)
  return shuffleTo(parts, LENGTH.links, rand)
}

// -------------------------------------------------------------- capitals --

function capitalReach (rand: Rand): string {
  const order = [...'asdfjkl', ...'eoir', ...'tncp', ...'huwg', ...'mybv', ...'xzq']
  // Each letter next to its own capital: the same finger, one with shift.
  const parts = order.map((letter) => `${letter.toUpperCase()}${letter}`)
  // Then two letters from opposite hands, so both little fingers take a turn.
  const pairs: string[] = []
  const bag = rand.shuffled(order)
  for (let i = 0; i + 1 < bag.length; i += 2) {
    const [a, b] = [bag[i], bag[i + 1]]
    pairs.push(`${a.toUpperCase()}${b}${b.toUpperCase()}${a}`)
  }
  return tidy(`${joinTo(parts, 110)} ${shuffleTo(pairs, 70, rand)}`)
}

function capitalShapes (pool: string[], rand: Rand): string {
  const words = rand.shuffled(pool.filter((word) => word.length >= 3)).slice(0, 16)
  const parts = words.map((word) => {
    const title = word.charAt(0).toUpperCase() + word.slice(1)
    return `${title} ${title} ${word.toUpperCase()}`
  })
  return joinTo(parts, LENGTH.shapes)
}

function initials (pool: string[], rand: Rand): string {
  const words = rand.shuffled(pool.filter((word) => word.length >= 3 && word.length <= 7))
  const parts: string[] = []
  for (let i = 0; i + 1 < words.length && parts.length < 20; i += 2) {
    const initial = words[i].charAt(0).toUpperCase()
    const surname = words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1)
    parts.push(`${initial}. ${surname},`)
  }
  return joinTo(parts, LENGTH.links)
}

// --------------------------------------------------------------- numbers --

const DIGITS = [...'1234567890']

/** A run of digits that reads as a number: `012` is a jolt to type and to read. */
function numberChunk (rand: Rand, min: number, max: number): string {
  const text = cluster(DIGITS, rand, min, max)
  return text.startsWith('0') ? `${1 + rand.int(9)}${text.slice(1)}` : text
}

function numberReach (rand: Rand): string {
  const parts: string[] = []
  for (const digit of DIGITS) {
    const home = homeKeyFor(digit)
    parts.push(`${home}${digit}${home}`, `${home}${digit}${home}${digit}${home}`)
  }
  const columns = ['147', '258', '369', '1470', '2580', '3690', '159', '260', '4567', '9876']
  return tidy(`${joinTo(parts, 110)} ${shuffleTo(columns, 70, rand)}`)
}

function numberShapes (rand: Rand): string {
  const parts: string[] = []
  for (let i = 0; i < 26; i++) {
    const size = 2 + rand.int(4)
    parts.push(numberChunk(rand, size, size))
  }
  const years = ['1873', '1908', '1946', '2024', '3405', '6721', '8250', '9014']
  return tidy(`${joinTo(['0123456789', '9876543210'], 24)} ${shuffleTo([...parts, ...years], LENGTH.shapes, rand)}`)
}

// --------------------------------------------------------------- symbols --

function symbolReach (keys: string[], rand: Rand): string {
  const parts: string[] = []
  for (const key of keys) {
    const home = homeKeyFor(key)
    parts.push(`${home}${key}${home}`, `${home}${key}${home}${key}${home}`)
  }
  const shifted = ['"', '_', '+', '{', '}', '|', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ':', '?', '<', '>']
  const shiftParts = shifted.map((char) => {
    const home = homeKeyFor(char)
    return `${home}${char}${home}`
  })
  return tidy(`${joinTo(parts, 90)} ${shuffleTo(shiftParts, 90, rand)}`)
}

/** Openers and closers, because getting the closing one blind is the hard half. */
function symbolPairs (pool: string[], rand: Rand): string {
  const words = rand.shuffled(pool.filter((word) => word.length >= 3 && word.length <= 8))
  const wrappers: [string, string][] = [['(', ')'], ['[', ']'], ['{', '}'], ['"', '"'], ["'", "'"], ['<', '>']]
  const parts: string[] = []
  for (let i = 0; i < 18 && i < words.length; i++) {
    const [open, close] = wrappers[i % wrappers.length]
    parts.push(`${open}${words[i]}${close}`)
  }
  const glued = ['a-b', 'x_y', 'i+1', 'n=0', '50%', '$40', '#1', 'a@b.co', 'f(x)', 'p&l', '~/work', 'a|b']
  return tidy(shuffleTo([...parts, ...glued], LENGTH.shapes, rand))
}

/**
 * Punctuation in its natural habitat. The made sentences are shared out
 * between the lessons rather than repeated in all of them, so no two drills in
 * the chapter read the same.
 */
const MARKED_LINES = [
  ['"Read it back," she said.', 'It cost $18.50, plus 7% tax.', 'The file is 40% done.'],
  ['Send it to team@example.com today.', 'The path is /home/work/notes.txt.', 'Is 2 + 2 = 4 still true?'],
  [
    'Use the up-to-date list (the third one).',
    'He typed 60 wpm at 98% accuracy!',
    'Press <shift> and hold it down.',
    'The array is [1, 2, 3]; the set is {4, 5}.'
  ]
]

function symbolProse (pool: string[], taught: string, rand: Rand, min: number, group: number): string {
  const base = sentences(rand.shuffled(pool).slice(0, 40), taught, rand, min * 0.62)
  return tidy(`${base} ${MARKED_LINES[group % MARKED_LINES.length].join(' ')}`)
}

// ------------------------------------------------------------- assembly --

interface Draft {
  title: string
  text: string
}

function draftsFor (spec: ChapterSpec, chapter: number, taught: string): Draft[] {
  const rand = makeRand(`typing/${chapter}/${spec.title}`)
  const pool = wordsFor(taught)
  const marked = MARKED_WORDS.filter((word) => typeable(word, taught))

  switch (spec.kind) {
    case 'home':
    case 'keys':
      return [
        { title: 'Reach', text: reachDrill(spec.keys, rand) },
        { title: 'Links', text: linkDrill(taught, spec.keys, pool, rand) },
        { title: 'Shapes', text: shapeDrill(pool, spec.keys, rand) },
        { title: 'Prose', text: proseDrill(pool, spec.keys, taught, rand, LENGTH.prose) },
        { title: 'Run', text: proseDrill(pool, spec.keys, taught, rand, LENGTH.run) }
      ]

    case 'punctuation':
      return [
        { title: 'Reach', text: reachDrill(spec.keys, rand) },
        { title: 'Marks', text: markedDrill(taught, rand) },
        { title: 'Clauses', text: clauseDrill(pool, taught, rand) },
        { title: 'Prose', text: proseDrill(pool, spec.keys, taught, rand, LENGTH.prose, { marked }) },
        { title: 'Run', text: proseDrill(pool, spec.keys, taught, rand, LENGTH.run, { marked }) }
      ]

    case 'capitals':
      return [
        { title: 'Reach', text: capitalReach(rand) },
        { title: 'Shapes', text: capitalShapes(pool, rand) },
        { title: 'Names', text: initials(pool, rand) },
        { title: 'Prose', text: sentences(rand.shuffled(pool).slice(0, 30), taught, rand, LENGTH.prose, { marked }) },
        { title: 'Run', text: sentences(rand.shuffled(pool).slice(0, 40), taught, rand, LENGTH.run, { marked }) }
      ]

    case 'numbers':
      return [
        { title: 'Reach', text: numberReach(rand) },
        { title: 'Columns', text: numberShapes(rand) },
        { title: 'Counts', text: sentences(rand.shuffled(pool).slice(0, 40), taught, rand, LENGTH.shapes, { numbers: 0.55 }) },
        { title: 'Prose', text: sentences(rand.shuffled(pool).slice(0, 40), taught, rand, LENGTH.prose, { numbers: 0.3, marked }) },
        { title: 'Run', text: sentences(rand.shuffled(pool).slice(0, 40), taught, rand, LENGTH.run, { numbers: 0.2, marked }) }
      ]

    case 'symbols':
      return [
        { title: 'Reach', text: symbolReach(spec.keys, rand) },
        { title: 'Pairs', text: symbolPairs(pool, rand) },
        { title: 'Marks', text: symbolProse(pool, taught, rand, LENGTH.shapes, 0) },
        { title: 'Prose', text: symbolProse(pool, taught, rand, LENGTH.prose, 1) },
        { title: 'Run', text: symbolProse(pool, taught, rand, LENGTH.run, 2) }
      ]

    case 'passages':
      return PASSAGES.map((passage) => ({ title: passage.title, text: passage.text }))
  }
}

/** The finished lessons for one chapter. */
export function buildLessons (
  spec: ChapterSpec,
  chapter: number,
  taught: string
): Lesson[] {
  return draftsFor(spec, chapter, taught).map((draft, i) => ({
    id: `${chapter}.${i + 1}`,
    chapter,
    index: i + 1,
    title: draft.title,
    text: draft.text
  }))
}

/**
 * A drill made from the characters the learner actually gets wrong. Built on
 * demand from their own error counts, so practice goes where it is needed
 * rather than where the syllabus happens to be.
 */
export function troubleLesson (chars: string[], taught: string): Lesson {
  const rand = makeRand(`trouble/${chars.join('')}`)
  const usable = chars.filter((char) => taught.includes(char)).slice(0, 6)
  const parts: string[] = []

  for (const char of usable) {
    const home = homeKeyFor(char)
    parts.push(`${home}${char}${home}`, `${home}${char}${home}${char}${home}`)
  }

  // The joins that character makes, which is usually where it actually fails.
  const links = [...PAIRS, ...TRIPLES].filter(
    (link) => typeable(link, taught) && usable.some((char) => link.includes(char.toLowerCase()))
  ).slice(0, 14)

  const pool = wordsFor(taught).filter((word) =>
    usable.some((char) => word.includes(char.toLowerCase()))
  )
  const words = rand.shuffled(pool).slice(0, 12)
  const blend = [...usable, ...usable, ...HOME]
  const settle: string[] = []
  for (let i = 0; i < 10; i++) settle.push(cluster(blend, rand, 3, 5))

  const text = tidy(
    [
      joinTo(parts, 80),
      shuffleTo(settle, 50, rand),
      links.length > 0 ? shuffleTo(links.map((link) => `${link} ${link}`), 60, rand) : '',
      words.length > 0 ? shuffleTo(words.map((word) => `${word} ${word}`), 80, rand) : ''
    ].join(' ')
  )

  return { id: 'trouble', chapter: 0, index: 0, title: 'Trouble keys', text }
}
