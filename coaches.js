// ========================================================
// MyRail - SVG Coach & Train Renderer (coaches.js)
// Detailed Indian Railways WAP-7 Locomotive & LHB/ICF Coaches
// ========================================================

const CoachSVGs = {
  // 1. Locomotive Engine (WAP-7 / Electric Loco)
  renderEngine(label = "LOCO") {
    return `
      <svg class="coach-svg" viewBox="0 0 170 85" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Locomotive ${label}">
        <!-- Coupler Rear -->
        <rect x="164" y="58" width="6" height="5" fill="#334155" rx="1"/>
        
        <!-- Track Rail & Sleepers -->
        <line x1="0" y1="80" x2="170" y2="80" stroke="#94a3b8" stroke-width="2.5"/>
        <line x1="12" y1="82" x2="18" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="38" y1="82" x2="44" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="64" y1="82" x2="70" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="90" y1="82" x2="96" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="116" y1="82" x2="122" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="142" y1="82" x2="148" y2="82" stroke="#64748b" stroke-width="4"/>

        <!-- Double Pantograph on Roof -->
        <polyline points="75,20 88,6 102,6 115,20" stroke="#94a3b8" stroke-width="2" fill="none"/>
        <line x1="84" y1="6" x2="106" y2="6" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round"/>
        <line x1="95" y1="6" x2="95" y2="20" stroke="#64748b" stroke-width="1.5"/>

        <!-- Bogies & Steel Wheels -->
        <rect x="22" y="66" width="46" height="6" rx="2" fill="#1e293b"/>
        <circle cx="32" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="32" cy="73" r="2.5" fill="#94a3b8"/>
        <circle cx="58" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="58" cy="73" r="2.5" fill="#94a3b8"/>

        <rect x="108" y="66" width="46" height="6" rx="2" fill="#1e293b"/>
        <circle cx="118" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="118" cy="73" r="2.5" fill="#94a3b8"/>
        <circle cx="144" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="144" cy="73" r="2.5" fill="#94a3b8"/>

        <!-- Cowcatcher / Cattle Guard -->
        <polygon points="2,66 14,66 8,76" fill="#475569" stroke="#1e293b"/>
        <line x1="5" y1="68" x2="9" y2="74" stroke="#94a3b8" stroke-width="1"/>

        <!-- Locomotive Main Body (Aerodynamic Front) -->
        <path d="M 6 65 L 164 65 L 164 20 L 46 20 Q 24 22 14 38 L 6 65 Z" fill="#b91c1c" stroke="#991b1b" stroke-width="1.5"/>
        
        <!-- Yellow Racing / Hazard Stripes -->
        <path d="M 10 44 L 164 44 L 164 48 L 8 48 Z" fill="#facc15"/>
        <path d="M 7 53 L 164 53 L 164 56 L 6 56 Z" fill="#facc15"/>

        <!-- Slanted Windshield & Glass Reflection -->
        <polygon points="28,24 45,24 41,37 20,37" fill="#0284c7" stroke="#0369a1" stroke-width="1"/>
        <line x1="28" y1="26" x2="38" y2="36" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>

        <!-- High-Beam Dual Headlight & Beam -->
        <polygon points="12,50 0,40 0,60" fill="rgba(254, 240, 138, 0.35)"/>
        <circle cx="12" cy="50" r="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <circle cx="12" cy="50" r="1.5" fill="#ffffff"/>

        <!-- Side Cab Door & Ventilation Grille -->
        <rect x="52" y="27" width="12" height="30" rx="1" fill="#991b1b" stroke="#7f1d1d"/>
        <line x1="72" y1="26" x2="94" y2="26" stroke="#7f1d1d" stroke-width="1.5"/>
        <line x1="72" y1="30" x2="94" y2="30" stroke="#7f1d1d" stroke-width="1.5"/>
        <line x1="72" y1="34" x2="94" y2="34" stroke="#7f1d1d" stroke-width="1.5"/>

        <!-- Emblem & Typography -->
        <text x="134" y="36" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="bold" fill="#fef08a" text-anchor="middle">WAP-7</text>
        <text x="134" y="61" font-family="'Outfit', sans-serif" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">IR LOCO</text>
      </svg>
    `;
  },

  // 2. Base Passenger Coach Generator
  renderCoach(code, type, name, theme) {
    const {
      bodyColor,
      borderColor,
      stripeColor,
      textColor,
      accentColor,
      isAC = true,
      hasGrills = false,
      isPantry = false,
      isLuggage = false,
    } = theme;

    // Windows generation
    let windowsHtml = "";
    if (isLuggage) {
      // Rolling metal shutter for parcel/luggage + 1 guard window
      windowsHtml = `
        <rect x="24" y="27" width="56" height="30" rx="1" fill="#475569" stroke="#334155"/>
        <line x1="24" y1="33" x2="80" y2="33" stroke="#64748b" stroke-width="1.5"/>
        <line x1="24" y1="39" x2="80" y2="39" stroke="#64748b" stroke-width="1.5"/>
        <line x1="24" y1="45" x2="80" y2="45" stroke="#64748b" stroke-width="1.5"/>
        <line x1="24" y1="51" x2="80" y2="51" stroke="#64748b" stroke-width="1.5"/>
        <!-- Guard Lookout Window -->
        <rect x="96" y="29" width="16" height="18" rx="2" fill="#0f172a" stroke="#cbd5e1"/>
        <circle cx="104" cy="38" r="2.5" fill="#fef08a"/>
        <!-- Red Tail Lamp -->
        <circle cx="152" cy="40" r="3" fill="#ef4444" stroke="#991b1b"/>
        <circle cx="152" cy="40" r="1" fill="#ffffff"/>
      `;
    } else if (isPantry) {
      windowsHtml = `
        <!-- Kitchen Small Windows -->
        <rect x="24" y="32" width="16" height="14" rx="2" fill="#0f172a" stroke="#cbd5e1"/>
        <rect x="46" y="32" width="16" height="14" rx="2" fill="#0f172a" stroke="#cbd5e1"/>
        <rect x="68" y="32" width="16" height="14" rx="2" fill="#0f172a" stroke="#cbd5e1"/>
        <!-- Kitchen Service Door -->
        <rect x="94" y="27" width="14" height="32" rx="1" fill="#334155" stroke="#1e293b"/>
        <!-- Chef Hat / Pantry Icon -->
        <circle cx="122" cy="36" r="6" fill="#ea580c"/>
        <text x="122" y="39" font-family="'Outfit', sans-serif" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">🍽️</text>
      `;
    } else if (hasGrills) {
      // Sleeper / General Windows with Metallic Grills
      windowsHtml = `
        <!-- Grilled Windows -->
        <g stroke="#cbd5e1" stroke-width="1">
          <rect x="22" y="30" width="15" height="18" rx="1" fill="#0f172a" stroke="#475569"/>
          <line x1="27" y1="30" x2="27" y2="48"/><line x1="32" y1="30" x2="32" y2="48"/>

          <rect x="42" y="30" width="15" height="18" rx="1" fill="#0f172a" stroke="#475569"/>
          <line x1="47" y1="30" x2="47" y2="48"/><line x1="52" y1="30" x2="52" y2="48"/>

          <rect x="62" y="30" width="15" height="18" rx="1" fill="#0f172a" stroke="#475569"/>
          <line x1="67" y1="30" x2="67" y2="48"/><line x1="72" y1="30" x2="72" y2="48"/>

          <rect x="82" y="30" width="15" height="18" rx="1" fill="#0f172a" stroke="#475569"/>
          <line x1="87" y1="30" x2="87" y2="48"/><line x1="92" y1="30" x2="92" y2="48"/>

          <rect x="102" y="30" width="15" height="18" rx="1" fill="#0f172a" stroke="#475569"/>
          <line x1="107" y1="30" x2="107" y2="48"/><line x1="112" y1="30" x2="112" y2="48"/>
        </g>
      `;
    } else {
      // AC Panoramic Tinted Windows
      windowsHtml = `
        <g stroke="${accentColor}" stroke-width="1">
          <rect x="22" y="30" width="22" height="16" rx="2" fill="#09142e"/>
          <circle cx="33" cy="38" r="2.5" fill="#fef08a" opacity="0.8"/>

          <rect x="48" y="30" width="22" height="16" rx="2" fill="#09142e"/>
          <circle cx="59" cy="38" r="2.5" fill="#fef08a" opacity="0.8"/>

          <rect x="74" y="30" width="22" height="16" rx="2" fill="#09142e"/>
          <circle cx="85" cy="38" r="2.5" fill="#fef08a" opacity="0.8"/>

          <rect x="100" y="30" width="22" height="16" rx="2" fill="#09142e"/>
          <circle cx="111" cy="38" r="2.5" fill="#fef08a" opacity="0.8"/>
        </g>
      `;
    }

    // Roof Unit: AC pod vs Round Ventilators
    const roofUnit = isAC
      ? `<rect x="44" y="16" width="68" height="4" rx="2" fill="#64748b"/>`
      : `<circle cx="40" cy="18" r="3" fill="#94a3b8"/><circle cx="80" cy="18" r="3" fill="#94a3b8"/><circle cx="120" cy="18" r="3" fill="#94a3b8"/>`;

    return `
      <svg class="coach-svg" viewBox="0 0 170 85" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Coach ${code} ${name}">
        <!-- Couplers on both ends -->
        <rect x="0" y="58" width="6" height="5" fill="#334155" rx="1"/>
        <rect x="164" y="58" width="6" height="5" fill="#334155" rx="1"/>

        <!-- Track Rail & Sleepers -->
        <line x1="0" y1="80" x2="170" y2="80" stroke="#94a3b8" stroke-width="2.5"/>
        <line x1="12" y1="82" x2="18" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="38" y1="82" x2="44" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="64" y1="82" x2="70" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="90" y1="82" x2="96" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="116" y1="82" x2="122" y2="82" stroke="#64748b" stroke-width="4"/>
        <line x1="142" y1="82" x2="148" y2="82" stroke="#64748b" stroke-width="4"/>

        <!-- Bogies & Steel Wheels -->
        <rect x="20" y="66" width="46" height="6" rx="2" fill="#1e293b"/>
        <circle cx="30" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="30" cy="73" r="2.5" fill="#94a3b8"/>
        <circle cx="56" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="56" cy="73" r="2.5" fill="#94a3b8"/>

        <rect x="104" y="66" width="46" height="6" rx="2" fill="#1e293b"/>
        <circle cx="114" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="114" cy="73" r="2.5" fill="#94a3b8"/>
        <circle cx="140" cy="73" r="6.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <circle cx="140" cy="73" r="2.5" fill="#94a3b8"/>

        <!-- Roof Elements -->
        ${roofUnit}

        <!-- Main Coach Body Shell -->
        <rect x="6" y="20" width="158" height="45" rx="4" fill="${bodyColor}" stroke="${borderColor}" stroke-width="1.5"/>

        <!-- Upper & Lower Livery Stripes -->
        <rect x="6" y="23" width="158" height="3" fill="${stripeColor}"/>
        <rect x="6" y="56" width="158" height="3" fill="${stripeColor}"/>

        <!-- Doors at both ends -->
        <rect x="9" y="26" width="9" height="34" rx="1" fill="#0f172a" opacity="0.2"/>
        <rect x="152" y="26" width="9" height="34" rx="1" fill="#0f172a" opacity="0.2"/>

        <!-- Windows Section -->
        ${windowsHtml}

        <!-- Coach Code Badge Plaque -->
        <rect x="127" y="28" width="22" height="18" rx="2" fill="#09142e" stroke="${stripeColor}" stroke-width="1"/>
        <text x="138" y="40" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="bold" fill="${textColor}" text-anchor="middle">${code}</text>

        <!-- Coach Class Label -->
        <text x="85" y="62" font-family="'Outfit', sans-serif" font-size="6.5" font-weight="bold" fill="${textColor}" text-anchor="middle" letter-spacing="0.5">${name}</text>
      </svg>
    `;
  },

  // Helper to resolve coach types
  render(coachCode) {
    const c = (coachCode || "").trim().toUpperCase();

    if (c === "ENG" || c === "LOCO") {
      return this.renderEngine("LOCO");
    }

    // 1A (AC First Class)
    if (c.startsWith("H") || c === "1A") {
      return this.renderCoach(c, "1A", "AC FIRST CLASS", {
        bodyColor: "#1e3a8a",
        borderColor: "#172554",
        stripeColor: "#f59e0b",
        textColor: "#fef08a",
        accentColor: "#f59e0b",
        isAC: true,
      });
    }

    // 2A (AC 2-Tier)
    if (c.startsWith("A") || c === "2A") {
      return this.renderCoach(c, "2A", "AC 2-TIER", {
        bodyColor: "#1d4ed8",
        borderColor: "#1e40af",
        stripeColor: "#93c5fd",
        textColor: "#ffffff",
        accentColor: "#bfdbfe",
        isAC: true,
      });
    }

    // 3A (AC 3-Tier)
    if (c.startsWith("B") || c === "3A") {
      return this.renderCoach(c, "3A", "AC 3-TIER", {
        bodyColor: "#0284c7",
        borderColor: "#0369a1",
        stripeColor: "#bae6fd",
        textColor: "#ffffff",
        accentColor: "#7dd3fc",
        isAC: true,
      });
    }

    // 3E (AC 3-Tier Economy)
    if (c.startsWith("M") || c === "3E") {
      return this.renderCoach(c, "3E", "AC 3-ECONOMY", {
        bodyColor: "#0d9488",
        borderColor: "#0f766e",
        stripeColor: "#99f6e4",
        textColor: "#ffffff",
        accentColor: "#5eead4",
        isAC: true,
      });
    }

    // SL (Sleeper Class)
    if (c.startsWith("S") && !c.includes("LRD")) {
      return this.renderCoach(c, "SL", "SLEEPER CLASS", {
        bodyColor: "#2563eb",
        borderColor: "#1d4ed8",
        stripeColor: "#facc15",
        textColor: "#ffffff",
        accentColor: "#fef08a",
        isAC: false,
        hasGrills: true,
      });
    }

    // PC (Pantry Car)
    if (c === "PC" || c === "PANTRY") {
      return this.renderCoach(c, "PC", "PANTRY CAR", {
        bodyColor: "#334155",
        borderColor: "#1e293b",
        stripeColor: "#ea580c",
        textColor: "#fdba74",
        accentColor: "#fed7aa",
        isAC: false,
        isPantry: true,
      });
    }

    // SLRD / LPR (Luggage & Guard)
    if (c.includes("LRD") || c.includes("LPR") || c === "SLR") {
      return this.renderCoach(c, "SLRD", "GUARD & LUGGAGE", {
        bodyColor: "#475569",
        borderColor: "#334155",
        stripeColor: "#cbd5e1",
        textColor: "#ffffff",
        accentColor: "#94a3b8",
        isAC: false,
        isLuggage: true,
      });
    }

    // GEN / GS (General Unreserved)
    return this.renderCoach(c, "GEN", "GENERAL (GS)", {
      bodyColor: "#475569",
      borderColor: "#334155",
      stripeColor: "#facc15",
      textColor: "#ffffff",
      accentColor: "#fde047",
      isAC: false,
      hasGrills: true,
    });
  },

  // Render an entire linked train rake from a string like "ENG-LPR-GEN-H1-A1-B1-PC-S1-SLRD"
  renderRake(coachString) {
    if (!coachString) return "<p>Coach layout not available for this train.</p>";
    const list = coachString.split("-").map(s => s.trim()).filter(Boolean);

    let html = `
      <div class="svg-rake-container">
        <div class="svg-rake-track">
          ${list.map((c, i) => `
            <div class="svg-coach-item" data-coach="${c}" onclick="showCoachInfoModal('${c}', ${i + 1})">
              ${this.render(c)}
              <span class="coach-number-sub">#${i + 1} ${c}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return html;
  }
};

