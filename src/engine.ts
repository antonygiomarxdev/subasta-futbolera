import type {
  BaseStats,
  TeamPlayer,
  SimulationResult,
  Version,
  Trait,
  Player,
  PlayerVariant,
  MatchEvent,
} from "./types";

type BuildOptions = {
  variantName?: string;
  version?: Version;
};

const VERSION_WEIGHTS_CONST: Record<Version, number> = {
  prime: 1.0,
  actual: 0.75,
  acabado: 0.5,
};

const VERSION_TO_VARIANT_NAME: Record<Version, string> = {
  prime: "Prime",
  actual: "Actual",
  acabado: "Acabado",
};

const TRAIT_EFFECTS: Record<string, Partial<Record<keyof BaseStats, number>>> = {
  "Fenómeno (Gordo)": {
    pace: -30,
    shooting: 20,
  },
  "Expulsado por defecto": {},
};

const isPlayerExpelled = (traits: string[]): boolean => {
  return traits.some((t) => t.toLowerCase().includes("expulsado"));
};

const applyTraitEffects = (
  stats: BaseStats,
  traits: string[]
): BaseStats => {
  const result = { ...stats };

  for (const trait of traits) {
    const effect = TRAIT_EFFECTS[trait];
    if (effect) {
      for (const [stat, modifier] of Object.entries(effect)) {
        if (modifier !== undefined) {
          const key = stat as keyof BaseStats;
          const currentValue = result[key] as number;
          result[key] = Math.max(
            1,
            Math.min(99, currentValue + modifier)
          ) as never;
        }
      }
    }
  }

  return result;
};

function selectVariant(
  player: Player,
  options: BuildOptions
): PlayerVariant | null {
  if (options.variantName) {
    const exact = player.variants.find((v) => v.name === options.variantName);
    if (exact) return exact;
    const lower = options.variantName.toLowerCase();
    const partial = player.variants.find((v) =>
      v.name.toLowerCase().includes(lower)
    );
    if (partial) return partial;
  }
  if (options.version) {
    const name = VERSION_TO_VARIANT_NAME[options.version];
    const byVersion = player.variants.find((v) => v.name === name);
    if (byVersion) return byVersion;
  }
  return player.variants[0] ?? null;
}

const calculateAverage = (team: TeamPlayer[]): number => {
  if (team.length === 0) return 0;
  const sum = team.reduce((acc, p) => {
    return (
      acc +
      (p.pace +
        p.shooting +
        p.passing +
        p.dribbling +
        p.defending +
        p.physical) /
        6
    );
  }, 0);
  return sum / team.length;
};

const calculateAttackingPower = (team: TeamPlayer[]): number => {
  const attackers = team.filter((p) =>
    ["ST", "LW", "RW", "CAM"].includes(p.position)
  );
  const midfielders = team.filter((p) =>
    ["CM", "CDM", "LM", "RM"].includes(p.position)
  );

  const attAvg =
    attackers.length > 0
      ? attackers.reduce(
          (acc, p) => acc + (p.shooting + p.dribbling + p.pace) / 3,
          0
        ) / attackers.length
      : 50;
  const midAvg =
    midfielders.length > 0
      ? midfielders.reduce(
          (acc, p) => acc + (p.passing + p.dribbling) / 2,
          0
        ) / midfielders.length
      : 50;

  return attAvg * 0.6 + midAvg * 0.4;
};

const calculateDefensivePower = (team: TeamPlayer[]): number => {
  const defenders = team.filter((p) =>
    ["CB", "LB", "RB", "CDM"].includes(p.position)
  );
  const goalkeeper = team.find((p) => p.position === "GK");

  const defAvg =
    defenders.length > 0
      ? defenders.reduce(
          (acc, p) => acc + (p.defending + p.physical + p.pace) / 3,
          0
        ) / defenders.length
      : 50;
  const gkRating = goalkeeper
    ? (goalkeeper.defending + goalkeeper.physical) / 2
    : 50;

  return defAvg * 0.6 + gkRating * 0.4;
};

const calculatePossession = (
  homeTeam: TeamPlayer[],
  awayTeam: TeamPlayer[]
): [number, number] => {
  if (homeTeam.length === 0 || awayTeam.length === 0) {
    return [50, 50];
  }

  const homePassing =
    homeTeam.reduce((acc, p) => acc + p.passing, 0) / homeTeam.length;
  const awayPassing =
    awayTeam.reduce((acc, p) => acc + p.passing, 0) / awayTeam.length;
  const total = homePassing + awayPassing;

  if (total === 0) return [50, 50];

  return [
    Math.round((homePassing / total) * 100),
    Math.round((awayPassing / total) * 100),
  ];
};

const generateShots = (
  attackingPower: number,
  defensivePower: number,
  possession: number,
  playerCount: number
): { shots: number; shotsOnTarget: number } => {
  const playerCountFactor = playerCount / 11;
  const baseShots = Math.floor(
    (attackingPower / 10) *
      (possession / 50) *
      (Math.random() * 3 + 7) *
      playerCountFactor
  );
  const shots = Math.max(1, Math.min(baseShots, 30));

  const shotQuality = (attackingPower - defensivePower * 0.5) / 100;
  const onTargetRate = 0.25 + shotQuality * 0.35;
  const shotsOnTarget = Math.max(1, Math.floor(shots * onTargetRate));

  return { shots, shotsOnTarget };
};

interface MinuteContext {
  minute: number;
  homeAttacking: number;
  awayAttacking: number;
  homeDefense: number;
  awayDefense: number;
  homePossession: number;
  awayPossession: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
}

