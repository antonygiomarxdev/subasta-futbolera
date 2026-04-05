import React from "react";
import type { TeamPlayer, MatchEvent, MatchEventType } from "./types";

interface PitchProps {
  homeTeam: TeamPlayer[];
  awayTeam: TeamPlayer[];
  homeName: string;
  awayName: string;
  activeEvent?: MatchEvent | null;
}

interface FormationSpot {
  x: number;
  y: number;
}

interface Formation {
  GK: FormationSpot[];
  CB: FormationSpot[];
  CM: FormationSpot[];
  ST: FormationSpot[];
}

const FORMATION_433_HOME: Formation = {
  GK: [{ x: 50, y: 90 }],
  CB: [
    { x: 20, y: 78 },
    { x: 40, y: 80 },
    { x: 60, y: 80 },
    { x: 80, y: 78 },
  ],
  CM: [
    { x: 20, y: 58 },
    { x: 50, y: 55 },
    { x: 80, y: 58 },
  ],
  ST: [
    { x: 15, y: 35 },
    { x: 50, y: 30 },
    { x: 85, y: 35 },
  ],
};

const FORMATION_433_AWAY: Formation = {
  GK: [{ x: 50, y: 10 }],
  CB: [
    { x: 20, y: 22 },
    { x: 40, y: 20 },
    { x: 60, y: 20 },
    { x: 80, y: 22 },
  ],
  CM: [
    { x: 20, y: 42 },
    { x: 50, y: 45 },
    { x: 80, y: 42 },
  ],
  ST: [
    { x: 15, y: 65 },
    { x: 50, y: 70 },
    { x: 85, y: 65 },
  ],
};

const getEventOffset = (
  eventType: MatchEventType,
  isHome: boolean,
  positionCategory: "GK" | "DEF" | "MID" | "ATT"
): { x: number; y: number } => {
  const direction = isHome ? 1 : -1;

  switch (eventType) {
    case "GOAL":
      if (positionCategory === "ATT") {
        return { x: (Math.random() - 0.5) * 10, y: direction * -15 };
      }
      if (positionCategory === "GK") {
        return { x: (Math.random() - 0.5) * 5, y: direction * 10 };
      }
      return { x: (Math.random() - 0.5) * 8, y: direction * -5 };

    case "CORNER":
      if (positionCategory === "ATT") {
        return { x: direction * 20, y: direction * -25 };
      }
      if (positionCategory === "DEF") {
        return { x: direction * -15, y: direction * 15 };
      }
      return { x: direction * 10, y: direction * -10 };

    case "PENALTY":
      if (positionCategory === "ATT") {
        return { x: direction * 25, y: direction * -20 };
      }
      if (positionCategory === "GK") {
        return { x: direction * -10, y: direction * 8 };
      }
      return { x: direction * 15, y: direction * -12 };

    case "FOUL":
      if (positionCategory === "DEF") {
        return { x: (Math.random() - 0.5) * 12, y: direction * 12 };
      }
      if (positionCategory === "MID") {
        return { x: (Math.random() - 0.5) * 10, y: direction * 8 };
      }
      return { x: 0, y: 0 };

    default:
      return { x: 0, y: 0 };
  }
};

const getPositionCategory = (position: string): "GK" | "DEF" | "MID" | "ATT" => {
  if (position === "GK") return "GK";
  if (/CB|LB|RB/.test(position)) return "DEF";
  if (/CM|CAM|CDM|LM|RM/.test(position)) return "MID";
  return "ATT";
};

const getFormationIndex = (position: string, globalIndex: number): number => {
  if (position === "GK") return 0;
  if (position === "CB") {
    if (globalIndex === 1) return 0;
    if (globalIndex === 2) return 1;
    if (globalIndex === 3) return 2;
    if (globalIndex === 4) return 3;
    return globalIndex % 4;
  }
  if (/LB|RB/.test(position)) {
    if (position === "LB") return 0;
    if (position === "RB") return 3;
    return globalIndex < 4 ? globalIndex : globalIndex - 4;
  }
  if (/CM|CAM|CDM|LM|RM/.test(position)) {
    const midIndex = globalIndex - 5;
    if (midIndex === 0 || midIndex === 1 || midIndex === 2) return midIndex;
    return globalIndex % 3;
  }
  const attIndex = globalIndex - 8;
  if (attIndex >= 0 && attIndex <= 2) return attIndex;
  return globalIndex % 3;
};

