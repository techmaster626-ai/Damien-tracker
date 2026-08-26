/**
 * Interactive Water Polo Pool Diagram and Shot Chart / Heatmap Engine
 * Features:
 * - Regulation SVG Pool layout with 2m (red), 5m (yellow), 6m (green), half line, and re-entry boxes.
 * - 3x3 Goal Mouth Target Grid + Crossbar & Post Zones.
 * - Interactive shot placement & outcome marker rendering.
 * - Heatmap density overlay & multi-dimensional filtering (Team, Player, Shot Type, Outcome).
 */

import { state } from './state.js';

export class PoolChartEngine {
  constructor(containerEl, goalContainerEl, options = {}) {
    this.container = containerEl;
    this.goalContainer = goalContainerEl;
    this.options = {
      interactive: true,
      onLocationSelect: null,
      ...options
    };

    this.currentFilter = {
      team: 'all', // 'all' | 'home' | 'away'
      outcome: 'all', // 'all' | 'goal' | 'save' | 'miss' | 'block'
      cap: 'all',
      quarter: 'all'
    };

    this.selectedCoords = null;
    this.selectedGoalZone = 'top_right';

    this.init();
  }

  init() {
    this.renderPoolSVG();
    this.renderGoalGrid();
    this.bindEvents();

    state.subscribe(() => {
      this.renderShots();
    });
  }

  renderPoolSVG() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="pool-chart-wrapper">
        <div class="pool-header-controls">
          <div class="filter-group">
            <label>Team:</label>
            <select id="pool-filter-team" class="chart-select">
              <option value="all">Both Teams</option>
              <option value="home">${state.match?.homeTeam?.name || 'Home'}</option>
              <option value="away">${state.match?.awayTeam?.name || 'Away'}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Outcome:</label>
            <select id="pool-filter-outcome" class="chart-select">
              <option value="all">All Outcomes</option>
              <option value="goal">Goals Only (🟢)</option>
              <option value="save">Saves (🔵)</option>
              <option value="miss">Misses (🔴)</option>
              <option value="block">Blocks (🟡)</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Quarter:</label>
            <select id="pool-filter-q" class="chart-select">
              <option value="all">All Quarters</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
            </select>
          </div>
        </div>

        <div class="pool-svg-container" id="pool-svg-board">
          <svg viewBox="0 0 400 320" class="pool-svg" id="pool-interactive-svg">
            <defs>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#07223d" />
                <stop offset="50%" stop-color="#0c355b" />
                <stop offset="100%" stop-color="#082b4a" />
              </linearGradient>
              <pattern id="waterTile" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 Q 5 5 10 10 T 20 10" fill="none" stroke="rgba(0, 229, 255, 0.04)" stroke-width="1"/>
              </pattern>
            </defs>

            <!-- Pool Water Background -->
            <rect x="10" y="10" width="380" height="300" rx="8" fill="url(#waterGrad)" />
            <rect x="10" y="10" width="380" height="300" rx="8" fill="url(#waterTile)" />
            <rect x="10" y="10" width="380" height="300" rx="8" fill="none" stroke="rgba(0, 229, 255, 0.4)" stroke-width="2" />

            <!-- Half Distance Line (White) -->
            <line x1="10" y1="20" x2="390" y2="20" stroke="#f8fafc" stroke-width="2" stroke-dasharray="6,4" />
            <text x="200" y="18" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">HALF DISTANCE (15m)</text>

            <!-- 6-Meter Line (Direct Shot / Yellow-Green Marker) -->
            <line x1="10" y1="130" x2="390" y2="130" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8" />
            <rect x="12" y="122" width="28" height="14" rx="3" fill="#10b981" />
            <text x="26" y="132" text-anchor="middle" fill="#022c22" font-size="9" font-weight="bold">6m</text>
            <rect x="360" y="122" width="28" height="14" rx="3" fill="#10b981" />
            <text x="374" y="132" text-anchor="middle" fill="#022c22" font-size="9" font-weight="bold">6m</text>

            <!-- 5-Meter Line (Penalty Line / Yellow Cone) -->
            <line x1="10" y1="170" x2="390" y2="170" stroke="#eab308" stroke-width="2" stroke-dasharray="5,3" opacity="0.9" />
            <polygon points="12,170 26,160 26,180" fill="#eab308" />
            <text x="38" y="174" fill="#eab308" font-size="10" font-weight="bold">5m PENALTY</text>
            <polygon points="388,170 374,160 374,180" fill="#eab308" />
            <text x="362" y="174" text-anchor="end" fill="#eab308" font-size="10" font-weight="bold">5m</text>

