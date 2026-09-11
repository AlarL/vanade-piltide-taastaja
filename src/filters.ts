import { RestorationFilter, RestorationFilterId } from "./types";

export const RESTORATION_FILTERS: RestorationFilter[] = [
  {
    id: "modern_hd",
    label: "Tänapäevane HD foto",
    tagline: "Nagu tänapäeva nutitelefoniga tehtud",
    description: "Tee foto täiesti uueks: üliterav, kristallselge nahatekstuur ja elavad puhtad värvid.",
    promptAddon: `TARGET OUTPUT QUALITY: MODERN ULTRA-HD SMARTPHONE / FLAGSHIP CAMERA PHOTOGRAPH.
- Make this photo look like it was taken today with a modern high-end smartphone camera or professional DSLR in pristine condition.
- Maximize facial clarity, crisp eye sharpness, natural authentic skin pores, sharp hair strands, and modern balanced lighting.
- Eliminate all vintage blur, haze, motion softness, and degradation. Render modern high-resolution clarity while faithfully keeping the person's exact facial features and identity.`,
  },
  {
    id: "authentic_restore",
    label: "Ajastutruu taastamine",
    tagline: "Paranda vead ja taasta värvid",
    description: "Parandab kriimud ja toob värvid välja, säilitades foto ajaloolise iseloomu.",
    promptAddon: `TARGET OUTPUT QUALITY: AUTHENTIC ARCHIVAL RESTORATION.
- Cleanly restore all tears, cracks, dust, and fading.
- Colorize with faithful, realistic historical tones while preserving the original photograph's gentle vintage soul and natural lighting.
- Faithfully preserve exact facial structure and expressions.`,
  },
  {
    id: "studio_portrait",
    label: "Stuudio portree",
    tagline: "Puhas valgus ja peen teravus",
    description: "Professionaalse fotosessiooni teravus, pehme stuudiovalgustus ja selged detailid.",
    promptAddon: `TARGET OUTPUT QUALITY: PROFESSIONAL HIGH-END STUDIO PORTRAIT.
- Reconstruct lighting as if captured in a professional photo studio with soft, flattering key lighting and sharp crisp focus.
- Enhance micro-contrast on eyes, eyelashes, and facial features.
- Keep skin texture looking real, authentic, and naturally sharp without plastic smoothing.`,
  },
];

export function getFilterById(id?: string | null): RestorationFilter {
  if (!id) return RESTORATION_FILTERS[0];
  return (
    RESTORATION_FILTERS.find((f) => f.id === id) || RESTORATION_FILTERS[0]
  );
}
