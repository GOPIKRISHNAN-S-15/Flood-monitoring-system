# 🌊 Smart IoT Flood Monitoring and Automated Flood Gate System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey.svg)](https://www.sqlite.org/)

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Team Information](#team-information)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Hardware Components](#hardware-components)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Hardware Setup](#hardware-setup)
- [NodeMCU Programming](#nodemcu-programming)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

The **Smart IoT Flood Monitoring and Automated Flood Gate System** is an innovative IoT-based solution designed to monitor water levels in real-time and automatically control flood gates to prevent flooding. The system uses ultrasonic sensors to measure water levels and provides a comprehensive web dashboard for monitoring and control.

### Key Objectives
- 🔍 **Real-time Water Level Monitoring** - Continuous monitoring using IoT sensors
- 🚪 **Automated Flood Gate Control** - Intelligent servo motor control based on water levels
- 🚨 **Smart Alert System** - Multi-level warning and danger alerts
- 📊 **Data Analytics** - Historical data analysis and trend visualization
- 🌐 **Remote Access** - Web-based dashboard for remote monitoring and control

## 👥 Team Information

**Team Name:** Pixel Hunters  
**Institution:** M. Kumarasamy College of Engineering, Karur, Tamil Nadu

### Team Members
- **Gopikrishnan.S** - Lead Developer & Project Coordinator
- **Deepak Kumar.M** - Hardware Specialist & IoT Engineer  
- **Jeeva.K** - Frontend Developer & UI/UX Designer
- **Mithun.S** - Backend Developer & Database Architect

## ✨ Features

### Core Functionality
- 🌊 **Water Level Detection** - Ultrasonic sensor-based measurement
- 🎛️ **Automated Response** - Smart flood gate control based on thresholds
- 📱 **Responsive Web Dashboard** - Real-time monitoring interface
- 🔐 **User Authentication** - JWT-based secure authentication
- 📈 **Data Visualization** - Interactive charts and gauges
- 🚨 **Alert Management** - Real-time notifications and alert history

### Water Level Logic
- **Normal**: Distance > 80 cm (Green status)
- **Warning**: 50-80 cm distance (Yellow alert)
- **Danger**: Distance < 50 cm (Red alert, automatic gate opening)

### Dashboard Features
- Real-time water level gauge
- Historical trend charts
- Alert notifications panel
- Manual servo control
- User profile management
- Mobile-responsive design

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **JavaScript** - ES6+ for interactive functionality
- **Bootstrap 5** - Responsive UI framework
- **Chart.js** - Data visualization library
- **Font Awesome** - Icon library

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **SQLite** - Lightweight database
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Security middleware

### Hardware
- **NodeMCU ESP8266** - WiFi-enabled microcontroller
- **HC-SR04** - Ultrasonic distance sensor
- **SG90 Servo Motor** - Flood gate control
- **Buzzer** - Local audio alerts
- **16x2 LCD Display** - Local data display

## 🏗️ System Architecture

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
┌─────────────────┐    ┌──────────────────┐              │
│   Web Server    │────│    Database      │              │
│ (Node.js/Express)    │    (SQLite)      │              │
└─────────────────┘    └──────────────────┘              │
                                                          │
┌─────────────────┐    ┌──────────────────┐              │
│  Web Dashboard  │────│   REST API       │──────────────┘
│ (HTML/CSS/JS)   │    │   Endpoints      │
└─────────────────┘    └──────────────────┘
```

## 🔧 Hardware Components

| Component | Model | Function | Specifications |
|-----------|-------|----------|----------------|
| **Microcontroller** | NodeMCU ESP8266 | Main controller | WiFi enabled, Arduino compatible |
| **Ultrasonic Sensor** | HC-SR04 | Distance measurement | Range: 2-400cm, Accuracy: ±3mm |
| **Servo Motor** | SG90 | Gate control | 180° rotation, Digital control |
| **Display** | 16x2 LCD | Local data display | I2C interface, Backlight |
| **Alert** | Buzzer | Audio notifications | High decibel, Low power |

## 🚀 Installation

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

### Step 1: Clone the Repository
```bash
git clone https://github.com/pixel-hunters/iot-flood-monitoring.git
cd iot-flood-monitoring
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Setup
Create a `.env` file in the root directory (optional):
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Step 4: Initialize Database
The SQLite database will be automatically created and initialized when you first run the server.

## ⚙️ Configuration

### Default Admin Account
A default admin account is automatically created:
- **Email:** `admin@pixelhunters.com`
- **Password:** `admin123`

> **Security Note:** Change the default password immediately after first login in production environments.

### Water Level Thresholds
Modify the thresholds in `server/controllers/sensorController.js`:
```javascript
const determineStatus = (distance) => {
    if (distance > 80) return 'normal';     // Normal level
    if (distance >= 50) return 'warning';   // Warning level  
    return 'danger';                        // Danger level
};
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
This uses `nodemon` for automatic server restarts during development.

### Production Mode
```bash
npm start
```

### Access the Application
- **Web Dashboard:** http://localhost:3000
- **API Health Check:** http://localhost:3000/api/health
- **Login Page:** http://localhost:3000/login

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

#### POST `/api/auth/login`
Authenticate user and get access token.
```json
{
  "email": "admin@pixelhunters.com",
  "password": "admin123"
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

### Sensor Data Endpoints

#### POST `/api/sensor-data`
Send sensor data from NodeMCU (public endpoint).
```json
{
  "distance": 65.5,
  "water_level": 134.5,
  "servo_state": "closed"
}
```

#### GET `/api/sensor-data`
Get all sensor readings (requires authentication).
- Query parameters: `limit` (optional)

#### GET `/api/latest`
Get latest sensor reading (public endpoint).

#### GET `/api/sensor-data/chart`
Get chart data for visualization.
- Query parameters: `hours` (default: 24)

### Alert Endpoints

#### GET `/api/alerts`
Get all alerts (requires authentication).

#### GET `/api/alerts/recent`
Get recent alerts within timeframe.
- Query parameters: `hours` (default: 24)

#### GET `/api/alerts/stats`
Get alert statistics and counts.

### Servo Control Endpoints

#### GET `/api/servo/status`
Get current servo state.

#### POST `/api/servo/control`
Manually control servo motor.
```json
{
  "action": "open"
}
```

### System Endpoints

#### GET `/api/health`
System health check.

#### GET `/api/status`
Detailed system status and metrics.

## 🔌 Hardware Setup

### Wiring Diagram

```
NodeMCU ESP8266 Connections:
├── HC-SR04 Ultrasonic Sensor
│   ├── VCC  → 3V3 (NodeMCU)
│   ├── GND  → GND (NodeMCU) 
│   ├── Trig → D1 (GPIO5)
│   └── Echo → D2 (GPIO4)
├── SG90 Servo Motor
│   ├── VCC  → VU (5V NodeMCU)
│   ├── GND  → GND (NodeMCU)
│   └── Signal → D3 (GPIO0)
├── 16x2 LCD Display (I2C)
│   ├── VCC  → 3V3 (NodeMCU)
│   ├── GND  → GND (NodeMCU)
│   ├── SDA  → D6 (GPIO12)
│   └── SCL  → D7 (GPIO13)
└── Buzzer
    ├── Positive → D5 (GPIO14)
    └── Negative → GND (NodeMCU)
```

### Circuit Assembly
1. Connect the ultrasonic sensor for distance measurement
2. Wire the servo motor for gate control
3. Set up LCD display for local monitoring
4. Connect buzzer for audio alerts
5. Ensure proper power distribution (consider external power for servo)

## 📟 NodeMCU Programming

### Arduino IDE Setup
1. Install Arduino IDE
2. Add ESP8266 board package:
   - File → Preferences
   - Additional Board Manager URLs: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Install ESP8266 boards via Board Manager
4. Install required libraries:
   - ESP8266WiFi
   - ESP8266HTTPClient
   - ArduinoJson
   - Servo
   - LiquidCrystal_I2C

### Sample NodeMCU Code
Create a new file `arduino/flood_monitor.ino`:

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include <LiquidCrystal_I2C.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverURL = "http://your-server-ip:3000/api/sensor-data";

// Pin definitions
#define TRIG_PIN D1
#define ECHO_PIN D2
#define SERVO_PIN D3
#define BUZZER_PIN D5

// Component initialization
Servo gateServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Global variables
float waterLevel = 0;
float distance = 0;
String servoState = "closed";
unsigned long lastSensorRead = 0;
unsigned long lastServerUpdate = 0;
const unsigned long SENSOR_INTERVAL = 1000;    // 1 second
const unsigned long SERVER_INTERVAL = 10000;   // 10 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize components
  initializePins();
  initializeLCD();
  initializeServo();
  connectWiFi();
  
  Serial.println("Flood Monitoring System Started");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensor data every second
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensorData();
    updateLocalDisplay();
    lastSensorRead = currentTime;
  }
  
  // Send data to server every 10 seconds
  if (currentTime - lastServerUpdate >= SERVER_INTERVAL) {
    sendDataToServer();
    lastServerUpdate = currentTime;
  }
  
  delay(100);
}

void initializePins() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
}