window.CoachSVGs = CoachSVGs;

// Interactive Coach Modal / Details
window.showCoachInfoModal = function(coachCode, position) {
  let title = "Passenger Coach";
  let desc = "Standard Indian Railways passenger coach.";
  let amenities = ["Charging Sockets", "Luggage Racks", "Bio-Toilets"];

  if (coachCode === "ENG" || coachCode === "LOCO") {
    title = "Locomotive Engine (WAP-7 / WAG-9)";
    desc = "High-power 6,000 HP Indian Railways electric locomotive capable of 140+ km/h speeds with dual pantographs.";
    amenities = ["Loco Pilot Cabin", "Regenerative Braking", "GPS Speed Radar"];
  } else if (coachCode.startsWith("H") || coachCode === "1A") {
    title = `Coach ${coachCode} - First Class AC (1A)`;
    desc = "Premier luxury class with lockable 2-berth coupes and 4-berth cabins, plush carpeting, reading lamps, and personal attendants.";
    amenities = ["Complimentary Bedding & Towels", "Coupe Privacy Doors", "Attendant Call Bell", "Reading Lamps"];
  } else if (coachCode.startsWith("A") || coachCode === "2A") {
    title = `Coach ${coachCode} - AC 2-Tier (2A)`;
    desc = "Comfortable air-conditioned coach with 48 to 54 berths arranged in 2 tiers (Upper & Lower) with individual privacy curtains.";
    amenities = ["Curtains for Privacy", "Fresh Bedroll Set", "Mobile Sockets per Bay"];
  } else if (coachCode.startsWith("B") || coachCode === "3A") {
    title = `Coach ${coachCode} - AC 3-Tier (3A)`;
    desc = "Air-conditioned 3-tier sleeper coach with 64 to 72 berths (Upper, Middle, Lower and Side Upper/Lower).";
    amenities = ["Air Conditioning", "Clean Linen & Blanket", "Individual Bottle Holders"];
  } else if (coachCode.startsWith("M") || coachCode === "3E") {
    title = `Coach ${coachCode} - AC 3-Tier Economy (3E)`;
    desc = "Modernized economical AC coach with 83 berths, modular ergonomics, personal reading lights, and optimized space.";
    amenities = ["High-Capacity AC", "Personal USB Ports", "Modern Bio-Vacuum Toilet"];
  } else if (coachCode.startsWith("S") && !coachCode.includes("LRD")) {
    title = `Coach ${coachCode} - Sleeper Class (SL)`;
    desc = "Non-AC sleeper coach with 72 to 80 berths. Open window travel with cooling fans and security window grills.";
    amenities = ["Wide Open Windows", "3-Tier Sleeping Berths", "Cushioned Seats"];
  } else if (coachCode === "PC") {
    title = `Coach ${coachCode} - Pantry Car`;
    desc = "Onboard railway kitchen coach preparing hot fresh meals, tea, snacks, and catering supplies for passengers.";
    amenities = ["Commercial Kitchen Equipment", "Deep Freezers", "Hot Water Boiler"];
  } else if (coachCode.includes("LRD") || coachCode.includes("LPR")) {
    title = `Coach ${coachCode} - Luggage, Brake & Guard Van`;
    desc = "Rear/front compartment housing the Train Manager (Guard) cabin, hand brake systems, emergency flasher, and parcel cargo section.";
    amenities = ["Guard Lookout Windows", "Emergency Handbrake", "Parcel Freight Hold"];
  } else {
    title = `Coach ${coachCode} - General Unreserved (GS)`;
    desc = "Unreserved second sitting coach for daily commuters and short-distance passengers with overhead luggage bars.";
    amenities = ["Wide Doors", "Overhead Racks", "Stainless Steel Grab Rails"];
  }

  showToast(`<strong>${title}</strong> (Position #${position})<br>${desc}`, "info");
};
