🌊 Smart IoT Flood Monitoring & Automated Gate System

🚀 An IoT-based system to monitor water levels and automatically control flood gates using sensors and a web dashboard.

🎯 Overview

This project uses an ultrasonic sensor + NodeMCU to detect water levels and automatically open/close flood gates using a servo motor.
A web dashboard allows monitoring, alerts, and manual control.

✨ Features

🌊 Water level detection (HC-SR04)

🚪 Automatic gate control (Servo)

🚨 Alert system (Normal / Warning / Danger)

📊 Dashboard with live data & charts

🔐 Secure login (JWT authentication)

🌐 Remote monitoring via web app

⚙️ Water Level Logic

Normal: > 80 cm

Warning: 50 – 80 cm

Danger: < 50 cm → Gate opens automatically

🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript, Bootstrap, Chart.js
Backend: Node.js, Express.js, SQLite
Hardware: NodeMCU ESP8266, HC-SR04, Servo (SG90), Buzzer, LCD

🏗️ Architecture

Sensor → NodeMCU → WiFi → Server → Database → Web Dashboard

🔧 Hardware Components

NodeMCU ESP8266

Ultrasonic Sensor (HC-SR04)

Servo Motor (SG90)

Buzzer

16x2 LCD

🚀 Installation
git clone https://github.com/your-repo/iot-flood-monitoring.git
cd iot-flood-monitoring
npm install
npm start
🌐 Usage

Open: http://localhost:3000

Default Login:

Email: admin@pixelhunters.com

Password: admin123

📡 API (Basic)

POST /api/sensor-data → Send sensor data

GET /api/latest → Latest reading

POST /api/servo/control → Control gate

🔌 Hardware Setup (Pins)

Trig → D1

Echo → D2

Servo → D3

Buzzer → D5

👥 Team

Pixel Hunters

Gopikrishnan S

Deepak Kumar M

Jeeva K

Mithun S

📄 License

MIT License

❤️ Acknowledgment
