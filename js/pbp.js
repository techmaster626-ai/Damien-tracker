/**
 * Play-by-Play Live Feed and Event Management
 * Features:
 * - Chronological event timeline with quarter groupings
 * - Instant filtering (Goals, Exclusions/Fouls, Saves/Blocks, Timeouts)
 * - Single-click event deletion with automated score & stat recalculation
 */

import { state } from './state.js';

export class PlayByPlayRenderer {
  constructor(containerEl) {
    this.container = containerEl;
    this.filterType = 'all'; // 'all' | 'goal' | 'foul' | 'save' | 'timeout'
    this.filterQuarter = 'all';

    this.init();
  }

  init() {
    state.subscribe(() => {
      this.render();
    });
    this.render();
  }

  render() {
    if (!this.container || !state.match) return;

    const events = [...(state.match.events || [])].reverse(); // newest first

    const filtered = events.filter(ev => {
      if (this.filterQuarter !== 'all' && ev.q !== parseInt(this.filterQuarter)) return false;
      if (this.filterType === 'goal' && !ev.isGoal) return false;
      if (this.filterType === 'foul' && ev.type !== 'exclusion' && ev.type !== 'penalty_drawn' && ev.type !== 'penalty_foul') return false;
      if (this.filterType === 'save' && ev.type !== 'save' && ev.type !== 'block') return false;
      if (this.filterType === 'timeout' && ev.type !== 'timeout') return false;
      return true;
    });

    this.container.innerHTML = `
      <div class="pbp-card">
        <div class="pbp-header">
          <div class="pbp-title-wrap">
            <h4>Live Match Timeline</h4>
            <span class="pbp-count">${filtered.length} Events</span>
          </div>
          <div class="pbp-filters">
            <select id="pbp-filter-q" class="pbp-select">
              <option value="all">All Quarters</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
            </select>
            <div class="pbp-pill-group">
              <button class="pbp-pill ${this.filterType === 'all' ? 'active' : ''}" data-type="all">All</button>
              <button class="pbp-pill ${this.filterType === 'goal' ? 'active' : ''}" data-type="goal">Goals 🟢</button>
              <button class="pbp-pill ${this.filterType === 'foul' ? 'active' : ''}" data-type="foul">Exclusions 🟡</button>
              <button class="pbp-pill ${this.filterType === 'save' ? 'active' : ''}" data-type="save">Saves 🔵</button>
            </div>
          </div>
        </div>

        <div class="pbp-timeline-scroll">
          ${filtered.length === 0 ? `
            <div class="pbp-empty">
              <span class="pbp-empty-icon">🤽‍♂️</span>
              <p>No events recorded matching the current filter.</p>
            </div>
          ` : `
            <div class="pbp-timeline-list">
              ${filtered.map(ev => this.renderEventItem(ev)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderEventItem(ev) {
    const isHome = ev.team === 'home';
    const teamObj = isHome ? state.match.homeTeam : state.match.awayTeam;
    const badgeBg = teamObj ? teamObj.capColor : '#ffffff';
    const badgeText = teamObj ? teamObj.capTextColor : '#000000';

    let icon = '⚡';
    let typeClass = 'event-general';

    if (ev.isGoal) {
      icon = '⚽';
      typeClass = 'event-goal';
    } else if (ev.type === 'exclusion') {
      icon = '⏱️';
      typeClass = 'event-exclusion';
    } else if (ev.type === 'penalty_drawn' || ev.type === 'penalty_foul') {
      icon = '🎯';
      typeClass = 'event-penalty';
    } else if (ev.type === 'save') {
      icon = '🧤';
      typeClass = 'event-save';
    } else if (ev.type === 'steal') {
      icon = '🤹';
      typeClass = 'event-steal';
    } else if (ev.type === 'block') {
      icon = '🛡️';
      typeClass = 'event-block';
    } else if (ev.type === 'timeout') {
      icon = '⏸️';
      typeClass = 'event-timeout';
    } else if (ev.type === 'sprint') {
      icon = '🏊';
      typeClass = 'event-sprint';
    }

    return `
      <div class="pbp-event-item ${typeClass}" data-id="${ev.id}">
        <div class="pbp-time-col">
          <span class="pbp-q-badge">Q${ev.q}</span>
          <span class="pbp-clock">${ev.timeStr}</span>
        </div>

        <div class="pbp-team-badge-col">
          <span class="pbp-cap-badge" style="background-color: ${badgeBg}; color: ${badgeText}; border: 1px solid #64748b;">
            #${ev.cap || '-'}
          </span>
        </div>

        <div class="pbp-desc-col">
          <div class="pbp-desc-text">
            ${ev.desc}
          </div>
          ${ev.shotType ? `<span class="pbp-tag shot-tag">${ev.shotType.toUpperCase()}</span>` : ''}
          ${ev.targetZone ? `<span class="pbp-tag zone-tag">${ev.targetZone.replace('_', ' ').toUpperCase()}</span>` : ''}
        </div>

        <div class="pbp-score-col">
          ${ev.isGoal ? `
            <span class="pbp-score-badge">${ev.homeScore} - ${ev.awayScore}</span>
          ` : ''}
        </div>

        <div class="pbp-actions-col">
          <button class="pbp-del-btn" data-id="${ev.id}" title="Delete event">✕</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const qSelect = this.container.querySelector('#pbp-filter-q');
    if (qSelect) {
      qSelect.value = this.filterQuarter;
      qSelect.addEventListener('change', (e) => {
        this.filterQuarter = e.target.value;
        this.render();
      });
    }

    const pills = this.container.querySelectorAll('.pbp-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        this.filterType = p.dataset.type;
        this.render();
      });
    });

    const delBtns = this.container.querySelectorAll('.pbp-del-btn');
    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        state.deleteEvent(id);
      });
    });
  }
}
