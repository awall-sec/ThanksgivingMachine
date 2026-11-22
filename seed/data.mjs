// Seed data for Thanksgiving Machine 2026.
// Source: family Google Sheet "Thanksgiving 2026" (menu, cooks, store lists, countdown, family recipes).
// Times are minutes relative to dinner (negative = before). Dinner default: Thu Nov 26, 2:00 PM Central.

export const DINNER_AT = '2026-11-26T14:00:00-06:00'

// day: 0 = Thursday, -1 = Wednesday, ... ; h/m = clock time that day
const at = (day, h, m = 0) => (day * 24 + h - 14) * 60 + m
const I = (qty, unit, item) => ({ qty, unit, item })
const T = (id, label, offset, dur, eq = 'counter', temp = null) => ({ id, label, at: offset, dur, eq, temp })

export const settings = { id: 1, dinner_at: DINNER_AT, headcount: 9, turkey_lb: 13.5 }

export const dishes = [
  ['turkey', 'Turkey', 'Alex/Papaw', 'main'],
  ['brine', 'Turkey Brine', 'Alex/Papaw', 'prep'],
  ['stock', 'Turkey Stock', 'Kaitlin', 'prep'],
  ['gravy', 'Gravy', 'Kaitlin', 'side'],
  ['stuffing', 'Stuffing', 'Mimi', 'side'],
  ['mashed', 'Mashed Potatoes', 'Kaitlin', 'side'],
  ['corn', 'Corn Soufflé', 'Kaitlin', 'side'],
  ['greenbean', 'Green Bean Casserole', 'Alex', 'side'],
  ['carrots', 'Carrots & Parsnips', 'Alex', 'side'],
  ['brussels', 'Brussels Sprouts', null, 'side'],
  ['sweetpotato', 'Sweet Potato Casserole', null, 'side'],
  ['peas', 'Peas', null, 'side'],
  ['cranberry', 'Cranberry Relish', 'Tammy', 'side'],
  ['lingonberry', 'Lingonberry Jam', null, 'side'],
  ['rolls', 'Rolls', 'Tammy', 'side'],
  ['eggs', 'Deviled Eggs', 'Mimi', 'side'],
  ['ham', 'Honey Baked Ham', 'Delivery', 'main', 'Delivered — no recipe needed.'],
  ['tamales', 'Tamales', '??', 'side', 'Who is bringing these?'],
  ['pie', 'Pie', '??', 'dessert'],
  ['brownies', 'Brownies', '??', 'dessert'],
  ['cookies', 'Cookies', 'Kaitlin', 'dessert'],
].map(([id, name, who, category, notes], i) => ({ id, name, who, category, sort: i, chosen_recipe_id: null, notes: notes ?? null }))

