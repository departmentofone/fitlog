export interface ChangelogEntry {
  date: string
  title: string
  changes: string[]
}

// Newest first. Add a new entry here whenever a real batch of changes ships - this is what
// "What's new" reads from, and it's the only place that content lives (no other data source).
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-10-03',
    title: 'Finishing a workout, ready-made programs, and a lot of polish',
    changes: [
      'Finish a workout to see how it went: time, volume, sets, your new personal records and the muscles you worked. Resume picks the clock up where it stopped',
      'Ready-made programs under Train, in Programs: full body, push/pull/legs and upper/lower. Add one and its workouts become presets you start in one tap',
      'A day with nothing logged yet offers your presets as one-tap starts',
      'Starting a preset plans its sets: tick each one off as you do it, and only finished sets count',
      'Set a daily protein goal next to your calories in Diet, and see protein against it on Meals',
      'New accounts can set units, weight and a goal weight in the welcome tour',
      'Food lists (the Mediterranean, Keto and other diets) moved under that name in Foods, and meal presets live in Meals only, with Edit presets there',
      'Reps and effort carry over from your last set, and the Plates button shows what to load for the weight you are about to lift',
      'The exercise list puts your recent exercises first, filters by muscle, and understands shorthand like "db bench" or "rdl"',
      "Log today's weight from the top of Body. It also updates the weight your calorie numbers use",
      'Scan a barcode from a meal and log the food straight into it',
      'Copy day can fill today from yesterday, and copied meals join the ones already there instead of doubling up',
      'History lists your recent workouts under the calendar, and Diet shows your last 7 days against your goal',
      'Fasting shows the stage you are in and a chart of your recent fasts, and asks before you end a fast early',
      'Search can take you to any screen',
      'Fixed streaks and weekly totals that counted the wrong day in the first hours after midnight',
      'The back button closes sheets and menus instead of leaving the screen behind them',
    ],
  },
  {
    date: '2026-09-29',
    title: 'Share links and a smarter rest timer',
    changes: [
      'Share a link to any workout, program, recipe, meal, meal plan or diet you have shared to Community. Whoever opens it lands right on it and can save a copy',
      'Every Community card has a share button too, so you can pass on something you found',
      'The rest timer can show its countdown in your notification bar and alert you when rest is over, even while you are in another app',
      'Settings has a Rest timer section: turn off the automatic start after each set, or the notifications',
      'New to FitLog? The app now opens on Create account, and the sign-in and sign-up screens are easier to tell apart',
      'Adding a food that is already in a meal adds to it: 2 eggs, then 2 more, is one entry of 4 eggs',
    ],
  },
  {
    date: '2026-09-27',
    title: 'Fixes',
    changes: ['Tapping the day at the top of Train or Eat opens a calendar again, so you can jump to any date'],
  },
  {
    date: '2026-09-26',
    title: 'A simpler layout',
    changes: [
      'Four places on the bottom bar (Train, Eat, Progress and Community) with their sections as tabs at the top, instead of a menu of 15 screens',
      'Each screen now says where you are in the header',
      'The barcode scanner opens from Foods, the calorie calculator from Diet, and the plate calculator from your workout',
      "What's new, About, and Feedback & support are in Settings",
      'Foods has a new icon that no longer looks like a bin',
      "Meals shows today's calories against your goal, with what's left, right at the top",
      'The + button steps aside while you log a set or search for a food, instead of covering the buttons',
      'One clear Add exercise button, with Superset next to it',
      'Calmer background glow that follows your accent colour, so cards look the same wherever they sit',
      'Fat is purple now instead of red, so it no longer looks like a warning',
      'Clearer headings on every card',
      'Days read "Today", "Yesterday" or "Thu 24 Sep", with a Today button to jump back',
      "Today's exercises are one tidy list: full names, and \"3 sets · best 70 kg × 8\" instead of \"S3 · R8 · 70kg\"",
      'Logged sets show as a compact table (set, weight, reps, RPE), and warm-up is a simple toggle',
      'Finished meals fold into a single line with a check mark',
      'The Preworkout and warm-up toggles clearly show when they are on',
    ],
  },
  {
    date: '2026-09-26',
    title: 'Send feedback from the app',
    changes: [
      'New Feedback tab (More menu): write to the developer about a bug, an idea or a question without leaving FitLog, and get a reply by email',
    ],
  },
  {
    date: '2026-09-24',
    title: 'Clearer Community, lots of polish',
    changes: [
      'Empty Community sections explain what belongs there, with a real example, instead of looking blank',
      'Tap a finished meal to see it or add something you forgot. It stays finished',
      'New accounts skip the preworkout question (switch it on in Settings), with a rest-day link right on the workout',
      'Community now leads with diets, and its buttons are calmer',
      'Exercise names on workout cards show in full instead of being cut off',
      'Calories use thousands separators everywhere (2,300 kcal)',
      'Chart dates no longer get cut off at the right edge',
      'The plate calculator labels its fields, and its cards no longer touch',
      'The Light theme now draws the date picker and checkboxes in light colours too',
      'Micronutrients stay grey until you log something, instead of flashing red',
      'Reloading or going back on Foods or Community no longer jumps you to Workouts',
      'Weights like 102.5 kg now fit in the set form on smaller phones',
    ],
  },
  {
    date: '2026-09-23',
    title: 'Diets and meal plans',
    changes: [
      'Follow a diet like Mediterranean, DASH, Keto or plant-based: its foods come first when you add food, and anything off-diet gets a small flag',
      'Meal plans: a full day of meals you can log in one tap, or combine up to 7 days into a week',
      'Official diets come with a sample day built only from their own foods',
      'Community guidelines, plus ways to report or hide what other people share',
      'A shorter, friendlier welcome for new accounts',
    ],
  },
  {
    date: '2026-09-23',
    title: 'Community, a Foods tab, and clearer rest days',
    changes: [
      'New Community tab: browse meal presets, recipes, workouts and programs people have shared, and save your own copy in one tap',
      'Official meal presets to start with: real meals with standard portions, from Greek yogurt bowls to salmon dinners',
      '"Share to Community" replaces "Shared with friend", and your own lists now only show your own presets',
      'New Foods tab: manage your food library, label any food, and build meal presets directly',
      'Logging a rest day now shows a clear confirmation card with Undo, instead of a greyed-out line',
      'The Calculator tab now shows Calories and Plates as two big, clearly labeled choices',
    ],
  },
  {
    date: '2026-09-16',
    title: 'Rest days, a real micro dashboard, and more',
    changes: [
      'Log a rest day so 1-2 days off in a row no longer breaks your workout streak',
      'The Diet tab now shows your micronutrients at all times, outside the breakdown modal',
      'A rest timer that counts down between sets, with a notification when it hits zero',
      "A \"last time\" hint while logging a set, so you're not guessing your previous numbers",
      'Weekly nutrition adherence score: how many of the last 7 logged days hit your goal',
      "This What's New tab",
    ],
  },
  {
    date: '2026-09-16',
    title: 'Aurora Glass redesign',
    changes: [
      'Switched the whole app from a flat black canvas to a glassmorphism look: translucent cards, ambient glow and a deep navy background',
      'Grouped the menu into Track / Progress / Tools instead of one long list',
      'History promoted to a real tab; added unified search and a floating quick-add button',
      'Illustrated empty states, skeleton loaders, swipe-to-delete, and a lot of small polish across every screen',
    ],
  },
]
