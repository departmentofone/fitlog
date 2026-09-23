import type { Tab } from '../types'

export interface Explainer {
  title: string
  body: string
  /** Always shown under an "Example" label so it's never mistaken for real data. */
  example: { name: string; lines: string[]; footer?: string }
}

// Shared examples. Numbers come from FitLog's own food library (USDA values), so they match what
// someone would see if they logged the same foods.
const CHICKEN_RICE: Explainer['example'] = {
  name: 'Chicken, rice & broccoli',
  lines: ['Chicken breast, cooked · 150 g', 'White rice, cooked · 150 g', 'Broccoli · 100 g'],
  footer: '477 kcal · 53 g protein · 49 g carbs · 6 g fat',
}

const BEGINNER_PROGRAM: Explainer['example'] = {
  name: 'Beginner fat loss',
  lines: [
    'Workouts: Full body A, Full body B',
    'Recipe: Overnight oats',
    'Meal preset: Chicken, rice & broccoli',
    'Diet goals: deficit · 2,000 kcal · 2.5 L water',
  ],
}

/** One short tip per More-menu tab, shown at the top of the tab until it's closed. */
export const TAB_TIPS: Partial<Record<Tab, Explainer>> = {
  workouts: {
    title: 'Log your training',
    body: 'Add an exercise, then log each set with its weight, reps and effort (RPE). Pair exercises into a superset, use the rest timer, and save a good session as a preset to repeat it in one tap.',
    example: {
      name: 'Bench press',
      lines: ['Set 1 · 60 kg × 8 · RPE 7', 'Set 2 · 60 kg × 8 · RPE 8', 'Set 3 · 62.5 kg × 6 · RPE 9'],
      footer: '2 minutes rest between sets',
    },
  },
  meals: {
    title: 'Log what you eat',
    body: 'Add foods to each meal from the food library, or add a saved preset or recipe in one go. Calories, protein, carbs and fat total up as you log. Water is tracked here too.',
    example: { ...CHICKEN_RICE, name: 'Lunch' },
  },
  scanner: {
    title: 'Scan packaged food',
    body: "Point the camera at a barcode to pull the product's nutrition from Open Food Facts, a free public database. Check the numbers, then save it to your food library. No camera? Type the barcode number instead.",
    example: {
      name: 'Nutella · 3017620422003',
      lines: ['Per 100 g: 539 kcal', '6.3 g protein · 57.5 g carbs · 30.9 g fat'],
    },
  },
  diet: {
    title: 'Your daily calorie target',
    body: 'Pick a goal (a deficit to lose weight, maintenance, or a surplus to gain) and a daily calorie target. See how today compares, your vitamins and minerals, a projection toward your goal weight, and calories from alcohol.',
    example: {
      name: 'Deficit · 2,000 kcal a day',
      lines: ['Eaten today: 1,450 kcal', '550 kcal left'],
      footer: 'Find your maintenance in Calculator first',
    },
  },
  fasting: {
    title: 'Time your fasts',
    body: "Start a fast with a common window (16:8, 18:6, 20:4 or one meal a day) or your own length. The timer shows your progress and what's likely happening in your body. Finished fasts are saved below.",
    example: {
      name: '16:8',
      lines: ['Last meal at 8:00 pm', 'Eat again at 12:00 pm the next day'],
      footer: '16 hours fasting, an 8-hour eating window',
    },
  },
  goals: {
    title: 'Targets and body tracking',
    body: 'Add your weight, height and goal weight, log body measurements and progress photos, and set lift targets. A lift target ticks itself off when you hit it in Workouts.',
    example: {
      name: 'Squat 100 kg × 5',
      lines: ['Best so far: 90 kg × 5', 'Goal weight: 75 kg (now 80 kg)'],
    },
  },
  history: {
    title: 'Every workout, day by day',
    body: 'Pick a day to see each exercise and set you logged, how long the workout took, and whether you had a preworkout. The week card sums up your last 7 days.',
    example: {
      name: 'Monday · Push day',
      lines: ['Bench press · 3 sets', 'Overhead press · 3 sets', 'Workout length: 52 min'],
    },
  },
  achievements: {
    title: 'Records and medals',
    body: 'Your personal records with an estimated one-rep max, a monthly challenge, and medals earned by training, eating on target, fasting consistently or getting stronger.',
    example: {
      name: 'Bench press · new record',
      lines: ['80 kg × 5', 'Estimated 1RM: 93 kg'],
      footer: 'Estimated with the Epley formula',
    },
  },
  programs: {
    title: 'Bundle a complete plan',
    body: 'A program packs workout presets, recipes, meal presets and, if you like, diet goals into one. Import it and everything is added to your account at once. Share yours to Community so others can too.',
    example: BEGINNER_PROGRAM,
  },
  foods: {
    title: 'Your food library and plans',
    body: 'Library holds every food you can log, including ones you add or scan. Presets are foods you log together, Plans are full days of meals, and Diets are lists of foods you want to stick to.',
    example: {
      name: 'Greek yogurt, plain nonfat',
      lines: ['Per 100 g: 59 kcal', '10 g protein · 3.6 g carbs · 0.4 g fat'],
    },
  },
  community: {
    title: 'Borrow what works',
    body: 'Browse diets, meal plans, recipes, workouts and programs from FitLog and other people. Saving makes your own copy to change however you like. To share something of yours, turn on "Share to Community" on it.',
    example: {
      name: 'Mediterranean diet',
      lines: ['Official · 206 foods and a sample day', 'Follow it and its foods come first when you log'],
    },
  },
  calculator: {
    title: 'Two quick calculators',
    body: 'Calories estimates how much you burn in a day (your maintenance) from your age, sex, height, weight and activity. Plates tells you what to load on each side of the bar.',
    example: {
      name: 'Calories and plates',
      lines: ['Man, 30, 180 cm, 80 kg, moderately active: about 2,760 kcal a day', '100 kg on a 20 kg bar: 25 kg + 15 kg on each side'],
    },
  },
}

