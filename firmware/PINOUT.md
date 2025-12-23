# SAGE Garden System - Hardware Pinout Guide

This guide details exactly how to wire your ESP32 to the sensors, pump, and LEDs used in the SAGE Garden firmware.

## ⚠️ Important Warning
**Always disconnect power before wiring components.** Double-check your connections, especially `VCC` (Power) and `GND` (Ground). Incorrect wiring can destroy your ESP32 or sensors.

## Pinout Summary

| Component | ESP32 Pin | Wire/Notes |
| :--- | :---: | :--- |
| **DHT22 Data** | `GPIO 4` | Often needs a 10k resistor between Data and VCC if not on a breakout board. |
| **Soil Moisture** | `GPIO 34` | Analog Input. **Input Only Pin**. |
| **Pump Relay** | `GPIO 25` | Connect to `IN` on Relay Module. |
| **LED Strip Data** | `GPIO 27` | Connect to `DIN` on LED Strip. Recommend 330Ω resistor in series. |
| **Onboard LED** | `GPIO 2` | Used for status blinking. |

---

## Detailed Wiring Instructions

### 1. DHT22 Temperature & Humidity Sensor
*   **VCC (+)Ref**: Connect to ESP32 `3.3V` or `5V` (Check sensor spec, usually 3.3V safe).
*   **GND (-)**: Connect to ESP32 `GND`.
*   **DATA**: Connect to **GPIO 4**.

### 2. Capacitive Soil Moisture Sensor (v1.2)
*   **VCC**: Connect to ESP32 `3.3V`.
*   **GND**: Connect to ESP32 `GND`.
*   **AOUT (Analog Out)**: Connect to **GPIO 34**.

### 3. Submersible Pump (via Relay Module)
*Do not connect the pump directly to the ESP32 pins! You must use a Relay or MOSFET.*

**Relay Module Side:**
*   **VCC**: Connect to ESP32 `5V` (Relays usually need 5V).
*   **GND**: Connect to ESP32 `GND`.
*   **IN (Signal)**: Connect to **GPIO 25**.

**Pump Side (High Voltage/Current):**
*   Connect the **Red (+)** wire of your external power source (e.g., 12V adapter or battery) to the **COM** (Common) port on the Relay.
*   Connect the **NO** (Normally Open) port on the Relay to the Pump's **Red (+)** wire.
*   Connect the Pump's **Black (-)** wire directly to your power source's **Black (-)** wire.

### 4. Addressable LEDs (WS2812B / NeoPixel)
*   **5V**: Connect to External `5V` Power Supply (ESP32 cannot drive many LEDs directly).
*   **GND**: Connect to External Power `GND` **AND** ESP32 `GND` (Common Ground is critical).
*   **DIN (Data In)**: Connect to **GPIO 27**.

---

## Powering the ESP32
*   For development: USB Cable.
*   For deployment: You can power the ESP32 via the `5V` (VIN) pin using your external 5V power supply.

## Firmware Configuration
If you need to change pins, edit the definitions at the top of `firmware/main.cpp`:

```cpp
#define PIN_DHT         4 
#define PIN_SOIL        34
#define PIN_PUMP        25
#define PIN_LEDS        27
```
