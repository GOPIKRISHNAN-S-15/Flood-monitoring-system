# 🌊 Smart IoT Flood Monitoring System - Project Structure

## 📁 Complete Project Directory Structure

```
flood-monitoring-system/
├─ 📄 README.md                    # Comprehensive documentation
├─ 📄 package.json                 # Node.js dependencies and scripts
├─ 📄 .env.example                 # Environment configuration template
├─ 📄 .gitignore                   # Git ignore rules
├─ 📄 LICENSE                      # MIT License file
├─ 📄 PROJECT_STRUCTURE.md          # This file
│
├─ 📂 server/                      # Backend Node.js application
│  ├─ 📄 server.js                 # Main Express server entry point
│  ├─ 📄 database.js               # SQLite database connection
│  │
│  ├─ 📂 models/                   # Database models and schemas
│  │  ├─ 📄 User.js                # User authentication model
│  │  ├─ 📄 SensorData.js          # Sensor reading data model
│  │  └─ 📄 Alert.js               # Alert notification model
│  │
│  ├─ 📂 controllers/              # API business logic controllers
│  │  ├─ 📄 authController.js      # User authentication logic
│  │  ├─ 📄 sensorController.js    # Sensor data processing
│  │  ├─ 📄 alertController.js     # Alert management logic
│  │  └─ 📄 servoController.js     # Servo motor control logic
│  │
│  ├─ 📂 routes/                   # Express route definitions
│  │  ├─ 📄 auth.js                # Authentication routes
│  │  ├─ 📄 sensorData.js          # Sensor data API routes
│  │  ├─ 📄 alerts.js              # Alert management routes
│  │  └─ 📄 servo.js               # Servo control routes
│  │
│  ├─ 📂 middleware/               # Custom Express middleware
│  │  ├─ 📄 auth.js                # JWT authentication middleware
│  │  ├─ 📄 validation.js          # Input validation middleware
│  │  └─ 📄 rateLimiting.js        # Rate limiting middleware
│  │
│  └─ 📄 database.sqlite           # SQLite database file (auto-generated)
│
├─ 📂 client/                      # Frontend web application
│  ├─ 📄 index.html                # Landing/home page
│  ├─ 📄 login.html                # User login page
│  ├─ 📄 signup.html               # User registration page
│  ├─ 📄 dashboard.html            # Main monitoring dashboard
│  ├─ 📄 about.html                # About page
│  ├─ 📄 team.html                 # Team information page
│  │
│  ├─ 📂 css/                      # Stylesheets
│  │  └─ 📄 style.css              # Main CSS file with responsive design
│  │
│  ├─ 📂 js/                       # JavaScript functionality
│  │  ├─ 📄 main.js                # Core application utilities
│  │  ├─ 📄 auth.js                # Authentication management
│  │  └─ 📄 dashboard.js           # Dashboard functionality with Chart.js
│  │
│  └─ 📂 assets/                   # Static assets
│     ├─ 📂 images/                # Images and icons
│     └─ 📂 fonts/                 # Custom fonts (if any)
│
├─ 📂 arduino/                     # NodeMCU ESP8266 firmware
│  └─ 📄 flood_monitor.ino         # Complete Arduino sketch
│
└─ 📂 docs/                        # Additional documentation
   ├─ 📄 API.md                    # API documentation
   ├─ 📄 HARDWARE_SETUP.md         # Hardware wiring guide
   ├─ 📄 DEPLOYMENT.md             # Deployment instructions
   └─ 📄 TROUBLESHOOTING.md        # Common issues and solutions
```

## 🏗️ System Architecture Overview

