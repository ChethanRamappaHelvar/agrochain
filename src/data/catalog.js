const L = (s) => s.split(",").map((x) => x.trim());

export const CATEGORIES = [
  {
    name: "Vegetables",
    icon: "🥬",
    items: L(
      "Tomato,Onion,Potato,Carrot,Cabbage,Cauliflower,Beans,Brinjal,Capsicum,Cucumber,Spinach,Beetroot,Radish,Pumpkin,Green Chilli",
    ),
  },
  {
    name: "Fruits",
    icon: "🍎",
    items: L(
      "Mango,Banana,Apple,Orange,Grapes,Watermelon,Papaya,Guava,Pomegranate,Pineapple,Sapota,Custard Apple,Muskmelon,Strawberry,Lemon",
    ),
  },
  {
    name: "Grains",
    icon: "🌾",
    items: L(
      "Rice,Wheat,Maize,Ragi,Jowar,Bajra,Barley,Millet,Brown Rice,Red Rice",
    ),
  },
  {
    name: "Pulses",
    icon: "🫘",
    items: L(
      "Toor Dal,Moong Dal,Urad Dal,Masoor Dal,Chickpeas,Green Gram,Black Gram,Horse Gram,Kidney Beans,Cowpeas",
    ),
  },
  {
    name: "Spices",
    icon: "🌶️",
    items: L(
      "Turmeric,Black Pepper,Cardamom,Chilli,Coriander,Cumin,Mustard,Fenugreek,Clove,Cinnamon",
    ),
  },
  {
    name: "Seeds",
    icon: "🌱",
    items: L(
      "Paddy Seeds,Wheat Seeds,Tomato Seeds,Chilli Seeds,Onion Seeds,Maize Seeds,Sunflower Seeds,Groundnut Seeds,Cotton Seeds,Millet Seeds",
    ),
  },
  {
    name: "Organic Products",
    icon: "🌿",
    items: L(
      "Organic Rice,Organic Wheat,Organic Tomato,Organic Onion,Organic Turmeric,Organic Honey,Organic Jaggery,Organic Millet",
    ),
  },
  {
    name: "Flowers",
    icon: "🌸",
    items: L("Rose,Jasmine,Marigold,Chrysanthemum,Lotus,Sunflower,Lily"),
  },
  {
    name: "Plantation Crops",
    icon: "☕",
    items: L("Coffee,Tea,Coconut,Arecanut,Cocoa,Rubber"),
  },
  {
    name: "Other Farm Products",
    icon: "🍯",
    items: L("Honey,Jaggery,Coconut Oil,Groundnut Oil,Dry Fruits"),
  },
];

export const FARMING_TYPES = ["Organic", "Natural", "Conventional"];
export const UNITS = ["KG", "Quintal", "Ton", "Litre", "Piece", "Dozen"];
export const BUSINESS_TYPES = [
  "Hotel",
  "Restaurant",
  "Retailer",
  "Wholesaler",
  "Exporter",
  "Agricultural Company",
];
export const STATES = [
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Telangana",
  "Kerala",
  "Maharashtra",
  "Gujarat",
  "Punjab",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Other",
];

const EMOJI = {
  tomato: "🍅",
  onion: "🧅",
  potato: "🥔",
  carrot: "🥕",
  cabbage: "🥬",
  cauliflower: "🥦",
  beans: "🫛",
  brinjal: "🍆",
  capsicum: "🫑",
  cucumber: "🥒",
  spinach: "🥬",
  beetroot: "🟣",
  radish: "🥕",
  pumpkin: "🎃",
  chilli: "🌶️",
  mango: "🥭",
  banana: "🍌",
  apple: "🍎",
  orange: "🍊",
  grape: "🍇",
  watermelon: "🍉",
  papaya: "🥭",
  guava: "🍐",
  pomegranate: "🍎",
  pineapple: "🍍",
  strawberry: "🍓",
  lemon: "🍋",
  muskmelon: "🍈",
  sapota: "🥔",
  rice: "🍚",
  wheat: "🌾",
  maize: "🌽",
  ragi: "🌾",
  jowar: "🌾",
  bajra: "🌾",
  millet: "🌾",
  barley: "🌾",
  turmeric: "🟡",
  pepper: "⚫",
  cardamom: "🌿",
  coriander: "🌿",
  cumin: "🌿",
  honey: "🍯",
  jaggery: "🍯",
  coconut: "🥥",
  coffee: "☕",
  tea: "🍵",
  rose: "🌹",
  jasmine: "🤍",
  marigold: "🌼",
  sunflower: "🌻",
  lotus: "🪷",
  lily: "🌷",
  oil: "🫒",
  dal: "🫘",
  gram: "🫘",
  chickpea: "🫘",
};
const CAT_EMOJI = {
  Vegetables: "🥬",
  Fruits: "🍎",
  Grains: "🌾",
  Pulses: "🫘",
  Spices: "🌶️",
  Seeds: "🌱",
  "Organic Products": "🌿",
  Flowers: "🌸",
  "Plantation Crops": "🥥",
  "Other Farm Products": "🍯",
};
const CAT_GRAD = {
  Vegetables: "linear-gradient(135deg,#d8f3dc,#95d5b2)",
  Fruits: "linear-gradient(135deg,#ffe8cc,#ffc078)",
  Grains: "linear-gradient(135deg,#fff3bf,#ffd43b)",
  Pulses: "linear-gradient(135deg,#f1e4d3,#d9b38c)",
  Spices: "linear-gradient(135deg,#ffd8cc,#ff9f80)",
  Seeds: "linear-gradient(135deg,#e9f5db,#b5e48c)",
  "Organic Products": "linear-gradient(135deg,#c7f9cc,#80ed99)",
  Flowers: "linear-gradient(135deg,#ffe3f1,#ffadd2)",
  "Plantation Crops": "linear-gradient(135deg,#e6ddd0,#c3a68a)",
  "Other Farm Products": "linear-gradient(135deg,#fff0c2,#ffd166)",
};

export function emojiFor(name = "", category = "") {
  const n = name.toLowerCase();
  for (const k of Object.keys(EMOJI)) if (n.includes(k)) return EMOJI[k];
  return CAT_EMOJI[category] || "🌾";
}
export const catGradient = (c) =>
  CAT_GRAD[c] || "linear-gradient(135deg,#d8f3dc,#b7e4c7)";
