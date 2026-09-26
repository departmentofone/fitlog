export interface ChangelogEntry {
  date: string
  title: string
  changes: string[]
}

// Newest first. Add a new entry here whenever a real batch of changes ships - this is what
// "What's new" reads from, and it's the only place that content lives (no other data source).
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-09-26',
    title: 'A simpler layout',
    changes: [
      'Four places on the bottom bar - Train, Eat, Progress and Community - with their sections as tabs at the top, instead of a menu of 15 screens',
      'Each screen now says where you are in the header',
      'The barcode scanner opens from Foods, the calorie calculator from Diet, and the plate calculator from your workout',
      "What's new, About, and Feedback & support (with why FitLog is free) are in Settings",
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
      'New Feedback tab (More menu): write to the developer without leaving FitLog - bug reports, ideas or questions, with a reply to your email',
      'Buy me a coffee moved there too, under Support FitLog',
    ],
  },
  {
    date: '2026-09-24',
    title: 'Clearer Community, lots of polish',
    changes: [
      'Empty Community sections explain what belongs there, with a real example, instead of looking blank',
      'Tap a finished meal to see it or add something you forgot - it stays finished',
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
      'Official meal presets to start with - real meals with standard portions, from Greek yogurt bowls to salmon dinners',
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
      'A real always-visible micronutrient dashboard on the Diet tab, not just buried in a modal',
      'A rest timer that counts down between sets, with a notification when it hits zero',
      "A \"last time\" hint while logging a set, so you're not guessing your previous numbers",
      'Weekly nutrition adherence score - how many of the last 7 logged days hit your goal',
      "This What's New tab",
    ],
  },
  {
    date: '2026-09-16',
    title: 'Aurora Glass redesign',
    changes: [
      'Switched the whole app from a flat black canvas to a glassmorphism look - translucent cards, ambient glow, deep navy background',
      'Grouped the menu into Track / Progress / Tools instead of one long list',
      'History promoted to a real tab; added unified search and a floating quick-add button',
      'Illustrated empty states, skeleton loaders, swipe-to-delete, and a lot of small polish across every screen',
    ],
  },
]
