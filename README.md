# Inspection Management Web Application

A responsive web application for conducting industrial facility inspections, built with Spring Boot (Gradle) for the backend and React for the frontend.

## Features

### Dashboard
- Overview of planned, in-progress, and completed inspections
- Display of key metrics (number of open inspections)

### Inspections
- Create new inspections (facility, date, responsible employee)
- Start, continue, and complete inspections
- Status display (planned / in progress / completed)

### Checklists
- Create and select checklists
- Conduct inspections based on check items
- Enter results (fulfilled / not fulfilled / N/A)
- Add comments to each check item

### Results and Reports
- Summary of inspection results
- Export as PDF / Print view

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database (in-memory)
- Gradle

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Axios for API communication
- Responsive CSS design

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- npm or yarn

### Running the Backend

```bash
cd backend
./gradlew bootRun
```

The backend will start on http://localhost:8080

### Running the Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will start on http://localhost:3000

## API Endpoints

### Inspections
- `GET /api/inspections` - Get all inspections
- `GET /api/inspections/{id}` - Get inspection by ID
- `GET /api/inspections/statistics` - Get inspection statistics
- `POST /api/inspections` - Create new inspection
- `PUT /api/inspections/{id}` - Update inspection
- `PUT /api/inspections/{id}/status` - Update inspection status
- `DELETE /api/inspections/{id}` - Delete inspection

### Checklists
- `GET /api/checklists` - Get all checklists
- `GET /api/checklists/{id}` - Get checklist by ID
- `GET /api/checklists/{id}/items` - Get checklist items
- `POST /api/checklists` - Create new checklist
- `POST /api/checklists/{id}/items` - Add item to checklist
- `DELETE /api/checklists/{id}` - Delete checklist

### Results
- `GET /api/results/inspection/{inspectionId}` - Get results for an inspection
- `POST /api/results/inspection/{inspectionId}` - Create result
- `PUT /api/results/{id}` - Update result
- `DELETE /api/results/{id}` - Delete result

## Project Structure

```
.
├── backend/
│   ├── src/main/java/com/inspection/
│   │   ├── InspectionApplication.java
│   │   ├── config/
│   │   │   └── DataInitializer.java
│   │   ├── controller/
│   │   │   ├── ChecklistController.java
│   │   │   ├── InspectionController.java
│   │   │   └── ResultController.java
│   │   ├── model/
│   │   │   ├── Checklist.java
│   │   │   ├── ChecklistItem.java
│   │   │   ├── Inspection.java
│   │   │   ├── InspectionStatus.java
│   │   │   ├── Result.java
│   │   │   └── ResultStatus.java
│   │   └── repository/
│   │       ├── ChecklistItemRepository.java
│   │       ├── ChecklistRepository.java
│   │       ├── InspectionRepository.java
│   │       └── ResultRepository.java
│   ├── build.gradle
│   └── settings.gradle
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChecklistManagement.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── InspectionExecution.tsx
    │   │   ├── InspectionForm.tsx
    │   │   ├── InspectionList.tsx
    │   │   └── InspectionReport.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   └── App.css
    └── package.json
```

## License

This project is developed for educational purposes as part of the Web Engineering course.