const generateMinuteEvent = (
  ctx: MinuteContext,
  isHomeAttacking: boolean
): MatchEvent | null => {
  const attacking = isHomeAttacking ? ctx.homeAttacking : ctx.awayAttacking;
  const defending = isHomeAttacking ? ctx.homeDefense : ctx.awayDefense;
  const team: "home" | "away" = isHomeAttacking ? "home" : "away";

  const eventChance = Math.random();
  const attackPressure = attacking / 100;
  const defResistance = defending / 100;

  if (eventChance < attackPressure * 0.08) {
    const goalChance = (attacking - defending * 0.5) / 100;
    if (Math.random() < goalChance) {
      const scorer = isHomeAttacking ? "Home" : "Away";
      ctx.homeScore += isHomeAttacking ? 1 : 0;
      ctx.awayScore += isHomeAttacking ? 0 : 1;
      return {
        minute: ctx.minute,
        type: "GOAL",
        description: `${scorer} team scores!`,
        team,
      };
    }
  }

  if (eventChance < attackPressure * 0.15) {
    const foulChance = defResistance * 0.6;
    if (Math.random() < foulChance) {
      return {
        minute: ctx.minute,
        type: "FOUL",
        description: `Foul committed in the ${team === "home" ? "away" : "home"} penalty area`,
        team: team === "home" ? "away" : "home",
      };
    }
  }

  if (eventChance < attackPressure * 0.12) {
    return {
      minute: ctx.minute,
      type: "CORNER",
      description: `Corner kick for ${team === "home" ? "home" : "away"} team`,
      team,
    };
  }

  if (eventChance < attackPressure * 0.05) {
    const penaltyChance = (attacking - defending * 0.7) / 100;
    if (Math.random() < penaltyChance && ctx.minute > 15) {
      return {
        minute: ctx.minute,
        type: "PENALTY",
        description: `Penalty awarded to ${team === "home" ? "home" : "away"} team!`,
        team,
      };
    }
  }

  return null;
};

const simulateMinute = (ctx: MinuteContext): MatchEvent | null => {
  const possessionRoll = Math.random() * 100;
  const isHomePossession = possessionRoll < ctx.homePossession;

  const event = generateMinuteEvent(ctx, isHomePossession);
  if (event) {
    ctx.events.push(event);
    return event;
  }

  return null;
};

export function buildTeamFromPlayers(
  players: Player[],
  playerIds: number[],
  options: BuildOptions = {}
): TeamPlayer[] {
  const result: TeamPlayer[] = [];

  for (const id of playerIds) {
    const player = players.find((p): p is Player => p.id === id);
    if (!player) continue;

    if (isPlayerExpelled(player.traits)) continue;

    const variant = selectVariant(player, options);
    if (!variant) continue;

    let weight = 1.0;
    if (options.version) {
      weight = VERSION_WEIGHTS_CONST[options.version];
    }

    const baseStats: BaseStats = {
      pace: Math.round(variant.stats.pace * weight),
      shooting: Math.round(variant.stats.shooting * weight),
      passing: Math.round(variant.stats.passing * weight),
      dribbling: Math.round(variant.stats.dribbling * weight),
      defending: Math.round(variant.stats.defending * weight),
      physical: Math.round(variant.stats.physical * weight),
    };

    const statsWithTraits = applyTraitEffects(baseStats, player.traits);

    const traits: Trait[] = player.traits.map(
      (t): Trait => ({
        name: t,
        impact_stats: TRAIT_EFFECTS[t] ?? {},
        description: "",
      })
    );

    result.push({
      id: player.id,
      name: `${player.name} (${variant.name})`,
      position: player.position,
      ...statsWithTraits,
      traits,
    });
  }

  return result;
}

export function simulateMatch(
  homeTeam: TeamPlayer[],
  awayTeam: TeamPlayer[]
): SimulationResult {
  if (homeTeam.length === 0 || awayTeam.length === 0) {
    throw new Error("Each team must have at least 1 player");
  }

  const homeCount = homeTeam.length;
  const awayCount = awayTeam.length;

  const homeAttacking = calculateAttackingPower(homeTeam);
  const awayAttacking = calculateAttackingPower(awayTeam);
  const homeDefense = calculateDefensivePower(homeTeam);
  const awayDefense = calculateDefensivePower(awayTeam);

  const [homePossession, awayPossession] = calculatePossession(
    homeTeam,
    awayTeam
  );

  const ctx: MinuteContext = {
    minute: 0,
    homeAttacking,
    awayAttacking,
    homeDefense,
    awayDefense,
    homePossession,
    awayPossession,
    homeScore: 0,
    awayScore: 0,
    events: [],
  };

  for (let minute = 1; minute <= 90; minute++) {
    ctx.minute = minute;
    simulateMinute(ctx);
  }

  const homeShotData = generateShots(
    homeAttacking,
    awayDefense,
    homePossession,
    homeCount
  );
  const awayShotData = generateShots(
    awayAttacking,
    homeDefense,
    awayPossession,
    awayCount
  );

  let winner: "home" | "away" | "draw";
  if (ctx.homeScore > ctx.awayScore) winner = "home";
  else if (ctx.awayScore > ctx.homeScore) winner = "away";
  else winner = "draw";

  return {
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    homePossession,
    awayPossession,
    homeShots: homeShotData.shots,
    awayShots: awayShotData.shots,
    homeShotsOnTarget: homeShotData.shotsOnTarget,
    awayShotsOnTarget: awayShotData.shotsOnTarget,
    winner,
    events: ctx.events,
  };
}

export function getTeamAverage(team: TeamPlayer[]): number {
  return calculateAverage(team);
}

export type {
  BuildOptions,
  Player,
  PlayerVariant,
  BaseStats,
  TeamPlayer,
  SimulationResult,
  Version,
  MatchEvent,
};
