#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <NimBLEDevice.h>
#include <Preferences.h>
#include <Adafruit_NeoPixel.h>

// --- PINOUT DEFINITIONS ---
// Be very careful with wiring. 
#define PIN_DHT         4      // Digital: DHT22 Data
#define PIN_SOIL        34     // Analog: Capacitive Soil Moisture Sensor
#define PIN_PUMP        25     // Digital Output: Relay or MOSFET for Pump
#define PIN_LEDS        27     // Digital Output: WS2812B / Neopixel Data
#define PIN_ONBOARD_LED 2      // Onboard Status LED

// --- CONFIGURATION ---
#define DHTTYPE         DHT22             // DHT 22 (AM2302)
#define NUM_LEDS        16                // Number of LEDs in your strip/ring
#define BRIGHTNESS      150               // 0-255

// --- BLE UUIDs (Must match App) ---
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID_RX           "beb5483e-36e1-4688-b7f5-ea07361b26a8" // Receive Credentials
#define CHAR_UUID_TX           "53966527-2b0e-473d-888d-788c26c364c2" // Send Status

// --- GLOBALS ---
DHT dht(PIN_DHT, DHTTYPE);
Adafruit_NeoPixel strip(NUM_LEDS, PIN_LEDS, NEO_GRB + NEO_KHZ800);
Preferences preferences;

// State Variables
String wifiSSID = "";
String wifiPassword = "";
String deviceToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YWFvY3F3d2N6d29pcGhpcGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTcxOTEsImV4cCI6MjA3OTU5MzE5MX0.0MQxvseTj797AU0KLbOS9bug31g2mkoIj1GdUml3LvQ";
String apiUrl = "https://juaaocqwwczwoiphiphj.supabase.co"; 

bool deviceConnected = false;
bool oldDeviceConnected = false;
bool shouldSaveConfig = false;

// Hardware State
bool pumpState = false;
bool ledState = false;

// BLE Objects
NimBLEServer *pServer = NULL;
NimBLECharacteristic *pTxCharacteristic;

// --- BLE CALLBACKS ---
class MyServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) {
        deviceConnected = true;
        Serial.println("BLE Client Connected");
    };

    void onDisconnect(NimBLEServer* pServer) {
        deviceConnected = false;
        Serial.println("BLE Client Disconnected");
    }
};

class MyCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic *pCharacteristic) {
        std::string rxValue = pCharacteristic->getValue();

        if (rxValue.length() > 0) {
            Serial.println("Received BLE Data");
            
            // Expected JSON: {"ssid":"...","pass":"...","token":"...","api":"..."}
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, rxValue);

            if (!error) {
                if (doc.containsKey("ssid")) wifiSSID = String((const char*)doc["ssid"]);
                if (doc.containsKey("pass")) wifiPassword = String((const char*)doc["pass"]);
                if (doc.containsKey("token")) deviceToken = String((const char*)doc["token"]);
                if (doc.containsKey("api")) apiUrl = String((const char*)doc["api"]);
                
                shouldSaveConfig = true; // Save to flash in main loop
                
                pTxCharacteristic->setValue("Config Received");
                pTxCharacteristic->notify();
            } else {
                Serial.println("JSON Parse Error");
            }
        }
    }
};

// --- HELPER FUNCTIONS ---

void saveConfig() {
    Serial.println("Saving configuration to Flash...");
    preferences.begin("sage_config", false);
    preferences.putString("ssid", wifiSSID);
    preferences.putString("pass", wifiPassword);
    preferences.putString("token", deviceToken);
    preferences.putString("api", apiUrl);
    preferences.end();
    shouldSaveConfig = false;
}

void loadConfig() {
    preferences.begin("sage_config", true);
    wifiSSID = preferences.getString("ssid", "");
    wifiPassword = preferences.getString("pass", "");
    deviceToken = preferences.getString("token", "");
    apiUrl = preferences.getString("api", "");
    preferences.end();
    
    Serial.println("Loaded Config:");
    Serial.println("SSID: " + wifiSSID);
    Serial.println("Token: " + (deviceToken.length() > 0 ? "Set" : "Empty"));
    Serial.println("API: " + apiUrl);
}

void setPump(bool on) {
    pumpState = on;
    digitalWrite(PIN_PUMP, on ? HIGH : LOW);
    Serial.print("Pump turned "); Serial.println(on ? "ON" : "OFF");
}

void setLeds(bool on, uint32_t color = 0) {
    ledState = on;
    if (on) {
        if (color == 0) color = strip.Color(255, 0, 255); // Default "Grow" Purple
        for(int i=0; i<strip.numPixels(); i++) {
            strip.setPixelColor(i, color);
        }
    } else {
        strip.clear();
    }
    strip.show();
    Serial.print("LEDs turned "); Serial.println(on ? "ON" : "OFF");
}

