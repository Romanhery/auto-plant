// This is where all of the libraries are included/called
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h> 
#include "DHT.h"
#include <Adafruit_NeoPixel.h>

// This is where the pins to the sensors and executors are defined
#define DHTPIN 27
#define DHTTYPE DHT22
#define SOIL_PIN 32
#define PUMP_PIN 18 
#define LED_PIN 2
#define NUM_LEDS 30


// These are the security secret keys and codes
const char* supabase_rpc_url = "https://juaaocqwwczwoiphiphj.supabase.co/rest/v1/rpc/add_secure_reading";
const char* supabase_table_url = "https://juaaocqwwczwoiphiphj.supabase.co/rest/v1/devices?device_id=eq.PLANT_2&select=current_command";
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YWFvY3F3d2N6d29pcGhpcGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTcxOTEsImV4cCI6MjA3OTU5MzE5MX0.0MQxvseTj797AU0KLbOS9bug31g2mkoIj1GdUml3LvQ";
const char* device_id = "PLANT_2"; 
const char* secret_key = "165648b7-614b-4a5d-93a2-a7b8879cd910"; 

// Calibration for DHT sensor
const int WET = 1800;
const int DRY = 3000;

//Dht initialization
DHT dht(DHTPIN, DHTTYPE);
//Led initialiaztion (Roman)
//
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);


//sending data inside a function named sendSensorData the moisture temp and humidity
void sendSensorData(int moisture, float temp, float humidity);
// checkimng the pump status
bool checkPumpStatus();
//idk maybe means that its going to wipe the colors as in turn off or change the colors
void colorWipe(uint32_t color, int wait);

// setup
void setup() {
  //init the baud rate for the serial monitor
  Serial.begin(115200);
  
  // init for the pump keeping it off at the boot for saftey
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
  
  //init for dht
  dht.begin();
  // init for led
  strip.begin();
  //setting brightness for the LEDS's to 30%
  strip.setBrightness(30);
  // then showing the leds
  strip.show();

  // defining WifiManager to wm so its easy to use 
  WiFiManager wm;
  // setting the configuration portal timeout for when the user is trying to connect to their esp32
  wm.setConfigPortalTimeout(180); 
  // while thats happening print connect to wifi
  Serial.println("Connecting to WiFi...");

  // conditional statement if the wifimanager doesn't connect to the wifi network PLANT_SETUP
  if (!wm.autoConnect("PLANT_SETUP")) {
    // print failed to connect to wifi
    Serial.println("Failed to connect and hit timeout");
    //then restart the esp32
    ESP.restart();
  }
  //if it does connect to wifi then print connected to wifi
  Serial.println("WiFi Connected! :)");
  
  //this means to turn on the leds to a color
  colorWipe(strip.Color(0, 0, 255), 10);
  // this means wait for a second
  delay(1000);
  // this means turn off the color
  colorWipe(strip.Color(0, 0, 0), 0);
}

//loop
void loop() {
  //taking in the raw readings and defining a variable for it
  int RAW = analogRead(SOIL_PIN); 
  // constraining the data from the analgog read instead of 4096 and 0 to 100 0
  int moisturePercent = constrain(map(RAW, DRY, WET, 0, 100), 0, 100);
  // reading the humidity and assigning h for the variable for it
  float h = dht.readHumidity(); 
  // reading the temp and assigning t for the variable for it
  float t = dht.readTemperature();

  //checking both of the variables to see if bad data or corrupt data is not coming to it so it doesnt mess up the code
  if (isnan(h) || isnan(t)) {
    //if it happens print failed from dht sensor because its not good data
    Serial.println("❌ Failed To Read From DHT sensor");
    // then wait for 2 seconds
    delay(2000);
    // then return it which means restart
    return;
  }

  // if wifi connected then do the function
  if (WiFi.status() == WL_CONNECTED) {
    // send the sensor data using moisture percent temperature and humidity
    sendSensorData(moisturePercent, t, h);
    // check the pump status and assinging it to shouldPumpBeOn
    bool shouldPumpBeOn = checkPumpStatus();
    // if the pump should be on is true
    if (shouldPumpBeOn) {
      //Print pump on
      Serial.println("💧 COMMAND: PUMP ON");
      // then actual execute and turn on the pump
      digitalWrite(PUMP_PIN, HIGH);
      // then change the color to this to signify that the pump is watering
      colorWipe(strip.Color(0, 255, 0), 0);
    //or
    } else {
      // print pump off
      Serial.println("zzz COMMAND: PUMP OFF");
      //turn off the pump
      digitalWrite(PUMP_PIN, LOW);
      // signify that the pump stopped watering
      colorWipe(strip.Color(255, 0, 0), 0);
    }
  // or
  } else {
    // print wifi is disconnected
    Serial.println("📶 WiFi Disconnected!");
    // and change the color to signify that the wifi is disconnected
    colorWipe(strip.Color(255, 165, 0), 0);
  }
  //wait 5 seconds
  delay(5000); //
}