void initializeLCD() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("FloodGuard IoT");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);
}

void initializeServo() {
  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // Close gate initially
  servoState = "closed";
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(0, 1);
    lcd.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  delay(2000);
}

void readSensorData() {
  // Trigger ultrasonic sensor
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo duration
  long duration = pulseIn(ECHO_PIN, HIGH);
  
  // Calculate distance in cm
  distance = duration * 0.034 / 2;
  
  // Calculate water level (assuming sensor is 200cm above ground)
  float sensorHeight = 200.0; // Adjust based on your setup
  waterLevel = sensorHeight - distance;
  
  // Ensure realistic values
  if (distance < 2 || distance > 400) {
    Serial.println("Sensor reading out of range");
    return;
  }
  
  // Determine action based on distance
  String status = determineStatus(distance);
  
  // Control servo and buzzer based on status
  if (status == "danger" && servoState == "closed") {
    openGate();
    activateBuzzer();
  } else if (status == "normal" && servoState == "open") {
    closeGate();
    deactivateBuzzer();
  }
  
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm, Water Level: ");
  Serial.print(waterLevel);
  Serial.print(" cm, Status: ");
  Serial.println(status);
}

String determineStatus(float dist) {
  if (dist > 80) return "normal";
  if (dist >= 50) return "warning";
  return "danger";
}

