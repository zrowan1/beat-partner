import type { VocalEffectPreset } from "@/types";

export const VOCAL_EFFECT_PRESETS: VocalEffectPreset[] = [
  {
    id: "pop-lead",
    name: "Pop Lead",
    genre: "Pop",
    description: "Bright, upfront vocal with clarity and sheen for modern pop productions.",
    chain: {
      eq: "High-pass 80Hz, +2dB @ 3kHz (Q=1.2), +1.5dB @ 10kHz shelf, cut -2dB @ 250Hz",
      compressor: "1176-style, 4:1, attack 3ms, release 100ms, gain reduction 3–6dB",
      reverb: "Hall, decay 2.2s, pre-delay 35ms, 15% wet",
      delay: "Stereo 1/8 note, 20% wet, feedback 18%, high-pass filter on delay return",
      other: "De-esser at 6–8kHz (-4dB), subtle saturation (tape-style, 10% drive)",
    },
  },
  {
    id: "pop-bgv",
    name: "Pop Background",
    genre: "Pop",
    description: "Smooth, blended background vocals that sit behind the lead without fighting.",
    chain: {
      eq: "High-pass 120Hz, +3dB @ 4kHz, low-pass 12kHz, scoop -3dB @ 400Hz",
      compressor: "Optical, 3:1, medium attack/release, 4–8dB GR for tight blend",
      reverb: "Plate, decay 2.8s, pre-delay 45ms, 25% wet",
      delay: "1/4 note dotted ping-pong, 22% wet, feedback 15%",
      other: "Light chorus (rate slow, depth 30%), de-esser gentle",
    },
  },
  {
    id: "hiphop-lead",
    name: "Hip-Hop Lead",
    genre: "Hip-Hop",
    description: "Aggressive, in-your-face rap vocal with punch and presence.",
    chain: {
      eq: "High-pass 100Hz, +3dB @ 2.5kHz, +2dB @ 8kHz air shelf, cut -3dB @ 350Hz",
      compressor: "FET, 8:1, fast attack 1ms, auto release, 6–10dB GR",
      reverb: "Small room, decay 0.8s, pre-delay 15ms, 8% wet",
      delay: "Slapback 1/16 note, 12% wet, feedback 8%",
      other: "Hard clipper on peaks, de-esser at 5kHz, parallel distortion (20% blend)",
    },
  },
  {
    id: "hiphop-adlib",
    name: "Hip-Hop Ad-libs",
    genre: "Hip-Hop",
    description: "Spaced-out, filtered ad-libs for fills and ear candy.",
    chain: {
      eq: "High-pass 200Hz, telephone-style bandpass (800Hz–4kHz peak)",
      compressor: "Heavy, 10:1, fast attack, fast release, 10–15dB GR",
      reverb: "Long hall, decay 4s, pre-delay 60ms, 35% wet",
      delay: "1/8 note triplet, 30% wet, feedback 35%, filtered repeats",
      other: "Pitch shift +7/-7 cents on doubler, heavy saturation, autopan",
    },
  },
  {
    id: "rnb-smooth",
    name: "R&B Smooth",
    genre: "R&B",
    description: "Warm, silky vocal with controlled dynamics and lush spatial effects.",
    chain: {
      eq: "High-pass 70Hz, +2dB @ 2kHz, +1.5dB @ 7kHz, gentle -1.5dB @ 300Hz",
      compressor: "SSL-style, 3:1, attack 10ms, release 200ms, 4–6dB GR",
      reverb: "Chamber, decay 2.5s, pre-delay 40ms, 20% wet",
      delay: "1/4 note, 18% wet, feedback 20%, sidechain duck from lead",
      other: "De-esser soft at 7kHz, tube saturation (warm, 15% drive), doubler wide",
    },
  },
  {
    id: "rnb-intimate",
    name: "R&B Intimate",
    genre: "R&B",
    description: "Close, breathy vocal for verses and stripped-down sections.",
    chain: {
      eq: "High-pass 60Hz, +1dB @ 1.5kHz, boost air 12kHz +2dB, subtle 100Hz warmth +1dB",
      compressor: "LA-2A-style, gentle 2–4dB GR, slow release for natural dynamics",
      reverb: "Small room, decay 1.2s, pre-delay 25ms, 12% wet",
      delay: "Very subtle 1/8 note, 8% wet, feedback 10%",
      other: "Minimal processing — focus on mic technique, slight de-esser, no saturation",
    },
  },
  {
    id: "rock-aggressive",
    name: "Rock Aggressive",
    genre: "Rock",
    description: "Raw, energetic vocal that cuts through dense guitars and drums.",
    chain: {
      eq: "High-pass 90Hz, +3dB @ 3kHz, +2dB @ 5kHz presence, -3dB @ 250Hz mud",
      compressor: "1176 all-buttons mode, 20:1, fast attack/release, 8–12dB GR",
      reverb: "Room, decay 1.5s, pre-delay 20ms, 10% wet",
      delay: "Slapback 80–120ms, 15% wet, feedback 10%",
      other: "Parallel compression (crushed blend 25%), de-esser at 6kHz, saturation 20%",
    },
  },
  {
    id: "rock-clean",
    name: "Rock Clean",
    genre: "Rock",
    description: "Polished but natural vocal for anthemic or melodic rock.",
    chain: {
      eq: "High-pass 80Hz, +2dB @ 2.5kHz, +1dB @ 12kHz shelf, -2dB @ 300Hz",
      compressor: "VCA, 4:1, attack 5ms, release 150ms, 5–7dB GR",
      reverb: "Hall, decay 2.8s, pre-delay 35ms, 18% wet",
      delay: "Stereo 1/4 note, 15% wet, feedback 12%",
      other: "Gentle de-esser, plate reverb secondary (8% wet), harmonic excitement subtle",
    },
  },
];

export const GENRE_COLORS: Record<string, string> = {
  Pop: "#22d3ee",
  "Hip-Hop": "#f472b6",
  "R&B": "#a78bfa",
  Rock: "#fb923c",
};
