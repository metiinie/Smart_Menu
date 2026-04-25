import type { MenuItem } from '@arifsmart/shared';

export type AllergenLine = { label: string; present: boolean };

export type IngredientLine = { name: string; detail?: string };

/** One row on a nutrition-style panel (amount + optional % daily value). */
export type NutritionRow = {
  nutrient: string;
  amount: string;
  dailyValue?: string;
  sub?: boolean;
};

export type NutritionSection = {
  title: string;
  rows: NutritionRow[];
};

export type IngredientInsights = {
  headline: string;
  servingLine: string;
  allergens: AllergenLine[];
  ingredients: IngredientLine[];
  dietaryTags: string[];
  nutritionSections: NutritionSection[];
};

const BY_ID: Record<string, IngredientInsights> = {
  m101: {
    headline: '—',
    servingLine: 'Per 250 ml (est.)',
    allergens: [
      { label: 'Dairy', present: false },
      { label: 'Nuts', present: false },
      { label: 'Gluten', present: false },
    ],
    ingredients: [
      { name: 'Hass avocado', detail: 'Pulp' },
      { name: 'Filtered water', detail: '' },
      { name: 'Fresh lime juice', detail: '' },
      { name: 'Lime zest', detail: '' },
      { name: 'Sea salt', detail: 'Trace' },
    ],
    dietaryTags: ['Vegan', 'Fasting', 'No added sugar'],
    nutritionSections: [
      {
        title: 'Energy & macros',
        rows: [
          { nutrient: 'Energy', amount: '180 kcal', dailyValue: '9%' },
          { nutrient: 'Total fat', amount: '15 g', dailyValue: '19%', sub: false },
          { nutrient: 'Saturated fat', amount: '2.2 g', dailyValue: '11%', sub: true },
          { nutrient: 'Trans fat', amount: '0 g', dailyValue: '—' },
          { nutrient: 'Cholesterol', amount: '0 mg', dailyValue: '0%' },
          { nutrient: 'Sodium', amount: '95 mg', dailyValue: '4%' },
          { nutrient: 'Total carbohydrate', amount: '12 g', dailyValue: '4%' },
          { nutrient: 'Dietary fiber', amount: '8 g', dailyValue: '29%', sub: true },
          { nutrient: 'Total sugars', amount: '1 g', dailyValue: '—', sub: true },
          { nutrient: 'Protein', amount: '3 g', dailyValue: '6%' },
        ],
      },
      {
        title: 'Vitamins',
        rows: [
          { nutrient: 'Vitamin D', amount: '0 mcg', dailyValue: '0%' },
          { nutrient: 'Vitamin C', amount: '12 mg', dailyValue: '13%' },
          { nutrient: 'Vitamin E (alpha-tocopherol)', amount: '2.7 mg', dailyValue: '18%' },
          { nutrient: 'Vitamin K', amount: '21 mcg', dailyValue: '18%' },
          { nutrient: 'Folate (B9)', amount: '60 mcg DFE', dailyValue: '15%' },
        ],
      },
      {
        title: 'Minerals',
        rows: [
          { nutrient: 'Calcium', amount: '18 mg', dailyValue: '1%' },
          { nutrient: 'Iron', amount: '0.6 mg', dailyValue: '3%' },
          { nutrient: 'Potassium', amount: '485 mg', dailyValue: '10%' },
          { nutrient: 'Magnesium', amount: '39 mg', dailyValue: '9%' },
        ],
      },
    ],
  },
  m102: {
    headline: '—',
    servingLine: 'Per 240 ml',
    allergens: [{ label: 'Dairy', present: false }, { label: 'Nuts', present: false }],
    ingredients: [
      { name: 'Ethiopian arabica coffee', detail: '' },
      { name: 'Filtered water', detail: '' },
    ],
    dietaryTags: ['Vegan', 'Fasting'],
    nutritionSections: [
      {
        title: 'Energy & macros',
        rows: [
          { nutrient: 'Energy', amount: '5 kcal', dailyValue: '0%' },
          { nutrient: 'Total fat', amount: '0 g', dailyValue: '0%' },
          { nutrient: 'Sodium', amount: '5 mg', dailyValue: '0%' },
          { nutrient: 'Total carbohydrate', amount: '0 g', dailyValue: '0%' },
          { nutrient: 'Protein', amount: '0.3 g', dailyValue: '1%' },
          { nutrient: 'Caffeine', amount: '~95 mg', dailyValue: '—' },
        ],
      },
      {
        title: 'Vitamins',
        rows: [
          { nutrient: 'Niacin (B3)', amount: '0.5 mg', dailyValue: '3%' },
          { nutrient: 'Riboflavin (B2)', amount: '0.2 mg', dailyValue: '15%' },
          { nutrient: 'Pantothenic acid (B5)', amount: '0.6 mg', dailyValue: '12%' },
        ],
      },
      {
        title: 'Minerals',
        rows: [
          { nutrient: 'Potassium', amount: '116 mg', dailyValue: '2%' },
          { nutrient: 'Magnesium', amount: '7 mg', dailyValue: '2%' },
          { nutrient: 'Manganese', amount: '0.1 mg', dailyValue: '4%' },
        ],
      },
    ],
  },
  m201: {
    headline: '—',
    servingLine: 'Per ~180 g (incl. kibbeh)',
    allergens: [{ label: 'Dairy', present: true }, { label: 'Gluten', present: false }],
    ingredients: [
      { name: 'Lean beef', detail: '' },
      { name: 'Niter kibbeh', detail: '' },
      { name: 'Mitmita', detail: '' },
      { name: 'Cardamom', detail: '' },
      { name: 'Ayib', detail: '' },
    ],
    dietaryTags: ['High protein', 'Dairy'],
    nutritionSections: [
      {
        title: 'Energy & macros',
        rows: [
          { nutrient: 'Energy', amount: '420 kcal', dailyValue: '21%' },
          { nutrient: 'Total fat', amount: '28 g', dailyValue: '36%' },
          { nutrient: 'Saturated fat', amount: '14 g', dailyValue: '70%', sub: true },
          { nutrient: 'Trans fat', amount: '0.5 g', dailyValue: '—', sub: true },
          { nutrient: 'Cholesterol', amount: '110 mg', dailyValue: '37%' },
          { nutrient: 'Sodium', amount: '480 mg', dailyValue: '21%' },
          { nutrient: 'Total carbohydrate', amount: '4 g', dailyValue: '1%' },
          { nutrient: 'Dietary fiber', amount: '0.5 g', dailyValue: '2%' },
          { nutrient: 'Protein', amount: '36 g', dailyValue: '72%' },
        ],
      },
      {
        title: 'Vitamins',
        rows: [
          { nutrient: 'Vitamin A', amount: '180 mcg RAE', dailyValue: '20%' },
          { nutrient: 'Vitamin B12', amount: '2.4 mcg', dailyValue: '100%' },
          { nutrient: 'Vitamin B6', amount: '0.5 mg', dailyValue: '29%' },
          { nutrient: 'Vitamin E', amount: '0.4 mg', dailyValue: '3%' },
        ],
      },
      {
        title: 'Minerals',
        rows: [
          { nutrient: 'Iron', amount: '3.2 mg', dailyValue: '18%' },
          { nutrient: 'Zinc', amount: '5.8 mg', dailyValue: '53%' },
          { nutrient: 'Selenium', amount: '28 mcg', dailyValue: '51%' },
          { nutrient: 'Phosphorus', amount: '220 mg', dailyValue: '18%' },
        ],
      },
    ],
  },
  m202: {
    headline: '—',
    servingLine: 'Per 1 egg + sauce (est.)',
    allergens: [{ label: 'Eggs', present: true }, { label: 'Dairy', present: false }],
    ingredients: [
      { name: 'Chicken', detail: '' },
      { name: 'Chicken stock', detail: '' },
      { name: 'Berbere spice blend', detail: '' },
      { name: 'Yellow onions', detail: '' },
      { name: 'Garlic', detail: '' },
      { name: 'Hard-boiled egg', detail: '' },
      { name: 'Lemon', detail: '' },
    ],
    dietaryTags: ['Gluten-free', 'Spicy'],
    nutritionSections: [
      {
        title: 'Energy & macros',
        rows: [
          { nutrient: 'Energy', amount: '380 kcal', dailyValue: '19%' },
          { nutrient: 'Total fat', amount: '18 g', dailyValue: '23%' },
          { nutrient: 'Saturated fat', amount: '4 g', dailyValue: '20%', sub: true },
          { nutrient: 'Cholesterol', amount: '240 mg', dailyValue: '80%' },
          { nutrient: 'Sodium', amount: '720 mg', dailyValue: '31%' },
          { nutrient: 'Total carbohydrate', amount: '22 g', dailyValue: '8%' },
          { nutrient: 'Dietary fiber', amount: '4 g', dailyValue: '14%' },
          { nutrient: 'Protein', amount: '32 g', dailyValue: '64%' },
        ],
      },
      {
        title: 'Vitamins',
        rows: [
          { nutrient: 'Vitamin A', amount: '120 mcg RAE', dailyValue: '13%' },
          { nutrient: 'Vitamin C', amount: '8 mg', dailyValue: '9%' },
          { nutrient: 'Vitamin B3 (niacin)', amount: '10 mg', dailyValue: '63%' },
        ],
      },
      {
        title: 'Minerals',
        rows: [
          { nutrient: 'Iron', amount: '2 mg', dailyValue: '11%' },
          { nutrient: 'Potassium', amount: '540 mg', dailyValue: '11%' },
          { nutrient: 'Phosphorus', amount: '280 mg', dailyValue: '22%' },
        ],
      },
    ],
  },
  m301: {
    headline: '—',
    servingLine: 'Per 60 g',
    allergens: [
      { label: 'Tree nuts', present: true },
      { label: 'Gluten', present: true },
      { label: 'Dairy', present: true },
    ],
    ingredients: [
      { name: 'Phyllo dough', detail: '' },
      { name: 'Unsalted butter', detail: '' },
      { name: 'Walnuts', detail: '' },
      { name: 'Pistachios', detail: '' },
      { name: 'Honey', detail: '' },
      { name: 'Sugar', detail: '' },
      { name: 'Orange blossom water', detail: '' },
    ],
    dietaryTags: ['Vegetarian', 'Nuts', 'Gluten'],
    nutritionSections: [
      {
        title: 'Energy & macros',
        rows: [
          { nutrient: 'Energy', amount: '280 kcal', dailyValue: '14%' },
          { nutrient: 'Total fat', amount: '16 g', dailyValue: '21%' },
          { nutrient: 'Saturated fat', amount: '7 g', dailyValue: '35%', sub: true },
          { nutrient: 'Cholesterol', amount: '25 mg', dailyValue: '8%' },
          { nutrient: 'Sodium', amount: '140 mg', dailyValue: '6%' },
          { nutrient: 'Total carbohydrate', amount: '32 g', dailyValue: '12%' },
          { nutrient: 'Total sugars', amount: '18 g', dailyValue: '—', sub: true },
          { nutrient: 'Protein', amount: '4 g', dailyValue: '8%' },
        ],
      },
      {
        title: 'Vitamins',
        rows: [
          { nutrient: 'Vitamin E', amount: '1.2 mg', dailyValue: '8%' },
          { nutrient: 'Thiamin (B1)', amount: '0.1 mg', dailyValue: '8%' },
        ],
      },
      {
        title: 'Minerals',
        rows: [
          { nutrient: 'Calcium', amount: '30 mg', dailyValue: '2%' },
          { nutrient: 'Iron', amount: '0.8 mg', dailyValue: '4%' },
          { nutrient: 'Magnesium', amount: '35 mg', dailyValue: '8%' },
        ],
      },
    ],
  },
};