void openGate() {
  gateServo.write(90); // Open position
  servoState = "open";
  Serial.println("Gate opened");
}

void closeGate() {
  gateServo.write(0); // Close position
  servoState = "closed";
  Serial.println("Gate closed");
}

void activateBuzzer() {
  // Buzzer pattern for danger
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}

void deactivateBuzzer() {
  digitalWrite(BUZZER_PIN, LOW);
}

void updateLocalDisplay() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Level: ");
  lcd.print(waterLevel, 1);
  lcd.print("cm");
  
  lcd.setCursor(0, 1);
  lcd.print("Dist: ");
  lcd.print(distance, 1);
  lcd.print(" Gate:");
  lcd.print(servoState.charAt(0));
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }
  
  HTTPClient http;
  WiFiClient client;
  
  http.begin(client, serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["distance"] = distance;
  doc["water_level"] = waterLevel;
  doc["servo_state"] = servoState;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending data: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Server response: " + response);
    
    // Parse response for any commands
    StaticJsonDocument<300> responseDoc;
    deserializeJson(responseDoc, response);
    
    if (responseDoc["action"] == "open_gate") {
      openGate();
    }
  } else {
    Serial.print("Error sending data: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}
```

### Programming Steps
1. Open Arduino IDE
2. Create new sketch and paste the code above
3. Update WiFi credentials and server URL
4. Select board: NodeMCU 1.0 (ESP-12E Module)
5. Select correct COM port
6. Upload the sketch

## 🚀 Deployment

### Local Network Deployment
1. Ensure server runs on a static IP
2. Update NodeMCU code with server IP address
3. Configure port forwarding if needed

### Cloud Deployment Options

#### Heroku
```bash
# Install Heroku CLI
# Create Procfile
echo "web: node server/server.js" > Procfile

# Deploy
heroku create your-app-name
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### AWS EC2
1. Launch EC2 instance
2. Install Node.js and npm
3. Clone repository
4. Install dependencies
5. Configure security groups
6. Use PM2 for process management

### Environment Variables for Production
```env
NODE_ENV=production
PORT=80
JWT_SECRET=your-super-secure-production-secret
```

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port is in use
netstat -an | findstr :3000

# Kill process using port
npx kill-port 3000
```

#### Database Issues
```bash
# Delete and recreate database
rm server/database.sqlite
npm start
```

#### NodeMCU Not Connecting
1. Check WiFi credentials
2. Verify server IP address
3. Ensure firewall allows connections
4. Check sensor wiring

#### Authentication Problems
```bash
# Clear browser localStorage
# Use demo credentials:
# Email: admin@pixelhunters.com
# Password: admin123
```

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=* npm start
```

### Network Configuration
For remote access, configure your router:
1. Set static IP for server
2. Configure port forwarding (port 3000)
3. Update firewall rules

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting

### Bug Reports
Use GitHub issues with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- System information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Team Pixel Hunters

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **M. Kumarasamy College of Engineering** - For providing the platform and support
- **Faculty Advisors** - For guidance and mentorship
- **Open Source Community** - For the amazing libraries and tools
- **IoT Community** - For inspiration and best practices

## 📞 Contact & Support

- **Team Email:** [pixelhunters@mkce.ac.in](mailto:pixelhunters@mkce.ac.in)
- **Project Repository:** [GitHub](https://github.com/pixel-hunters/iot-flood-monitoring)
- **Institution:** [M. Kumarasamy College of Engineering](https://www.mkce.ac.in)

---

**Developed with ❤️ by Team Pixel Hunters**  
*M. Kumarasamy College of Engineering, Karur, Tamil Nadu*

**Version:** 1.0.0  
**Last Updated:** March 2024