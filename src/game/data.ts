export const PRINCESSES = [
  { name: "Fairy Princess", def: "Lily", dresses: [0, 1, 5] },
  { name: "Mermaid Princess", def: "Coral", dresses: [1, 0, 2] },
  { name: "Ice Queen", def: "Winter", dresses: [2, 0, 5] },
  { name: "Garden Princess", def: "Rosie", dresses: [3, 0, 4] },
  { name: "Starlight Princess", def: "Luna", dresses: [4, 0, 5] },
  { name: "Rainbow Princess", def: "Skye", dresses: [5, 0, 2] },
] as const;

export const DRESS_NAME: Record<number, string> = {
  0: "Blush ballgown",
  1: "Seafoam gown",
  2: "Snow gown",
  3: "Rose gown",
  4: "Star gown",
  5: "Rainbow gown",
};

export const SHOES = [
  { name: "Glass slippers" },
  { name: "Ruby shoes" },
  { name: "Gold sandals" },
  { name: "Pink boots" },
  { name: "Purple sneakers" },
  { name: "Green flats" },
] as const;

export const JEWELS = [
  { name: "Gold crown", slot: "crown" },
  { name: "Silver tiara", slot: "tiara" },
  { name: "Pearls", slot: "neck" },
  { name: "Flower crown", slot: "flowers" },
  { name: "Earrings", slot: "ears" },
  { name: "Heart necklace", slot: "heart" },
] as const;

export const CLOTHS = [
  { name: "Pink cloth", color: "#ffb3d4" },
  { name: "White cloth", color: "#fff8f0" },
  { name: "Lavender cloth", color: "#d4c4ff" },
  { name: "Gold cloth", color: "#ffd36a" },
] as const;

export const CAKES = [
  { name: "Berry cake", kind: "berry" },
  { name: "Chocolate cake", kind: "choc" },
  { name: "Rainbow cake", kind: "rainbow" },
  { name: "Flower cake", kind: "flower" },
] as const;

export const BLOOMS = [
  { name: "Roses", kind: "roses" },
  { name: "Tulips", kind: "tulips" },
  { name: "Sunflowers", kind: "sun" },
  { name: "Wildflowers", kind: "wild" },
] as const;

export const TREATS = [
  { name: "Tea", kind: "tea" },
  { name: "Cupcake", kind: "cupcake" },
  { name: "Cookie", kind: "cookie" },
  { name: "Macaron", kind: "macaron" },
  { name: "Cake", kind: "slice" },
] as const;

export type Save = {
  p: number;
  dress: number;
  shoes: number;
  jewel: number;
  name: string;
};

export type TeaPhase = "guest" | "seat" | "decorate" | "serve";

export type Tea = {
  phase: TeaPhase;
  seats: number;
  seated: number[];
  gi: number;
  ci: number;
  cloth: number;
  cake: number;
  flow: number;
  dec: "cloth" | "cake" | "flowers";
  served: { tea: boolean; items: string[] }[];
  tray: boolean;
  ti: number;
  pick: number;
};

export function asset(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  return base + path.replace(/^\//, "");
}

export function artDress(p: number, dress: number) {
  return asset(`/art/p${p}-d${dress}.png`);
}

export function validSave(c: Save) {
  const princess = PRINCESSES[c.p];
  return (
    !!princess &&
    (princess.dresses as readonly number[]).includes(c.dress) &&
    c.shoes >= 0 &&
    c.shoes < SHOES.length &&
    c.jewel >= 0 &&
    c.jewel < JEWELS.length &&
    typeof c.name === "string" &&
    c.name.length > 0 &&
    c.name.length <= 16
  );
}
