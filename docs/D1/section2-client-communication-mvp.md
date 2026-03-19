# 2. Client Communication and MVP Agreement

## 2.1 Stakeholders Identification

Since the system is designed to assist land managers and Indigenous groups in predicting and mitigating fire impacts on cultural heritage sites, the stakeholders involved in this project are primarily drawn from that context.

**Key Stakeholders:**
*   **Primary Client / Domain Expert:** Dr. Sven Ouzman (Associate Professor, School of Social Sciences, Archaeology, UWA).
*   **Project Facilitator:** Karla Ivkovic (CITS5206 Teaching Team).
*   **Main Users:** Indigenous Land Owners, Ranger Groups, Department of Biodiversity, Conservation and Attractions (DBCA) personnel, and local Shire councils.
*   **Development Team:** Group 21, responsible for designing, implementing, and delivering the system.

## 2.2 Client Communication Details

To ensure effective collaboration and timely feedback, the following communication methods and channels are established:

**Communication Channels:**
*   **Microsoft Teams:** Used for quick communication, daily stand-ups, file sharing, and maintaining an ongoing discussion space among the development team and with the Project Facilitator.
*   **Microsoft Outlook (UWA Email):** For formal client communications, milestone sign-offs, and requirement approvals.
*   **GitHub:** Serves as the central platform for code repository, version control, issue tracking, and managing the agile development workflow (e.g., Kanban boards, pull requests).
*   **In-person / Online Meetings:** Conducted to elicit requirements, demonstrate early features, and collect feedback.

**Project Resource Links (Shared via SharePoint):**
*   **Link to Meeting Agenda and Minutes Folder:** 
    `https://uniwa-my.sharepoint.com/:f:/r/personal/24408996_student_uwa_edu_au/Documents/Desktop/class/2026_1/CITS5206/meeting_minutes?csf=1&web=1&e=a9kReW`
*   **Link to Client Communication Records Folder:** 
    `https://uniwa-my.sharepoint.com/:f:/r/personal/24408996_student_uwa_edu_au/Documents/Desktop/class/2026_1/CITS5206/communication_record?csf=1&web=1&e=1iJ3X4`

## 2.3 Communication Plan and Requirement Traceability

This section outlines the structured communication plan for the project and provides a traceability table that maps the client's specific interview statements directly to the software design.

*Table 1: Communication Plan*

| Week | Task | Method | Purpose | Participants |
| :--- | :--- | :--- | :--- | :--- |
| 2 | First meeting with client to clarify project details | In-person / Teams Interview | Understand client needs, define the initial scope of the project, and clarify target users. | Client, Developers |
| 3 | Project specification and constraint discussion | Microsoft Teams meeting | Finalize functional requirements, non-functional requirements, and strict ethical data constraints. | Client, Developers |
| 4 | Preparing project plan and awaiting client approval | Email, Teams chat | Share project plan (D1 draft) and MVP scope for review and feedback. | Developers, Client |
| 5 | D1: Project Specification and Plan Submission | LMS | Submit finalized documents and confirm alignment. | Developers |
| 6 | Work on MVP features development | GitHub, Agile Kanban board | Begin implementation of core features (Web GIS and risk algorithm). | Developers |
| 7 | MVP demo and client feedback | Online meeting (Teams), Live demo | Present MVP core functions, gather feedback. | Developers, Client |
| 8-9 | Update MVP based on client feedback | GitHub, Teams messages | Apply revisions to the risk calculation logic and UI as per client input. | Developers |
| 10 | D2: Individual Software Features Submission | LMS | Demonstrate specific feature completion by individual members, collect approval. | Developers |
| 12 | D3: Final Deliverable & Handover | LMS, Final Meeting | Deliver final polished software system, documentation, and client acceptance testing. | Developers, Client |

During the initial interviews with Dr. Sven Ouzman, the project goals and strict geographical and ethical constraints were clarified. Below is a traceability table that records the interview contents and provides insights into the project design.

*Table 2: Traceability Table*

