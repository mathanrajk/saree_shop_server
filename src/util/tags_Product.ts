export const ITags = ["new", "offer", "trend"] as const

export type Tags = (typeof ITags)[number] // "new" | "offer" | "trend"

export const IDressTypes = [
  "saree",
  "chudidar",
  "salwar-suit",
  "kurti",
  "lehenga",
  "anarkali",
  "palazzo-set",
  "half-saree",
  "sharara",
  "gown",
  "patiala",
  "customized"
] as const;

export type DressType = (typeof IDressTypes)[number];