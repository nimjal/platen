/**
 * The word bank. Every lesson that uses words draws from this list, filtered
 * down to the letters the learner has been taught. The early chapters have
 * very little alphabet to work with, so the home-row words are listed first
 * and deliberately include some unglamorous ones — there are only so many
 * words in `asdfjkl`.
 *
 * Lowercase a-z only. Capitals and punctuation are added by the generator when
 * the chapter that teaches them is reached.
 */
const WORD_SOURCE = `
a as ad add adds ads alas all ask asks dad dads fad fads fall falls flak
flask flasks lad lads lass sad salad salads alfalfa

aid aide air airs aisle alike alive alter arid arise aside dare dark dead
deal dear deed deer desk dial did die dies drill drills dual duel dull
elder elk fail fails fair fake fare fear feed feel field file files fill
filled fire fired fires flair flake flare flea fled flies fluid fried fuel
full idea ideas idle ill jade jail jails jar jars kid kids kill killed
lake lard lark larks laser leaf leak lead leaf led lied life like liked
likes raid raids rail rails real rear red reed relies rid ride rides rifle
rise risk risks rude rule ruler rules sail sails sale said sea seal seals
sealed see seed seek self sell serial side sides silk skid slid slide sure
used user users usual dealer failed jailed killer

allow arrow below blow bold book bore bow bowl brook code cold cool crow
door dose down drop few field fold folk food fool for fork form fowl fowls
kilo know lord low order oak oil old ore our owe owl own pair pale panel
paper park pass pear pedal peel per period pile pillar plea plead please
plod plus poker polar pole poor pop pore power prod prop pull pulse pure
purse quail quake qualified quarrel quiet quill quip quirk quiz roll rope
rose row rope sold solid sore soup speak spider spoke spoil spool spore
spread squad squall square squid squire swell swore upper wade wafer wake
walk wall ward ware warp weak wear weed week weekly weep weld well were
wide wild will wire wise wolf woke word wore work works world worse would
wrap wreck

after alert alter apart artist attire audit deposit desert detail dirty
dispute district distort duty early earth eight either elite empty equity
estate fatal faster faulty fifty filter first fitter flat float flute forty
frost fruit list liter lofty lottery loyal party patrol pilot pity plate
pleasure poetry portly poultry pretty priority priest quality quarter
quiet quite ratio realty relay reply report resort result retail rifle
riot risky roast rotate route royal rusty safety salty satire settle
short shorty silty sister site slate sleep slept slip slot soft solar
sort spirit split sport stair stale star start state stay steady steel
still stir stole stop store storm story strap street strike strip strode
strong studio study stuff style suit surplus sweat sweet swift
tailor taste tea teak tear tell test their theory thirty those threat
three throw thus tidy tie tier tilt tire title toast today toil toll tool
top total tour tower trade trail trait trap travel tray treat trial trip
trout trust truth try tulip turf twist typist

active advice cancel carve cave civic claim clear clerk click cliff climb
clip clock close cloud clue coast coat cover craft crate cream credit
crop cross cruise crust cycle direct dock doctor drama dream dust electric
exact fact factor force local locate mail major make male mall manual
map mark market mask master match meal meat medal metal meter mild mile
milk mill mist mixed model modest moist molar moral more most motive
motor mould mouse move movie music must vacate valid value vast veil
vector velvet vertical vessel victim video view visit vital voice volume
vote vowel

axis blaze box boxes buzz crazy dozen exit exile expert export extra fax
fix fixed flex fuzzy hazel jazz lazy maze mix mixer next oxide prize
quartz relax size sixty taxi text textile toxic vex wax waxed zeal zebra
zero zest zinc zip zone zoom

able about above absorb accept access agent ahead alarm album along amber
among ample anchor angle animal answer anybody bank banner basic batch
beach began begin behalf behind being belong bench beyond bind blend
blind block board bonus border both bottle bought bound brain branch
brand brave bread break breath bridge bright bring broad brother brown
brush budget build bunch bundle burden bushel button cabin cabinet chain
chair chance change channel chapter charge chart cheap check chief child
choice choose chosen chunk church claim clean climb cloth coach coffee
column combine comfort common change danger debate decent decide decline
defend degree deliver demand depend design detach detect device dinner
double doubt drink during dynamic eager engine enough entire entry evening
event every exchange exhibit expand explain fabric famous fancy fashion
father feature fellow fetch finance finding finish flight flower follow
forest forget fortune forward found freedom friend function funding
garden gather general gentle giant given glance global golden govern
grade grand grant graph grasp great green ground group growth guard
guess guide habit handle happen harbour health heart heavy height helpful
hidden higher highly history hobby holder honest honour horizon hunger
hunter husband hybrid ignore image impact import income indeed indoor
industry inform inner insight inspire instant intend invent invite
island itself jacket join joint journal journey judge junior kitchen
knight known ladder language later laughter launch layer leader league
learn leather legend length lesson letter level liberty library licence
lift light limit linen listen little living logic longer machine machinery
magic magnet manage manner margin marine matter meaning measure medium
member memory mention merchant merit method middle might minute mirror
mission mobile modern moment monitor month morning mother motion mountain
moving mutual nation native nature nearly needle neighbour neither nephew
nerve network neutral never night noble normal notable nothing notice
number nurture object oblige obtain occupy ocean offer office often
onward opening option orange organ origin other ought outdoor outline
output outside overall package painting palace parent parcel partner
patient pattern peace pencil people perfect perhaps person picture piece
pillow pioneer plane planet plant plenty pocket poem point polish popular
portion positive possible pound powder practice praise prefer prepare
present pretend prevent primary print prison private problem process
produce profile profit project promise proper propose protect proud
provide public publish purchase purpose pursue puzzle quantity question
quick quickly rabbit radio raise random range rapid rather reach reader
reason recent record reduce refer reflect reform refuse regard region
regular reject relate release remain remember remind remove render repair
repeat replace request require rescue research reserve resist resource
respect respond restore retain return reveal review reward rhythm ribbon
riding rigid rising river road robot rocket rough round rubber rugged
runner rural sample sandy saving scale scatter scene scheme school
science scope screen search season second secret section secure segment
select senior sense sentence series serious serve settle seven several
shadow shape share sharp shelf shelter shine shining shore should
shoulder shower signal silent silver similar simple single sister sketch
skill slight slowly small smart smile smooth social socket soften solid
solution someone sorrow sound source southern space spare speech speed
spend sphere spirit spoken sponsor spread spring square stable staff
stage stamp stand standard status steady steam stitch stock stone stood
storage strange stream strength stretch strict string strive structure
struggle student subject submit succeed sudden suffer sugar suggest
summer summit sunny superb supply support suppose surface surprise
survey survive sustain switch symbol system table tackle talent target
teacher teaching temple tender tension terrain thanks theme therefore
thing think third thorough though thought thread thrive through thunder
ticket tighten timber timing tissue tobacco together tomorrow tongue
tonight topic torch touch tough toward towel tractor traffic trainer
transfer transit treasure tremble trend tribute trigger trophy trouble
truly trumpet trunk tunnel turkey turning twelve twenty typical
umbrella uncle under uniform union unique united unless unlike until
unusual update upgrade upon upper urban urgent useful utility vanish
variety various vehicle venture verbal verify version vessel veteran
vibrant victory village vintage violet virtue visible vision visitor
vocal volume voyage wander wanted warmth warning washing watch water
weather wedding weight welcome welfare western whatever whether which
while whisper whole widely willing window winner winter wisdom wonder
wooden worker working workshop worry worth writer writing written yellow
yesterday yield young yourself
`
const RAW = `${WORD_SOURCE}`
  .trim()
  .split(/\s+/)
  .filter((word) => /^[a-z]+$/.test(word))

