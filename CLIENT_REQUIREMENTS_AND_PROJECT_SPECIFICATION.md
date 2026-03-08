**CITS5206 Capstone Project: Client Requirements & Project Specification Summary**

**Client Name:** Sven (Archaeologist & Social Scientist, UWA)
**Project Domain:** Cultural Heritage Fire Risk Prediction and Management System
**Document Purpose:** Comprehensive extraction of client requirements, system architecture, and ethical constraints to serve as the foundation for Deliverable 1 (D1) and MVP definition.

---

### 1. Executive Summary & Problem Statement

**1.1 The Core Problem**
Australia possesses sophisticated tools for predicting and managing fire risks to natural environments and modern infrastructure (e.g., NAFI - North Australian Fire Information). However, there is a complete absence of dedicated tools to assess and mitigate fire risks to cultural heritage sites. Currently, land managers conduct prescribed burns (to reduce fuel loads) or fight catastrophic wildfires without systemic knowledge of heritage site locations or their specific vulnerabilities, leading to the irreversible destruction of tangible artifacts and their associated intangible cultural narratives.

**1.2 The Project Objective**
To develop a software solution—primarily a web-based spatial data repository and mapping tool—that enables land managers to calculate, visualize, and manage the risk of fire impacting specific cultural heritage sites. This tool will empower decision-makers to establish "exclusion zones" during prescribed burns and prioritize high-value/highly vulnerable sites during active wildfire suppression.

**1.3 Target Users (Stakeholders)**
*   Indigenous Land Owners and Ranger Groups.
*   Government Departments (e.g., DBCA - Department of Biodiversity, Conservation and Attractions).
*   Local Government Authorities (Shires).
*   Private Landowners and Pastoralists.

---

### 2. Functional Requirements (The "What")

Based on the client interview, the system requires a tiered approach to functionality. The client explicitly emphasized: "Do one thing well rather than two things poorly."

**2.1 Priority 1: Web-Based Spatial Dashboard (The Core MVP)**
*   **Data Integration & Mapping:** The system must overlay geographic heritage site locations with fire-related data (e.g., active fire hotspots, historical fire scars).
*   **Risk Visualization:** Sites must be visually categorized by their calculated fire risk (e.g., Low, Medium, High). 
*   **Data Export Capability:** The system must allow users to export data to Microsoft Excel (CSV format). This is a rigid requirement because many local shire councils lack sophisticated GIS software and rely entirely on Excel for administrative tasks.
*   **Tiered Access System:** An authentication system that restricts data visibility based on user clearance (crucial for Indigenous data sovereignty).

**2.2 Priority 2: Field Data Collection Tool (Optional/Extended MVP)**
*   **Mobile Interface:** An application (or responsive web app) for rangers operating in the field to log newly discovered heritage sites.
*   **Data Capture Fields:** Must capture GPS coordinates, site type, photographs, and basic environmental parameters.
*   **Offline Functionality:** Absolutely critical. Rangers operate in remote areas (e.g., the Kimberley) with zero cellular reception. The tool must cache data locally and synchronize with the central database automatically upon regaining network connectivity.

---

### 3. Non-Functional Requirements & UI/UX Constraints (The "How")

The client highlighted specific usability and ethical constraints that must dictate the system design:

**3.1 Accessibility and Visual Encoding**
*   **Colorblind Compliance:** While a "Red-Yellow-Green" traffic light system is requested for risk indication, the client explicitly noted that approximately 8% of Caucasian males suffer from red-green colorblindness. The UI must incorporate redundant visual indicators (e.g., distinct geometric shapes, numerical risk scores, or alternative color palettes) to ensure the risk level is universally comprehensible.

**3.2 Geographical Scoping**
*   **Regional Limitation:** Western Australia is too large for a 12-week project. The client mandates selecting a specific sample region (e.g., the Kimberley, Pilbara, or South West) to serve as a Proof of Concept (PoC) rather than attempting statewide coverage.

**3.3 Data Privacy & Indigenous Data Sovereignty (Critical Ethical Constraint)**
*   **Information Secrecy:** Much Indigenous cultural data is highly restricted (e.g., gender-specific sacred sites). Exact GPS coordinates of highly sensitive sites cannot be exposed on public-facing mapping layers.
*   **Intellectual Property:** The system architecture must respect that data ownership remains with the Traditional Owners, not the university or the government.

---

### 4. The Risk Assessment Algorithm (Core Business Logic)

To implement the core business logic faithfully, the technical implementation must translate the client's archaeological expertise into a programmatic algorithm. The "Fire Risk Score" of a heritage site must be a dynamically calculated output based on the following variables:

**Variable 1: Material Vulnerability (Static)**
*   *Extreme Risk:* Culturally modified trees (scarred trees), wooden implements, paperbark structures, spinifex resin artifacts.
*   *High Risk:* Rock art inside caves/shelters (extreme heat causes granite/sandstone to expand and exfoliate, destroying the art).
*   *Low Risk:* Lithic scatters (stone tools on open ground).

**Variable 2: Topographical Context (Static)**
*   Sites located in deep gorges, narrow valleys, or steep slopes face a higher risk due to the "chimney effect" (fire accelerates uphill and intensifies in narrow corridors). Sites on flat, barren plains carry lower topographical risk.

**Variable 3: Vegetation and Fuel Load (Semi-Dynamic)**
*   The type and density of surrounding flora. For instance, the presence of Spinifex grass (highly resinous and explosive when burned) substantially increases the risk score.

**Variable 4: Meteorological and Active Fire Data (Dynamic - For Future API Integration)**
*   Wind direction relative to active fire fronts. A site located downwind of an active hotspot requires an immediate elevation to "Critical" risk status.

---

### 5. Recommended Action Plan for Deliverable 1 (D1)

To align Deliverable 1 with the client's priorities and deliver a feasible MVP within the project timeframe, the team should execute the following roadmap:

1.  **Define the MVP Strictly:** Commit *only* to the Web-based Dashboard for D1. State clearly that the Field App will only be initiated once the core dashboard is complete (and validated). This reduces delivery risk and keeps scope realistic.
2.  **Mock Data Strategy:** Given the sensitivity and access restrictions associated with real Indigenous cultural data, use procedural/mock data generated for a specific bounding box (e.g., a 100x100km grid in the Kimberley) to build the Proof of Concept.
3.  **Algorithm Blueprint:** Document the mathematical logic of the Risk Assessment Algorithm (as outlined in Section 4) in the D1 submission. This ensures the client's domain knowledge is accurately captured and traceable in the implementation.
4.  **Acknowledge Social Impact:** Include in the D1 Problem Statement the client-provided statistic regarding the economic and health value of heritage sites (saving the healthcare system $94 per visit). This provides context for the project's social impact.

**End of Summary**
