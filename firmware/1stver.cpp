#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <NimBLEDevice.h>

// --- Configuration ---
#define DHTPIN 4      // Digital pin connected to the DHT sensor
#define DHTTYPE DHT22 // DHT 22 (AM2302)
#define SOIL_PIN 34   // Analog pin for soil moisture
#define LED_PIN 2     // Onboard LED

// UUIDs for BLE Provisioning (Must match the React App)
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID_RX "beb5483e-36e1-4688-b7f5-ea07361b26a8" // Receive Credentials
#define CHARACTERISTIC_UUID_TX "53966527-2b0e-473d-888d-788c26c364c2" // Send Status

// API Endpoint (Replace with your computer's IP if testing locally, or deployed URL)
// NOTE: "localhost" won't work on ESP32. Use local IP like "http://192.168.1.100:3000/api/sensors"
String api_url = "https://juaaocqwwczwoiphiphj.supabase.co"; 

// --- Globals ---
DHT dht(DHTPIN, DHTTYPE);
NimBLEServer *pServer = NULL;
NimBLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
bool oldDeviceConnected = false;
bool wifiConfigured = false;
String wifiSSID = "";
String wifiPassword = "";

// --- BLE Callbacks ---
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
            Serial.println("*********");
            Serial.print("Received Value: ");
            for (int i = 0; i < rxValue.length(); i++)
                Serial.print(rxValue[i]);
            Serial.println();
            Serial.println("*********");

            // Parse JSON: {"ssid": "MyWiFi", "password": "pass", "api": "http://..."}
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, rxValue);

            if (!error) {
                const char* ssid = doc["ssid"];
                const char* password = doc["password"];
                if (doc.containsKey("api")) {
                    const char* url = doc["api"];
                    api_url = String(url);
                }

                wifiSSID = String(ssid);
                wifiPassword = String(password);
                wifiConfigured = true;
                
                // Notify App
                pTxCharacteristic->setValue("Credentials Received");
                pTxCharacteristic->notify();
            }
        }
    }
};

// --- Helper Functions ---
void connectToWiFi() {
    Serial.println("Connecting to WiFi...");
    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

    int attempt = 0;
    while (WiFi.status() != WL_CONNECTED && attempt < 20) {
        delay(500);
        Serial.print(".");
        attempt++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("");
        Serial.println("WiFi connected");
        Serial.println("IP address: ");
        Serial.println(WiFi.localIP());
        
        if (deviceConnected) {
             pTxCharacteristic->setValue("Connected");
             pTxCharacteristic->notify();
        }
    } else {
        Serial.println("WiFi Failed");
        if (deviceConnected) {
             pTxCharacteristic->setValue("WiFi Failed");
             pTxCharacteristic->notify();
        }
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    dht.begin();

    // Init BLE
    NimBLEDevice::init("SAGE_GARDEN_NEW"); // Device Name matching App
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    NimBLEService *pService = pServer->createService(SERVICE_UUID);

    pTxCharacteristic = pService->createCharacteristic(
                                CHARACTERISTIC_UUID_TX,
                                NIMBLE_PROPERTY_NOTIFY
                            );

    NimBLECharacteristic * pRxCharacteristic = pService->createCharacteristic(
                                             CHARACTERISTIC_UUID_RX,
                                             NIMBLE_PROPERTY_WRITE
                                         );

    pRxCharacteristic->setCallbacks(new MyCallbacks());

    pService->start();
    NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->start();

    Serial.println("Waiting for a client connection to notify...");
}

void loop() {
    // 1. Handle BLE Connection State
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // give the bluetooth stack the chance to get things ready
        pServer->startAdvertising(); // restart advertising
        Serial.println("start advertising");
        oldDeviceConnected = deviceConnected;
    }
    if (deviceConnected && !oldDeviceConnected) {
        // do stuff here on connecting
        oldDeviceConnected = deviceConnected;
    }

    // 2. Handle WiFi Connection Trigger
    if (wifiConfigured && WiFi.status() != WL_CONNECTED) {
        connectToWiFi();
        wifiConfigured = false; // Reset trigger
    }

    // 3. Main Loop: Read Sensors & Send Data
    if (WiFi.status() == WL_CONNECTED) {
        delay(5000); // Send data every 5 seconds

        float h = dht.readHumidity();
        float t = dht.readTemperature(); // Celsius
        int soil = analogRead(SOIL_PIN);
        // Map soil (0-4095) to percentage (0-100). Adjust min/max based on calibration.
        // Assuming 4095 is dry and 0 is wet, or vice versa. Usually capacitive is inverse.
        int soilPercent = map(soil, 4095, 2000, 0, 100); 
        soilPercent = constrain(soilPercent, 0, 100);

        if (isnan(h) || isnan(t)) {
            Serial.println(F("Failed to read from DHT sensor!"));
            return;
        }

        // Prepare JSON payload
        StaticJsonDocument<200> doc;
        // Use MAC Address as unique Device ID
        doc["device_id"] = "SAGE_GARDEN_" + WiFi.macAddress(); 
        doc["temperature"] = t;
        doc["humidity"] = h;
        doc["soil_moisture"] = soilPercent;

        String jsonOutput;
        serializeJson(doc, jsonOutput);

        // HTTP POST
        HTTPClient http;
        http.begin(api_url);
        http.addHeader("Content-Type", "application/json");
        int httpResponseCode = http.POST(jsonOutput);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println(httpResponseCode);
            Serial.println(response);
            digitalWrite(LED_PIN, HIGH); delay(100); digitalWrite(LED_PIN, LOW); // Blink on success
        } else {
            Serial.print("Error on sending POST: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    }
}