const recipeList = {
  turkey: [
    {
      title: 'Herb Butter Oil-less Fried Turkey', badge: 'Fryer favorite',
      description: 'Brined bird, herb butter under the skin, cooked in the oil-less fryer. Crispy skin, oven stays free.',
      serves: '9–10', prep: 30, cook: 150, eq: 'fryer', temp: null,
      ing: [I(1, '', 'whole turkey (13.5 lb), thawed'), I(0.5, 'cup', 'butter, softened'), I(2, 'tbsp', 'fresh thyme, chopped'), I(2, 'tbsp', 'fresh parsley, chopped'), I(1, 'tbsp', 'garlic powder'), I(1, 'tsp', 'black pepper')],
      steps: [
        'Remove turkey from brine, rinse inside and out, and pat VERY dry (dry skin = crispy skin).',
        'Mash butter with thyme, parsley, garlic powder and pepper. Loosen the skin and rub butter underneath and over the outside.',
        'Preheat the oil-less fryer 15 minutes. Load turkey breast-up in the basket.',
        'Cook about 10–11 minutes per pound (≈2½ hrs for 13.5 lb). Start checking at 2 hours.',
        'Done at 165°F in the breast and 175°F in the thigh. Tent with foil and rest 25 minutes, then carve.',
      ],
      tasks: [
        T('dry', 'Turkey out of brine — rinse & pat dry', at(0, 9), 20),
        T('butter', 'Herb butter under the turkey skin', at(0, 10, 45), 15),
        T('preheat', 'Preheat oil-less fryer', at(0, 10, 45), 15, 'fryer'),
        T('cook', 'Turkey in the oil-less fryer (~2½ hrs)', at(0, 11), 150, 'fryer'),
        T('rest', 'Rest turkey under foil', at(0, 13, 30), 25),
        T('carve', 'Carve the turkey', at(0, 13, 50), 10),
      ],
    },
    {
      title: 'Cajun Rubbed Oil-less Fried Turkey', badge: 'Spicy',
      description: 'Bold Cajun dry rub with a little heat. Works brined or unbrined (skip salt in the rub if brined).',
      serves: '9–10', prep: 25, cook: 150, eq: 'fryer', temp: null,
      ing: [I(1, '', 'whole turkey (13.5 lb), thawed'), I(2, 'tbsp', 'paprika'), I(1, 'tbsp', 'garlic powder'), I(1, 'tbsp', 'onion powder'), I(2, 'tsp', 'dried thyme'), I(1, 'tsp', 'cayenne pepper'), I(1, 'tbsp', 'brown sugar'), I(2, 'tbsp', 'olive oil')],
      steps: [
        'Pat turkey very dry. Mix all spices and brown sugar.',
        'Rub turkey with olive oil, then coat all over (and under the skin) with the spice mix.',
        'Preheat oil-less fryer 15 minutes. Cook ~10–11 min/lb until 165°F breast, 175°F thigh.',
        'Rest 25 minutes under foil before carving.',
      ],
      tasks: [
        T('dry', 'Turkey out of brine — rinse & pat dry', at(0, 9), 20),
        T('rub', 'Cajun rub on the turkey', at(0, 10, 40), 20),
        T('preheat', 'Preheat oil-less fryer', at(0, 10, 45), 15, 'fryer'),
        T('cook', 'Turkey in the oil-less fryer (~2½ hrs)', at(0, 11), 150, 'fryer'),
        T('rest', 'Rest turkey under foil', at(0, 13, 30), 25),
        T('carve', 'Carve the turkey', at(0, 13, 50), 10),
      ],
    },
    {
      title: 'Cheesecloth Butter Roast Turkey', badge: 'Family recipe · uses oven',
      description: 'The family sheet recipe: stuffed, butter-soaked cheesecloth tent, 400°F then 325°F. Note: ties up the oven ~4 hrs.',
      serves: '9–10', prep: 30, cook: 225, eq: 'oven', temp: 325,
      ing: [I(1, '', 'whole turkey (13.5 lb), thawed'), I(0.5, 'cup', 'butter'), I(1, '', 'cheesecloth (double layer)')],
      steps: [
        'Remove the bird from brine and rinse inside and out with cold water. Discard brine.',
        'Preheat oven to 400°F. Fill breast and neck cavity loosely with stuffing. Truss if needed. Place on a rack in a shallow roasting pan.',
        'Melt ½ cup butter. Soak a double layer of cheesecloth in it and drape over the turkey, tucking edges into the pan.',
        'Roast in the middle of the oven 45 minutes, then reduce to 325°F.',
        'Continue roasting until juices run clear and the thigh reads 165–175°F (12–14 lb stuffed: 3½–4 hrs total).',
        'Rest 20 minutes. Remove cheesecloth, then remove stuffing and carve.',
      ],
      tasks: [
        T('dry', 'Turkey out of brine — rinse', at(0, 9), 20),
        T('stuff', 'Stuff, truss & cheesecloth the turkey', at(0, 9, 30), 30),
        T('hot', 'Roast turkey at 400°F', at(0, 10), 45, 'oven', 400),
        T('cook', 'Roast turkey at 325°F (check temp)', at(0, 10, 45), 165, 'oven', 325),
        T('rest', 'Rest turkey, remove cheesecloth', at(0, 13, 30), 20),
        T('carve', 'Remove stuffing & carve', at(0, 13, 50), 10),
      ],
    },
  ],

  brine: [
    {
      title: '"Good Eats" Turkey Brine', badge: 'Family recipe',
      description: 'The family brine for a 14–16 lb bird. Make Tuesday, turkey goes in Wednesday night.',
      serves: '1 turkey', prep: 15, cook: 15, eq: 'stove', temp: null,
      ing: [I(1, 'cup', 'kosher salt'), I(0.5, 'cup', 'light brown sugar'), I(1, 'gallon', 'vegetable stock'), I(1, 'tbsp', 'black peppercorns'), I(0.5, 'tbsp', 'allspice berries'), I(0.5, 'tbsp', 'candied ginger, chopped'), I(1, 'gallon', 'iced water')],
      steps: [
        'Combine all brine ingredients except the ice water in a stockpot and bring to a boil.',
        'Stir to dissolve solids, remove from heat, cool to room temp, then refrigerate until thoroughly chilled.',
        'Night before: wash the thawed turkey, pat dry, remove giblets (save for stock!). Place breast-side down in a container big enough to submerge it — make sure it fits in the fridge.',
        'Combine brine and ice water, pour over turkey, cover and refrigerate at least 6 hours, turning once halfway.',
      ],
      tasks: [
        T('make', 'Make brine — boil, dissolve, cool & chill', at(-2, 18), 30, 'stove'),
        T('in', 'Turkey into the brine (save giblets for stock)', at(-1, 18), 20, 'fridge'),
        T('turn', 'Flip the turkey in the brine', at(-1, 22), 5, 'fridge'),
      ],
    },
    {
      title: 'Apple Cider Brine', badge: 'Sweet & tangy',
      description: 'Cider, orange and rosemary give a subtly sweet, juicy bird.',
      serves: '1 turkey', prep: 15, cook: 10, eq: 'stove', temp: null,
      ing: [I(0.5, 'gallon', 'apple cider'), I(1, 'cup', 'kosher salt'), I(0.5, 'cup', 'brown sugar'), I(2, '', 'oranges, quartered'), I(4, 'sprigs', 'fresh rosemary'), I(1, 'tbsp', 'black peppercorns'), I(1.5, 'gallon', 'iced water')],
      steps: [
        'Warm cider with salt and sugar just until dissolved. Add oranges, rosemary, peppercorns. Cool and chill.',
        'Add ice water, submerge the turkey, refrigerate 12–18 hours, flipping once.',
        'Rinse and pat very dry before cooking.',
      ],
      tasks: [
        T('make', 'Make cider brine & chill', at(-2, 18), 25, 'stove'),
        T('in', 'Turkey into the brine (save giblets for stock)', at(-1, 18), 20, 'fridge'),
        T('turn', 'Flip the turkey in the brine', at(-1, 22), 5, 'fridge'),
      ],
    },
    {
      title: 'Dry Brine (No Bucket)', badge: 'Easiest',
      description: 'Salt rub that sits uncovered in the fridge. No sloshing buckets, extra-crispy skin — great for the fryer.',
      serves: '1 turkey', prep: 15, cook: 0, eq: 'fridge', temp: null,
      ing: [I(0.33, 'cup', 'kosher salt'), I(1, 'tbsp', 'brown sugar'), I(1, 'tbsp', 'black pepper'), I(1, 'tbsp', 'dried thyme')],
      steps: [
        'Pat the thawed turkey dry and remove giblets.',
        'Mix salt, sugar, pepper and thyme. Rub all over and under the skin (about 1 tbsp salt per 4 lb).',
        'Refrigerate uncovered on a rack 24–48 hours. Do NOT rinse — just pat dry before cooking.',
      ],
      tasks: [
        T('in', 'Dry-brine rub on turkey, fridge uncovered', at(-2, 18), 20, 'fridge'),
      ],
    },
  ],

  stock: [
    {
      title: 'Giblet Turkey Stock', badge: 'Family recipe',
      description: 'The family recipe: giblets simmered with chicken stock and aromatics, reduced. Used for gravy and dressing.',
      serves: '≈ 2 cups rich stock', prep: 10, cook: 90, eq: 'stove', temp: null,
      ing: [I(8, 'cup', 'chicken stock'), I(1, '', 'onion, chopped'), I(1, '', 'carrot, chopped'), I(6, '', 'parsley stems'), I(0.25, 'tsp', 'dried thyme'), I(1, '', 'bay leaf')],
      steps: [
        'Place turkey neck, gizzard and heart in a saucepan with chicken stock, onion, carrot, parsley stems, thyme and bay leaf.',
        'Simmer over low heat until reduced by three-quarters, about 1½ hours.',
        'Strain and refrigerate.',
      ],
      tasks: [
        T('simmer', 'Simmer giblet stock (reduce by ¾)', at(-1, 18, 30), 90, 'stove'),
        T('strain', 'Strain stock & refrigerate', at(-1, 20), 10, 'fridge'),
      ],
    },
    {
      title: 'Roasted Turkey Wing Stock', badge: 'Richest flavor',
      description: 'Roasted wings make a deep, dark stock — extra handy since the oil-less fryer makes few drippings.',
      serves: '≈ 8 cups', prep: 15, cook: 225, eq: 'oven', temp: 425,
      ing: [I(3, 'lb', 'turkey wings'), I(2, '', 'onion, chopped'), I(2, '', 'carrot, chopped'), I(2, 'stalks', 'celery'), I(12, 'cup', 'water'), I(1, '', 'bay leaf'), I(4, 'sprigs', 'fresh thyme')],
      steps: [
        'Roast wings, onion and carrot at 425°F for 45 minutes until deep brown.',
        'Move everything to a stockpot with celery, water, bay and thyme. Scrape pan bits in too.',
        'Simmer gently 3 hours. Strain, cool and refrigerate.',
      ],
      tasks: [
        T('roast', 'Roast turkey wings for stock', at(-1, 9), 45, 'oven', 425),
        T('simmer', 'Simmer wing stock', at(-1, 9, 50), 180, 'stove'),
        T('strain', 'Strain stock & refrigerate', at(-1, 12, 50), 10, 'fridge'),
      ],
    },
    {
      title: 'Quick Doctored Store-Bought Stock', badge: '30 minutes',
      description: 'Boxed stock simmered with aromatics and butter — fast and nearly as good.',
      serves: '≈ 7 cups', prep: 5, cook: 30, eq: 'stove', temp: null,
      ing: [I(8, 'cup', 'chicken stock'), I(1, '', 'onion, chopped'), I(1, 'stalks', 'celery'), I(1, '', 'carrot, chopped'), I(2, 'tbsp', 'butter'), I(4, 'sprigs', 'fresh thyme')],
      steps: [
        'Brown onion, celery and carrot in butter 5 minutes.',
        'Add stock (and giblets if you have them) and thyme. Simmer 30 minutes. Strain and chill.',
      ],
      tasks: [
        T('simmer', 'Simmer quick stock', at(-1, 18, 30), 35, 'stove'),
        T('strain', 'Strain stock & refrigerate', at(-1, 19, 5), 10, 'fridge'),
      ],
    },
  ],

  gravy: [
    {
      title: 'Pan Drippings Gravy', badge: 'Family recipe',
      description: 'The family method: drippings whisked with flour, cornstarch and turkey stock. Scaled up for 9; add butter if the fryer tray is light on drippings.',
      serves: '9', prep: 5, cook: 15, eq: 'stove', temp: null,
      ing: [I(4, 'tbsp', 'turkey drippings or butter'), I(2, 'tbsp', 'flour'), I(2, 'tsp', 'cornstarch'), I(3, 'cup', 'turkey stock'), I(null, '', 'salt'), I(null, '', 'pepper')],
      steps: [
        'Pour drippings into a container. In the hot pan, whisk fat/drippings with flour, cornstarch and ½ cup stock — whisk constantly.',
        'Add the remaining stock and stir until thickened, about 2 minutes.',
        'Keep stirring 1 more minute to your desired consistency. Season.',
      ],
      tasks: [T('make', 'Make gravy (whisk drippings + stock)', at(0, 13, 35), 15, 'stove')],
    },
    {
      title: 'Make-Ahead Butter Gravy', badge: 'Stress-free',
      description: 'Made Wednesday from stock, reheated Thursday — no last-minute whisking. Stir in any fryer drippings at the end.',
      serves: '10–12', prep: 5, cook: 25, eq: 'stove', temp: null,
      ing: [I(0.5, 'cup', 'butter'), I(0.5, 'cup', 'flour'), I(6, 'cup', 'turkey stock'), I(1, 'tsp', 'dried thyme'), I(null, '', 'salt'), I(null, '', 'pepper')],
      steps: [
        'Melt butter, whisk in flour and cook 3 minutes until golden.',
        'Slowly whisk in stock. Add thyme and simmer 10 minutes until thick. Season, cool and refrigerate.',
        'Thursday: reheat over medium, whisking in any turkey drippings.',
      ],
      tasks: [
        T('make', 'Make gravy ahead', at(-1, 20, 15), 25, 'stove'),
        T('reheat', 'Reheat gravy + add drippings', at(0, 13, 40), 15, 'stove'),
      ],
    },
    {
      title: 'Mushroom Herb Gravy', badge: 'Extra savory',
      description: 'Browned mushrooms and shallots with a splash of cream.',
      serves: '9', prep: 10, cook: 20, eq: 'stove', temp: null,
      ing: [I(8, 'oz', 'cremini mushrooms, sliced'), I(2, '', 'shallots, minced'), I(4, 'tbsp', 'butter'), I(0.25, 'cup', 'flour'), I(4, 'cup', 'turkey stock'), I(2, 'tsp', 'fresh thyme, chopped'), I(0.25, 'cup', 'heavy cream')],
      steps: [
        'Brown mushrooms in butter 6–8 minutes. Add shallots for 2 minutes.',
        'Sprinkle in flour, stir 1 minute, then whisk in stock. Simmer until thick.',
        'Stir in thyme, cream and any drippings. Season.',
      ],
      tasks: [
        T('prep', 'Slice mushrooms & shallots', at(0, 12, 30), 15),
        T('make', 'Make mushroom gravy', at(0, 13, 25), 25, 'stove'),
      ],
    },
  ],

  stuffing: [
    {
      title: 'Apple Pecan Dressing', badge: 'Family recipe',
      description: 'The family dressing from the sheet. Fills a 1½-qt casserole — double it if you want leftovers for 9.',
      serves: '6–8', prep: 20, cook: 30, eq: 'oven', temp: 350,
      ing: [I(1.5, 'cup', 'turkey stock'), I(0.75, 'cup', 'celery, chopped'), I(0.75, 'cup', 'onion, chopped'), I(6, 'tbsp', 'butter'), I(0.75, 'tsp', 'salt'), I(6, 'cup', 'stuffing bread cubes'), I(3, 'cup', 'apples, finely chopped'), I(0.75, 'cup', 'pecans, chopped'), I(1.5, 'tsp', 'ground sage'), I(0.5, 'tsp', 'ground cinnamon'), I(0.125, 'tsp', 'pepper')],
      steps: [
        'In a small saucepan combine stock, celery, onion, butter and salt. Bring to a boil, reduce heat, cover and simmer until vegetables are tender (5–7 min).',
        'In a large bowl combine bread cubes, apples, pecans, sage, cinnamon and pepper.',
        'Pour broth and vegetables over the bread cubes and gently stir to moisten.',
        'Spoon into a greased 1½-qt casserole. Bake covered at 350°F for 25–30 minutes.',
      ],
      tasks: [
        T('prep', 'Make dressing: simmer veg, chop apples, mix', at(0, 11, 30), 25, 'stove'),
        T('bake', 'Bake dressing (covered)', at(0, 12, 45), 30, 'oven', 350),
      ],
    },
    {
      title: 'Classic Sage & Onion Stuffing', badge: 'Crowd-size',
      description: 'Buttery, herby, crispy on top — a big 9×13 pan for the whole crew.',
      serves: '10–12', prep: 25, cook: 45, eq: 'oven', temp: 350,
      ing: [I(12, 'cup', 'stuffing bread cubes'), I(1, 'cup', 'butter'), I(2, '', 'onion, chopped'), I(4, 'stalks', 'celery'), I(2, 'tbsp', 'fresh sage, chopped'), I(1, 'tbsp', 'fresh thyme, chopped'), I(3, 'cup', 'chicken stock'), I(2, '', 'eggs'), I(1, 'tsp', 'salt'), I(1, 'tsp', 'pepper')],
      steps: [
        'Melt butter and cook onion and celery until soft, 8–10 minutes. Stir in herbs.',
        'Toss with bread cubes. Whisk stock with eggs, salt and pepper; pour over and toss.',
        'Spread in a buttered 9×13. Bake at 350°F covered 30 minutes, uncovered 15 more until golden.',
      ],
      tasks: [
        T('prep', 'Make stuffing: cook veg, toss with bread', at(0, 11, 30), 25, 'stove'),
        T('bake', 'Bake stuffing', at(0, 12, 30), 45, 'oven', 350),
      ],
    },
    {
      title: 'Sausage Cornbread Stuffing', badge: 'Southern style',
      description: 'Jiffy cornbread baked Wednesday, then mixed with sausage, celery and onion.',
      serves: '10–12', prep: 30, cook: 40, eq: 'oven', temp: 350,
      ing: [I(2, 'boxes', 'Jiffy corn muffin mix'), I(1, 'lb', 'breakfast sausage'), I(1, '', 'onion, chopped'), I(3, 'stalks', 'celery'), I(4, 'cup', 'stuffing bread cubes'), I(2.5, 'cup', 'chicken stock'), I(3, '', 'eggs'), I(4, 'tbsp', 'butter'), I(1, 'tbsp', 'ground sage')],
      steps: [
        'Wednesday: bake the Jiffy cornbread per box (uses 2 of the eggs + milk), cool, crumble, leave out to dry.',
        'Thursday: brown sausage, then cook onion and celery in the fat with butter.',
        'Combine cornbread, bread cubes, sausage mix and sage. Stir in stock and 1 egg.',
        'Bake in a buttered 9×13 at 350°F for 40 minutes.',
      ],
      tasks: [
        T('cornbread', 'Bake Jiffy cornbread for stuffing', at(-1, 16), 20, 'oven', 400),
        T('prep', 'Brown sausage, mix stuffing', at(0, 11, 30), 30, 'stove'),
        T('bake', 'Bake cornbread stuffing', at(0, 12, 40), 40, 'oven', 350),
      ],
    },
  ],

  mashed: [
    {
      title: 'Classic Buttery Mashed Potatoes', badge: 'Classic',
      description: 'Yukon Golds, lots of butter and warm milk. Simple and perfect.',
      serves: '10', prep: 30, cook: 35, eq: 'stove', temp: null,
      ing: [I(5, 'lb', 'Yukon Gold potatoes'), I(1, 'cup', 'butter'), I(1.5, 'cup', 'whole milk'), I(2, 'tsp', 'salt'), I(1, 'tsp', 'pepper')],
      steps: [
        'Peel and cut potatoes into 2-inch chunks. Cover with cold salted water.',
        'Bring to a boil and cook until fork-tender, 18–22 minutes. Drain well.',
        'Warm milk and butter together. Mash potatoes, stir in the warm mixture, season. Keep covered on low.',
      ],
      tasks: [
        T('peel', 'Peel & cube potatoes', at(0, 11, 30), 30),
        T('boil', 'Boil potatoes', at(0, 12, 45), 25, 'stove'),
        T('mash', 'Mash potatoes', at(0, 13, 10), 15, 'stove'),
      ],
    },
    {
      title: 'Garlic Sour Cream Mashed Potatoes', badge: 'Tangy',
      description: 'Garlic simmered right in the pot, finished with sour cream and chives.',
      serves: '10', prep: 30, cook: 35, eq: 'stove', temp: null,
      ing: [I(5, 'lb', 'Yukon Gold potatoes'), I(6, 'cloves', 'garlic'), I(1, 'cup', 'sour cream'), I(0.5, 'cup', 'butter'), I(0.5, 'cup', 'whole milk'), I(2, 'tbsp', 'fresh chives'), I(2, 'tsp', 'salt')],
      steps: [
        'Peel and cube potatoes. Boil with the peeled garlic cloves until tender. Drain.',
        'Mash with butter and milk, then fold in sour cream, chives and salt.',
      ],
      tasks: [
        T('peel', 'Peel & cube potatoes', at(0, 11, 30), 30),
        T('boil', 'Boil potatoes + garlic', at(0, 12, 45), 25, 'stove'),
        T('mash', 'Mash potatoes with sour cream', at(0, 13, 10), 15, 'stove'),
      ],
    },
    {
      title: 'Make-Ahead Cream Cheese Mashed Potatoes', badge: 'Make ahead',
      description: 'Mash Wednesday, bake Thursday — frees up the stovetop when it matters most.',
      serves: '10–12', prep: 40, cook: 35, eq: 'oven', temp: 350,
      ing: [I(5, 'lb', 'russet potatoes'), I(8, 'oz', 'cream cheese'), I(1, 'cup', 'sour cream'), I(0.5, 'cup', 'butter'), I(0.5, 'cup', 'whole milk'), I(2, 'tsp', 'salt'), I(1, 'tsp', 'garlic powder')],
      steps: [
        'Wednesday: peel, boil and drain potatoes. Mash with everything except half the butter.',
        'Spread in a buttered casserole, dot with butter, cover and refrigerate.',
        'Thursday: bake covered at 350°F for 30–35 minutes until hot.',
      ],
      tasks: [
        T('make', 'Peel, boil & mash potatoes ahead', at(-1, 11), 60, 'stove'),
        T('bake', 'Bake make-ahead mashed potatoes', at(0, 12, 45), 35, 'oven', 350),
      ],
    },
  ],

  corn: [
    {
      title: 'Jiffy Corn Soufflé', badge: 'Family recipe',
      description: 'The family recipe, at the 1.5× batch the sheet shops for (3 cans, 3 boxes, 6 eggs, 24 oz sour cream).',
      serves: '12–14', prep: 5, cook: 45, eq: 'oven', temp: 350,
      ing: [I(0.75, 'cup', 'butter'), I(3, 'cans', 'cream style corn'), I(3, 'boxes', 'Jiffy corn muffin mix'), I(6, '', 'eggs'), I(24, 'oz', 'sour cream')],
      steps: [
        'Preheat oven to 350°F. While it heats, melt the butter in the bottom of a casserole dish.',
        'In a large bowl combine corn, muffin mix, eggs and sour cream until fully incorporated.',
        'Pour batter into the dish with melted butter — the butter rises up around the batter.',
        'Bake 35–45 minutes: less for pudding-like, more for cake-like.',
      ],
      tasks: [
        T('mix', 'Mix corn soufflé (melt butter in dish)', at(0, 12, 0), 10),
        T('bake', 'Bake corn soufflé', at(0, 12, 15), 45, 'oven', 350),
      ],
    },
    {
      title: 'From-Scratch Corn Pudding', badge: 'No box mix',
      description: 'Custardy sweet corn pudding with cream and eggs.',
      serves: '10', prep: 15, cook: 50, eq: 'oven', temp: 350,
      ing: [I(6, 'cup', 'frozen corn, thawed'), I(5, '', 'eggs'), I(2, 'cup', 'heavy cream'), I(0.33, 'cup', 'sugar'), I(0.25, 'cup', 'flour'), I(4, 'tbsp', 'butter'), I(1, 'tsp', 'salt')],
      steps: [
        'Melt butter. Blend half the corn with eggs, cream, sugar, flour and salt until smooth.',
        'Stir in remaining corn and butter. Pour into a buttered 9×13.',
        'Bake at 350°F 45–50 minutes until just set in the center.',
      ],
      tasks: [
        T('mix', 'Mix corn pudding', at(0, 11, 50), 15),
        T('bake', 'Bake corn pudding', at(0, 12, 10), 50, 'oven', 350),
      ],
    },
    {
      title: 'Cheddar Jalapeño Corn Casserole', badge: 'Cheesy kick',
      description: 'The Jiffy classic with sharp cheddar and a little jalapeño.',
      serves: '10–12', prep: 10, cook: 45, eq: 'oven', temp: 350,
      ing: [I(2, 'cans', 'cream style corn'), I(1, 'cans', 'whole kernel corn, drained'), I(2, 'boxes', 'Jiffy corn muffin mix'), I(16, 'oz', 'sour cream'), I(0.5, 'cup', 'butter'), I(2, 'cup', 'shredded cheddar'), I(1, '', 'jalapeño, minced')],
      steps: [
        'Melt butter. Mix all ingredients except 1 cup cheese.',
        'Pour into a buttered 9×13, top with remaining cheese.',
        'Bake at 350°F about 45 minutes until golden and set.',
      ],
      tasks: [
        T('mix', 'Mix cheddar corn casserole', at(0, 12), 10),
        T('bake', 'Bake corn casserole', at(0, 12, 15), 45, 'oven', 350),
      ],
    },
  ],

  greenbean: [
    {
      title: 'Classic Green Bean Casserole', badge: 'Classic',
      description: 'Cream of mushroom, French\'s onions — the one everybody expects.',
      serves: '10', prep: 15, cook: 35, eq: 'oven', temp: 350,
      ing: [I(2, 'lb', 'green beans, trimmed & blanched (or 4 cans)'), I(2, 'cans', 'cream of mushroom soup'), I(1, 'cup', 'whole milk'), I(2, 'tsp', 'soy sauce'), I(0.5, 'tsp', 'pepper'), I(2.67, 'cup', "French's fried onions")],
      steps: [
        'Mix soup, milk, soy sauce and pepper. Stir in beans and 1⅓ cups onions.',
        'Bake in a 3-qt dish at 350°F for 30 minutes. Stir.',
        'Top with remaining onions and bake 5 minutes more.',
      ],
      tasks: [
        T('prep', 'Assemble green bean casserole', at(0, 12, 15), 15),
        T('bake', 'Bake green bean casserole', at(0, 12, 40), 35, 'oven', 350),
      ],
    },
    {
      title: 'From-Scratch Mushroom Green Bean Casserole', badge: 'Upgraded',
      description: 'Fresh beans in a real mushroom cream sauce, still topped with French\'s onions.',
      serves: '10', prep: 30, cook: 25, eq: 'oven', temp: 350,
      ing: [I(2, 'lb', 'green beans, trimmed'), I(12, 'oz', 'cremini mushrooms, sliced'), I(4, 'tbsp', 'butter'), I(3, 'cloves', 'garlic'), I(0.25, 'cup', 'flour'), I(1, 'cup', 'chicken stock'), I(1, 'cup', 'heavy cream'), I(2.67, 'cup', "French's fried onions")],
      steps: [
        'Blanch beans 5 minutes in salted water, then ice bath.',
        'Brown mushrooms in butter with garlic. Stir in flour, then stock and cream; simmer until thick.',
        'Fold in beans, top with onions, bake at 350°F 25 minutes.',
      ],
      tasks: [
        T('prep', 'Blanch beans & make mushroom sauce', at(0, 11, 45), 30, 'stove'),
        T('bake', 'Bake green bean casserole', at(0, 12, 45), 25, 'oven', 350),
      ],
    },
    {
      title: 'Garlic Lemon Green Beans with Almonds', badge: 'Light & fresh',
      description: 'Quick stovetop beans — zero oven space needed.',
      serves: '10', prep: 10, cook: 12, eq: 'stove', temp: null,
      ing: [I(2.5, 'lb', 'green beans, trimmed'), I(3, 'tbsp', 'olive oil'), I(3, 'cloves', 'garlic'), I(1, '', 'lemons'), I(0.5, 'cup', 'sliced almonds, toasted'), I(1, 'tsp', 'salt')],
      steps: [
        'Blanch beans 4 minutes, drain.',
        'Sauté garlic in olive oil 1 minute, add beans and toss 3–4 minutes.',
        'Finish with lemon zest + juice, salt and almonds.',
      ],
      tasks: [
        T('prep', 'Trim green beans', at(0, 11), 15),
        T('cook', 'Blanch & sauté green beans', at(0, 13, 35), 15, 'stove'),
      ],
    },
  ],

  carrots: [
    {
      title: 'Honey-Thyme Roasted Carrots & Parsnips', badge: 'Classic',
      description: 'Sweet, caramelized roots with honey and thyme.',
      serves: '10', prep: 20, cook: 35, eq: 'oven', temp: 400,
      ing: [I(2, 'lb', 'carrots'), I(2, 'lb', 'parsnips'), I(3, 'tbsp', 'olive oil'), I(3, 'tbsp', 'honey'), I(1, 'tbsp', 'fresh thyme'), I(1, 'tsp', 'salt')],
      steps: [
        'Peel carrots and parsnips; cut into even sticks.',
        'Toss with oil, salt and thyme. Roast at 400°F 30–35 minutes, flipping once.',
        'Drizzle with honey for the last 5 minutes.',
      ],
      tasks: [
        T('prep', 'Peel & cut carrots and parsnips', at(0, 11), 20),
        T('roast', 'Roast carrots & parsnips', at(0, 13, 20), 35, 'oven', 400),
      ],
    },
    {
      title: 'Brown Sugar Glazed Carrots & Parsnips', badge: 'Stovetop',
      description: 'Glazed in a skillet — keeps the oven free.',
      serves: '10', prep: 20, cook: 20, eq: 'stove', temp: null,
      ing: [I(2, 'lb', 'carrots'), I(2, 'lb', 'parsnips'), I(4, 'tbsp', 'butter'), I(0.33, 'cup', 'brown sugar'), I(0.5, 'cup', 'water'), I(0.5, 'tsp', 'salt'), I(1, 'tbsp', 'fresh parsley')],
      steps: [
        'Cut peeled carrots and parsnips into coins.',
        'Simmer covered with water, butter and salt 10 minutes.',
        'Uncover, add brown sugar and cook until glazed, 8–10 minutes. Top with parsley.',
      ],
      tasks: [
        T('prep', 'Peel & slice carrots and parsnips', at(0, 11), 20),
        T('cook', 'Glaze carrots & parsnips', at(0, 13, 30), 25, 'stove'),
      ],
    },
    {
      title: 'Maple Dijon Roasted Carrots & Parsnips', badge: 'Tangy-sweet',
      description: 'Maple syrup and Dijon, roasted hot for crispy edges.',
      serves: '10', prep: 20, cook: 30, eq: 'oven', temp: 425,
      ing: [I(2, 'lb', 'carrots'), I(2, 'lb', 'parsnips'), I(3, 'tbsp', 'olive oil'), I(3, 'tbsp', 'maple syrup'), I(1, 'tbsp', 'Dijon mustard'), I(1, 'tsp', 'salt')],
      steps: [
        'Whisk oil, maple and Dijon. Toss with cut carrots and parsnips and salt.',
        'Roast at 425°F 25–30 minutes until browned.',
      ],
      tasks: [
        T('prep', 'Peel & cut carrots and parsnips', at(0, 11), 20),
        T('roast', 'Roast maple Dijon carrots', at(0, 13, 25), 30, 'oven', 425),
      ],
    },
  ],

  brussels: [
    {
      title: 'Lemon Parmesan Roasted Brussels Sprouts', badge: 'Crispy',
      description: 'Roasted until crispy, finished with lemon and Parmesan.',
      serves: '10', prep: 20, cook: 25, eq: 'oven', temp: 400,
      ing: [I(3, 'lb', 'brussel sprouts'), I(0.25, 'cup', 'olive oil'), I(1, '', 'lemons'), I(0.5, 'cup', 'grated Parmesan'), I(1, 'tsp', 'salt'), I(0.5, 'tsp', 'pepper')],
      steps: [
        'Trim and halve sprouts. Toss with oil, salt and pepper.',
        'Roast cut-side down at 400°F 20–25 minutes until deeply browned.',
        'Toss with lemon zest, juice and Parmesan.',
      ],
      tasks: [
        T('prep', 'Trim & halve Brussels sprouts', at(0, 11, 15), 20),
        T('roast', 'Roast Brussels sprouts', at(0, 13, 25), 25, 'oven', 400),
      ],
    },
    {
      title: 'Bacon Balsamic Brussels Sprouts', badge: 'Bacon!',
      description: 'Roasted with bacon, finished with balsamic glaze.',
      serves: '10', prep: 20, cook: 30, eq: 'oven', temp: 400,
      ing: [I(3, 'lb', 'brussel sprouts'), I(8, 'oz', 'bacon, chopped'), I(2, 'tbsp', 'olive oil'), I(3, 'tbsp', 'balsamic glaze'), I(1, 'tsp', 'salt')],
      steps: [
        'Toss halved sprouts and chopped bacon with oil and salt on a sheet pan.',
        'Roast at 400°F 25–30 minutes, stirring once.',
        'Drizzle with balsamic glaze.',
      ],
      tasks: [
        T('prep', 'Trim sprouts & chop bacon', at(0, 11, 15), 20),
        T('roast', 'Roast bacon Brussels sprouts', at(0, 13, 20), 30, 'oven', 400),
      ],
    },
    {
      title: 'Shaved Brussels Sprout Salad', badge: 'No cooking',
      description: 'Bright, crunchy salad with apples, pecans and Parmesan — no oven or stove.',
      serves: '10', prep: 25, cook: 0, eq: 'counter', temp: null,
      ing: [I(2, 'lb', 'brussel sprouts'), I(2, '', 'apples'), I(0.75, 'cup', 'pecans, toasted'), I(0.5, 'cup', 'grated Parmesan'), I(0.33, 'cup', 'olive oil'), I(2, '', 'lemons'), I(1, 'tsp', 'Dijon mustard'), I(1, 'tsp', 'honey')],
      steps: [
        'Thinly shave sprouts (food processor slicer works great). Thinly slice apples.',
        'Whisk oil, lemon juice, Dijon, honey, salt and pepper.',
        'Toss everything right before serving.',
      ],
      tasks: [
        T('prep', 'Shave sprouts & make dressing', at(0, 12, 30), 25),
        T('toss', 'Toss Brussels salad', at(0, 13, 50), 5),
      ],
    },
  ],

  sweetpotato: [
    {
      title: 'Pecan Streusel Sweet Potato Casserole', badge: 'Classic',
      description: 'Silky sweet potatoes under a crunchy brown sugar pecan crumble. Filling made Wednesday.',
      serves: '10–12', prep: 30, cook: 35, eq: 'oven', temp: 350,
      ing: [I(4, 'lb', 'sweet potatoes'), I(0.5, 'cup', 'butter'), I(0.5, 'cup', 'brown sugar'), I(2, '', 'eggs'), I(0.5, 'cup', 'whole milk'), I(1, 'tsp', 'vanilla'), I(1, 'cup', 'pecans, chopped'), I(0.33, 'cup', 'flour')],
      steps: [
        'Wednesday: peel, cube and boil sweet potatoes until tender, 15–20 minutes. Mash with half the butter, ¼ cup brown sugar, eggs, milk and vanilla. Spread in a 9×13, cover, chill.',
        'Mix pecans, flour, remaining butter and sugar into a crumble; store separately.',
        'Thursday: top with crumble and bake at 350°F 30–35 minutes.',
      ],
      tasks: [
        T('make', 'Boil & mash sweet potato filling', at(-1, 12), 45, 'stove'),
        T('bake', 'Bake sweet potato casserole', at(0, 12, 15), 35, 'oven', 350),
      ],
    },
    {
      title: 'Marshmallow Sweet Potato Casserole', badge: 'Kid favorite',
      description: 'Toasty marshmallow top — pure nostalgia.',
      serves: '10–12', prep: 30, cook: 30, eq: 'oven', temp: 350,
      ing: [I(4, 'lb', 'sweet potatoes'), I(0.33, 'cup', 'butter'), I(0.33, 'cup', 'brown sugar'), I(0.5, 'cup', 'whole milk'), I(1, 'tsp', 'ground cinnamon'), I(10, 'oz', 'mini marshmallows')],
      steps: [
        'Wednesday: boil and mash sweet potatoes with butter, sugar, milk and cinnamon. Spread in a 9×13, chill.',
        'Thursday: bake at 350°F 20 minutes, top with marshmallows and bake 8–10 more until toasted.',
      ],
      tasks: [
        T('make', 'Boil & mash sweet potatoes', at(-1, 12), 45, 'stove'),
        T('bake', 'Bake sweet potatoes + marshmallows', at(0, 12, 20), 30, 'oven', 350),
      ],
    },
    {
      title: 'Maple Roasted Sweet Potatoes', badge: 'Simple',
      description: 'Cubes roasted with maple, cinnamon and a pinch of cayenne.',
      serves: '10', prep: 20, cook: 35, eq: 'oven', temp: 400,
      ing: [I(4, 'lb', 'sweet potatoes'), I(3, 'tbsp', 'olive oil'), I(3, 'tbsp', 'maple syrup'), I(1, 'tsp', 'ground cinnamon'), I(0.25, 'tsp', 'cayenne pepper'), I(1, 'tsp', 'salt')],
      steps: [
        'Peel and cube sweet potatoes. Toss with oil, salt, cinnamon and cayenne.',
        'Roast at 400°F 30–35 minutes, tossing with maple syrup for the last 10.',
      ],
      tasks: [
        T('prep', 'Peel & cube sweet potatoes', at(0, 11, 30), 20),
        T('roast', 'Roast sweet potatoes', at(0, 13, 20), 35, 'oven', 400),
      ],
    },
  ],

  peas: [
    {
      title: 'Buttered Peas with Mint', badge: '10 minutes',
      description: 'Sweet peas, butter and a little fresh mint.',
      serves: '10', prep: 2, cook: 8, eq: 'stove', temp: null,
      ing: [I(2, 'lb', 'frozen peas'), I(3, 'tbsp', 'butter'), I(2, 'tbsp', 'fresh mint, chopped'), I(0.5, 'tsp', 'salt')],
      steps: ['Simmer peas in a little salted water 4–5 minutes. Drain.', 'Toss with butter, mint and salt.'],
      tasks: [T('cook', 'Cook buttered peas', at(0, 13, 45), 10, 'stove')],
    },
    {
      title: 'Creamed Peas & Pearl Onions', badge: 'Old-fashioned',
      description: 'Peas and pearl onions in a light cream sauce.',
      serves: '10', prep: 5, cook: 15, eq: 'stove', temp: null,
      ing: [I(2, 'lb', 'frozen peas'), I(1, 'lb', 'frozen pearl onions'), I(3, 'tbsp', 'butter'), I(2, 'tbsp', 'flour'), I(1.5, 'cup', 'whole milk'), I(0.5, 'tsp', 'salt')],
      steps: ['Cook pearl onions in butter 5 minutes.', 'Stir in flour, then milk; simmer until thick.', 'Add peas and heat through 5 minutes.'],
      tasks: [T('cook', 'Make creamed peas & onions', at(0, 13, 35), 20, 'stove')],
    },
    {
      title: 'Peas with Bacon & Shallots', badge: 'Savory',
      description: 'Crispy bacon and sweet shallots tossed with peas.',
      serves: '10', prep: 5, cook: 15, eq: 'stove', temp: null,
      ing: [I(2, 'lb', 'frozen peas'), I(6, 'oz', 'bacon, chopped'), I(2, '', 'shallots, minced'), I(1, 'tbsp', 'butter')],
      steps: ['Crisp bacon, remove. Cook shallots in the fat 3 minutes.', 'Add peas and butter, cook 5 minutes. Top with bacon.'],
      tasks: [T('cook', 'Cook peas with bacon', at(0, 13, 35), 20, 'stove')],
    },
  ],

  cranberry: [
    {
      title: 'Cranberry Orange Relish', badge: 'Family recipe',
      description: 'The family recipe — simmer until the berries pop. Make ahead; keeps a week.',
      serves: '8', prep: 5, cook: 10, eq: 'stove', temp: null,
      ing: [I(3, 'cup', 'fresh cranberries'), I(0.5, 'cup', 'sugar'), I(2, 'tbsp', 'orange zest'), I(0.5, 'cup', 'water')],
      steps: [
        'Combine all ingredients in a saucepan and bring to a simmer over medium-low heat.',
        'Simmer, stirring occasionally, until cranberries pop, about 5 minutes.',
        'Let cool and refrigerate, covered, up to 1 week.',
      ],
      tasks: [
        T('make', 'Make cranberry relish & chill', at(-1, 10, 30), 15, 'stove'),
        T('out', 'Take cranberry relish out of the fridge', at(0, 13, 30), 2, 'fridge'),
      ],
    },
    {
      title: 'Raw Cranberry Orange Relish', badge: 'No cook',
      description: 'Food-processor relish: whole orange and fresh cranberries. Zingy and bright.',
      serves: '10', prep: 10, cook: 0, eq: 'counter', temp: null,
      ing: [I(12, 'oz', 'fresh cranberries'), I(1, '', 'orange'), I(0.75, 'cup', 'sugar')],
      steps: ['Quarter the orange (peel on, seeds out).', 'Pulse with cranberries and sugar until finely chopped.', 'Chill at least 4 hours to let flavors meld.'],
      tasks: [
        T('make', 'Pulse raw cranberry relish & chill', at(-1, 10, 30), 10),
        T('out', 'Take cranberry relish out of the fridge', at(0, 13, 30), 2, 'fridge'),
      ],
    },
    {
      title: 'Spiced Whole-Berry Cranberry Sauce', badge: 'Warm spices',
      description: 'Orange juice, cinnamon stick and cloves.',
      serves: '10', prep: 5, cook: 15, eq: 'stove', temp: null,
      ing: [I(24, 'oz', 'fresh cranberries'), I(1, 'cup', 'sugar'), I(1, 'cup', 'orange juice'), I(1, '', 'cinnamon stick'), I(3, '', 'whole cloves')],
      steps: ['Simmer everything until most berries burst, 10–12 minutes.', 'Remove spices, cool and refrigerate.'],
      tasks: [
        T('make', 'Make spiced cranberry sauce & chill', at(-1, 10, 30), 20, 'stove'),
        T('out', 'Take cranberry sauce out of the fridge', at(0, 13, 30), 2, 'fridge'),
      ],
    },
  ],

  lingonberry: [
    {
      title: 'Store-Bought Lingonberry Jam', badge: 'Zero effort',
      description: 'A good jar (IKEA or the international aisle). Just spoon into a bowl.',
      serves: '10', prep: 2, cook: 0, eq: 'counter', temp: null,
      ing: [I(2, 'jars', 'lingonberry jam')],
      steps: ['Spoon into a serving bowl.'],
      tasks: [T('out', 'Lingonberry jam into a bowl', at(0, 13, 45), 3)],
    },
    {
      title: 'Quick Homemade Lingonberry Jam', badge: 'Homemade',
      description: 'Frozen lingonberries simmered with sugar — 15 minutes.',
      serves: '10', prep: 2, cook: 15, eq: 'stove', temp: null,
      ing: [I(4, 'cup', 'frozen lingonberries'), I(1.5, 'cup', 'sugar'), I(0.25, 'cup', 'water')],
      steps: ['Simmer berries, sugar and water 10–15 minutes, stirring.', 'Cool; it thickens as it chills.'],
      tasks: [
        T('make', 'Make lingonberry jam & chill', at(-1, 11), 20, 'stove'),
        T('out', 'Lingonberry jam into a bowl', at(0, 13, 45), 3),
      ],
    },
    {
      title: 'Lingonberry Orange Sauce', badge: 'Citrusy',
      description: 'Lingonberries with orange juice and zest — a lighter, saucier take.',
      serves: '10', prep: 5, cook: 12, eq: 'stove', temp: null,
      ing: [I(3, 'cup', 'frozen lingonberries'), I(0.75, 'cup', 'sugar'), I(0.5, 'cup', 'orange juice'), I(1, 'tbsp', 'orange zest')],
      steps: ['Simmer all ingredients 10–12 minutes.', 'Cool and refrigerate.'],
      tasks: [
        T('make', 'Make lingonberry orange sauce', at(-1, 11), 15, 'stove'),
        T('out', 'Lingonberry sauce into a bowl', at(0, 13, 45), 3),
      ],
    },
  ],

  rolls: [
    {
      title: 'Brown-and-Serve Rolls', badge: 'Easiest',
      description: 'Store-bought rolls, brushed with butter and browned in the final minutes.',
      serves: '24 rolls', prep: 2, cook: 10, eq: 'oven', temp: 400,
      ing: [I(2, 'packages', 'brown-and-serve rolls (12 ct)'), I(2, 'tbsp', 'butter')],
      steps: ['Brush rolls with melted butter.', 'Bake at 400°F 8–10 minutes until golden.'],
      tasks: [T('bake', 'Bake rolls', at(0, 13, 45), 12, 'oven', 400)],
    },
    {
      title: 'Homemade Soft Dinner Rolls', badge: 'From scratch',
      description: 'Fluffy yeast rolls, baked in the morning before the oven gets busy.',
      serves: '24 rolls', prep: 40, cook: 20, eq: 'oven', temp: 375,
      ing: [I(6, 'cup', 'all-purpose flour'), I(2, 'packets', 'instant yeast'), I(0.33, 'cup', 'sugar'), I(2, 'cup', 'whole milk, warm'), I(0.5, 'cup', 'butter'), I(2, '', 'eggs'), I(2, 'tsp', 'salt')],
      steps: [
        'Mix warm milk, butter, sugar, yeast and eggs. Add flour and salt; knead 8 minutes.',
        'Rise until doubled, about 1¼ hours. Shape 24 balls in a buttered pan.',
        'Rise again 45–60 minutes. Bake at 375°F 18–20 minutes. Brush with butter.',
        'Rewarm wrapped in a towel (or 20 sec in the microwave) before dinner.',
      ],
      tasks: [
        T('mix', 'Mix & knead roll dough', at(0, 8, 30), 20),
        T('rise1', 'First rise (roll dough)', at(0, 8, 50), 75),
        T('shape', 'Shape rolls', at(0, 10, 5), 15),
        T('rise2', 'Second rise (rolls)', at(0, 10, 20), 50),
        T('bake', 'Bake rolls', at(0, 11, 10), 20, 'oven', 375),
        T('warm', 'Rewarm rolls', at(0, 13, 55), 3, 'microwave'),
      ],
    },
    {
      title: 'Rhodes Frozen Butter Rolls', badge: 'Homemade taste',
      description: 'Frozen dough rolls that rise on the counter all morning, then bake fast.',
      serves: '24 rolls', prep: 5, cook: 15, eq: 'oven', temp: 350,
      ing: [I(24, '', 'Rhodes frozen dinner rolls'), I(2, 'tbsp', 'butter')],
      steps: [
        'Arrange frozen rolls in a buttered 9×13, cover with greased plastic wrap.',
        'Rise 3–4 hours until doubled.',
        'Bake at 350°F 15–20 minutes. Brush with butter.',
      ],
      tasks: [
        T('rise', 'Set out frozen rolls to rise', at(0, 9), 210),
        T('bake', 'Bake rolls', at(0, 12, 40), 18, 'oven', 350),
      ],
    },
  ],

  eggs: [
    {
      title: 'Classic Deviled Eggs', badge: 'Classic',
      description: 'Mayo, mustard, a splash of vinegar and paprika.',
      serves: '24 halves', prep: 25, cook: 15, eq: 'stove', temp: null,
      ing: [I(12, '', 'eggs'), I(0.5, 'cup', 'mayonnaise'), I(2, 'tsp', 'yellow mustard'), I(1, 'tsp', 'white vinegar'), I(null, '', 'salt'), I(null, '', 'paprika')],
      steps: [
        'Wednesday: cover eggs with cold water, bring to a boil, cover and let stand 12 minutes. Ice bath, then refrigerate.',
        'Thursday: peel, halve, mash yolks with mayo, mustard, vinegar and salt.',
        'Pipe or spoon into whites, dust with paprika, chill until serving.',
      ],
      tasks: [
        T('boil', 'Hard-boil eggs for deviled eggs', at(-1, 12, 30), 20, 'stove'),
        T('fill', 'Peel & fill deviled eggs', at(0, 9, 30), 25),
      ],
    },
    {
      title: 'Bacon Ranch Deviled Eggs', badge: 'Fan favorite',
      description: 'Ranch seasoning in the filling and crispy bacon on top.',
      serves: '24 halves', prep: 30, cook: 15, eq: 'stove', temp: null,
      ing: [I(12, '', 'eggs'), I(0.5, 'cup', 'mayonnaise'), I(1, 'tbsp', 'ranch seasoning'), I(4, 'slices', 'bacon'), I(1, 'tbsp', 'fresh chives')],
      steps: ['Boil and chill eggs Wednesday.', 'Thursday: cook bacon crisp and crumble. Mash yolks with mayo and ranch.', 'Fill, top with bacon and chives.'],
      tasks: [
        T('boil', 'Hard-boil eggs for deviled eggs', at(-1, 12, 30), 20, 'stove'),
        T('fill', 'Crisp bacon, peel & fill deviled eggs', at(0, 9, 30), 30, 'stove'),
      ],
    },
    {
      title: 'Dill Pickle Deviled Eggs', badge: 'Tangy',
      description: 'Dill relish and a splash of pickle juice.',
      serves: '24 halves', prep: 25, cook: 15, eq: 'stove', temp: null,
      ing: [I(12, '', 'eggs'), I(0.5, 'cup', 'mayonnaise'), I(3, 'tbsp', 'dill pickle relish'), I(1, 'tbsp', 'pickle juice'), I(1, 'tsp', 'Dijon mustard'), I(null, '', 'fresh dill')],
      steps: ['Boil and chill eggs Wednesday.', 'Thursday: mash yolks with mayo, relish, pickle juice and Dijon.', 'Fill and garnish with dill.'],
      tasks: [
        T('boil', 'Hard-boil eggs for deviled eggs', at(-1, 12, 30), 20, 'stove'),
        T('fill', 'Peel & fill deviled eggs', at(0, 9, 30), 25),
      ],
    },
  ],

  pie: [
    {
      title: 'Perfect Pumpkin Pie (Eagle Brand)', badge: 'Family recipe',
      description: 'The family pumpkin pie. One pie serves 8 — consider making two. Baked Wednesday so the oven is free Thursday.',
      serves: '8 per pie', prep: 15, cook: 55, eq: 'oven', temp: 425,
      ing: [I(1, 'cans', 'pumpkin (15 oz)'), I(1, 'cans', 'sweetened condensed milk (14 oz)'), I(2, '', 'eggs'), I(1, 'tsp', 'ground cinnamon'), I(0.5, 'tsp', 'ground ginger'), I(0.5, 'tsp', 'ground nutmeg'), I(0.5, 'tsp', 'salt'), I(1, '', 'unbaked 9-inch pie crust'), I(null, '', 'whipped cream')],
      steps: [
        'Preheat oven to 425°F. Whisk pumpkin, sweetened condensed milk, eggs, spices and salt until smooth. Pour into crust.',
        'Bake 15 minutes.',
        'Reduce oven to 350°F and bake 35–40 minutes more, until a knife 1 inch from the crust comes out clean.',
        'Cool, refrigerate, and serve with whipped cream.',
      ],
      tasks: [
        T('mix', 'Mix pumpkin pie filling', at(-1, 13), 15),
        T('hot', 'Bake pie at 425°F', at(-1, 13, 15), 15, 'oven', 425),
        T('bake', 'Bake pie at 350°F (35–40 min)', at(-1, 13, 30), 40, 'oven', 350),
      ],
    },
    {
      title: 'Classic Pecan Pie', badge: 'Rich',
      description: 'Gooey brown sugar filling, loaded with pecans.',
      serves: '8', prep: 15, cook: 55, eq: 'oven', temp: 350,
      ing: [I(1, '', 'unbaked 9-inch pie crust'), I(1, 'cup', 'light corn syrup'), I(1, 'cup', 'brown sugar'), I(3, '', 'eggs'), I(0.33, 'cup', 'butter'), I(1, 'tsp', 'vanilla'), I(2, 'cup', 'pecan halves')],
      steps: ['Whisk corn syrup, sugar, eggs, melted butter and vanilla.', 'Stir in pecans, pour into crust.', 'Bake at 350°F 50–55 minutes until just set. Cool completely.'],
      tasks: [
        T('mix', 'Mix pecan pie filling', at(-1, 13), 15),
        T('bake', 'Bake pecan pie', at(-1, 13, 15), 55, 'oven', 350),
      ],
    },
    {
      title: 'Dutch Apple Crumb Pie', badge: 'Crumb top',
      description: 'Cinnamon apples under a buttery brown sugar crumble.',
      serves: '8', prep: 30, cook: 50, eq: 'oven', temp: 375,
      ing: [I(1, '', 'unbaked 9-inch pie crust'), I(6, '', 'apples'), I(0.5, 'cup', 'sugar'), I(1, 'tsp', 'ground cinnamon'), I(1, 'tbsp', 'lemon juice'), I(0.75, 'cup', 'flour'), I(0.5, 'cup', 'brown sugar'), I(0.5, 'cup', 'butter')],
      steps: ['Peel and slice apples; toss with sugar, cinnamon, lemon and 2 tbsp flour. Fill crust.', 'Rub remaining flour, brown sugar and cold butter into crumbs; scatter on top.', 'Bake at 375°F 45–50 minutes until bubbling. Cool.'],
      tasks: [
        T('mix', 'Slice apples & make crumble', at(-1, 13), 30),
        T('bake', 'Bake apple crumb pie', at(-1, 13, 30), 50, 'oven', 375),
      ],
    },
  ],

  brownies: [
    {
      title: 'Fudgy One-Bowl Brownies', badge: 'From scratch',
      description: 'Dense, fudgy, crackly top. A 9×13 pan.',
      serves: '24 squares', prep: 15, cook: 28, eq: 'oven', temp: 350,
      ing: [I(1, 'cup', 'butter'), I(2, 'cup', 'sugar'), I(4, '', 'eggs'), I(2, 'tsp', 'vanilla'), I(0.75, 'cup', 'cocoa powder'), I(1, 'cup', 'flour'), I(0.5, 'tsp', 'salt'), I(1, 'cup', 'chocolate chips')],
      steps: ['Melt butter, whisk in sugar, then eggs and vanilla.', 'Stir in cocoa, flour and salt, then chips.', 'Bake in a lined 9×13 at 350°F 25–28 minutes. Cool before cutting.'],
      tasks: [
        T('mix', 'Mix brownie batter', at(-1, 14, 30), 15),
        T('bake', 'Bake brownies', at(-1, 14, 45), 28, 'oven', 350),
      ],
    },
    {
      title: 'Upgraded Box Brownies', badge: 'Shortcut',
      description: 'Two boxes plus espresso powder and extra chips — nobody will know.',
      serves: '24 squares', prep: 10, cook: 30, eq: 'oven', temp: 350,
      ing: [I(2, 'boxes', 'brownie mix'), I(1, 'tsp', 'espresso powder'), I(1, 'cup', 'chocolate chips'), I(null, '', 'eggs, oil & water per box')],
      steps: ['Mix per box directions, adding espresso powder.', 'Fold in chips. Bake per box in a 9×13.'],
      tasks: [
        T('mix', 'Mix brownie batter', at(-1, 14, 30), 10),
        T('bake', 'Bake brownies', at(-1, 14, 40), 30, 'oven', 350),
      ],
    },
    {
      title: 'Pumpkin Swirl Brownies', badge: 'Festive',
      description: 'Fudgy brownies swirled with spiced pumpkin cheesecake.',
      serves: '24 squares', prep: 25, cook: 35, eq: 'oven', temp: 350,
      ing: [I(1, 'boxes', 'brownie mix'), I(8, 'oz', 'cream cheese'), I(0.5, 'cup', 'pumpkin'), I(1, '', 'eggs'), I(0.25, 'cup', 'sugar'), I(1, 'tsp', 'pumpkin pie spice')],
      steps: ['Prepare brownie batter, spread in a 9×13.', 'Beat cream cheese, pumpkin, egg, sugar and spice. Dollop on top and swirl with a knife.', 'Bake at 350°F 30–35 minutes.'],
      tasks: [
        T('mix', 'Make pumpkin swirl brownie batter', at(-1, 14, 30), 25),
        T('bake', 'Bake pumpkin swirl brownies', at(-1, 14, 55), 35, 'oven', 350),
      ],
    },
  ],

  cookies: [
    {
      title: 'Brown Butter Chocolate Chip Cookies', badge: 'Crowd-pleaser',
      description: 'Nutty brown butter, gooey centers. About 3 dozen.',
      serves: '36 cookies', prep: 25, cook: 36, eq: 'oven', temp: 375,
      ing: [I(1, 'cup', 'butter'), I(1, 'cup', 'brown sugar'), I(0.5, 'cup', 'sugar'), I(2, '', 'eggs'), I(2, 'tsp', 'vanilla'), I(2.5, 'cup', 'flour'), I(1, 'tsp', 'baking soda'), I(1, 'tsp', 'salt'), I(2, 'cup', 'chocolate chips')],
      steps: ['Brown butter until nutty; cool 10 minutes.', 'Whisk with sugars, eggs, vanilla. Stir in flour, soda, salt, then chips.', 'Bake 2-tbsp scoops at 375°F 10–12 minutes, 3 batches.'],
      tasks: [
        T('mix', 'Make cookie dough', at(-1, 15, 30), 25),
        T('bake', 'Bake cookies (3 batches)', at(-1, 16), 36, 'oven', 375),
      ],
    },
    {
      title: 'Pumpkin Snickerdoodles', badge: 'Fall spice',
      description: 'Soft, cakey, rolled in cinnamon sugar.',
      serves: '30 cookies', prep: 20, cook: 30, eq: 'oven', temp: 350,
      ing: [I(0.5, 'cup', 'butter'), I(1, 'cup', 'sugar'), I(0.5, 'cup', 'pumpkin'), I(1, '', 'eggs'), I(2.25, 'cup', 'flour'), I(1, 'tsp', 'baking powder'), I(2, 'tsp', 'pumpkin pie spice'), I(2, 'tsp', 'ground cinnamon')],
      steps: ['Cream butter and ¾ cup sugar; beat in pumpkin and egg.', 'Mix in flour, baking powder and spice. Chill 30 minutes.', 'Roll balls in cinnamon + remaining sugar. Bake at 350°F 10–12 minutes.'],
      tasks: [
        T('mix', 'Make snickerdoodle dough & chill', at(-1, 15, 15), 50, 'fridge'),
        T('bake', 'Bake snickerdoodles', at(-1, 16, 5), 30, 'oven', 350),
      ],
    },
    {
      title: 'Maple Leaf Sugar Cookies', badge: 'Decorate with kids',
      description: 'Leaf-shaped cutouts with a maple glaze.',
      serves: '30 cookies', prep: 45, cook: 30, eq: 'oven', temp: 350,
      ing: [I(1, 'cup', 'butter'), I(1, 'cup', 'sugar'), I(1, '', 'eggs'), I(1, 'tsp', 'vanilla'), I(3, 'cup', 'flour'), I(1, 'tsp', 'baking powder'), I(2, 'cup', 'powdered sugar'), I(3, 'tbsp', 'maple syrup')],
      steps: ['Cream butter and sugar, add egg and vanilla, then flour and baking powder. Chill 1 hour.', 'Roll ¼ inch thick, cut leaves, bake at 350°F 8–10 minutes.', 'Glaze with powdered sugar whisked with maple syrup.'],
      tasks: [
        T('mix', 'Make sugar cookie dough & chill', at(-1, 14), 75, 'fridge'),
        T('bake', 'Cut & bake sugar cookies', at(-1, 15, 30), 30, 'oven', 350),
        T('glaze', 'Glaze & decorate cookies', at(-1, 16, 30), 30),
      ],
    },
  ],
}