/** Community sections with nothing in them explain themselves instead of looking empty. */
export const COMMUNITY_EXPLAINERS: Record<'all' | 'diet' | 'plan' | 'meal' | 'recipe' | 'workout' | 'program', Explainer> = {
  all: {
    title: 'Nothing shared yet',
    body: 'Diets, meal plans, recipes, workouts and programs that people share show up here. Share your own by turning on "Share to Community" on any of them.',
    example: { ...CHICKEN_RICE, name: 'Chicken, rice & broccoli (meal preset)' },
  },
  diet: {
    title: "What's a diet?",
    body: "A diet is the list of foods you want to eat. Follow one and its foods come first when you log, with a small flag on anything that's off the list. Make your own in Foods → Diets and share it here.",
    example: {
      name: 'Mediterranean',
      lines: ['Vegetables, fruit, whole grains, beans and lentils', 'Olive oil, nuts, fish and seafood', 'Some poultry, eggs, cheese and yogurt; little red meat'],
      footer: 'Based on the Oldways Mediterranean Diet Pyramid',
    },
  },
  plan: {
    title: "What's a meal plan?",
    body: 'A full day of meals with exact amounts, or up to 7 days combined into a week. Log a whole day in one tap. Build one in Foods → Plans and share it here.',
    example: {
      name: 'A training day',
      lines: [
        'Breakfast · 2 eggs, 2 slices whole wheat toast, a banana',
        'Lunch · chicken breast 150 g, white rice 150 g, broccoli 100 g',
        'Snack · nonfat Greek yogurt 170 g, blueberries 100 g',
        'Dinner · lentils 200 g, brown rice 150 g, olive oil 10 g',
      ],
      footer: '1,549 kcal · 115 g protein · 201 g carbs · 33 g fat',
    },
  },
  meal: {
    title: "What's a meal preset?",
    body: 'Foods you often eat together, saved as one item so the whole meal logs in one tap. Save one in Foods → Presets and share it here.',
    example: CHICKEN_RICE,
  },
  recipe: {
    title: "What's a recipe?",
    body: 'A dish you cook from several ingredients. FitLog works out calories and macros per serving, so logging a portion is accurate. Build one in Meals → Recipes and share it here.',
    example: {
      name: 'Overnight oats · 2 servings',
      lines: ['Oats 80 g, 1% milk 250 g, nonfat Greek yogurt 150 g', 'Blueberries 100 g, honey 20 g'],
      footer: 'Per serving: 311 kcal · 19 g protein · 51 g carbs · 5 g fat',
    },
  },
  workout: {
    title: "What's a workout preset?",
    body: 'A saved list of exercises with their sets, weights and reps. Load it into any day to start from last time instead of from scratch. Save one in Workouts → Presets and share it here.',
    example: {
      name: 'Push day',
      lines: ['Bench press · 3 × 8', 'Overhead press · 3 × 8', 'Incline dumbbell press · 3 × 10', 'Lateral raise · 3 × 15', 'Triceps pushdown · 3 × 12'],
    },
  },
  program: {
    title: "What's a program?",
    body: 'A bundle of workout presets, recipes, meal presets and optional diet goals. Importing one adds all of it to your account at once. Build one in Programs and share it here.',
    example: BEGINNER_PROGRAM,
  },
}
