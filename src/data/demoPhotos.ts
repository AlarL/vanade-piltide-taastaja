/**
 * Näidisfoto päisesse enne ja pärast vaatamiseks.
 * Siia saab kasutaja soovi korral kleepida oma foto URL-id või base64 andmed.
 */

export interface DemoPhotoPair {
  title: string;
  subtitle: string;
  beforeImage: string; // Algne kahjustatud/mustvalge foto
  afterImage: string; // Taastatud ja värvitud foto
}

// Ajalooline näidisfoto (originaal: aa_original.png, taastatud: valmis.png)
export const DEFAULT_DEMO_PHOTO: DemoPhotoPair = {
  title: "Näide: Ajaloolise arhiivifoto taastamine",
  subtitle: "Lohista liugurit vasakule ja paremale, et võrrelda originaali ning taastatud tulemust.",
  // Viitab originaalile (aa_original.png)
  beforeImage: "/aa_original.png",
  // Taastatud ja värvitud versioon (valmis.png)
  afterImage: "/valmis.png",
};
