/* ===================================================
   THE STITCH ROOM - Schools Manager
   schools.js
   =================================================== */

'use strict';

const SchoolsManager = {
  schools: [],
  activeFilter: 'All',
  dataPath: 'data/schools.json',

  /* --------------------------------------------------
     Load schools from JSON file
  -------------------------------------------------- */
  async loadSchools() {
    try {
      const response = await fetch(this.dataPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.schools = data.schools || [];
      return this.schools;
    } catch (err) {
      console.error('SchoolsManager: Failed to load schools.json', err);
      this.schools = [];
      return [];
    }
  },

  /* --------------------------------------------------
     Filter schools by city/category
  -------------------------------------------------- */
  filterByCategory(category) {
    if (!category || category === 'All') return [...this.schools];
    return this.schools.filter(s => s.category === category);
  },

  /* --------------------------------------------------
     Get school by id
  -------------------------------------------------- */
  getById(id) {
    return this.schools.find(s => s.id === parseInt(id));
  },

  /* --------------------------------------------------
     Render school cards into a container
  -------------------------------------------------- */
  renderCards(container, schools) {
    if (!container) return;

    if (!schools || schools.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-school"></i>
          <h3>No Schools Found</h3>
          <p>No schools match the selected filter.</p>
        </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    schools.forEach((school, index) => {
      const card = document.createElement('div');
      card.className = 'school-card';
      card.dataset.id = school.id;
      card.dataset.reveal = 'fade-up';
      card.style.transitionDelay = `${(index % 6) * 0.06}s`;

      card.innerHTML = `
        <div class="school-card-image">
          <img src="${school.image}"
               alt="${school.name}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
               loading="lazy">
          <div class="school-card-image-placeholder" style="display:none">🏫</div>
          <span class="school-card-badge">${school.type}</span>
        </div>
        <div class="school-card-body">
          <h3 class="school-card-name">${school.name}</h3>
          <p class="school-card-location">
            <i class="fas fa-map-marker-alt"></i>
            ${school.city}, ${school.state}
          </p>
          <div class="school-card-meta">
            <span class="school-meta-item">
              <i class="fas fa-users"></i>
              ${school.students.toLocaleString()} Students
            </span>
            <span class="school-meta-item">
              <i class="fas fa-calendar"></i>
              Est. ${school.established}
            </span>
          </div>
          <p class="school-card-address" style="font-size:0.78rem;color:rgba(0,0,0,0.5);margin-bottom:1rem;line-height:1.4;">
            <i class="fas fa-location-dot" style="color:#6c63ff;margin-right:4px;"></i>
            ${school.address}
          </p>
          <div class="school-card-actions">
            <button class="btn btn-outline btn-sm" onclick="SchoolsManager.viewOnMap(${school.id})">
              <i class="fas fa-map"></i> View Map
            </button>
            <button class="btn btn-primary btn-sm" onclick="SchoolsManager.exploreSchool(${school.id})">
              <i class="fas fa-arrow-right"></i> Explore
            </button>
          </div>
        </div>`;

      fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    // Trigger reveal for newly added cards
    setTimeout(() => {
      container.querySelectorAll('[data-reveal]').forEach(el => {
        el.classList.add('revealed');
      });
    }, 50);
  },

  /* --------------------------------------------------
     Initialize filter tabs
  -------------------------------------------------- */
  initFilters(container, gridContainer) {
    const tabs = container.querySelectorAll('.filter-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active state
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        this.activeFilter = filter;

        // Get filtered schools
        const filtered = this.filterByCategory(filter);

        // Update count
        const countEl = document.getElementById('schools-count');
        if (countEl) {
          countEl.textContent = filtered.length;
        }

        // Render cards
        this.renderCards(gridContainer, filtered);

        // Update map if available
        if (window.MapManager && window.MapManager.map) {
          window.MapManager.filterMarkers(filter);
        }
      });
    });
  },

  /* --------------------------------------------------
     View school on map - scroll to map and highlight
  -------------------------------------------------- */
  viewOnMap(schoolId) {
    const school = this.getById(schoolId);
    if (!school) return;

    // If on clients page, scroll to map section
    const mapSection = document.getElementById('clients-map');
    if (mapSection) {
      const offset = 80;
      const top = mapSection.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      setTimeout(() => {
        if (window.MapManager) {
          window.MapManager.highlightSchool(schoolId);
        }
      }, 600);
    }
  },

  /* --------------------------------------------------
     Explore school (show detail or navigate)
  -------------------------------------------------- */
  exploreSchool(schoolId) {
    const school = this.getById(schoolId);
    if (!school) return;

    // Show a modal with school details
    this.showSchoolDetail(school);
  },

  /* --------------------------------------------------
     Show school detail modal
  -------------------------------------------------- */
  showSchoolDetail(school) {
    // Remove existing modal
    const existing = document.getElementById('school-detail-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'school-detail-modal';
    modal.className = 'admin-modal-overlay open';
    modal.innerHTML = `
      <div class="admin-modal" style="max-width:500px;">
        <div class="admin-modal-header">
          <h3>${school.name}</h3>
          <button class="modal-close-btn" id="close-school-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="admin-modal-body">
          <div class="school-card-image" style="height:160px;border-radius:12px;overflow:hidden;margin-bottom:1.5rem;">
            <img src="${school.image}" alt="${school.name}" style="width:100%;height:100%;object-fit:cover;"
              onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#1a0a2e,#0f0f2a)'; this.parentElement.innerHTML='<div style=\'display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;\'>🏫</div>'">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
            <div style="background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.2);border-radius:10px;padding:1rem;text-align:center;">
              <div style="font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,#6c63ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${school.students.toLocaleString()}</div>
              <div style="font-size:0.75rem;color:rgba(0,0,0,0.5);margin-top:0.25rem;">Students</div>
            </div>
            <div style="background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.15);border-radius:10px;padding:1rem;text-align:center;">
              <div style="font-size:1.5rem;font-weight:800;color:#00d4ff;">${school.established}</div>
              <div style="font-size:0.75rem;color:rgba(0,0,0,0.5);margin-top:0.25rem;">Established</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <div style="display:flex;align-items:flex-start;gap:0.75rem;font-size:0.875rem;color:rgba(0,0,0,0.7);">
              <i class="fas fa-map-marker-alt" style="color:#6c63ff;margin-top:3px;min-width:14px;"></i>
              <span>${school.address}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem;font-size:0.875rem;color:rgba(0,0,0,0.7);">
              <i class="fas fa-city" style="color:#6c63ff;min-width:14px;"></i>
              <span>${school.city}, ${school.state}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem;font-size:0.875rem;color:rgba(0,0,0,0.7);">
              <i class="fas fa-graduation-cap" style="color:#6c63ff;min-width:14px;"></i>
              <span>${school.type} School</span>
            </div>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="btn btn-outline btn-sm" id="close-school-modal-2">Close</button>
          <button class="btn btn-primary btn-sm" onclick="SchoolsManager.viewOnMap(${school.id}); document.getElementById('school-detail-modal').remove();">
            <i class="fas fa-map"></i> View on Map
          </button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    document.getElementById('close-school-modal').addEventListener('click', () => modal.remove());
    document.getElementById('close-school-modal-2').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  },

  /* --------------------------------------------------
     Initialize page - load and display all schools
  -------------------------------------------------- */
  async init(gridId = 'schools-grid', filterContainerId = 'filter-container') {
    await this.loadSchools();

    const grid = document.getElementById(gridId);
    const filterContainer = document.getElementById(filterContainerId);

    if (grid) {
      this.renderCards(grid, this.schools);
    }

    if (filterContainer && grid) {
      this.initFilters(filterContainer, grid);
    }

    // Update count
    const countEl = document.getElementById('schools-count');
    if (countEl) countEl.textContent = this.schools.length;

    return this.schools;
  }
};

// Auto-init on DOM ready if on clients page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('schools-grid')) {
    SchoolsManager.init();
  }
});

window.SchoolsManager = SchoolsManager;