function defaultInsights(item: MenuItem): IngredientInsights {
  const veg = item.name.toLowerCase().includes('juice') || item.name.toLowerCase().includes('salad');
  return {
    headline: item.description?.trim() || '—',
    servingLine: '—',
    allergens: [
      { label: 'Gluten', present: !veg },
      { label: 'Dairy', present: !veg },
      { label: 'Nuts', present: false },
    ],
    ingredients: [
      { name: '—', detail: '' },
      { name: '—', detail: '' },
      { name: '—', detail: '' },
    ],
    dietaryTags: item.isFasting ? ['fasting'] : [],
    nutritionSections: [
      {
        title: 'Energy & macros',
        rows: [
          { nutrient: 'Energy', amount: '—', dailyValue: '—' },
          { nutrient: 'Total fat', amount: '—', dailyValue: '—' },
          { nutrient: 'Saturated fat', amount: '—', dailyValue: '—', sub: true },
          { nutrient: 'Cholesterol', amount: '—', dailyValue: '—' },
          { nutrient: 'Sodium', amount: '—', dailyValue: '—' },
          { nutrient: 'Total carbohydrate', amount: '—', dailyValue: '—' },
          { nutrient: 'Protein', amount: '—', dailyValue: '—' },
        ],
      },
      {
        title: 'Vitamins',
        rows: [
          { nutrient: 'Vitamin A', amount: '—', dailyValue: '—' },
          { nutrient: 'Vitamin C', amount: '—', dailyValue: '—' },
          { nutrient: 'Vitamin D', amount: '—', dailyValue: '—' },
        ],
      },
      {
        title: 'Minerals',
        rows: [
          { nutrient: 'Calcium', amount: '—', dailyValue: '—' },
          { nutrient: 'Iron', amount: '—', dailyValue: '—' },
          { nutrient: 'Potassium', amount: '—', dailyValue: '—' },
        ],
      },
    ],
  };
}

export function getIngredientInsights(item: MenuItem): IngredientInsights {
  return BY_ID[item.id] ?? defaultInsights(item);
}
