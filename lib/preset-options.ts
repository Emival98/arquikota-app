export const DEMO_PRESETS = [
  {
    id: "kota-commerce",
    name: "Kota Commerce",
    tagline: "Loja em produção",
    description:
      "Next 14, Node 18 e auth-helpers. É o cenário realista que precisa de intervenção.",
  },
  {
    id: "kota-studio",
    name: "Kota Studio",
    tagline: "Base saudável",
    description:
      "Next 16, Node 24 e verificação semanal ativa. Mostra como é um projeto em dia.",
  },
  {
    id: "kota-legado",
    name: "Kota Legado",
    tagline: "Backoffice antigo",
    description:
      "Next 12, Node 16 e configuração Vercel legada. O pior caso, com dívida acumulada.",
  },
] as const;

export type DemoPresetId = (typeof DEMO_PRESETS)[number]["id"];

export const DEFAULT_PRESET_ID: DemoPresetId = "kota-commerce";

export function isDemoPresetId(value: string): value is DemoPresetId {
  return DEMO_PRESETS.some((preset) => preset.id === value);
}