/** Deduplicated, so a word written twice above is not drilled twice as often. */
export const WORDS: string[] = [...new Set(RAW)]

/**
 * The passages that make up the final chapter. Short, self-contained, and
 * written for this tutor, so the whole project stays under one licence. Each
 * one stays inside the characters taught by the chapters before it.
 */
export const PASSAGES: { title: string; text: string }[] = [
  {
    title: 'The Machine',
    text: 'The first typing machines were built for clerks, not for poets. A clerk who could set down a hundred words a minute was worth two who could not, and so the keyboard spread from the office to the parlour, and then to every desk in the world. It is a strange inheritance: a layout designed in 1873 that we still press with our fingers today.'
  },
  {
    title: 'Ten Fingers',
    text: 'Touch typing rests on one idea. Each finger owns a small patch of keys and never leaves it. The eight fingers come home to "asdf" and "jkl;" after every stroke, so the hand always knows where it is. Look at the screen, not the board. Your fingers already have the map; they only need to be trusted with it.'
  },
  {
    title: 'Slow is Fast',
    text: 'Speed is a by-product. Chase it directly and you buy 60 words a minute at the price of 8% errors, which is no bargain at all: every mistake costs a backspace, a glance, and the thread of the sentence. Type slowly enough to be right. The rhythm tightens on its own, usually within a week or two of honest practice.'
  },
  {
    title: 'The Weak Fingers',
    text: 'The little fingers do a third of the work of the forefingers and complain twice as loudly. They carry "a", ";", "q", "p", "z", "/", and both shift keys: an unfair share for the shortest digits on the hand. Give them their own drills. Roll the whole hand toward the reach instead of stretching one tendon after it.'
  },
  {
    title: 'Practice',
    text: 'Fifteen minutes a day beats two hours on Sunday. The skill lives in the cerebellum, and the cerebellum learns by repetition spread over sleep, not by heroics. Set a small target (say 95% accuracy at 40 wpm), meet it, then raise it. Progress that feels boring is usually progress that lasts.'
  }
]
