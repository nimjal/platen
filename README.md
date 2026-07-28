# Typing

A QWERTY touch typing tutor that runs in the browser. Eleven chapters take you
in a straight line from the home row to full passages: fifty-five lessons,
ordered so that you are typing real English as early as possible, with every
score kept locally.

No accounts, no network requests, no analytics. Open `index.html` from a static
host and it works.

**It is also live at <https://nimjal.github.io/platen/>**, if you would rather
not host it yourself. Scores are kept in that browser's `localStorage` either
way.

```
npm install
npm run dev      # dev server with hot reload
npm run build    # type-check and bundle to docs/
npm run preview  # serve the production build
npm test         # curriculum, engine, scores and app tests
```

## How it works

### The course is a line

Eleven chapters, five lessons each, taken in order:

| # | Chapter | Introduces | Vocabulary open |
| --- | --- | --- | --- |
| 1 | Home Row | `a s d f j k l ;` | 2% |
| 2 | The Common Four | `e o i r` | 13% |
| 3 | Building Words | `t n c p` | 35% |
| 4 | Most of English | `h u w g` | 65% |
| 5 | Sentences | `. , ' -` | 65% |
| 6 | The Last Letters | `m y b v` | 94% |
| 7 | Rare Letters | `x z q /` | 100% |
| 8 | Capitals | shift, `A`–`Z` | |
| 9 | Numbers | `1`–`0` | |
| 10 | Symbols | `= [ ] \` and the shifted row | |
| 11 | Passages | continuous prose | |

**The order is chosen by coverage, not by geometry.** At each step the keys
that unlock the most ordinary English come next, subject to two constraints: a
chapter takes two keys per hand, and no finger learns two keys at once. That is
why `e o i r` comes before `w g`, and why `x z q` wait until the end — between
them they appear in a handful of words.

The last column is the point. Two thirds of the word bank is typeable by
chapter four. Given the same twelve new keys, an order that works outward row
by row reaches 49% of it, and one that works outward in mirrored pairs reaches
34%. The drills stop being nonsense syllables early and start being writing.

A tutor with fixed lesson text cannot make this trade, because its text was
written against one particular order. Here the vocabulary follows whatever
order the chapters declare, so the order can be chosen on its merits.

Chapter five buys no new words at all, and earns its place anyway: the full
stop, comma, apostrophe and hyphen are what turn a list of words into prose.
They are all on the right hand, which is a fact about QWERTY rather than a
choice made here.

Each chapter runs the same five drills, and each has one job:

- **Reach** — find the new key from every anchor its hand offers, and come back.
  Struck from its own home key first, then from each of the other three fingers'
  keys, then against the other hand.
- **Links** — the letter joins the new keys create, drawn from the frequency
  lists in `src/data/links.ts`: `th he in er`, then `the and ing ion`. Speed is
  not made of keys, it is made of the joins between them.
- **Shapes** — families of words sharing the new key in the same surroundings:
  `note tone stone atone`. One movement learned four times beats four unrelated
  words learned once.
- **Prose** — ordinary sentences, with whatever punctuation has been taught.
- **Run** — one continuous piece. This is the one that decides the chapter.

### Lessons are calculated, not stored

There is no file of lesson text. Each chapter declares only the keys it
introduces; `src/lib/generate.ts` builds the drills from that, against the
accumulated character set of every chapter before it.

Two properties fall out of this. First, **no lesson can contain a key you have
not been taught** — the word pool is filtered by the taught set before anything
is assembled, and the test suite checks it again. Second, the syllabus cannot
drift out of step with itself: reorder the chapters in `src/data/chapters.ts`
and every drill downstream rebuilds correctly.

Generation is seeded, so a lesson reads the same on every visit and scores stay
comparable between runs.

### You have to pass to move on

A lesson opens when the one before it is passed. Passing means meeting both
halves of the standard for the chapter — **96% keystroke accuracy** and a
speed target that starts at 15 wpm and rises to 32 by the last chapter.

Accuracy is counted per keystroke, not per run of mistakes, and backspacing
does not repair it: a fumbled word costs four keystrokes, because that is what
it cost. Speed counts a word as five characters and excludes the first
character, which starts the clock and so is not itself timed.

If you already type and want to start further along, "Unlock it anyway" opens
the road up to any lesson you like.

### Focus mode

Press **Focus** for the lesson alone: no input box, no keyboard, no metrics
competing for the eye. The text is set large and lights up as you type it, the
character you owe is underlined in its finger's colour, and a passed lesson
rolls straight into the next one — lesson after lesson, chapter after chapter,
without touching the mouse. <kbd>Esc</kbd> leaves.

There is still a text area underneath; it is simply invisible. Keeping a real
form control is what makes phone keyboards, dead keys and input methods work.

### Scores stay in your browser

Everything is in `localStorage` under `typing.*`:

- best speed and accuracy per lesson, and how many attempts it took
- a rolling history of the last 400 runs
- a count of which characters you actually get wrong

That last one drives the **trouble-key drill**: the progress panel lists the
keys you miss most, tinted by the finger that owes you an apology, and builds a
drill out of them on demand. Practice goes where it is needed rather than where
the syllabus happens to be.

**Export** writes the lot to a JSON file. **Erase progress** deletes it. Nothing
is ever uploaded, and there is nowhere for it to be uploaded to.

### Colour is the finger map

Every finger has a hue, and that hue follows it everywhere: the on-screen
keyboard, the lamp under the character you are about to type, the trouble keys,
and the scale beneath each chapter on the ruler. Nothing else in the interface
is coloured — the primary action is a slab of ink, not a tinted button.

| Finger | Hue |
| --- | --- |
| Forefinger | amber |
| Middle finger | teal |
| Ring finger | periwinkle |
| Little finger | magenta |
| Thumb | grey |

The number row follows the letter columns exactly — `4` sits above `r`, so it
belongs to the left forefinger; `7` sits above `u`, so it belongs to the right.
One rule, no exceptions, nothing to choose.

### The tape and the head

Outside focus mode, the lesson text rides a carriage that slides under a head
bolted to the chassis. The head never moves; the tape does. That is the whole
idea of touch typing, so the interface is built around it rather than around a
cursor wandering across a paragraph.

The tape is perforated at exactly one hole per character, so the perforations
scroll past at your keystroke rate — cadence is on screen without a readout for
it. Progress is the line along the bottom edge, not a separate bar.

### Typing commands

Typed into the input when you are off track:

| Command | Effect |
| --- | --- |
| `fix`, `xxx` | Delete everything after the last correct character |
| `restart`, `rst` | Start the lesson again |

<kbd>Esc</kbd> also restarts the lesson.

## Layout of the source

```
src/
  data/chapters.ts   what each chapter introduces, and its guide
  data/words.ts      the word bank and the closing passages
  data/links.ts      letter pairs and triples by frequency; contractions
  lib/generate.ts    turns a chapter into five drills
  lib/curriculum.ts  assembles the course; navigation and standards
  lib/layout.ts      key -> finger, for QWERTY
  lib/engine.ts      the typing state machine and the metrics
  lib/scores.ts      local storage: records, history, trouble keys
  components/        the shell, the tape, the keyboard, focus mode
