/*
 * Smart IoT Flood Monitoring and Automated Flood Gate System
 * Team: Pixel Hunters
 * Institution: M. Kumarasamy College of Engineering, Karur
 * 
 * This Arduino sketch runs on NodeMCU ESP8266 and handles:
 * - Ultrasonic sensor reading for water level detection
 * - Servo motor control for automated flood gate
 * - Local LCD display for real-time monitoring
 * - WiFi connectivity and data transmission to web server
 * - Local buzzer alerts based on water level thresholds
 * 
 * Hardware Components:
 * - NodeMCU ESP8266
 * - HC-SR04 Ultrasonic Sensor
 * - SG90 Servo Motor
 * - 16x2 LCD Display (I2C)
 * - Buzzer for audio alerts
 * 
 * Pin Configuration:
 * - Ultrasonic Trig: D1 (GPIO5)
 * - Ultrasonic Echo: D2 (GPIO4)
 * - Servo Control: D3 (GPIO0)
 * - LCD SDA: D6 (GPIO12)
 * - LCD SCL: D7 (GPIO13)
 * - Buzzer: D5 (GPIO14)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ===== CONFIGURATION SECTION =====
// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // Replace with your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";    // Replace with your WiFi password

// Server Configuration
const char* SERVER_URL = "http://192.168.1.100:3000/api/sensor-data"; // Replace with your server IP
const char* HEALTH_CHECK_URL = "http://192.168.1.100:3000/api/health";

// Hardware Pin Definitions
#define TRIG_PIN D1        // GPIO5 - Ultrasonic Trigger
#define ECHO_PIN D2        // GPIO4 - Ultrasonic Echo  
#define SERVO_PIN D3       // GPIO0 - Servo Motor
#define BUZZER_PIN D5      // GPIO14 - Buzzer
#define LED_PIN D4         // GPIO2 - Built-in LED

// System Configuration
#define SENSOR_HEIGHT_CM 200.0      // Height of sensor above ground level (adjust for your setup)
#define MEASUREMENT_TIMEOUT 30000   // Ultrasonic sensor timeout (microseconds)

// Thresholds (matching server logic)
#define NORMAL_THRESHOLD 80     // Distance > 80cm = Normal
#define WARNING_THRESHOLD 50    // Distance 50-80cm = Warning  
#define DANGER_THRESHOLD 50     // Distance < 50cm = Danger

// Timing Configuration
const unsigned long SENSOR_READ_INTERVAL = 2000;    // Read sensors every 2 seconds
const unsigned long SERVER_UPDATE_INTERVAL = 10000; // Send to server every 10 seconds
const unsigned long DISPLAY_UPDATE_INTERVAL = 1000; // Update LCD every 1 second
const unsigned long WIFI_RETRY_INTERVAL = 30000;    // Retry WiFi connection every 30 seconds
const unsigned long HEALTH_CHECK_INTERVAL = 60000;  // Health check every 60 seconds

// ===== HARDWARE OBJECTS =====
Servo floodGateServo;
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C address 0x27, 16 columns, 2 rows

// ===== GLOBAL VARIABLES =====
// Sensor Data
float currentDistance = 0.0;
float currentWaterLevel = 0.0;
String currentStatus = "normal";
String servoPosition = "closed";
bool buzzerActive = false;

// Timing Variables
unsigned long lastSensorRead = 0;
unsigned long lastServerUpdate = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastWifiCheck = 0;
unsigned long lastHealthCheck = 0;

// Status Variables
bool wifiConnected = false;
bool serverReachable = false;
int consecutiveFailures = 0;
int successfulTransmissions = 0;

// System Statistics
unsigned long systemUpTime = 0;
unsigned long totalMeasurements = 0;
float averageDistance = 0.0;

// ===== SETUP FUNCTION =====
void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=====================================");
  Serial.println("Smart IoT Flood Monitoring System");
  Serial.println("Team: Pixel Hunters");
  Serial.println("Institution: M. Kumarasamy College of Engineering");
  Serial.println("=====================================");
  
  // Initialize hardware components
  initializePins();
  initializeLCD();
  initializeServo();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Perform initial health check
  performHealthCheck();
  
  // System ready
  Serial.println("System initialization complete!");
  Serial.println("Starting flood monitoring...");
  
  displaySystemReady();
  systemUpTime = millis();
}

// ===== MAIN LOOP =====
void loop() {
  unsigned long currentTime = millis();
  
  // Monitor WiFi connection
  checkWiFiConnection(currentTime);
  
  // Read sensor data at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensorData();
    lastSensorRead = currentTime;
  }
  
  // Update local display
  if (currentTime - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL) {
    updateLocalDisplay();
    lastDisplayUpdate = currentTime;
  }
  
  // Send data to server
  if (currentTime - lastServerUpdate >= SERVER_UPDATE_INTERVAL) {
    if (wifiConnected) {
      sendDataToServer();
    }
    lastServerUpdate = currentTime;
  }
  
  // Perform health check
  if (currentTime - lastHealthCheck >= HEALTH_CHECK_INTERVAL) {
    if (wifiConnected) {
      performHealthCheck();
    }
    lastHealthCheck = currentTime;
  }
  
  // Handle buzzer patterns
  manageBuzzerAlerts();
  
  // Update system LED status
  updateStatusLED();
  
  delay(100); // Small delay to prevent overwhelming the system
}

// ===== INITIALIZATION FUNCTIONS =====
void initializePins() {
  Serial.print("Initializing GPIO pins... ");
  
  // Configure pin modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Set initial states
  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // LED on during initialization
  
  Serial.println("✓ Done");
}

void initializeLCD() {
  Serial.print("Initializing LCD display... ");
  
  lcd.init();
  lcd.backlight();
  lcd.clear();
  
  // Display startup message
  lcd.setCursor(0, 0);
  lcd.print("FloodGuard IoT");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  Serial.println("✓ Done");
  delay(2000);
}

void initializeServo() {
  Serial.print("Initializing servo motor... ");
  
  floodGateServo.attach(SERVO_PIN);
  
  // Close gate initially (safety position)
  floodGateServo.write(0);
  servoPosition = "closed";
  
  Serial.println("✓ Done (Gate closed)");
  delay(1000);
}

// ===== WiFi FUNCTIONS =====
void connectToWiFi() {
  Serial.println("Connecting to WiFi network...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0, 1);
  lcd.print(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(attempts % 16, 1);
    lcd.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("✓ WiFi connected successfully!");
    Serial.print("Local IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(3000);
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("✗ Failed to connect to WiFi");
    Serial.println("System will continue in offline mode");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Offline Mode");
    delay(3000);
  }
}

void checkWiFiConnection(unsigned long currentTime) {
  if (currentTime - lastWifiCheck >= WIFI_RETRY_INTERVAL) {
    if (WiFi.status() != WL_CONNECTED && wifiConnected) {
      Serial.println("WiFi connection lost. Attempting to reconnect...");
      wifiConnected = false;
      WiFi.reconnect();
    } else if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
      Serial.println("WiFi reconnected successfully!");
      wifiConnected = true;
    }
    lastWifiCheck = currentTime;
  }
}

// ===== SENSOR READING FUNCTIONS =====
void readSensorData() {
  // Read ultrasonic sensor
  float distance = readUltrasonicDistance();
  
  if (distance < 0) {
    Serial.println("⚠ Invalid sensor reading, skipping...");
    return;
  }
  
  // Update measurements
  currentDistance = distance;
  currentWaterLevel = SENSOR_HEIGHT_CM - distance;
  
  // Ensure water level is not negative
  if (currentWaterLevel < 0) {
    currentWaterLevel = 0;
  }
  
  // Determine status and take action
  String previousStatus = currentStatus;
  currentStatus = determineWaterStatus(distance);
  
  // Update statistics
  totalMeasurements++;
  averageDistance = ((averageDistance * (totalMeasurements - 1)) + distance) / totalMeasurements;
  
  // Handle status changes
  if (currentStatus != previousStatus) {
    Serial.println("Status change detected: " + previousStatus + " → " + currentStatus);
    handleStatusChange(currentStatus, previousStatus);
  }
  
  // Control flood gate based on status
  controlFloodGate(currentStatus);
  
  // Log current readings
  Serial.print("Distance: ");
  Serial.print(distance, 2);
  Serial.print("cm | Water Level: ");
  Serial.print(currentWaterLevel, 2);
  Serial.print("cm | Status: ");
  Serial.print(currentStatus);
  Serial.print(" | Gate: ");
  Serial.println(servoPosition);
}

float readUltrasonicDistance() {
  // Clear trigger pin
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Send 10 microsecond pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo duration
  long duration = pulseIn(ECHO_PIN, HIGH, MEASUREMENT_TIMEOUT);
  
  if (duration == 0) {
    Serial.println("Ultrasonic sensor timeout");
    return -1;
  }
  
  // Calculate distance (speed of sound = 343 m/s)
  float distance = (duration * 0.034) / 2.0;
  
  // Validate reading
  if (distance < 2 || distance > 400) {
    Serial.print("Distance out of range: ");
    Serial.println(distance);
    return -1;
  }
  
  return distance;
}

String determineWaterStatus(float distance) {
  if (distance > NORMAL_THRESHOLD) {
    return "normal";
  } else if (distance >= WARNING_THRESHOLD) {
    return "warning";
  } else {
    return "danger";
  }
}

void handleStatusChange(String newStatus, String oldStatus) {
  Serial.println("Water level status changed!");
  Serial.println("Previous: " + oldStatus + " → Current: " + newStatus);
  
  // Log timestamp of status change
  unsigned long uptime = millis() - systemUpTime;
  Serial.print("System uptime: ");
  Serial.print(uptime / 1000);
  Serial.println(" seconds");
  
  // Visual indicator on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("STATUS CHANGE!");
  lcd.setCursor(0, 1);
  lcd.print(oldStatus + " -> " + newStatus);
  delay(2000);
}

// ===== FLOOD GATE CONTROL =====
void controlFloodGate(String status) {
  if (status == "danger" && servoPosition != "open") {
    openFloodGate();
  } else if (status == "normal" && servoPosition != "closed") {
    closeFloodGate();
  }
  // Warning status maintains current gate position
}

void openFloodGate() {
  Serial.println("🚪 Opening flood gate (EMERGENCY)");
  floodGateServo.write(90); // Open position
  servoPosition = "open";
  
  // Visual feedback
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("EMERGENCY!");
  lcd.setCursor(0, 1);
  lcd.print("Gate Opening...");
  delay(2000);
}

void closeFloodGate() {
  Serial.println("🚪 Closing flood gate (SAFE)");
  floodGateServo.write(0); // Closed position
  servoPosition = "closed";
  
  // Visual feedback
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Water Level OK");
  lcd.setCursor(0, 1);
  lcd.print("Gate Closing...");
  delay(2000);
}

// ===== ALERT SYSTEM =====
void manageBuzzerAlerts() {
  static unsigned long lastBuzzerChange = 0;
  static bool buzzerState = false;
  
  if (currentStatus == "danger") {
    // Rapid beeping for danger
    if (millis() - lastBuzzerChange >= 300) {
      buzzerState = !buzzerState;
      digitalWrite(BUZZER_PIN, buzzerState ? HIGH : LOW);
      lastBuzzerChange = millis();
    }
    buzzerActive = true;
  } else if (currentStatus == "warning") {
    // Slow beeping for warning
    if (millis() - lastBuzzerChange >= 1000) {
      buzzerState = !buzzerState;
      digitalWrite(BUZZER_PIN, buzzerState ? HIGH : LOW);
      lastBuzzerChange = millis();
    }
    buzzerActive = buzzerState;
  } else {
    // Silent for normal
    digitalWrite(BUZZER_PIN, LOW);
    buzzerActive = false;
  }
}

// ===== DISPLAY FUNCTIONS =====
void updateLocalDisplay() {
  lcd.clear();
  
  // First line: Water level and status
  lcd.setCursor(0, 0);
  lcd.print("L:");
  lcd.print(currentWaterLevel, 1);
  lcd.print("cm ");
  
  if (currentStatus == "normal") {
    lcd.print("OK");
  } else if (currentStatus == "warning") {
    lcd.print("WARN");
  } else {
    lcd.print("DNGR");
  }
  
  // Second line: Distance and gate status
  lcd.setCursor(0, 1);
  lcd.print("D:");
  lcd.print(currentDistance, 1);
  lcd.print(" G:");
  lcd.print(servoPosition == "open" ? "OPEN" : "CLSD");
  
  // WiFi indicator
  if (wifiConnected) {
    lcd.setCursor(15, 0);
    lcd.print("*");
  }
  
  // Server connection indicator
  if (serverReachable) {
    lcd.setCursor(15, 1);
    lcd.print("S");
  }
}

void displaySystemReady() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  lcd.setCursor(0, 1);
  lcd.print("Monitoring...");
  delay(2000);
}

// ===== SERVER COMMUNICATION =====
void sendDataToServer() {
  if (!wifiConnected) {
    Serial.println("Cannot send data: WiFi not connected");
    return;
  }
  
  HTTPClient http;
  WiFiClient client;
  
  Serial.print("Sending data to server... ");
  
  // Prepare HTTP request
  http.begin(client, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout
  
  // Create JSON payload
  StaticJsonDocument<300> sensorData;
  sensorData["distance"] = currentDistance;
  sensorData["water_level"] = currentWaterLevel;
  sensorData["servo_state"] = servoPosition;
  sensorData["status"] = currentStatus;
  sensorData["buzzer_active"] = buzzerActive;
  sensorData["wifi_strength"] = WiFi.RSSI();
  sensorData["uptime_seconds"] = (millis() - systemUpTime) / 1000;
  sensorData["total_measurements"] = totalMeasurements;
  
  String jsonPayload;
  serializeJson(sensorData, jsonPayload);
  
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("✓ Response (");
    Serial.print(httpResponseCode);
    Serial.print("): ");
    Serial.println(response);
    
    serverReachable = true;
    consecutiveFailures = 0;
    successfulTransmissions++;
    
    // Parse server response for any commands
    parseServerResponse(response);
    
  } else {
    Serial.print("✗ HTTP Error: ");
    Serial.println(httpResponseCode);
    serverReachable = false;
    consecutiveFailures++;
  }
  
  http.end();
}

void parseServerResponse(String response) {
  StaticJsonDocument<200> responseDoc;
  DeserializationError error = deserializeJson(responseDoc, response);
  
  if (error) {
    Serial.println("Failed to parse server response");
    return;
  }
  
  // Check for remote commands
  if (responseDoc.containsKey("command")) {
    String command = responseDoc["command"];
    Serial.println("Received server command: " + command);
    
    if (command == "open_gate") {
      openFloodGate();
    } else if (command == "close_gate") {
      closeFloodGate();
    } else if (command == "test_buzzer") {
      testBuzzer();
    }
  }
}

void performHealthCheck() {
  if (!wifiConnected) return;
  
  HTTPClient http;
  WiFiClient client;
  
  http.begin(client, HEALTH_CHECK_URL);
  http.setTimeout(3000);
  
  int responseCode = http.GET();
  
  if (responseCode == 200) {
    Serial.println("✓ Server health check passed");
    serverReachable = true;
  } else {
    Serial.print("✗ Server health check failed: ");
    Serial.println(responseCode);
    serverReachable = false;
  }
  
  http.end();
}

// ===== UTILITY FUNCTIONS =====
void updateStatusLED() {
  static unsigned long lastLedUpdate = 0;
  static bool ledState = false;
  
  unsigned long interval;
  
  if (currentStatus == "danger") {
    interval = 100; // Rapid blinking
  } else if (currentStatus == "warning") {
    interval = 500; // Medium blinking
  } else if (!wifiConnected) {
    interval = 1000; // Slow blinking for no WiFi
  } else {
    interval = 2000; // Very slow blinking for normal
  }
  
  if (millis() - lastLedUpdate >= interval) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? LOW : HIGH); // Built-in LED is active LOW
    lastLedUpdate = millis();
  }
}

void testBuzzer() {
  Serial.println("Testing buzzer...");
  for (int i = 0; i < 5; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}

// ===== DIAGNOSTIC FUNCTIONS =====
void printSystemStatus() {
  Serial.println("\n===== SYSTEM STATUS =====");
  Serial.print("Uptime: ");
  Serial.print((millis() - systemUpTime) / 1000);
  Serial.println(" seconds");
  
  Serial.print("WiFi: ");
  Serial.println(wifiConnected ? "Connected" : "Disconnected");
  
  Serial.print("Signal Strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  
  Serial.print("Server: ");
  Serial.println(serverReachable ? "Reachable" : "Unreachable");
  
  Serial.print("Total Measurements: ");
  Serial.println(totalMeasurements);
  
  Serial.print("Successful Transmissions: ");
  Serial.println(successfulTransmissions);
  
  Serial.print("Consecutive Failures: ");
  Serial.println(consecutiveFailures);
  
  Serial.print("Average Distance: ");
  Serial.print(averageDistance, 2);
  Serial.println(" cm");
  
  Serial.println("========================\n");
}