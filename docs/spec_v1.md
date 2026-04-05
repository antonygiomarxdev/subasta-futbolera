# 📋 SPEC: SUBASTA FUTBOLERA SIMULATOR (v1.0)

## 🛠️ Tech Stack
- **Frontend:** React + Vite (Static Export para GitHub Pages).
- **Styling:** Tailwind CSS (Estética dark/premium).
- **Simulación:** Motor 2D en Canvas o SVG (Estilo "FIFA Manager Simulation").

## ⚽ Funcionalidades Core
1. **DB de Jugadores (JSON):** 
   - Atributos: Ritmo, Tiro, Pase, Regate, Defensa, Fisico.
   - Variantes: "Base", "Prime", "Acabado" (multiplicadores de stats).
2. **Modo Administrador:**
   - Selección de 11 jugadores por equipo (Formación fija 4-3-3).
   - Botón de "Simular Partido".
3. **Motor de Simulación:**
   - Algoritmo que calcula la probabilidad de gol basado en el enfrentamiento de líneas (Delanteros vs Defensas).
   - Visualización de "bolitas" en el campo moviéndose (sin detalle, puro flujo de juego).
4. **Modos de Torneo:**
   - Liguilla (Todos contra todos) - Ideal para 5 jugadores.
   - Eliminatoria (Semifinales) - Ideal para 4 jugadores.

## 🎨 UI/UX
- Fondo de campo de fútbol minimalista.
- Tablero de puntuación en tiempo real durante la simulación.

## 🃏 Sistema de Modificadores (The 412 Factor)
Para capturar la esencia del programa, el motor debe incluir estados aleatorios:
1. **Pepe Expulsado:** El jugador no participa en el partido (el equipo juega con 10).
2. **Gordo (Modo Ronaldo Nazario):** -30% Ritmo, +20% Tiro.
3. **Motivado:** +10% en todos los atributos.
4. **Lesionado en el Calentamiento:** El jugador es sustituido por un jugador random de media 60.

## ⚙️ Ajuste al Motor de Simulación
- Si un equipo tiene un jugador con estado "Expulsado", la defensa y el medio campo pierden un 15% de efectividad total.

## 🎭 Sistema de Variantes (Dynamic Versions)
Cada jugador puede tener múltiples versiones históricas o "especiales":
- **Key:** Identificador único del jugador (ej: 'cr7').
- **Variants:** Lista de objetos con 'name', 'stats' e 'image_url'.
- **Ejemplos Icónicos:**
  - Cristiano Ronaldo: ['Sporting Joven', 'Man Utd Prime', 'Madrid Beast', 'Actual'].
  - Ronaldinho: ['Barca Prime', 'Milan Legend', 'Preso (Modo Cárcel)'].

## 🖼️ Gestión de Imágenes
- El motor debe buscar la imagen específica de la variante en /assets/players/{key}_{variant}.jpg.

## 🕒 MOTOR DE SIMULACIÓN v2.0 (MODO EN VIVO)
Para lograr el realismo que busca el Socio, el motor dejará de ser una suma instantánea y pasará a ser un generador de eventos:

1. **Bucle de 90 Minutos:** El simulador correrá 90 iteraciones.
2. **Generador de Eventos:** En cada minuto, el sistema calculará la probabilidad de:
   - **Tiro de Esquina:** Basado en disparos bloqueados por la defensa.
   - **Penal:** Basado en entradas fallidas en el área.
   - **Saque de Banda:** Basado en pases fallidos cerca de las bandas.
   - **Gol:** El clímax del evento.
3. **Timeline de Partido:** El resultado ahora incluirá un array `events: MatchEvent[]` con el minuto y la descripción.

## 🎬 ANIMACIONES Y VISUALES
- **Pitch dinámico:** Las "bolitas" de los jugadores se moverán a posiciones específicas según el evento (ej: todos al área en un córner).
- **Ticker de Texto:** Un letrero que diga "Min 45: ¡GOL de Messi!".
