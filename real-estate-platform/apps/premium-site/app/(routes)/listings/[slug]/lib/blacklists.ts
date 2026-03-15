export const DINING_BLACKLIST = new Set([
  'pei wei', 'applebees', "applebee's", "chili's", 'chilis', "mcdonald's", 'mcdonalds',
  "wendy's", 'wendys', 'taco bell', 'burger king', 'sonic', "jack in the box",
  "carl's jr", 'carls jr', "arby's", 'arbys', "denny's", 'dennys', 'ihop',
  "waffle house", "pizza hut", "domino's", 'dominos', "papa john's", 'papa johns',
  "little caesars", "panda express", "chipotle", "five guys", "in-n-out",
  "raising cane's", "raising canes", "wingstop", "buffalo wild wings",
  "olive garden", "red lobster", "outback steakhouse", "texas roadhouse",
  "cracker barrel", "golden corral", "bob evans", "perkins",
  "subway", "jimmy john's", "jimmy johns", "jersey mike's", "jersey mikes",
  "panera", "starbucks", "dunkin", "dutch bros",
]);

export const GROCERY_BLACKLIST = new Set([
  'circle k', 'quiktrip', 'qt', '7-eleven', '7 eleven', 'am pm', 'ampm',
  'dollar general', 'dollar tree', 'family dollar', 'five below',
  'cvs', 'walgreens', 'rite aid', 'chevron', 'shell', 'arco', 'valero',
]);

export const EXCLUDED_DINING_TYPES = new Set([
  'gas_station', 'convenience_store', 'fast_food_restaurant', 'meal_delivery', 'meal_takeaway',
]);

export const EXCLUDED_GROCERY_TYPES = new Set([
  'convenience_store', 'gas_station', 'drugstore', 'pharmacy',
]);

export const EXCLUDED_SCHOOL_TYPES = new Set([
  'gym', 'martial_arts_school', 'dance_school', 'driving_school', 'art_school',
  'music_school', 'language_school', 'tutoring_service',
]);
