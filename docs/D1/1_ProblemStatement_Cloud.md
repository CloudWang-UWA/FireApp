# 1. Problem Statement
## 1.1 Problem Definition
The objective of this project is to develop a system capable of identifying areas likely to contain cultural heritage sites and visualising their potential vulnerability to wildfires on a map across Western Australia.

Cultural heritage sites, including scar trees, rock art, and artefacts, are highly valuable for studying human history, as they carry cultural narratives and meanings. Such sites are fragile and can easily be damaged or destroyed. Wildfires have been a major threat to them, as they are often large in scale and high in intensity, causing irreversible damage to cultural heritage.

However, only a small portion of cultural heritage sites are currently recorded in databases such as ACHIS and InHerit, while many sites remain unmapped. In addition, many regions in Australia consist of vast and remote wilderness with limited road access, making fire management difficult and inefficient.

Currently, land managers often conduct prescribed burns or engage in firefighting during catastrophic wildfires without sufficient information of heritage site locations and their risk levels, which limits their ability to effectively manage fires and protect these sites.

Therefore, there is a need for a system that can identify areas likely to contain cultural heritage sites and assess their vulnerability to wildfires based on environmental factors such as elevation, slope, vegetation type, fuel load, and proximity to water. For example, granite outcrops are often associated with cultural heritage sites, as they can serve as important water sources (e.g., gnamma holes) in arid environments, supporting human activities such as settlement and rock art. Therefore, areas with such landscape features are more likely to contain cultural heritage sites. This would enable land managers to prioritise high-risk areas and allocate resources more effectively, thereby minimising potential damage to heritage sites.

## 1.2 Client Needs & Justifications
Sven Ouzman, the associate professor of School of Social Sciences, Archaeology, requires to develop a tool that allows land managers (especially Indigenous) to predict the impacts of fire on heritage sites so that appropriate mitigation measures can be put in place. His principal requirement is to build a web application to visualize cultural heritage sites as well as their level of risk on the map. Besides, he also has some other requirements for this application that can be put into two categories:
### Functional requirements:
- Data Processing: The system should process and convert raw data into suitable formats in GIS such as GeoJSON.

- Data Integration & Mapping: The system should overlay geographic heritage site data and related landscape features (e.g., granite outcrops) with fire-related environmental data (e.g., elevation, slope angle, fuel load, vegetation, water).

- Map Visualization: The system should display GIS data and areas with potential cultural heritage sites on an interactive map. It should also visualize fire risk levels (e.g., green for low risk, yellow for medium risk, and red for high risk).

- Risk Assessment: The system should assess fire risk based on environmental factors. The system may provide simple indicative analysis of potential high-risk areas based on risk assessment.

- User Interaction: The system should allow users to explore and interact with map data (e.g., zoom, filter, select regions).

- Data Export: The system should support exporting results or datasets to formats such as Excel.

### Non-Functional requirements:
#### Usability & Accessibility
- The system should be easy to use and update.
- The system should support users with different levels of textual and visual literacy.
- The system should be accessible to users with colour vision deficiencies.
- The system should provide an intuitive and user-friendly interface.

#### Security & Privacy
- The system must ensure secure handling of sensitive cultural heritage data.
- The system must respect Indigenous Cultural and Intellectual Property (ICIP).
- The system must adhere to Indigenous Data Sovereignty (IDaS) principles.
- Access to sensitive data should be appropriately controlled and restricted.

#### Performance & Scalability
- The system should efficiently handle large geospatial datasets.
- The system should be scalable to support additional data and users in the future.

#### Maintainability & Extensibility
- The system should be easy to maintain and update.
- The system should support future enhancements, such as additional data layers or analytical functions.

#### Reliability
- The system should provide consistent and reliable performance during operation.
- The system should minimise downtime and handle errors gracefully.

This interactive map application enables land managers to clearly distinguish between areas of varying risk levels, making it easier to identify locations that require immediate protection and those of lower priority. As a result, fire management actions can be planned and implemented more effectively, reducing the potential damage to cultural heritage sites. This directly supports the client's goal of empowering Indigenous land managers with actionable, data-driven tools for cultural heritage preservation.

## 1.3 Expected Deliverable

The Minimum Viable Product (MVP) for this project is a web-based GIS application designed to support the identification of areas likely to contain cultural heritage sites and the visualization of their potential vulnerability to wildfires.

The MVP will include the following key deliverables:

- Interactive Map: The system will display GIS data and areas with potential cultural heritage sites alongside selected environmental layers (e.g., vegetation, fuel load, granite outcrops, and burn areas) on an interactive map. Users will be able to perform basic interactions such as zooming, filtering, and selecting specific regions.

- Risk Assessment: The system will provide a simple, rule-based estimation of fire risk based on environmental factors such as slope, vegetation, and fuel load.

- Risk Visualization: The system will visualize fire risk levels directly on the map using a colour scale (e.g., green for low risk, yellow for medium risk, red for high risk). Colour-blind friendly schemes and supplementary visual cues (e.g., shapes or labels) will be applied to ensure accessibility.

- Data Processing: The system will clean, prepare, and integrate selected datasets (e.g., vegetation, slope, fuel load, and granite outcrops) into formats suitable for visualization and basic analysis.

- Data Export: The system will allow users to export selected data or results into formats such as CSV for external use (e.g., in Excel).

The MVP will focus on the Wagyl Kaip Agreement Area in the Great Southern region of Western Australia, using publicly available datasets.

The system is designed to be user-friendly and accessible, enabling land managers to explore spatial data and support informed decision-making for fire management and the protection of cultural heritage sites.

## 1.4 Success Criteria
The success of the system will be evaluated based on the following measurable criteria:
- The system can successfully display areas with potential cultural heritage sites and relevant environmental information on an interactive map, with map layers loading within 3 seconds under normal network conditions.
- The system can classify areas into different fire risk levels based on environmental factors (e.g., slope, vegetation, fuel), following predefined classification rules consistently and correctly.
- Users can effectively interact with the map (e.g., zooming, filtering, selecting regions), with response times under 1–2 seconds and no noticeable lag during typical usage.
- The system can correctly process and integrate multiple datasets, with data alignment errors below 5% and no critical data loss during processing.
- The system can export selected data or results into formats such as Excel, with a success rate of 100% for valid export requests and file generation within 5 seconds.
- The system is easy to use and accessible, with at least 80% of test users able to complete key tasks (e.g., locating a site, applying filters) without assistance, and reporting positive usability feedback.