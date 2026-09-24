import { ExplainerCard } from 'fitlog-design-system'

// The boxes FitLog's Community tab shows in an empty section: what the thing is, plus one real example.
export const Program = () => (
  <div className="w-80">
    <ExplainerCard
      explainer={{
        title: "What's a program?",
        body: 'A bundle of workout presets, recipes, meal presets and optional diet goals. Importing one adds all of it to your account at once. Build one in Programs and share it here.',
        example: {
          name: 'Beginner fat loss',
          lines: [
            'Workouts: Full body A, Full body B',
            'Recipe: Overnight oats',
            'Meal preset: Chicken, rice & broccoli',
            'Diet goals: deficit · 2,000 kcal · 2.5 L water',
          ],
        },
      }}
    />
  </div>
)

export const RecipeWithTotals = () => (
  <div className="w-80">
    <ExplainerCard
      explainer={{
        title: "What's a recipe?",
        body: 'A dish you cook from several ingredients. FitLog works out calories and macros per serving, so logging a portion is accurate.',
        example: {
          name: 'Overnight oats · 2 servings',
          lines: ['Oats 80 g, 1% milk 250 g, nonfat Greek yogurt 150 g', 'Blueberries 100 g, honey 20 g'],
          footer: 'Per serving: 311 kcal · 19 g protein · 51 g carbs · 5 g fat',
        },
      }}
    />
  </div>
)