| Category | Details | Source (Client Quote / Context) |
| :--- | :--- | :--- |
| **Geographical Scope** | The project will not cover all of Western Australia. The MVP will focus on a specific, manageable bounding box (e.g., a sample area in the Kimberley). | *"Western Australia is too big. I'm not expecting you to cover the whole state... choose a specific area that corresponds to a native title group or a municipal shire." - Sven* |
| **Accessibility & UI** | The risk map will use redundant visual encodings (shapes, numbers) alongside colors, avoiding a pure red-green traffic light system. | *"8% of Caucasian males are red-green colorblind... they are not going to see your red. You have to think of another way of telling them." - Sven* |
| **Data Sovereignty & Security** | The system must implement Role-Based Access Control (RBAC). Exact GPS coordinates of sensitive sites will not be publicly displayed. | *"The copyright doesn't always stay with you... the data belongs to the Traditional Owners. You cannot put highly sensitive exact coordinates on a public map." - Sven* |
| **Data Export Capability** | The web application must include a feature to export the queried risk assessment data into CSV/Excel formats. | *"We are dealing with town councils and shires. They don't always have the software to do this... everyone has got Excel." - Sven* |
| **Algorithmic Variables** | The risk calculation engine must factor in material vulnerability, topography, and fuel load. | *"A fire is not going to damage stone tools... but if it's a wooden house or a culturally modified tree, it's a high risk. Fire also travels differently depending on the topography." - Sven* |

## 2.4 Minimum Viable Product (MVP) Agreement

Based on the interview with the client and the analysis of project specifications, the agreed MVP will include the following core functional requirements. The development strategy strictly adheres to the client's directive: *"Do one thing well rather than two things poorly."*

1.  **Interactive Web-based GIS Dashboard:** A web application capable of overlaying geographical cultural heritage site locations (mock/sample data for the PoC) with environmental data layers (topography, vegetation).
2.  **Static Risk Assessment Engine:** A deterministic backend algorithm that calculates a 'Total Fire Risk Score' (e.g., Low, Medium, High, Extreme) for each site based on material vulnerability, topography, and fuel load.
3.  **Role-Based Access Control (RBAC) System:** A secure authentication module ensuring that exact coordinate data is restricted to authorized personnel (e.g., Rangers, Admins), while public users view obfuscated or buffered region data to respect Indigenous Data Sovereignty.
4.  **Accessible Visual Indicators:** Application of color-blind friendly coding and supplementary visual shapes on the map to distinctly differentiate risk levels and site types.
5.  **Administrative Data Export:** A function allowing authorized users to export queried spatial and risk data into standardized Excel (CSV) formats for offline administrative use.

*(Note: The mobile application for field data collection and live meteorological API integrations have been officially moved to Priority 2/Backlog to ensure the core MVP is delivered flawlessly).*

The MVP scope was presented to and approved by the client, Dr. Sven Ouzman, via email on [Insert Date] March 2026.

**Detailed Storyboard for the GUI:**
`https://uniwa.sharepoint.com/:b:/t/CITS5206SEM-12026-Group[X]/[Insert_GUI_Link_Here]`

**High Level UML User and System Interaction Diagram:**
`https://github.com/UWA-CITS5206-2026/Group[X]-HeritageFireRisk/blob/main/Docs/UML_Diagram.png`

## 2.5 Revisions & Feedback

1.  **Feedback Process**
    *   The Client and Project Facilitator will provide feedback through emails, scheduled MS Teams meetings, interviews, and shared project management tools.
    *   Regular check-ins will be scheduled bi-weekly to discuss progress, clarify algorithmic weighting, and gather UI feedback.
2.  **Revisions Rounds**
    *   The project includes 3 formal rounds of revisions according to the timelines of the 3 Deliverables (D1, D2, D3).
    *   Additional continuous revisions will be implemented via the Agile Kanban methodology during active development sprints.
3.  **Turnaround Time for Revisions**
    *   Requested revisions by the client will be addressed and logged into the GitHub repository within 5 business days after feedback submission.
    *   The Client and Facilitator are expected to provide feedback within 3 business days following a demonstration to maintain the strict 12-week project timeline.
4.  **Scope of Revisions**
    *   Revisions will focus on specific areas within the agreed MVP, such as UI adjustments, tuning the risk algorithm parameters, and functionality fine-tuning.
    *   Major changes outside the agreed scope (e.g., requesting the full development of the offline mobile app) will require a formal scope renegotiation and may be deferred to a separate phase of work beyond this unit.
5.  **Final Approval**
    *   A release candidate of the MVP will be shared for final User Acceptance Testing (UAT) and approval before the final D3 delivery.
    *   Once approved, further changes will not be integrated into the current academic deliverable.