```

`src/lib/engine.ts` and everything under `lib/` is free of React and tested
directly. The tests cover the curriculum invariants, the state machine, the
score keeping, and a browser-level smoke test of the app itself.

## Contributing

Bug reports and pull requests are welcome.

- `npm test` and `npm run build` must both pass.
- Adding or reordering chapters means editing `src/data/chapters.ts` only. The
  test suite will tell you if a drill ends up using a key that has not been
  taught yet.
- New words go in `src/data/words.ts`, lowercase `a`–`z`; the generator filters
  them per chapter.
- The house style is two-space indent, no semicolons, and comments that explain
  why rather than what.

## Licence

[MIT](LICENSE).

## Credits

This project was inspired by [QuickQWERTY](https://codeberg.org/susam/quickqwerty)
by Susam Pal (MIT), and still owes it the `fix` and `restart` commands and the
little faces.

What is not carried over is the teaching. QuickQWERTY introduces keys in
mirrored pairs — `ru`, `vm`, `ei`, `c,` — across twenty-one units, each with
five hand-written sections named Grip, Words, Control, Sentences and Test. This
course orders keys by coverage instead, in groups of four across eleven
chapters, and its five drills are Reach, Links, Shapes, Prose and Run. The
Links drill, built from bigram and trigram frequency, and the Shapes drill,
built from word families, have no counterpart there; the prefix ladder that
QuickQWERTY calls Control has no counterpart here.

No lesson text is shared. Every character a learner types in this tutor is
generated at build time from the word bank and the frequency lists, so there is
no lesson-text file to carry anything over in.