/* ===================================================
   THE STITCH ROOM - Interactive Map Manager
   map.js - Leaflet.js Tamil Nadu Map
   =================================================== */

'use strict';

const MapManager = {
  map: null,
  markers: {},
  schools: [],
  activeMarkerId: null,

  // Tamil Nadu bounds
  tamilNaduBounds: [[7.9, 76.2], [13.6, 80.4]],
  tamilNaduCenter: [10.8505, 78.6677],
  defaultZoom: 7,

  /* --------------------------------------------------
     Create custom marker icon
  -------------------------------------------------- */
  createIcon(active = false) {
    const color = active ? '#00d4ff' : '#6c63ff';
    const size = active ? 14 : 11;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <defs>
          <radialGradient id="mg${Math.random().toString(36).substr(2,5)}" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="${active ? '#00d4ff' : '#a855f7'}"/>
            <stop offset="100%" stop-color="${color}"/>
          </radialGradient>
        </defs>
        <ellipse cx="15" cy="37" rx="6" ry="3" fill="rgba(0,0,0,0.3)"/>
        <path d="M15 2C9.48 2 5 6.48 5 12c0 7.5 10 26 10 26S25 19.5 25 12c0-5.52-4.48-10-10-10z"
              fill="url(#mg${Math.random().toString(36).substr(2,5)})"
              stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
        <circle cx="15" cy="12" r="${size/2 + 1}" fill="rgba(0,0,0,0.9)"/>
        <circle cx="15" cy="12" r="${size/2 - 1}" fill="${color}"/>
      </svg>`;

    return L.divIcon({
      html: `<div style="filter:drop-shadow(0 4px 8px ${color}99)">${svg}</div>`,
      className: '',
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -42]
    });
  },

  /* --------------------------------------------------
     Initialize map
  -------------------------------------------------- */
  init(containerId = 'home-map') {
    const container = document.getElementById(containerId);
    if (!container || !window.L) return;

    // Destroy existing map instance
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = {};
    }

    this.map = L.map(containerId, {
      center: this.tamilNaduCenter,
      zoom: this.defaultZoom,
      minZoom: 6,
      maxZoom: 16,
      maxBounds: [[6.5, 75.5], [14.5, 81.5]],
      maxBoundsViscosity: 0.8,
      zoomControl: true,
      attributionControl: false
    });

    // Dark premium tile layer (CartoDB Dark Matter)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    // Add Tamil Nadu label overlay
    this.addStateLabel();

    return this.map;
  },

  /* --------------------------------------------------
     Add a state label
  -------------------------------------------------- */
  addStateLabel() {
    if (!this.map) return;
    const label = L.divIcon({
      html: `<div style="
        background: rgba(108,99,255,0.15);
        border: 1px solid rgba(108,99,255,0.3);
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        color: rgba(0,0,0,0.7);
        letter-spacing: 2px;
        text-transform: uppercase;
        backdrop-filter: blur(10px);
        white-space: nowrap;
      ">Tamil Nadu</div>`,
      className: '',
      iconAnchor: [40, 0]
    });
    L.marker([11.2, 78.5], { icon: label, interactive: false }).addTo(this.map);
  },

  /* --------------------------------------------------
     Add school markers
  -------------------------------------------------- */
  addSchoolMarkers(schools) {
    if (!this.map) return;

    schools.forEach(school => {
      if (!school.latitude || !school.longitude) return;

      const icon = this.createIcon(false);
      const marker = L.marker([school.latitude, school.longitude], { icon })
        .addTo(this.map);

      // Popup content
      marker.bindPopup(`
        <div style="min-width:200px;font-family:'Poppins',sans-serif;">
          <div class="map-popup-title">${school.name}</div>
          <div class="map-popup-city">
            <i style="color:#00d4ff;margin-right:4px;" class="fas fa-map-marker-alt"></i>
            ${school.city}, ${school.state}
          </div>
          <div class="map-popup-detail">
            <i style="color:#6c63ff;margin-right:4px;" class="fas fa-users"></i>
            ${school.students.toLocaleString()} Students
          </div>
          <div class="map-popup-detail">
            <i style="color:#6c63ff;margin-right:4px;" class="fas fa-graduation-cap"></i>
            ${school.type} &bull; Est. ${school.established}
          </div>
          <div class="map-popup-detail" style="font-size:0.72rem;color:rgba(0,0,0,0.4);margin-top:0.35rem;">
            ${school.address}
          </div>
        </div>
      `, {
        maxWidth: 280,
        className: 'custom-popup'
      });

      // Tooltip on hover
      marker.bindTooltip(school.name, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip',
        offset: [0, -45]
      });

      this.markers[school.id] = { marker, school };
    });
  },

  /* --------------------------------------------------
     Highlight a specific school
  -------------------------------------------------- */
  highlightSchool(schoolId) {
    const id = parseInt(schoolId);
    const entry = this.markers[id];
    if (!entry || !this.map) return;

    // Reset previous active marker
    if (this.activeMarkerId && this.markers[this.activeMarkerId]) {
      const prev = this.markers[this.activeMarkerId];
      prev.marker.setIcon(this.createIcon(false));
    }

    // Activate new marker
    entry.marker.setIcon(this.createIcon(true));
    this.activeMarkerId = id;

    // Pan and zoom to school
    this.map.flyTo([entry.school.latitude, entry.school.longitude], 13, {
      duration: 1.2,
      easeLinearity: 0.4
    });

    // Open popup after animation
    setTimeout(() => {
      entry.marker.openPopup();
    }, 1300);
  },

  /* --------------------------------------------------
     Filter markers by category
  -------------------------------------------------- */
  filterMarkers(category) {
    if (!this.map) return;

    Object.values(this.markers).forEach(({ marker, school }) => {
      if (category === 'All' || school.category === category) {
        if (!this.map.hasLayer(marker)) {
          marker.addTo(this.map);
        }
      } else {
        if (this.map.hasLayer(marker)) {
          this.map.removeLayer(marker);
        }
      }
    });
  },

  /* --------------------------------------------------
     Search school by name/city and highlight
  -------------------------------------------------- */
  searchSchool(query) {
    if (!query.trim()) return;
    const q = query.toLowerCase();

    const match = Object.values(this.markers).find(({ school }) =>
      school.name.toLowerCase().includes(q) ||
      school.city.toLowerCase().includes(q)
    );

    if (match) {
      this.highlightSchool(match.school.id);
      return match.school;
    }
    return null;
  },

  /* --------------------------------------------------
     Reset map view to Tamil Nadu
  -------------------------------------------------- */
  resetView() {
    if (!this.map) return;
    this.map.flyTo(this.tamilNaduCenter, this.defaultZoom, { duration: 1 });

    if (this.activeMarkerId && this.markers[this.activeMarkerId]) {
      this.markers[this.activeMarkerId].marker.setIcon(this.createIcon(false));
      this.activeMarkerId = null;
    }
  },

  /* --------------------------------------------------
     Full init: create map + load schools + add markers
  -------------------------------------------------- */
  async fullInit(containerId = 'home-map') {
    this.init(containerId);

    // Load schools if not already loaded
    let schools = [];
    if (window.SchoolsManager && window.SchoolsManager.schools.length > 0) {
      schools = window.SchoolsManager.schools;
    } else {
      try {
        const r = await fetch('data/schools.json');
        const d = await r.json();
        schools = d.schools || [];
      } catch (e) {
        console.error('MapManager: Failed to load schools', e);
      }
    }

    this.schools = schools;
    this.addSchoolMarkers(schools);

    return schools;
  }
};

/* --------------------------------------------------
   Initialize maps on page load
-------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Home page map
  if (document.getElementById('home-map')) {
    MapManager.fullInit('home-map');
  }

  // Clients page map
  if (document.getElementById('clients-map')) {
    // Init after schools are loaded
    const initClientsMap = async () => {
      await MapManager.fullInit('clients-map');
    };

    if (window.SchoolsManager && window.SchoolsManager.schools.length > 0) {
      initClientsMap();
    } else {
      // Wait a bit for schools to load
      setTimeout(initClientsMap, 500);
    }
  }
});

window.MapManager = MapManager;



