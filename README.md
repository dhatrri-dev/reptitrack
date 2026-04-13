# ReptiTrack

A logistics and shipment management system designed for tracking operational lifecycles and financial data. Built as a full-stack application using Node.js, React, and MySQL.

## Overview
ReptiTrack provides a centralized platform for logistics operations, focusing on shipment tracking, customer management, and financial reporting. The system uses a normalized relational database to maintain consistency across shipment statuses and payment records.

## Core Modules

### 📦 Shipment Management
- **Lifecycle Tracking**: Full CRUD capability for shipments with state-based status updates (Pending, In Transit, Delivered).
- **Receiver Registry**: Dedicated management for delivery endpoints and contact points to ensure data reusability.
- **Tracking History**: Status-based tracking logic to monitor shipment progression over time.

### 💰 Financial Integration
- **Cost Calculation**: Automated revenue and cost tracking using SQL JOINs to correlate shipments with billing data.
- **Payment Lifecycle**: Monitoring of paid, pending, and overdue transactions at the customer level.
- **Currency Normalization**: Consistent financial reporting localized for standard logistics operations.

### 📊 Operations Dashboard
- **Dynamic Visualization**: Rendering of operational KPIs (Total Shipments, Revenue, Success Rates) using Recharts.
- **Alert System**: Logic-based notification system that flags delayed shipments and critical status changes.
- **Metrics Aggregation**: Backend aggregation of database records to provide operational insights.

## Technical Stack
- **Frontend**: React.js (Component-based UI), Ant Design, Framer Motion.
- **Backend**: Node.js and Express.js (RESTful API architecture).
- **Database**: MySQL (Relational schema, indexed for shipment and tracking lookups).
- **Communication**: Axios and Fetch for client-server interaction.
- **Geospatial**: Leaflet integration for shipment coordinate visualization.

## Project Structure
```text
logistics-app/
├── client/          # React single-page application
│   ├── src/
│   │   ├── components/  # Modular UI elements
│   │   └── pages/       # Dashboard and management views
├── server/          # Express.js REST API
│   ├── db/          # Database connection and schema definitions
│   ├── routes/      # Endpoint handlers for shipments, payments, and stats
│   └── scripts/     # Maintenance and data synchronization utilities
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL Server instance
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhatrri-dev/reptitrack.git
   cd reptitrack
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Configure .env with DB_HOST, DB_USER, DB_PASS, and DB_NAME
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   npm start
   ```

## License
Distributed under the ISC License.

## Author
Dhatrri