// create new function send sensor data that passes through moisture temp and humidity
void sendSensorData(int moisture, float temp, float humidity) {
    // change httpclient to http
    HTTPClient http;
    // start checking the rpc url first
    http.begin(supabase_rpc_url);
    // then add the data of the api key
    http.addHeader("apikey", supabase_key);
    // then tell it who is the bearer or who owns it and the api key
    http.addHeader("Authorization", String("Bearer ") + supabase_key);
    // after that tell it what type of data/conent it is
    http.addHeader("Content-Type", "application/json");
    // then create a JSON document
    StaticJsonDocument<300> doc;
    //device id
    doc["p_device_id"] = device_id;
    //secret key for rpc authorization
    doc["p_secret_key"] = secret_key; 
    //moisture for database
    doc["p_moisture"] = moisture;
    //temperature for database
    doc["p_temp"] = temp; 
    //humidity for database
    doc["p_humidity"] = humidity;
    //light for database will change once we get the photoresistors to work
    doc["p_light"] = 80;
    // tell the esp32 to remember this in its memory
    String jsonPayload;
    // then convert it into the format supabase asks for
    serializeJson(doc, jsonPayload);
    // post the data and assign the respone code to the respond variable
    int httpResponseCode = http.POST(jsonPayload);
    // check if the response code is higher then zero
    if (httpResponseCode > 0) {
      // then print data sent
      Serial.print("✅ Data Sent. Code: ");
      //then print the response code
      Serial.println(httpResponseCode);
      //or
    } else {
      // print error sending data
      Serial.print("❌ Error Sending Data: ");
      // and the response code most likely and error
      Serial.println(httpResponseCode);
    }
    //then stop the http client
    http.end();
}
// create the boolean function check pump status
bool checkPumpStatus() {
  //change http client into http
  HTTPClient http;
  // start and http client with the supabase table 
  http.begin(supabase_table_url);
  // add the api key
  http.addHeader("apikey", supabase_key);
  // add the bearer/owner and the api key
  http.addHeader("Authorization", String("Bearer ") + supabase_key);
  // get the code form the database
  int httpCode = http.GET();
  // make the pumpstate default false incase of error for saftey
  bool pumpState = false;
  // check the code response and if it higher than 0
  if (httpCode > 0) {
    // assign the payload string to the variable string payload
    String payload = http.getString();
    //print the response code from supabase
     Serial.println("Supabase Response: " + payload); 

    // then take the JSON document
    StaticJsonDocument<200> doc;
    // and unencrypt it and assign the response code of that to DeserializationError but change that to error
    DeserializationError error = deserializeJson(doc, payload);

    // if there isn't an  error
    if (!error) {
      // and if the document size is larger than zero
      if (doc.size() > 0) {
        // check the command
        String command = doc[0]["current_command"];
        // if the command is true
        if (command == "true") {
          // change the state of the pump to true
          pumpState = true;
        // or if the command is false
        } else if (command == "false") {
          //then make the pump state false
          pumpState = false;
        }
      }
      // OR 
    } else {
      //print failed
      Serial.print("deserializeJson() failed: ");
      //print the error
      Serial.println(error.c_str());
    }
    //Or
  } else {
    // print its a reading table error
    Serial.print("❌ Error Reading Table: ");
    // then print the response
    Serial.println(httpCode);
  }
  // then end the http cleint
  http.end();
  // and return the pumpstate so we know what it is
  return pumpState;
}
// creating the colorwipe functions using the uint32_t as color , and wait as int passing through it
void colorWipe(uint32_t color, int wait) {
  // loop through the number of pixels
  for(int i=0; i<strip.numPixels(); i++) { 
    //change the color of each of them 
    strip.setPixelColor(i, color);
    //if the wait is larger than 0
    if(wait > 0) {
      //show the leds
      strip.show();
      // and wait the wait variable
      delay(wait);
    }
  }
  // then show the leds
  strip.show();
}