export const recipes = Object.entries(recipeList).flatMap(([dishId, list]) =>
  list.map((r, i) => ({
    id: `${dishId}-${i + 1}`,
    dish_id: dishId,
    title: r.title,
    badge: r.badge ?? null,
    description: r.description ?? null,
    serves: r.serves ?? null,
    prep_min: r.prep ?? null,
    cook_min: r.cook ?? null,
    equipment: r.eq ?? null,
    temp_f: r.temp ?? null,
    ingredients: r.ing,
    steps: r.steps,
    tasks: r.tasks,
    sort: i,
  })),
)

// Chores from the sheet's countdown + day-of list that aren't tied to a recipe.
export const tasks = [
  ['thaw', 'Thaw turkey in the fridge (13.5 lb ≈ 3 days) — skip if fresh', at(-4, 10), 10, 'fridge', 'Rule of thumb: 1 day per 4–5 lb in the fridge. Do this ASAP if the bird is frozen!'],
  ['sams', 'Shop Costco', at(-4, 13), 90, 'counter'],
  ['meijer', 'Shop HEB', at(-4, 15), 60, 'counter'],
  ['china', 'Wash china', at(-3, 13), 60, 'counter'],
  ['serving', 'Get out serving dishes', at(-3, 14), 30, 'counter'],
  ['silver', 'Clean silver', at(-3, 15), 45, 'counter'],
  ['linens', 'Wash & iron table linens', at(-3, 16), 60, 'counter'],
  ['clean', 'Clean house', at(-2, 10), 180, 'counter'],
  ['sarah', 'Pick up Sarah', at(-1, 12), 60, 'counter'],
  ['applesauce', 'Make applesauce', at(-1, 15), 45, 'stove'],
  ['tea', 'Make iced tea (1 gal)', at(0, 9), 15, 'stove'],
  ['table', 'Set the table', at(0, 11), 30, 'counter'],
  ['tamales', 'Tamales — warm & set out (who is bringing?)', at(0, 13, 20), 25, 'stove'],
  ['ham', 'Honey Baked Ham — plate & set out', at(0, 13, 30), 15, 'counter'],
  ['tables', 'Butter, salt & pepper on the tables', at(0, 13, 45), 5, 'counter'],
  ['coffee', 'Make coffee for dessert', at(0, 14, 45), 10, 'counter'],
].map(([id, label, offset_min, duration_min, equipment, notes], i) => ({ id, label, offset_min, duration_min, equipment, temp_f: null, sort: i, notes: notes ?? null }))

// Non-recipe shopping from the sheet (drinks, paper goods, extras).
export const groceryExtras = [
  ['x-pepsi', 'Pepsi', '1 gal', 'Costco'],
  ['x-dietpepsi', 'Diet Pepsi', '', 'Costco'],
  ['x-fiji', 'Fiji water', '1 pack', 'Costco'],
  ['x-tea', 'Tea bags (iced tea)', '1 gal worth', 'Other'],
  ['x-coffee', 'Coffee', '', 'Other'],
  ['x-beer', 'Beer', '', 'HEB'],
  ['x-wine', 'Wine', '', 'HEB'],
  ['x-ice', 'Ice', '', 'HEB'],
  ['x-plates', 'Paper dessert plates', '', 'HEB'],
  ['x-napkins', 'Paper napkins', '', 'HEB'],
  ['x-gumbo', 'Gumbo supplies', '', 'HEB'],
  ['x-bread', 'Sandwich bread', '', 'HEB'],
  ['x-chips', "Lay's chips", '', 'HEB'],
  ['x-foil', 'Heavy-duty foil (turkey rest)', '', 'HEB'],
].map(([id, name, qty, store]) => ({ id, name, qty, store, checked: false }))
