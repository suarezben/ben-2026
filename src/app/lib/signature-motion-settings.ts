export type SignatureMotionSettings = {
  inDelayMs: number;
  inStiffness: number;
  inDamping: number;
  inMass: number;
  anticipationPx: number;
  anticipationMs: number;
  outDelayEnabled: boolean;
  outDelayMs: number;
  outAnticipationPx: number;
  outAnticipationMs: number;
  outStiffness: number;
  outDamping: number;
  outMass: number;
  desktopScale: number;
  mobileScale: number;
  desktopY: number;
  mobileY: number;
};

export const DEFAULT_SIGNATURE_MOTION: SignatureMotionSettings = {
  inDelayMs: 50,
  inStiffness: 260,
  inDamping: 28,
  inMass: 0.8,
  anticipationPx: 12,
  anticipationMs: 110,
  outDelayEnabled: true,
  outDelayMs: 50,
  outAnticipationPx: 12,
  outAnticipationMs: 110,
  outStiffness: 300,
  outDamping: 30,
  outMass: 0.72,
  desktopScale: 0.76,
  mobileScale: 0.84,
  desktopY: 18,
  mobileY: 40,
};

export const SIGNATURE_MOTION_STORAGE_KEY = 'ben-signature-motion-v2';
