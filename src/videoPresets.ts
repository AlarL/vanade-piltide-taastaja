export interface VideoPreset {
  id: string;
  title: string;
  tagline: string;
  category: "Põhiline" | "Klassikaline" | "Emotsionaalne";
  iconName: "Smile" | "Eye" | "ArrowUpRight" | "RotateCw" | "MessageSquare" | "Wind" | "UserCheck";
  userPrompt: string;
  apiPrompt: string;
}

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: "warm_smile",
    title: "Rahulik soe naeratus",
    tagline: "Siiras, rahulik ja elutruu naeratav ilme",
    category: "Põhiline",
    iconName: "Smile",
    userPrompt:
      "Inimene naeratab soojalt ja rahulikult, silmad muutuvad leebeks ja elavaks, suunurgad tõusevad õrnale naeratusele ja ta hingab rahulikult.",
    apiPrompt:
      "A cinematic, lifelike high-detail video where the person in the photo smiles warmly and serenely. Gentle natural eye blinks with lifelike reflection and moisture in the eyes, calm realistic breathing movement, soft smile forming on the lips with authentic facial micro-expressions. Steady camera framing, pristine photographic quality.",
  },
  {
    id: "direct_eye_contact",
    title: "Vaatab otse silma",
    tagline: "Sügav ja elav pilkkontakt kaamerasse",
    category: "Põhiline",
    iconName: "Eye",
    userPrompt:
      "Inimene vaatab otse vaatajale silma, pilgutab rahulikult ja teeb vaevumärgatava leebe heakskiitva noogutuse.",
    apiPrompt:
      "A hyper-realistic video where the person looks directly into the camera lens, establishing deep, warm, lifelike eye contact with the viewer. Natural gentle eye blinking, very subtle graceful head micro-movement, calm steady gaze with subtle micro-expressions and authentic breathing.",
  },
  {
    id: "raise_eyes_smile",
    title: "Tõstab pilgu ja naeratab",
    tagline: "Langetatud pilk tõuseb aeglaselt kaamerasse",
    category: "Põhiline",
    iconName: "ArrowUpRight",
    userPrompt:
      "Inimene tõstab rahulikult pilgu alt üles kaamerasse, vaatab vaatajale otsa ning tema näole tekib meeldiv soe naeratus.",
    apiPrompt:
      "A beautiful, emotionally touching video where the person begins with eyes gently looking down or relaxed, then smoothly and naturally raises their eyes up to look straight at the camera. Their face lights up with a subtle, warm, genuine smile as direct eye contact is made. Realistic natural pacing and graceful motion.",
  },
  {
    id: "gentle_turn",
    title: "Aeglane peapööre",
    tagline: "Pöörab pead väärikalt kaamera poole",
    category: "Klassikaline",
    iconName: "RotateCw",
    userPrompt:
      "Inimene pöörab pead sujuvalt ja rahulikult kaamera suunas, pilgutab silmi ja vaatab leebelt otsa.",
    apiPrompt:
      "A dignified archival portrait video where the subject slowly and smoothly turns their head towards the camera, blinking softly with expressive, authentic eyes and a gentle composed expression. High realism, smooth cinematic movement.",
  },
  {
    id: "speaks_greeting",
    title: "Räägib ja tervitab",
    tagline: "Nagu ütleks sooja tervituse või tere",
    category: "Emotsionaalne",
    iconName: "MessageSquare",
    userPrompt:
      "Inimene liigutab suud nagu ütleks sõbraliku tervituse, noogutab kergelt pead ja naeratab soojalt.",
    apiPrompt:
      "A lifelike video where the person speaks subtly and gently as if giving a warm, loving greeting to a dear family member, with natural lip and jaw articulation, soft nodding, and affectionate facial expression. Ultra-realistic, respectful, authentic vintage portrait brought to life.",
  },
  {
    id: "gentle_breeze",
    title: "Mahe tuul ja elavus",
    tagline: "Tuuleõhk liigutab juukseid, rahulik hingamine",
    category: "Klassikaline",
    iconName: "Wind",
    userPrompt:
      "Kerge mahe tuuleõhk liigutab õrnalt juuksesalke ja rõivaid, inimene hingab rahulikult ja pilgutab silmi.",
    apiPrompt:
      "A cinematic subtle motion video where a gentle ambient breeze softly flutters loose strands of hair and clothing collar. The person breathes gently and blinks naturally with a calm, peaceful presence. Seamless lifelike photorealism.",
  },
  {
    id: "dignified_vintage",
    title: "Väärikas klassikaline pilk",
    tagline: "Ajastutruu väärikas ja rahulik kohalolek",
    category: "Klassikaline",
    iconName: "UserCheck",
    userPrompt:
      "Inimene säilitab väärika ja rahuliku ilme, pilgutab elutruult silmi, liigutab vaevumärgatavalt pead ning vaatab selgelt kaamerasse.",
    apiPrompt:
      "A classic, elegant, dignified vintage portrait coming alive. Extremely subtle, ultra-realistic micro-movements: natural eye blinks, subtle eye saccades, calm chest rise and fall from breathing, timeless dignified presence. Perfectly preserving historical authenticity.",
  },
];
