
export interface Artifact {
  id: string;
  name: string;
  originalSubreddit: string;
  description: string;
  riddle: string;
  hint: string;
  imageUrl?: string;
  lore: string;
  year: string;
  redditUrl: string;
}

export interface GameState {
  score: number;
  streak: number;
  lastSolvedDate: string | null;
  artifactsCollected: string[];
  currentLocation: { x: number; y: number };
  dailyFound: boolean;
  status: 'exploring' | 'solving' | 'success' | 'intro';
}

export interface Position {
  x: number;
  y: number;
}
