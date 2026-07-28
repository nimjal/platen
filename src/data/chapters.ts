import type { ChapterSpec } from '../types'

/**
 * The syllabus: eleven chapters, taken in order, each adding a little to what
 * the hands already know.
 *
 * A chapter declares only what it *introduces*. Its lessons are calculated
 * from that in `lib/generate.ts`, against every character taught before it, so
 * the curriculum cannot drift out of step with itself: no lesson can contain a
 * key the learner has not met.
 *
 * The order is chosen by coverage, not by geometry. At each step the keys that
 * unlock the most ordinary English come next, subject to two constraints: a
 * chapter takes two keys per hand, and no finger learns two keys at once. That
 * is why `e o i r` comes before `w g`, and why `x z q` wait until the end —
 * between them they appear in a handful of words.
 *
 * The pay-off is material to practise on. Two thirds of the word bank is
 * typeable by chapter four, against roughly a third under a row-by-row order,
 * so the drills stop being nonsense syllables early and start being writing.
 * A tutor with fixed lesson text cannot do this; because the text here is
 * generated from whatever has been taught, the vocabulary follows the order
 * automatically.
 */
export const CHAPTERS: ChapterSpec[] = [
  {
    title: 'Home Row',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    kind: 'home',
    guide: [
      'Eight fingers sit on the middle row and own one key each: A, S, D, F for the left hand, J, K, L and the semicolon for the right. The thumbs share the space bar. This is the position everything else is measured from.',
      'F and J carry a raised bar. Find them without looking — that is what they are for. Once the hands are set you should be able to leave the row and come back to it blind.',
      'There is not much English in eight letters, so this chapter is short on words and long on position. Strike with the finger that owns the key and let it drop straight back.'
    ]
  },
  {
    title: 'The Common Four',
    keys: ['e', 'o', 'i', 'r'],
    kind: 'keys',
    guide: [
      'Four keys, one per finger, all on the row above home: E under the left middle finger, R under the left forefinger, I under the right middle finger, O under the right ring finger.',
      'These are the four most useful letters left on the board. Adding them takes the vocabulary from twenty-six words to a hundred and seventy, which is why they come first rather than whichever keys happen to sit nearby.',
      'Reach with the finger, not the hand. The other three fingers stay on their keys while one goes up, and the wrist does not follow it.'
    ]
  },
  {
    title: 'Building Words',
    keys: ['t', 'n', 'c', 'p'],
    kind: 'keys',
    guide: [
      'Now the reaches go in different directions at once. T is up and inward from F. N is down and inward from J. C is down from D. P is up from the semicolon, at the far corner of the top row.',
      'This is the chapter where drills start reading like language: a third of the word bank opens up here, including most of the short function words that hold a sentence together.',
      'P is the awkward one. The right little finger is short and the reach is diagonal, so rotate the hand a few degrees towards it rather than stretching the finger on its own.'
    ]
  },
  {
    title: 'Most of English',
    keys: ['h', 'u', 'w', 'g'],
    kind: 'keys',
    guide: [
      'H and G are inward reaches along the home row itself — J moves left to H, F moves right to G — so the hand travels sideways rather than up or down. U is up from J. W is up from S.',
      'With these four you can type two thirds of the words in the course. From here the drills are ordinary prose and the remaining chapters are mostly filling in gaps.',
      'The inward reaches are the ones that drag the whole hand out of position. Move the forefinger across and let the other three stay behind to hold the place.'
    ]
  },
  {
    title: 'Sentences',
    keys: ['.', ',', "'", '-'],
    kind: 'punctuation',
    guide: [
      'Punctuation on QWERTY belongs almost entirely to the right hand, so this chapter is one-sided by nature. The full stop is below L, the comma below K, the apostrophe to the right of the semicolon, the hyphen up beyond P.',
      'These four are worth a chapter of their own because they change what the drills can be. Until now the text has been words in a row; from here it is sentences, with clauses, contractions and compounds.',
      'A full stop takes a space after it and none before. The apostrophe here is the plain typewriter one — the same key whether it marks a contraction or a possessive.'
    ]
  },
  {
    title: 'The Last Letters',
    keys: ['m', 'y', 'b', 'v'],
    kind: 'keys',
    guide: [
      'The forefingers take three of these: B is down and inward from F, M and Y both belong to the right forefinger, M below J and Y up beyond U. V is down from F as well.',
      'None of the four is common, but they are spread across enough words that finishing them lifts the vocabulary to ninety-four per cent. After this chapter almost nothing is out of reach.',
      'B and Y are the longest reaches on the board for the forefingers. Expect them to be slow, and check that the hand has actually come back afterwards.'
    ]
  },
  {
    title: 'Rare Letters',
    keys: ['x', 'z', 'q', '/'],
    kind: 'keys',
    guide: [
      'What is left. X is below S, Z below A, Q above A, and the slash below the semicolon. Three of the four fall to the left hand, which is unusual, and to its two weakest fingers.',
      'Together these letters account for well under one per cent of written English, which is exactly why they are last: drilling them early would have cost four chapters of useful practice.',
      'Z and Q are the hardest keys most people ever learn, because the little finger is short and both reaches are diagonal. Keep the movement small by turning the wrist instead of extending the finger.'
    ]
  },
  {
    title: 'Capitals',
    keys: [],
    extra: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    kind: 'capitals',
    guide: [
      'A capital is a two-handed stroke. The little finger of one hand holds shift while the other hand types the letter — right shift for a left-hand letter, left shift for a right-hand letter. Using the shift on the same side as the letter is the habit worth not forming.',
      'Hold shift, strike, release both, and put both little fingers back. The rest of the hand stays on the home row throughout.',
      'Caps lock plays no part in this. It is not on the map of any finger here.'
    ]
  },
  {
    title: 'Numbers',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    kind: 'numbers',
    guide: [
      'The number row inherits the columns below it. Whichever finger owns a column owns the digit at the top: 4 sits above R and belongs to the left forefinger, 7 sits above U and belongs to the right.',
      'That gives 1 to the left little finger, 2 to the left ring, 3 to the left middle, 4 and 5 to the left forefinger, 6 and 7 to the right forefinger, 8 to the right middle, 9 to the right ring, 0 to the right little finger. One rule and no exceptions to memorise.',
      'This row is two rows from home, so the hand genuinely has to move. Lift it, strike, and set it back down on the home row rather than creeping upwards over the chapter.'
    ]
  },
  {
    title: 'Symbols',
    keys: ['=', '[', ']', '\\', '`'],
    extra: '"_+{}|~!@#$%^&*():<>?',
    kind: 'symbols',
    guide: [
      'The rest of the board. The unshifted keys here sit out past P and the semicolon and all belong to the right little finger, which by now has more territory than any other finger on the hand.',
      'The shifted symbols need no new positions: they are the number row and the punctuation you already have, taken with the opposite shift. A question mark is the slash with left shift; a dollar sign is 4 with right shift.',
      'Brackets and quotes come in pairs, so the drills here type them in pairs. Getting the closing one without looking is the harder half.'
    ]
  },
  {
    title: 'Passages',
    keys: [],
    kind: 'passages',
    guide: [
      'Continuous prose, with everything in play. This is the point where typing stops being an exercise and turns into a way of writing things down.',
      'Stop hunting for keys. Read a few words ahead of your hands and let them follow, the way the eye runs ahead of the voice when reading aloud.',
      'Where your speed falls apart is information. The trouble-key drill on the progress panel is built from precisely those slips, and it is worth more than another pass through a passage you can already type.'
    ]
  }
]
