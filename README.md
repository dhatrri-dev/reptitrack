# 🦎 ReptiTrack — Next-Gen Logistics & Shipment ERP

![ReptiTrack Banner](https://img.shields.io/badge/ReptiTrack-Logistics_ERP-blue?style=for-the-badge&logo=react&logoColor=white)
![Build Version](https://img.shields.io/badge/Version-1.0.0--Stable-green?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_%7C_Node_%7C_MySQL-orange?style=for-the-badge)

**ReptiTrack** is a high-performance, full-stack logistics management system designed to streamline shipment tracking, financial reporting, and operational efficiency. Built with a premium aesthetic and enterprise-grade architecture, it provides real-time insights into your supply chain.

---

## 🚀 Key Features

### 📊 Operational Metrics Dashboard
- **Live Analytics**: Real-time charts powered by `Recharts` and `Framer Motion` for smooth, dynamic data visualization.
- **Dynamic KPIs**: Track total shipments, active deliveries, revenue flow, and success rates at a glance.
- **Animated Interactions**: High-end micro-animations and smooth transitions for a premium user experience.

### 📦 Lifecycle Shipment Management
- **Complete CRUD**: Create, Update, and Track shipments with ease.
- **Real-time Status Tracking**: Monitor shipments from "Pending" to "Delivered" with a detailed event timeline.
- **Receiver Management**: Dedicated routes for managing delivery endpoints and contacts.

### 💰 Integrated Payment Tracker
- **Real-time Cost Data**: Automatically calculates shipment costs and revenue using optimized SQL JOINs.
- **Financial Status**: Track paid, pending, and overdue payments across all customers.
- **Currency Support**: Fully localized for professional presentation.

### 🔔 Smart Alert System
- **Automated Notifications**: System-generated alerts for delayed shipments or critical status changes.
- **Interactive Panel**: Quick-view panel for managers to address operational bottlenecks instantly.

### 👥 User & Access Control
- **Role-Based Management**: Scalable user management system with secure authentication.
- **Admin Dashboard**: Specialized tools for managing personnel and system configurations.

---

## 🛠 Tech Stack

### Frontend
- **React.js**: Modern component-based architecture.
- **Ant Design**: Enterprise-class UI design language.
- **Framer Motion**: Production-ready motion library.
- **Recharts**: Composited charting library for data visualization.
- **Leaflet**: Interactive map integration for shipment tracking.

### Backend
- **Node.js**: Asynchronous event-driven JavaScript runtime.
- **Express.js**: Fast, unopinionated, minimalist web framework.
- **MySQL**: Robust relational database for data integrity.
- **Axios**: Promise-based HTTP client for API communication.

---

## 📂 Project Structure

```text
logistics-app/
├── client/          # React Frontend (AntD, Framer Motion)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   └── pages/       # Dashboard, Tracking, Management
├── server/          # Node.js Backend (Express, MySQL)
│   ├── db/          # Database configuration and migrations
│   ├── routes/      # API endpoints (shipments, stats, auth)
│   └── scripts/     # Data sync and maintenance utilities
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL Server
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhatrri-dev/reptitrack.git
   cd reptitrack
   ```

2. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm start
   ```

3. **Backend Setup**
   ```bash
   cd ../server
   npm install
   # Configure your .env with DB credentials
   npm start
   ```

---

## 📄 License
Distributed under the ISC License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for Modern Logistics
</p>