            <!-- 2-Meter Offside Line (Red Cone) -->
            <line x1="10" y1="255" x2="390" y2="255" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,2" opacity="0.9" />
            <polygon points="12,255 26,245 26,265" fill="#ef4444" />
            <text x="38" y="259" fill="#ef4444" font-size="10" font-weight="bold">2m OFFSIDE</text>
            <polygon points="388,255 374,245 374,265" fill="#ef4444" />
            <text x="362" y="259" text-anchor="end" fill="#ef4444" font-size="10" font-weight="bold">2m</text>

            <!-- 2m Center Hole Zone -->
            <ellipse cx="200" cy="275" rx="36" ry="16" fill="rgba(239, 68, 68, 0.08)" stroke="rgba(239, 68, 68, 0.3)" stroke-dasharray="2,2" />
            <text x="200" y="278" text-anchor="middle" fill="rgba(255, 255, 255, 0.5)" font-size="9">2m HOLE SET</text>

            <!-- Goal Net Area (Bottom) -->
            <rect x="140" y="295" width="120" height="15" fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" stroke-width="2" rx="2" />
            <line x1="140" y1="295" x2="260" y2="295" stroke="#ffffff" stroke-width="3" />
            <!-- Goal posts -->
            <circle cx="140" cy="295" r="4" fill="#ffffff" stroke="#ef4444" stroke-width="2" />
            <circle cx="260" cy="295" r="4" fill="#ffffff" stroke="#ef4444" stroke-width="2" />
            <text x="200" y="306" text-anchor="middle" fill="#00e5ff" font-size="10" font-weight="bold">GOAL CAGE (3.0m)</text>

            <!-- Re-entry Exclusion Corner Areas -->
            <rect x="10" y="280" width="30" height="30" fill="rgba(234, 179, 8, 0.15)" stroke="#eab308" stroke-dasharray="2,2" />
            <text x="25" y="298" text-anchor="middle" fill="#eab308" font-size="8">RE-ENTRY</text>

            <rect x="360" y="280" width="30" height="30" fill="rgba(234, 179, 8, 0.15)" stroke="#eab308" stroke-dasharray="2,2" />
            <text x="375" y="298" text-anchor="middle" fill="#eab308" font-size="8">RE-ENTRY</text>

            <!-- Layer for dynamically rendered shots -->
            <g id="pool-shots-layer"></g>

            <!-- Active / Clicked placement crosshair indicator -->
            <g id="pool-crosshair" style="display: none;">
              <circle cx="0" cy="0" r="10" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="3,2" class="pulse-crosshair" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#00e5ff" stroke-width="2" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#00e5ff" stroke-width="2" />
            </g>
          </svg>
        </div>

        <div class="pool-legend">
          <div class="legend-item"><span class="legend-dot goal"></span> Goal</div>
          <div class="legend-item"><span class="legend-dot save"></span> Goalie Save</div>
          <div class="legend-item"><span class="legend-dot miss"></span> Miss / Bar</div>
          <div class="legend-item"><span class="legend-dot block"></span> Field Block</div>
        </div>
      </div>
    `;

    this.renderShots();
  }

  renderGoalGrid() {
    if (!this.goalContainer) return;

    this.goalContainer.innerHTML = `
      <div class="goal-face-card">
        <div class="goal-face-header">
          <h4>Goal Face Target Location</h4>
          <span class="goal-subtitle">Select placement quadrant</span>
        </div>
        <div class="goal-face-frame">
          <div class="crossbar-label">CROSSBAR</div>
          <div class="goal-grid-3x3">
            <button type="button" class="goal-quad-btn" data-zone="top_left">
              <span class="quad-title">Top Left</span>
              <span class="quad-stat" id="stat-quad-top_left">0</span>
            </button>
            <button type="button" class="goal-quad-btn" data-zone="top_center">
              <span class="quad-title">Top Center</span>
              <span class="quad-stat" id="stat-quad-top_center">0</span>
            </button>
            <button type="button" class="goal-quad-btn active" data-zone="top_right">
              <span class="quad-title">Top Right</span>
              <span class="quad-stat" id="stat-quad-top_right">0</span>
            </button>
            
