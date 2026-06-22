export type RawPresets = Record<string, RawPreset>;
export type RawPreset = {
  icon?: string;
  /** Remote bitmap (or any image URL); shown in the preview like iD when third-party images are enabled. */
  imageURL?: string;
  fields?: string[];
  moreFields?: string[];
  geometry?: string[];
  tags?: Record<string, string>;
  matchScore?: number;
  searchable?: boolean;
  suggestion?: boolean;
};

export type RawTranslations = {
  en?: {
    presets?: {
      presets?: Record<string, { name?: string; terms?: string; aliases?: string }>;
      categories?: Record<string, { name?: string }>;
    };
  };
};

export type RawCategories = Record<string, { icon?: string; members?: string[] }>;

export type RawFields = Record<string, { key?: string; type?: string; geometry?: string[] }>;

export type DenormalizedPreset = {
  id: string;
  name: string;
  terms: string[];
  aliases: string[];
  icon?: string;
  imageURL?: string;
  iconPrefix?: string;
  geometry: string[];
  tags: Record<string, string>;
  tagString: string;
  primaryTagKey?: string;
  primaryTagValue?: string;
  categoryIds: string[];
  categoryNames: string[];
  fields: string[];
  moreFields: string[];
  matchScore: number;
  hasIcon: boolean;
  searchable?: boolean;
};

export type SchemaData = {
  presets: DenormalizedPreset[];
  presetsById: Map<string, DenormalizedPreset>;
  /** Source preset entries as authored in `data/presets/{id}.json`. */
  rawPresets: RawPresets;
  categories: RawCategories;
  categoryNames: Record<string, string>;
  /** Raw field definitions (keyed by field id) — used to expand a preset's field references. */
  fields: RawFields;
  loadError: string | null;
  diagnostics: string[];
};

export type IconRegistryEntry = {
  name: string;
  prefix: string;
  svgRaw?: string;
};

export type IconViewModel = IconRegistryEntry & {
  usageCount: number;
  presets: DenormalizedPreset[];
};
