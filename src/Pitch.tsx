import React from "react";
import type { TeamPlayer } from "./types";

interface PitchProps {
  homeTeam: TeamPlayer[];
  awayTeam: TeamPlayer[];
  homeName: string;
  awayName: string;
}

const getPositionCategory = (position: string): "GK" | "DEF" | "MID" | "ATT" => {
  const p = position.toUpperCase();
  if (p === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB"].includes(p)) return "DEF";
  if (["CM", "CDM", "CAM", "LM", "RM"].includes(p)) return "MID";
  return "ATT";
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
  x: number;
  y: number;
  isHome: boolean;
}

const PlayerDot: React.FC<PlayerDotProps> = ({ player, x, y, isHome }) => {
  const fillColor = isHome ? "#3b82f6" : "#ef4444";
  const rating = getRating(player);
  const shortName = player.name.split(" ").slice(-1)[0]; 

  return (
    <g style={{ transition: "all 0.5s ease" }}>
      <circle cx={x} cy={y} r={6} fill={fillColor} opacity={0.3} />
      <circle
        cx={x}
        cy={y}
        r={4.5}
        fill={fillColor}
        stroke="#fff"
        strokeWidth={0.8}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={3.2}
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {rating}
      </text>
      <text
        x={x}
        y={y + 7.5}
        textAnchor="middle"
        fill="#fff"
        fontSize={2.8}
        fontWeight="bold"
        style={{ textShadow: "0 1px 2px #000", pointerEvents: "none" }}
      >
        {shortName}
      </text>
    </g>
  );
};

const Pitch: React.FC<PitchProps> = ({ homeTeam, awayTeam, homeName, awayName }) => {
  const renderTeam = (team: TeamPlayer[], isHome: boolean) => {
    const categories: Record<string, TeamPlayer[]> = {
      GK: [],
      DEF: [],
      MID: [],
      ATT: [],
    };

    team.forEach((p) => {
      const cat = getPositionCategory(p.position);
      if (categories[cat]) {
        categories[cat].push(p);
      }
    });

    const rows = isHome
      ? [
          { cat: "GK", y: 90 },
          { cat: "DEF", y: 75 },
          { cat: "MID", y: 60 },
          { cat: "ATT", y: 45 },
        ]
      : [
          { cat: "GK", y: 10 },
          { cat: "DEF", y: 25 },
          { cat: "MID", y: 40 },
          { cat: "ATT", y: 55 },
        ];

    return rows.flatMap((row) => {
      const players = categories[row.cat] || [];
      return players.map((p, i) => {
        const count = players.length;
        const x = count === 1 ? 50 : 20 + (i * (60 / (count - 1)));
        return (
          <PlayerDot
            key={`${isHome ? "home" : "away"}-${p.id}-${i}`}
            player={p}
            x={x}
            y={row.y}
            isHome={isHome}
          />
        );
      });
    });
  };

  return (
    <div style={{ 
      background: "#121212", 
      padding: "20px", 
      borderRadius: "12px", 
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      border: "1px solid #333"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
        <div style={{ color: "#3b82f6", fontWeight: "bold", fontSize: "14px" }}>🔵 {homeName}</div>
        <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "14px" }}>🔴 {awayName}</div>
      </div>
      
      <div style={{ position: "relative", width: "100%", paddingTop: "100%" }}>
        <svg
          viewBox="0 0 100 100"
          style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%",
            borderRadius: "4px"
          }}
        >
          <defs>
            <linearGradient id="pitchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#1a472a", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#2d5a3d", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Pitch Grass */}
          <rect x="0" y="0" width="100" height="100" fill="url(#pitchGradient)" />
          
          {/* Lines */}
          <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.4)" />

          {/* Goals areas */}
          <rect x="30" y="5" width="40" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <rect x="30" y="80" width="40" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />

          {renderTeam(homeTeam, true)}
          {renderTeam(awayTeam, false)}
        </svg>
      </div>
    </div>
  );
};

export default Pitch;
