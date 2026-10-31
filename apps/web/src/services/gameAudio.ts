export interface GameAudioSettings {
  master: number;
  music: number;
  effects: number;
}

export type AudioScene = 'menu' | 'waiting' | 'match';
export type GameSound = 'attack' | 'movement' | 'turn';

const SETTINGS_KEY = 'atlas-audio-settings';
const DEFAULT_SETTINGS: GameAudioSettings = { master: 75, music: 32, effects: 72 };
const MUSIC_TRACKS: Record<Exclude<AudioScene, 'match'>, string> = {
  menu: '/assets/audio/atlas-menu.ogg',
  waiting: '/assets/audio/atlas-waiting.ogg',
};
const SOUND_TRACKS = {
  attack: ['/assets/audio/battle-explosion.ogg'],
  movement: ['/assets/audio/troop-step-1.ogg', '/assets/audio/troop-step-2.ogg'],
} as const;

let settings = loadSettings();
let scene: AudioScene = 'menu';
let unlocked = false;
let music: HTMLAudioElement | null = null;
let movementStep = 0;

function loadSettings(): GameAudioSettings {
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(stored) as Partial<GameAudioSettings>;
    return {
      master: clamp(parsed.master, DEFAULT_SETTINGS.master),
      music: clamp(parsed.music, DEFAULT_SETTINGS.music),
      effects: clamp(parsed.effects, DEFAULT_SETTINGS.effects),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function clamp(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}

export function getGameAudioSettings() {
  return { ...settings };
}

function syncMusic() {
  if (typeof window === 'undefined') return;
  if (scene === 'match') {
    music?.pause();
    return;
  }

  const source = MUSIC_TRACKS[scene];
  if (!music) {
    music = new Audio();
    music.loop = true;
    music.preload = 'none';
  }
  if (!music.src.endsWith(source)) {
    music.pause();
    music.src = source;
    music.currentTime = 0;
  }
  music.volume = (settings.master * settings.music) / 10000;
  if (unlocked && music.paused) void music.play().catch(() => undefined);
}

export function setGameAudioScene(nextScene: AudioScene) {
  scene = nextScene;
  syncMusic();
}

export function unlockGameAudio() {
  unlocked = true;
  syncMusic();
}

export function updateGameAudioSettings(update: Partial<GameAudioSettings>) {
  settings = {
    master: clamp(update.master ?? settings.master, settings.master),
    music: clamp(update.music ?? settings.music, settings.music),
    effects: clamp(update.effects ?? settings.effects, settings.effects),
  };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Audio controls still work for this session when storage is unavailable.
  }
  syncMusic();
  return getGameAudioSettings();
}

function playAsset(source: string, volumeScale = 1) {
  if (!unlocked || typeof window === 'undefined') return;
  const audio = new Audio(source);
  audio.volume = (settings.master * settings.effects * volumeScale) / 10000;
  void audio.play().catch(() => undefined);
}

function playTurnChime() {
  if (!unlocked || settings.master === 0 || settings.effects === 0 || typeof window === 'undefined') return;
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  void context.resume().catch(() => undefined);
  const startAt = context.currentTime;
  const masterGain = context.createGain();
  masterGain.gain.value = (settings.master * settings.effects) / 10000;
  masterGain.connect(context.destination);

  [740, 988].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = startAt + index * 0.13;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.22, start + 0.08);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.22, start + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
    oscillator.connect(envelope);
    envelope.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(start + 0.36);
  });
  window.setTimeout(() => void context.close(), 700);
}

export function playGameSound(sound: GameSound) {
  if (sound === 'turn') {
    playTurnChime();
    return;
  }
  if (sound === 'attack') {
    SOUND_TRACKS.attack.forEach(source => playAsset(source, 0.82));
    return;
  }
  const source = SOUND_TRACKS.movement[movementStep % SOUND_TRACKS.movement.length];
  movementStep += 1;
  playAsset(source, 0.42);
}
