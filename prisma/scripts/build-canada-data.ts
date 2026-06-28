import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

const PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

function toDisplayName(value: string): string {
  return value
    .split(/(\s+|[-'])/)
    .map((part) => {
      if (!part.trim() || part === "-" || part === "'") return part;
      if (/^\d+$/.test(part)) return part;
      const upper = part.toUpperCase();
      if (upper === "ST") return "St";
      if (upper === "ST.") return "St.";
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

type RawCity = [string, string];

function buildCanadaProvinces() {
  const raw = JSON.parse(
    readFileSync(join(dataDir, "canada-cities-source.json"), "utf8")
  ) as RawCity[];

  const grouped = new Map<string, Set<string>>();

  for (const [rawCity, abbr] of raw) {
    const province = PROVINCE_NAMES[abbr];
    if (!province) continue;

    const city = toDisplayName(rawCity.trim());
    if (!city) continue;

    if (!grouped.has(province)) {
      grouped.set(province, new Set());
    }
    grouped.get(province)!.add(city);
  }

  const provinces = Object.values(PROVINCE_NAMES).map((name) => ({
    name,
    cities: [...(grouped.get(name) ?? [])].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    ),
  }));

  const totalCities = provinces.reduce((sum, province) => sum + province.cities.length, 0);

  writeFileSync(
    join(dataDir, "canada-provinces.json"),
    `${JSON.stringify(provinces, null, 2)}\n`
  );

  console.log(
    `Built canada-provinces.json: ${provinces.length} provinces/territories, ${totalCities} cities`
  );
}

buildCanadaProvinces();