### Backend Components (server/)
- **server.js**: Express.js application with middleware, routing, and error handling
- **database.js**: SQLite database connection and initialization
- **models/**: Data models for User, SensorData, and Alert entities
- **controllers/**: Business logic for authentication, sensors, alerts, and servo control
- **routes/**: RESTful API endpoint definitions
- **middleware/**: Custom middleware for authentication, validation, and rate limiting

### Frontend Components (client/)
- **HTML Pages**: Landing page, authentication, dashboard, and informational pages
- **CSS**: Responsive design with Bootstrap integration and custom styling
- **JavaScript**: Modular JS for authentication, dashboard functionality, and Chart.js integration

### Hardware Integration (arduino/)
- **flood_monitor.ino**: Complete NodeMCU ESP8266 firmware with:
  - Ultrasonic sensor reading
  - Servo motor control
  - LCD display management
  - WiFi connectivity
  - HTTP communication with server
  - Local buzzer alerts

## 🔄 Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IoT Sensors   │────│   NodeMCU ESP8266│────│  WiFi Network   │
│   (HC-SR04)     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
┌─────────────────┐    ┌──────────────────┐              │
│  Servo Motor    │────│   Local Display  │              │
│  (SG90)         │    │   (16x2 LCD)     │              │
└─────────────────┘    └──────────────────┘              │
                                                          │
                                ┌─────────────────────────┘
                                │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Server    │────│    Database      │────│   REST API      │
│ (Node.js/Express)    │    (SQLite)      │    │   Endpoints     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
┌─────────────────┐    ┌──────────────────┐              │
│  Web Dashboard  │────│   Frontend JS    │──────────────┘
│ (HTML/CSS/JS)   │    │   (Chart.js)     │
└─────────────────┘    └──────────────────┘
```

## 🚀 Quick Start Guide

### 1. Clone Repository
```bash
git clone https://github.com/pixel-hunters/iot-flood-monitoring.git
cd iot-flood-monitoring
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Upload Arduino Code
- Open `arduino/flood_monitor.ino` in Arduino IDE
- Update WiFi credentials and server URL
- Upload to NodeMCU ESP8266

### 6. Access Web Dashboard
- Open browser to `http://localhost:3000`
- Login with: admin@pixelhunters.com / admin123

## 📊 Technology Stack

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **SQLite**: Lightweight database
- **JWT**: JSON Web Token authentication
- **bcrypt**: Password hashing
- **Helmet**: Security middleware
- **Morgan**: HTTP request logger

### Frontend Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with custom properties
- **JavaScript ES6+**: Interactive functionality
- **Bootstrap 5**: Responsive UI framework
- **Chart.js**: Data visualization
- **Font Awesome**: Icon library

### Hardware Technologies
- **NodeMCU ESP8266**: WiFi-enabled microcontroller
- **HC-SR04**: Ultrasonic distance sensor
- **SG90**: Servo motor for gate control
- **16x2 LCD**: Local display
- **Buzzer**: Audio alert system

## 🔧 Configuration Files

- **package.json**: Node.js project configuration
- **.env.example**: Environment variables template
- **arduino/flood_monitor.ino**: NodeMCU firmware configuration

## 📝 Key Features Implemented

### Real-time Monitoring
- ✅ Continuous water level monitoring
- ✅ Real-time dashboard updates
- ✅ Interactive data visualizations
- ✅ Historical trend analysis

### Automated Control
- ✅ Smart flood gate control
- ✅ Threshold-based automation
- ✅ Manual override capability
- ✅ Safety interlocks

### Alert System
- ✅ Multi-level warning system
- ✅ Audio and visual alerts
- ✅ Alert history tracking
- ✅ Status notifications

### User Management
- ✅ Secure authentication
- ✅ JWT token-based sessions
- ✅ User profile management
- ✅ Access control

### IoT Integration
- ✅ WiFi connectivity
- ✅ HTTP API communication
- ✅ Local sensor processing
- ✅ Device health monitoring

## 🎯 Project Completion Status

| Component | Status | Description |
|-----------|--------|-------------|
| **Backend API** | ✅ Complete | Full REST API with authentication |
| **Database** | ✅ Complete | SQLite with comprehensive models |
| **Frontend Web** | ✅ Complete | Responsive dashboard with charts |
| **Authentication** | ✅ Complete | JWT-based secure authentication |
| **IoT Firmware** | ✅ Complete | NodeMCU code with all features |
| **Documentation** | ✅ Complete | Comprehensive README and guides |
| **Deployment** | ✅ Ready | Production-ready configuration |

## 👥 Team Pixel Hunters

### Team Members
- **Gopikrishnan.S** - Lead Developer & Project Coordinator
- **Deepak Kumar.M** - Hardware Specialist & IoT Engineer  
- **Jeeva.K** - Frontend Developer & UI/UX Designer
- **Mithun.S** - Backend Developer & Database Architect

### Institution
**M. Kumarasamy College of Engineering**  
Karur, Tamil Nadu, India

## 📞 Support & Contact

- **Team Email**: pixelhunters@mkce.ac.in
- **Repository**: https://github.com/pixel-hunters/iot-flood-monitoring
- **Documentation**: See README.md for detailed setup instructions

---

**🌊 Smart flood monitoring for safer communities**  
*Built with modern web technologies and IoT integration*