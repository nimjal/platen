/** One drill. `id` doubles as the URL fragment and the score key. */
export interface Lesson {
  /** `3.2` — chapter three, lesson two. */
  id: string
  chapter: number
  /** 1-based position within the chapter. */
  index: number
  title: string
  text: string
}

/** What a chapter is before its lessons have been calculated. */
export interface ChapterSpec {
  title: string
  /** Physical keys the chapter introduces, unshifted. */
  keys: string[]
  /** Characters unlocked without a new key — capitals, shifted symbols. */
  extra?: string
  /** Chooses which drills are generated. */
  kind: 'home' | 'keys' | 'punctuation' | 'capitals' | 'numbers' | 'symbols' | 'passages'
  guide: string[]
}

export interface Chapter extends ChapterSpec {
  number: number
  lessons: Lesson[]
  /** Every character taught up to and including this chapter. */
  taught: string
}

export interface LessonRef {
  chapter: number
  lesson: number
}
