export type PlayerState = "Prime" | "Base" | "Acabado";

export interface BaseStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Trait {
  name: string;
  impact_stats: Record<string, number>;
  description: string;
}

export interface PlayerVariant {
  name: string;
  stats: BaseStats;
}

export interface Player {
  id: number;
  name: string;
  position: string;
  nationality: string;
  age: number;
  traits: string[];
  variants: PlayerVariant[];
}

export interface TeamPlayer extends BaseStats {
  id: number;
  name: string;
  position: string;
  traits: Trait[];
}

export interface Team {
  name: string;
  players: TeamPlayer[];
  total_media: number;
}

export type MatchEventType = "GOAL" | "CORNER" | "PENALTY" | "FOUL";

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  description: string;
  team: "home" | "away";
}

export interface SimulationResult {
  homeScore: number;
  awayScore: number;
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  winner: "home" | "away" | "draw";
  events: MatchEvent[];
}

export type Version = "prime" | "actual" | "acabado";

export const VERSION_WEIGHTS: Record<Version, number> = {
  prime: 1.0,
  actual: 0.75,
  acabado: 0.5,
};

export type Position =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CM"
  | "CDM"
  | "CAM"
  | "LM"
  | "RM"
  | "ST"
  | "LW"
  | "RW";

export type PositionCategory = "GK" | "DEF" | "MID" | "ATT";

export const POSITION_CATEGORIES: Record<Position, PositionCategory> = {
  GK: "GK",
  CB: "DEF",
  LB: "DEF",
  RB: "DEF",
  CM: "MID",
  CDM: "MID",
  CAM: "MID",
  LM: "MID",
  RM: "MID",
  ST: "ATT",
  LW: "ATT",
  RW: "ATT",
};
