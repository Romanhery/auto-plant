// ==========================================
// ESP32 SMART PLANT MONITOR - FULL CODE
// ==========================================
//Jan 8th 2026 WORKING CODE STATUS
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h> 
#include "DHT.h"
#include <Adafruit_NeoPixel.h>

// ------------------------------------------
// 1. PIN DEFINITIONS
// ------------------------------------------
#define DHTPIN 27
#define DHTTYPE DHT22
#define SOIL_PIN 32

// Actuator & Output Pins
#define PUMP_PIN 18 
#define LED_PIN 2
#define NUM_LEDS 30

// ------------------------------------------
// 2. SUPABASE CONFIGURATION
// ------------------------------------------
const char* supabase_rpc_url = "https://juaaocqwwczwoiphiphj.supabase.co/rest/v1/rpc/add_secure_reading";

// FIXED: Using 'current_command' to control the pump
const char* supabase_table_url = "https://juaaocqwwczwoiphiphj.supabase.co/rest/v1/devices?device_id=eq.PLANT_2&select=current_command";

const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YWFvY3F3d2N6d29pcGhpcGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTcxOTEsImV4cCI6MjA3OTU5MzE5MX0.0MQxvseTj797AU0KLbOS9bug31g2mkoIj1GdUml3LvQ";

// ------------------------------------------
// 3. DEVICE SETTINGS
// ------------------------------------------
const char* device_id = "PLANT_2"; 
const char* secret_key = "165648b7-614b-4a5d-93a2-a7b8879cd910"; 

// Calibration (Adjust these based on your specific soil sensor)
const int WET = 1800;
const int DRY = 3000;

// ------------------------------------------
// 4. OBJECT INITIALIZATION
// ------------------------------------------
DHT dht(DHTPIN, DHTTYPE);
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// Function Prototypes
void sendSensorData(int moisture, float temp, float humidity);
bool checkPumpStatus();
void colorWipe(uint32_t color, int wait);

void setup() {
  Serial.begin(115200);
  
  // Init Hardware
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW); // Ensure off at boot
  
  dht.begin();
  strip.begin();
  strip.setBrightness(30);
  strip.show(); // Initialize all pixels to 'off'

  // WiFi Manager
  WiFiManager wm;
  wm.setConfigPortalTimeout(180); 

  Serial.println("Connecting to WiFi...");
  // Connect to previous WiFi, or create AP "PLANT_SETUP" if connection fails
  if (!wm.autoConnect("PLANT_SETUP")) {
    Serial.println("Failed to connect and hit timeout");
    ESP.restart();
  }

  Serial.println("WiFi Connected! :)");
  
  // Flash Blue to indicate connection success
  colorWipe(strip.Color(0, 0, 255), 10);
  delay(1000);
  colorWipe(strip.Color(0, 0, 0), 0);
}

void loop() {
  // --------------------------------------
  // 1. Read Sensors
  // --------------------------------------
  int RAW = analogRead(SOIL_PIN); 
  int moisturePercent = constrain(map(RAW, DRY, WET, 0, 100), 0, 100);
  float h = dht.readHumidity(); 
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("❌ Failed To Read From DHT sensor");
    // If sensor fails, we assume NO data sent to avoid corrupting database
    delay(2000);
    return;
  }

  // --------------------------------------
  // 2. Network Operations
  // --------------------------------------
  if (WiFi.status() == WL_CONNECTED) {
    
    // --- A. SEND DATA (POST) ---
    sendSensorData(moisturePercent, t, h);

    // --- B. CHECK PUMP STATUS (GET) ---
    bool shouldPumpBeOn = checkPumpStatus();
    
    // --- C. ACTUATE ---
    if (shouldPumpBeOn) {
      Serial.println("💧 COMMAND: PUMP ON");
      digitalWrite(PUMP_PIN, HIGH);
      colorWipe(strip.Color(0, 255, 0), 0); // Green for Pumping
    } else {
      Serial.println("zzz COMMAND: PUMP OFF");
      digitalWrite(PUMP_PIN, LOW);
      colorWipe(strip.Color(255, 0, 0), 0); // Red for Standby
    }

  } else {
    Serial.println("📶 WiFi Disconnected!");
    colorWipe(strip.Color(255, 165, 0), 0); // Orange for No WiFi
  }

  delay(5000); // Wait 5 seconds before next loop
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

void sendSensorData(int moisture, float temp, float humidity) {
    HTTPClient http;
    http.begin(supabase_rpc_url);
    
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<300> doc;
    doc["p_device_id"] = device_id;
    doc["p_secret_key"] = secret_key; 
    doc["p_moisture"] = moisture;
    doc["p_temp"] = temp; 
    doc["p_humidity"] = humidity;
    doc["p_light"] = 80; // Hardcoded for now

    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("✅ Data Sent. Code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("❌ Error Sending Data: ");
      Serial.println(httpResponseCode);
    }
    http.end();
}

bool checkPumpStatus() {
  HTTPClient http;
  // We use current_command now
  http.begin(supabase_table_url);
  
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);
  
  int httpCode = http.GET();
  bool pumpState = false;

  if (httpCode > 0) {
    String payload = http.getString();
    // Debug line to see exactly what Supabase sends back
     Serial.println("Supabase Response: " + payload); 

    // Parse JSON Response
    // Expecting array: [{"current_command": "true"}] or [{"current_command": "false"}]
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      // Supabase returns an array of rows
      if (doc.size() > 0) {
        String command = doc[0]["current_command"];
        if (command == "true") {
          pumpState = true;
        } else if (command == "false") {
          pumpState = false;
        }
        // If it's something else, default to false (pumpState initialized to false)
      }
    } else {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("❌ Error Reading Table: ");
    Serial.println(httpCode);
  }
  
  http.end();
  return pumpState;
}

void colorWipe(uint32_t color, int wait) {
  for(int i=0; i<strip.numPixels(); i++) { 
    strip.setPixelColor(i, color);
    if(wait > 0) {
      strip.show();
      delay(wait);
    }
  }
  strip.show();
}