void connectToWiFi() {
    if (wifiSSID == "") return;

    Serial.println("Connecting to WiFi...");
    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

    int attempt = 0;
    while (WiFi.status() != WL_CONNECTED && attempt < 20) {
        delay(500);
        Serial.print(".");
        attempt++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connected!");
        Serial.println(WiFi.localIP());
        
        if (deviceConnected) {
            String successMsg = "SUCCESS:" + WiFi.macAddress();
            pTxCharacteristic->setValue(successMsg.c_str());
            pTxCharacteristic->notify();
        }
        
        // Blink Green to show connection
        setLeds(true, strip.Color(0, 255, 0));
        delay(1000);
        setLeds(false);
        
    } else {
        Serial.println("\nWiFi Failed");
        if (deviceConnected) {
             pTxCharacteristic->setValue("ERROR:WiFi Failed");
             pTxCharacteristic->notify();
        }
    }
}

// --- SETUP ---
void setup() {
    Serial.begin(115200);
    
    // Hardware Init
    pinMode(PIN_ONBOARD_LED, OUTPUT);
    pinMode(PIN_PUMP, OUTPUT);
    digitalWrite(PIN_PUMP, LOW); // Force Pump OFF on boot

    dht.begin();
    
    strip.begin();
    strip.setBrightness(BRIGHTNESS);
    strip.show(); // Initialize all pixels to 'off'

    // Load Credentials
    loadConfig();

    // BLE Init
    NimBLEDevice::init("SAGE_GARDEN");
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    NimBLEService *pService = pServer->createService(SERVICE_UUID);
    pTxCharacteristic = pService->createCharacteristic(CHAR_UUID_TX, NIMBLE_PROPERTY_NOTIFY);
    NimBLECharacteristic * pRxCharacteristic = pService->createCharacteristic(CHAR_UUID_RX, NIMBLE_PROPERTY_WRITE);
    pRxCharacteristic->setCallbacks(new MyCallbacks());
    pService->start();
    NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->start();

    Serial.println("System Ready. Waiting for BLE or WiFi...");
    
    // Try auto-connect if configured
    if (wifiSSID != "" && wifiPassword != "") {
        connectToWiFi();
    }
}

// --- MAIN LOOP ---
void loop() {
    // 1. Save Config if pending
    if (shouldSaveConfig) {
        saveConfig();
        connectToWiFi();
    }

    // 2. BLE Re-advertising logic
    if (!deviceConnected && oldDeviceConnected) {
        delay(500);
        pServer->startAdvertising(); 
        Serial.println("Restarting Advertising");
        oldDeviceConnected = deviceConnected;
    }
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }

    // 3. Normal Operation
    if (WiFi.status() == WL_CONNECTED && apiUrl != "" && deviceToken != "") {
        
        // Read Sensors
        float h = dht.readHumidity();
        float t = dht.readTemperature(); 
        int soilRaw = analogRead(PIN_SOIL);
        int soilPercent = map(soilRaw, 4095, 2000, 0, 100); 
        soilPercent = constrain(soilPercent, 0, 100);

        if (isnan(h) || isnan(t)) Serial.println("Failed to read DHT!");

        // Create Payload
        StaticJsonDocument<512> doc;
        doc["temperature"] = t;
        doc["humidity"] = h;
        doc["moisture"] = soilPercent;
        // Optionally send MAC if needed for duplicate checks, but Token is primary
        doc["device_name"] = WiFi.macAddress();

        String jsonOutput;
        serializeJson(doc, jsonOutput);

        // Send POST
        HTTPClient http;
        http.begin(apiUrl);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "Bearer " + deviceToken); 
        
        int httpResponseCode = http.POST(jsonOutput);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Data Sent. Response: " + response);
            
            // Check for Commands in Response
            // Response format: {"success":true,"command":{"command":"PUMP_ON",...}}
            StaticJsonDocument<512> respDoc;
            deserializeJson(respDoc, response);
            
            if (respDoc.containsKey("command") && !respDoc["command"].isNull()) {
                String cmd = respDoc["command"]["command"];
                Serial.println("Executing Command: " + cmd);
                
                if (cmd == "PUMP_ON") setPump(true);
                else if (cmd == "PUMP_OFF") setPump(false);
                else if (cmd == "LED_ON") setLeds(true);
                else if (cmd == "LED_OFF") setLeds(false);
            }

            // Blink Onboard LED to indicate data sent
            digitalWrite(PIN_ONBOARD_LED, HIGH); delay(100); digitalWrite(PIN_ONBOARD_LED, LOW);
        } else {
            Serial.print("Error sending data: ");
            Serial.println(httpResponseCode);
        }
        http.end();

        delay(5000); // 5 Seconds Interval
    } else {
        // Not connected logic
        delay(1000);
    }
}