const getCoords = (
  position: string,
  globalIndex: number,
  isHome: boolean,
  activeEvent?: MatchEvent | null
): FormationSpot => {
  const formation = isHome ? FORMATION_433_HOME : FORMATION_433_AWAY;
  const category = getPositionCategory(position);
  const idx = getFormationIndex(position, globalIndex);

  const formationKey = category === "ATT" ? "ST" : category;
  const spots = formation[formationKey as keyof Formation];
  let baseX = 50;
  let baseY = isHome ? 75 : 25;

  if (spots && spots[idx]) {
    baseX = spots[idx].x;
    baseY = spots[idx].y;
  } else {
    if (category === "GK") baseY = isHome ? 90 : 10;
    else if (category === "DEF") baseY = isHome ? 78 : 22;
    else if (category === "MID") baseY = isHome ? 58 : 42;
    else baseY = isHome ? 35 : 65;
  }

  if (activeEvent) {
    const offset = getEventOffset(activeEvent.type, isHome, category);
    return {
      x: Math.max(5, Math.min(95, baseX + offset.x)),
      y: Math.max(5, Math.min(95, baseY + offset.y)),
    };
  }

  return { x: baseX, y: baseY };
};

const getRating = (player: TeamPlayer): number => {
  return Math.round(
    (player.pace +
      player.shooting +
      player.passing +
      player.dribbling +
      player.defending +
      player.physical) /
      6
  );
};

interface PlayerDotProps {
  player: TeamPlayer;
  index: number;
  isHome: boolean;
  activeEvent?: MatchEvent | null;
}

const PlayerDot: React.FC<PlayerDotProps> = ({ player, index, isHome, activeEvent }) => {
  const coords = getCoords(player.position, index, isHome, activeEvent);
  const fillColor = isHome ? "#3b82f6" : "#ef4444";
  const rating = getRating(player);
  const shortName = player.name.length > 12
    ? player.name.split(" ").slice(0, 2).join(" ").slice(0, 11)
    : player.name;

  return (
    <g>
      <circle
        cx={coords.x}
        cy={coords.y}
        r={7}
        fill={fillColor}
        stroke="#fff"
        strokeWidth={1.5}
      />
      <text
        x={coords.x}
        y={coords.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={5}
        fontWeight="bold"
      >
        {rating}
      </text>
      <text
        x={coords.x}
        y={coords.y + 13}
        textAnchor="middle"
        fill="#fff"
        fontSize={3.5}
        style={{ textShadow: "0 1px 2px #000" }}
      >
        {shortName}
      </text>
    </g>
  );
};

const sortPlayersByPosition = (players: TeamPlayer[]): TeamPlayer[] => {
  const order: Record<string, number> = {
    GK: 0,
    CB: 1,
    LB: 2,
    RB: 3,
    CM: 4,
    CDM: 5,
    CAM: 6,
    LM: 7,
    RM: 8,
    ST: 9,
    LW: 10,
    RW: 11,
  };

  return [...players].sort((a, b) => {
    const orderA = order[a.position] ?? 99;
    const orderB = order[b.position] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.id - b.id;
  });
};

const Pitch: React.FC<PitchProps> = ({ homeTeam, awayTeam, homeName, awayName, activeEvent }) => {
  const sortedHome = sortPlayersByPosition(homeTeam);
  const sortedAway = sortPlayersByPosition(awayTeam);

  return (
    <div className="pitch-container">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", maxWidth: 700, background: "#1a472a" }}
      >
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#2d5a3d" />
            <rect width="5" height="10" fill="#256b3a" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#grass)" />
        <rect
          x="2.5"
          y="2.5"
          width="95"
          height="95"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />
        <line x1="50" y1="2.5" x2="50" y2="97.5" stroke="#fff" strokeWidth={0.5} />
        <circle cx="50" cy="50" r="9" fill="none" stroke="#fff" strokeWidth={0.5} />
        <circle cx="50" cy="50" r={1} fill="#fff" />

        <rect
          x="2.5"
          y="2.5"
          width="95"
          height="20"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />
        <rect
          x="25"
          y="2.5"
          width="50"
          height="12"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />
        <rect
          x="40"
          y="2.5"
          width="20"
          height="6"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />

        <rect
          x="2.5"
          y="77.5"
          width="95"
          height="20"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />
        <rect
          x="25"
          y="85.5"
          width="50"
          height="12"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />
        <rect
          x="40"
          y="91.5"
          width="20"
          height="6"
          fill="none"
          stroke="#fff"
          strokeWidth={0.5}
        />

        <text
          x={50}
          y={8}
          textAnchor="middle"
          fill="#fff"
          fontSize={4.5}
          fontWeight="bold"
        >
          {awayName}
        </text>
        <text
          x={50}
          y={96}
          textAnchor="middle"
          fill="#fff"
          fontSize={4.5}
          fontWeight="bold"
        >
          {homeName}
        </text>

        {sortedAway.slice(0, 11).map((player, i) => (
          <PlayerDot
            key={`away-${player.id}`}
            player={player}
            index={i}
            isHome={false}
            activeEvent={activeEvent}
          />
        ))}
        {sortedHome.slice(0, 11).map((player, i) => (
          <PlayerDot
            key={`home-${player.id}`}
            player={player}
            index={i}
            isHome={true}
            activeEvent={activeEvent}
          />
        ))}
      </svg>
    </div>
  );
};

export default Pitch;
