# 1. Problem Statement
## 1.1 Problem Definition
The objective of this project is to develop a system capable of identifying cultural heritage sites that are vulnerable to wildfires and visualising their associated risk levels on a map across Western Australia.

Cultural heritage sites, including scar trees, rock art, and artefacts, are highly valuable for studying human history, as they carry cultural narratives and meanings. Such sites are fragile and can easily be damaged or destroyed. Wildfires have been a major threat to them, as they are often large in scale and high in intensity, causing irreversible damage to cultural heritage.

However, only a small portion of cultural heritage sites are currently recorded in databases such as ACHIS and InHerit, while many sites remain unmapped. In addition, many regions in Australia consist of vast and remote wilderness with limited road access, making fire management difficult and inefficient.

Currently, land managers often conduct prescribed burns or engage in firefighting during catastrophic wildfires without sufficient information of heritage site locations and their risk levels, which limits their ability to effectively manage fires and protect these sites.

Therefore, there is a need for a system that can identify the likely locations of cultural heritage sites and assess their vulnerability to wildfires based on environmental factors such as elevation, slope, vegetation type, fuel load, and proximity to water. For example, granite outcrops are often associated with cultural heritage sites, as they can serve as important water sources (e.g., gnamma holes) in arid environments, supporting human activities such as settlement and rock art. Therefore, areas with such landscape features are more likely to contain cultural heritage sites. This would enable land managers to prioritise high-risk areas and allocate resources more effectively, thereby minimising potential damage to heritage sites.

## 1.2 Client' Needs & Justifications
Sven Ouzman, the associate professor of School of Social Sciences, Archaeology, requires to develop a tool that allows land managers (especially Indigenous) to predict the impacts of fire on heritage sites so that appropriate mitigation measures can be put in place. His principal requiremnt is to build a web application to visualize cultural heritage sites as well as their level of risk on the map. Besides, he also has some other requirements for this application that can be put into two categories:
### Functional requirements:
- Data Processing: The system should process and convert raw data into suitable formats in GIS such as GeoJSON.

- Data Integration & Mapping: The system should overlay geographic heritage site locations (e.g., granite outcrops) with fire-related environment data (e.g., elevation, slope angle, fuel load, vegetation, water etc).

- Map Visualization: The system should display GIS data and cultural heritage sites on an interactive map. It should also visualize fire risk levels (e.g., green for low risk, yellow for medium risk, and red for high risk).

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

This interactive map application enables land managers to clearly distinguish between areas of varying risk levels, making it easier to identify locations that require immediate protection and those of lower priority. As a result, fire management actions can be planned and implemented more effectively, reducing the potential damage to cultural heritage sites. Improved fire management may also contribute to reduced carbon emissions, which can generate additional environmental and economic benefits.

## 1.3 Expected Deliverable

The final deliverable of this project will be a web-based GIS application that supports the identification and visualization of cultural heritage sites and their vulnerability to bushfires. The system will integrate multiple datasets, including vegetation, fuel characteristics, geological features (e.g., granite outcrops), and burn areas, and present them on an interactive map.

The application will allow users to explore spatial data, view heritage site locations, and understand their associated fire risk levels based on the combined influence of multiple environmental factors. Users will be able to interact with the map through functions such as zooming, filtering, and selecting specific regions. In addition, the system will support exporting selected data or results into formats such as Excel.

The system is designed to be user-friendly and accessible, enabling land managers to make informed decisions for fire management and the protection of cultural heritage sites.

## 1.4 Success Criteria

The success of the system will be evaluated based on the following criteria:

- The system can successfully display cultural heritage sites and relevant environmental data on an interactive map.
- The system can classify areas into different fire risk levels based on the combined influence of environmental factors such as slope, vegetation, and fuel characteristics.
- Users can effectively interact with the map, including zooming, filtering, and selecting regions, without significant performance issues.
- The system can correctly process and integrate multiple datasets for visualization and analysis.
- The system can export selected data or results into formats such as Excel.
- The system is easy to use and accessible to users with different levels of technical and visual literacy.