import { useState, useMemo } from "react";
import playersData from "../data/players.json";
import type { Player, TeamPlayer, SimulationResult } from "./types";
import { simulateMatch } from "./engine";
import Pitch from "./Pitch";

type AppPhase = "SETUP" | "SIMULATION";

interface SelectedPlayer {
  playerId: number;
  variantName: string;
}

const PLAYERS = playersData.players as Player[];

function App() {
  const [phase, setPhase] = useState<AppPhase>("SETUP");
  const [homeName, setHomeName] = useState("Equipo Local");
  const [awayName, setAwayName] = useState("Equipo Visitante");
  const [homeSelection, setHomeSelection] = useState<SelectedPlayer[]>([]);
  const [awaySelection, setAwaySelection] = useState<SelectedPlayer[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const availablePlayers = useMemo(() => {
    return PLAYERS.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      variants: p.variants.map((v) => v.name),
    }));
  }, []);

  const getPlayerById = (id: number): Player | undefined => {
    return PLAYERS.find((p) => p.id === id);
  };

  const addPlayer = (
    team: "home" | "away",
    playerId: number,
    variantName: string
  ) => {
    const selection = team === "home" ? homeSelection : awaySelection;
    const setSelection = team === "home" ? setHomeSelection : setAwaySelection;

    if (selection.length >= 11) return;
    if (selection.some((s) => s.playerId === playerId)) return;

    setSelection([...selection, { playerId, variantName }]);
  };

  const removePlayer = (team: "home" | "away", index: number) => {
    if (team === "home") {
      setHomeSelection((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAwaySelection((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (
    team: "home" | "away",
    index: number,
    variantName: string
  ) => {
    if (team === "home") {
      setHomeSelection((prev) =>
        prev.map((s, i) => (i === index ? { ...s, variantName } : s))
      );
    } else {
      setAwaySelection((prev) =>
        prev.map((s, i) => (i === index ? { ...s, variantName } : s))
      );
    }
  };

  const handleSimulate = () => {
    const homePlayerIds = homeSelection.map((s) => s.playerId);
    const awayPlayerIds = awaySelection.map((s) => s.playerId);

    const variantMap = new Map<number, string>();
    homeSelection.forEach((s) => variantMap.set(s.playerId, s.variantName));
    awaySelection.forEach((s) => variantMap.set(s.playerId, s.variantName));

    const homePlayers: Player[] = homePlayerIds
      .map((id) => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);

    const awayPlayers: Player[] = awayPlayerIds
      .map((id) => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);

    const homeTeam: TeamPlayer[] = homePlayers.map((p) => {
      const variantName = variantMap.get(p.id) ?? p.variants[0]?.name ?? "Prime";
      const variant = p.variants.find((v) => v.name === variantName) ?? p.variants[0];
      if (!variant) {
        return {
          id: p.id,
          name: `${p.name} (${p.variants[0]?.name ?? "Prime"})`,
          position: p.position,
          pace: p.variants[0]?.stats.pace ?? 70,
          shooting: p.variants[0]?.stats.shooting ?? 70,
          passing: p.variants[0]?.stats.passing ?? 70,
          dribbling: p.variants[0]?.stats.dribbling ?? 70,
          defending: p.variants[0]?.stats.defending ?? 70,
          physical: p.variants[0]?.stats.physical ?? 70,
          traits: p.traits.map((t) => ({ name: t, impact_stats: {}, description: "" })),
        };
      }
      return {
        id: p.id,
        name: `${p.name} (${variant.name})`,
        position: p.position,
        ...variant.stats,
        traits: p.traits.map((t) => ({ name: t, impact_stats: {}, description: "" })),
      };
    });

    const awayTeam: TeamPlayer[] = awayPlayers.map((p) => {
      const variantName = variantMap.get(p.id) ?? p.variants[0]?.name ?? "Prime";
      const variant = p.variants.find((v) => v.name === variantName) ?? p.variants[0];
      if (!variant) {
        return {
          id: p.id,
          name: `${p.name} (${p.variants[0]?.name ?? "Prime"})`,
          position: p.position,
          pace: p.variants[0]?.stats.pace ?? 70,
          shooting: p.variants[0]?.stats.shooting ?? 70,
          passing: p.variants[0]?.stats.passing ?? 70,
          dribbling: p.variants[0]?.stats.dribbling ?? 70,
          defending: p.variants[0]?.stats.defending ?? 70,
          physical: p.variants[0]?.stats.physical ?? 70,
          traits: p.traits.map((t) => ({ name: t, impact_stats: {}, description: "" })),
        };
      }
      return {
        id: p.id,
        name: `${p.name} (${variant.name})`,
        position: p.position,
        ...variant.stats,
        traits: p.traits.map((t) => ({ name: t, impact_stats: {}, description: "" })),
      };
    });

    const simulationResult = simulateMatch(homeTeam, awayTeam);
    setResult(simulationResult);
    setPhase("SIMULATION");
  };

  const handleBack = () => {
    setPhase("SETUP");
    setResult(null);
  };

  const getPlayerRating = (player: SelectedPlayer): number => {
    const p = getPlayerById(player.playerId);
    if (!p) return 0;
    const variant = p.variants.find((v) => v.name === player.variantName) ?? p.variants[0];
    if (!variant) return 0;
    const stats = variant.stats;
    return Math.round(
      (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical) / 6
    );
  };

  const homeRatings: TeamPlayer[] = homeSelection.map((s) => {
    const p = getPlayerById(s.playerId);
    const variant = p?.variants.find((v) => v.name === s.variantName) ?? p?.variants[0];
    if (!p || !variant) {
      return { id: s.playerId, name: p?.name ?? "Unknown", position: p?.position ?? "ST", pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70, traits: [] };
    }
    return {
      id: p.id,
      name: `${p.name} (${variant.name})`,
      position: p.position,
      ...variant.stats,
      traits: p.traits.map((t) => ({ name: t, impact_stats: {}, description: "" })),
    };
  });

  const awayRatings: TeamPlayer[] = awaySelection.map((s) => {
    const p = getPlayerById(s.playerId);
    const variant = p?.variants.find((v) => v.name === s.variantName) ?? p?.variants[0];
    if (!p || !variant) {
      return { id: s.playerId, name: p?.name ?? "Unknown", position: p?.position ?? "ST", pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70, traits: [] };
    }
    return {
      id: p.id,
      name: `${p.name} (${variant.name})`,
      position: p.position,
      ...variant.stats,
      traits: p.traits.map((t) => ({ name: t, impact_stats: {}, description: "" })),
    };
  });

  if (phase === "SIMULATION") {
    return (
      <div style={{ padding: "20px", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>⚽ Simulación de Partido</h1>
          <div style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "10px" }}>
            {homeName} {result ? `${result.homeScore}` : "?"} - {result ? `${result.awayScore}` : "?"} {awayName}
          </div>
          {result && (
            <div style={{ fontSize: "14px", color: "#aaa" }}>
              Posesión: {result.homePossession}% - {result.awayPossession}% | 
              Tiros: {result.homeShots} - {result.awayShots} | 
              Tiros al Arco: {result.homeShotsOnTarget} - {result.awayShotsOnTarget}
            </div>
          )}
        </div>
        <Pitch
          homeTeam={homeRatings}
          awayTeam={awayRatings}
          homeName={homeName}
          awayName={awayName}
        />
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={handleBack} style={{ background: "#555", color: "#fff" }}>
            Volver al Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", textAlign: "center" }}>
        ⚽ Subasta Futbolera - Setup
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div>
          <h2 style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #444", color: "#fff", fontSize: "18px", fontWeight: "bold" }}
            />
          </h2>
          <p style={{ color: "#aaa", marginBottom: "10px" }}>Jugadores seleccionados: {homeSelection.length}/11</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {homeSelection.map((s, i) => {
              const p = getPlayerById(s.playerId);
              return (
                <div key={`home-${s.playerId}`} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2a2a4a", padding: "8px", borderRadius: "6px" }}>
                  <span style={{ flex: 1 }}>{p?.name} ({s.variantName})</span>
                  <span style={{ color: "#aaa" }}>OVR: {getPlayerRating(s)}</span>
                  <select
                    value={s.variantName}
                    onChange={(e) => updateVariant("home", i, e.target.value)}
                    style={{ width: "120px" }}
                  >
                    {p?.variants.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removePlayer("home", i)} style={{ background: "#ef4444", color: "#fff", padding: "4px 8px" }}>✕</button>
                </div>
              );
            })}
          </div>

          <h3 style={{ marginBottom: "10px" }}>Jugadores Disponibles</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {availablePlayers.filter((p) => !homeSelection.some((s) => s.playerId === p.id)).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px", borderBottom: "1px solid #333" }}>
                <span style={{ flex: 1 }}>{p.name} ({p.position})</span>
                <select
                  value={p.variants[0]}
                  onChange={(e) => addPlayer("home", p.id, e.target.value)}
                  style={{ width: "120px" }}
                >
                  {p.variants.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={awayName}
              onChange={(e) => setAwayName(e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #444", color: "#fff", fontSize: "18px", fontWeight: "bold" }}
            />
          </h2>
          <p style={{ color: "#aaa", marginBottom: "10px" }}>Jugadores seleccionados: {awaySelection.length}/11</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {awaySelection.map((s, i) => {
              const p = getPlayerById(s.playerId);
              return (
                <div key={`away-${s.playerId}`} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2a2a4a", padding: "8px", borderRadius: "6px" }}>
                  <span style={{ flex: 1 }}>{p?.name} ({s.variantName})</span>
                  <span style={{ color: "#aaa" }}>OVR: {getPlayerRating(s)}</span>
                  <select
                    value={s.variantName}
                    onChange={(e) => updateVariant("away", i, e.target.value)}
                    style={{ width: "120px" }}
                  >
                    {p?.variants.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removePlayer("away", i)} style={{ background: "#ef4444", color: "#fff", padding: "4px 8px" }}>✕</button>
                </div>
              );
            })}
          </div>

          <h3 style={{ marginBottom: "10px" }}>Jugadores Disponibles</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {availablePlayers.filter((p) => !awaySelection.some((s) => s.playerId === p.id)).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px", borderBottom: "1px solid #333" }}>
                <span style={{ flex: 1 }}>{p.name} ({p.position})</span>
                <select
                  value={p.variants[0]}
                  onChange={(e) => addPlayer("away", p.id, e.target.value)}
                  style={{ width: "120px" }}
                >
                  {p.variants.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button
          onClick={handleSimulate}
          disabled={homeSelection.length !== 11 || awaySelection.length !== 11}
          style={{
            background: homeSelection.length === 11 && awaySelection.length === 11 ? "#22c55e" : "#444",
            color: "#fff",
            fontSize: "18px",
            padding: "15px 40px",
          }}
        >
          {homeSelection.length === 11 && awaySelection.length === 11
            ? "▶ Simular Partido"
            : `Seleccionar ${11 - homeSelection.length} más / ${11 - awaySelection.length} más`}
        </button>
      </div>
    </div>
  );
}

export default App;
