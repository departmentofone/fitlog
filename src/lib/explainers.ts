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