            <button type="button" class="goal-quad-btn" data-zone="mid_left">
              <span class="quad-title">Mid Left</span>
              <span class="quad-stat" id="stat-quad-mid_left">0</span>
            </button>
            <button type="button" class="goal-quad-btn" data-zone="mid_center">
              <span class="quad-title">Center (GK)</span>
              <span class="quad-stat" id="stat-quad-mid_center">0</span>
            </button>
            <button type="button" class="goal-quad-btn" data-zone="mid_right">
              <span class="quad-title">Mid Right</span>
              <span class="quad-stat" id="stat-quad-mid_right">0</span>
            </button>
            
            <button type="button" class="goal-quad-btn" data-zone="bottom_left">
              <span class="quad-title">Low Left (Skip)</span>
              <span class="quad-stat" id="stat-quad-bottom_left">0</span>
            </button>
            <button type="button" class="goal-quad-btn" data-zone="bottom_center">
              <span class="quad-title">Low Center</span>
              <span class="quad-stat" id="stat-quad-bottom_center">0</span>
            </button>
            <button type="button" class="goal-quad-btn" data-zone="bottom_right">
              <span class="quad-title">Low Right (Skip)</span>
              <span class="quad-stat" id="stat-quad-bottom_right">0</span>
            </button>
          </div>
          <div class="goal-outside-row">
            <button type="button" class="goal-outer-btn" data-zone="bar">Hit Crossbar</button>
            <button type="button" class="goal-outer-btn" data-zone="post">Hit Post</button>
            <button type="button" class="goal-outer-btn" data-zone="wide">Wide / Over</button>
          </div>
        </div>
      </div>
    `;

    this.bindGoalGridEvents();
    this.updateGoalStats();
  }

  bindGoalGridEvents() {
    const btns = this.goalContainer.querySelectorAll('.goal-quad-btn, .goal-outer-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedGoalZone = btn.dataset.zone;
      });
    });
  }

  updateGoalStats() {
    if (!state.match) return;
    const counts = {
      top_left: 0, top_center: 0, top_right: 0,
      mid_left: 0, mid_center: 0, mid_right: 0,
      bottom_left: 0, bottom_center: 0, bottom_right: 0
    };

    state.match.events.forEach(ev => {
      if (ev.targetZone && counts[ev.targetZone] !== undefined) {
        counts[ev.targetZone]++;
      }
    });

    Object.keys(counts).forEach(zone => {
      const el = document.getElementById(`stat-quad-${zone}`);
      if (el) el.textContent = counts[zone];
    });
  }

  bindEvents() {
    const svgEl = document.getElementById('pool-interactive-svg');
    const crosshair = document.getElementById('pool-crosshair');

    if (svgEl) {
      svgEl.addEventListener('click', (e) => {
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgEl.getScreenCTM().inverse());

        // Clamp to pool bounds (X: 20-380, Y: 20-290)
        const clampedX = Math.max(20, Math.min(380, svgP.x));
        const clampedY = Math.max(20, Math.min(290, svgP.y));

        // Percentage for storage (X: 0-100%, Y: 0-100%)
        const pctX = Math.round(((clampedX - 10) / 380) * 100);
        const pctY = Math.round(((clampedY - 10) / 300) * 100);

        this.selectedCoords = { x: pctX, y: pctY };

        if (crosshair) {
          crosshair.setAttribute('transform', `translate(${clampedX}, ${clampedY})`);
          crosshair.style.display = 'block';
        }

        if (this.options.onLocationSelect) {
          this.options.onLocationSelect(this.selectedCoords);
        }
      });
    }

    // Filter changes
    const teamSelect = document.getElementById('pool-filter-team');
    const outcomeSelect = document.getElementById('pool-filter-outcome');
    const qSelect = document.getElementById('pool-filter-q');

    if (teamSelect) {
      teamSelect.addEventListener('change', (e) => {
        this.currentFilter.team = e.target.value;
        this.renderShots();
      });
    }
    if (outcomeSelect) {
      outcomeSelect.addEventListener('change', (e) => {
        this.currentFilter.outcome = e.target.value;
        this.renderShots();
      });
    }
    if (qSelect) {
      qSelect.addEventListener('change', (e) => {
        this.currentFilter.quarter = e.target.value;
        this.renderShots();
      });
    }
  }

  setPlacement(pctX, pctY) {
    this.selectedCoords = { x: pctX, y: pctY };
    const crosshair = document.getElementById('pool-crosshair');
    if (crosshair) {
      const svgX = 10 + (pctX / 100) * 380;
      const svgY = 10 + (pctY / 100) * 300;
      crosshair.setAttribute('transform', `translate(${svgX}, ${svgY})`);
      crosshair.style.display = 'block';
    }
  }

  renderShots() {
    const layer = document.getElementById('pool-shots-layer');
    if (!layer || !state.match) return;

    layer.innerHTML = '';
    const events = state.match.events || [];

    // Filter events
    const shotEvents = events.filter(ev => {
      const isShot = ev.isGoal || ev.type === 'miss' || ev.type === 'save' || ev.type === 'block';
      if (!isShot) return false;

      if (this.currentFilter.team !== 'all' && ev.team !== this.currentFilter.team) return false;
      if (this.currentFilter.quarter !== 'all' && ev.q !== parseInt(this.currentFilter.quarter)) return false;

      if (this.currentFilter.outcome === 'goal' && !ev.isGoal) return false;
      if (this.currentFilter.outcome === 'save' && ev.type !== 'save') return false;
      if (this.currentFilter.outcome === 'miss' && ev.type !== 'miss') return false;
      if (this.currentFilter.outcome === 'block' && ev.type !== 'block') return false;

      return true;
    });

    shotEvents.forEach(ev => {
      const pctX = ev.poolX !== undefined ? ev.poolX : 50;
      const pctY = ev.poolY !== undefined ? ev.poolY : 50;

      const svgX = 10 + (pctX / 100) * 380;
      const svgY = 10 + (pctY / 100) * 300;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'pool-shot-marker');
      g.setAttribute('data-id', ev.id);

      // Trajectory trajectory line to goal mouth
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', svgX);
      line.setAttribute('y1', svgY);
      line.setAttribute('x2', 200);
      line.setAttribute('y2', 295);
      line.setAttribute('stroke', ev.isGoal ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.25)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '3,3');
      g.appendChild(line);

      // Marker shape
      if (ev.isGoal) {
        // Green pulsating goal circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', svgX);
        circle.setAttribute('cy', svgY);
        circle.setAttribute('r', '7');
        circle.setAttribute('fill', '#10b981');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', svgX);
        text.setAttribute('y', svgY + 3.5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#022c22');
        text.setAttribute('font-size', '8');
        text.setAttribute('font-weight', 'bold');
        text.textContent = ev.cap || 'G';
        g.appendChild(text);
      } else if (ev.type === 'save') {
        // Blue diamond
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const size = 6;
        poly.setAttribute('points', `${svgX},${svgY - size} ${svgX + size},${svgY} ${svgX},${svgY + size} ${svgX - size},${svgY}`);
        poly.setAttribute('fill', '#38bdf8');
        poly.setAttribute('stroke', '#0c4a6e');
        poly.setAttribute('stroke-width', '1.5');
        g.appendChild(poly);
      } else if (ev.type === 'block') {
        // Amber square
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', svgX - 5);
        rect.setAttribute('y', svgY - 5);
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', '#f59e0b');
        rect.setAttribute('stroke', '#78350f');
        rect.setAttribute('stroke-width', '1.5');
        g.appendChild(rect);
      } else {
        // Red cross for miss
        const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l1.setAttribute('x1', svgX - 5);
        l1.setAttribute('y1', svgY - 5);
        l1.setAttribute('x2', svgX + 5);
        l1.setAttribute('y2', svgY + 5);
        l1.setAttribute('stroke', '#ef4444');
        l1.setAttribute('stroke-width', '2.5');
        g.appendChild(l1);

        const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l2.setAttribute('x1', svgX + 5);
        l2.setAttribute('y1', svgY - 5);
        l2.setAttribute('x2', svgX - 5);
        l2.setAttribute('y2', svgY + 5);
        l2.setAttribute('stroke', '#ef4444');
        l2.setAttribute('stroke-width', '2.5');
        g.appendChild(l2);
      }

      // Title hover tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      const teamName = ev.team === 'home' ? state.match.homeTeam.name : state.match.awayTeam.name;
      title.textContent = `${ev.isGoal ? 'GOAL' : ev.type.toUpperCase()} | ${teamName} #${ev.cap || '?'} | Q${ev.q} ${ev.timeStr} | Type: ${ev.shotType || 'Standard'}`;
      g.appendChild(title);

      layer.appendChild(g);
    });

    this.updateGoalStats();
  }
}
