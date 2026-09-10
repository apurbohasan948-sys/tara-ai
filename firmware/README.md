# TARA - Modular AI Companion Robot Framework (v0.1.0)

**Target Hardware:** Standard ESP32 (ESP32-D0WDQ6 / ESP32-WROOM-32 / NodeMCU-32S)  
*Strictly standard ESP32: No ESP32-S3 / C3 / C6 dependencies.*

---

## 1. Overview
TARA is a modular, physical AI companion robot framework built for standard dual-core ESP32 microcontrollers. TARA connects to cloud and local network AI services, animates an expressive OLED robot face, executes speech interactions through I2S audio hardware and gTTS, and serves an onboard, mobile-responsive web configuration interface directly from the ESP32.

---

## 2. Directory Structure

```
TARA/
├── firmware/
│   ├── TARA.ino                   <- Arduino Sketch Entry Point
│   ├── platformio.ini             <- PlatformIO Build Spec (esp32dev)
│   ├── include/
│   │   └── TaraCommon.h           <- Shared types, version, definitions
│   ├── src/
│   │   ├── core/                  <- Central Coordinator & State Engine
│   │   │   ├── TaraCore.h/.cpp
│   │   │   ├── TaraState.h/.cpp
│   │   │   ├── TaraConfig.h
│   │   │   └── EventBus.h/.cpp
│   │   ├── wifi/                  <- AP Provisioning & Wi-Fi Station
│   │   │   ├── WiFiManager.h/.cpp
│   │   │   ├── Provisioning.h/.cpp
│   │   │   └── NetworkStatus.h/.cpp
│   │   ├── web/                   <- Onboard HTTP Server & REST API
│   │   │   ├── WebServerManager.h/.cpp
│   │   │   ├── WebRoutes.h/.cpp
│   │   │   ├── WebAPI.h/.cpp
│   │   │   └── WebUIAssets.h
│   │   ├── brain/                 <- Cloud & Local Model Providers
│   │   │   ├── Brain.h/.cpp
│   │   │   ├── ModelProvider.h
│   │   │   ├── CloudProvider.h/.cpp
│   │   │   └── Response.h
│   │   ├── voice/                 <- STT, gTTS streaming & Audio Pipeline
│   │   │   ├── VoiceManager.h/.cpp
│   │   │   ├── STT.h/.cpp
│   │   │   ├── TTS.h/.cpp
│   │   │   └── AudioManager.h/.cpp
│   │   ├── memory/                <- SRAM Circular Buffer & NVS Persistent
│   │   │   ├── MemoryManager.h/.cpp
│   │   │   ├── ConversationMemory.h/.cpp
│   │   │   └── PersistentMemory.h/.cpp
│   │   ├── personality/           <- Personality Traits & Speaking Style
│   │   │   ├── PersonalityManager.h/.cpp
│   │   │   └── PersonalityConfig.h
│   │   ├── emotion/               <- Dynamic Emotion State (Joy, Calm, etc.)
│   │   │   ├── EmotionManager.h/.cpp
│   │   │   └── EmotionState.h
│   │   ├── face/                  <- Expressive OLED Face & Animations
│   │   │   ├── FaceManager.h/.cpp
│   │   │   ├── Animation.h/.cpp
│   │   │   └── Expressions.h/.cpp
│   │   ├── hardware/              <- Centralized GPIO & Peripherals
│   │   │   ├── HardwareConfig.h
│   │   │   ├── DisplayDriver.h/.cpp
│   │   │   ├── AudioHardware.h/.cpp
│   │   │   ├── LEDController.h/.cpp
│   │   │   ├── SensorManager.h/.cpp
│   │   │   └── ActuatorManager.h/.cpp
│   │   ├── ota/                   <- Over-The-Air Update Engine
│   │   │   └── OTAManager.h/.cpp
│   │   └── storage/               <- Preferences NVS Flash Storage
│   │       └── StorageManager.h/.cpp
│   └── data/web/                  <- Raw web interface assets
└── README.md
```

---

## 3. Centralized Standard ESP32 Hardware Pinout

All GPIO numbers are defined strictly in `src/hardware/HardwareConfig.h`:

| Peripheral | Standard ESP32 Pin | Function | Notes |
| :--- | :--- | :--- | :--- |
| **OLED Display** | **GPIO 21** | I2C SDA | Data line for 128x64 OLED (SSD1306) |
| **OLED Display** | **GPIO 22** | I2C SCL | Clock line for 128x64 OLED (SSD1306) |
| **I2S Audio** | **GPIO 26** | I2S BCLK | Bit clock shared between Mic & Speaker |
| **I2S Audio** | **GPIO 25** | I2S LRC / WS | Word select clock shared |
| **I2S Speaker Amp**| **GPIO 19** | I2S DOUT | Audio output to MAX98357A DIN |
| **I2S Microphone** | **GPIO 34** | I2S DIN | Audio input from INMP441 DOUT (Input-only pin) |
| **Status LED** | **GPIO 2** | Digital Out | NodeMCU built-in blue LED |
| **Action Button** | **GPIO 0** | Digital In | NodeMCU BOOT button (Active LOW) |
| **Touch Sensor** | **GPIO 4** | Touch0 | Capacitive touch on robot head shell |

---

## 4. First-Boot Wi-Fi AP Provisioning Flow

1. On boot, TARA checks `StorageManager::hasWiFiCredentials()`.
2. If no credentials exist:
   - TARA starts **SoftAP Mode** (`TARA-Setup-XXXX`, open or password `tara1234`).
   - TARA sets AP IP to `192.168.4.1` and displays `"Wi-Fi Setup: TARA-Setup-XXXX"` on the OLED screen.
3. User connects a phone or computer to the `TARA-Setup-XXXX` Wi-Fi.
4. User opens `http://192.168.4.1` in any browser.
5. The TARA Web Configuration interface appears.
6. User enters their 2.4GHz Home Wi-Fi SSID and Password.
7. TARA tests the connection:
   - If connected, credentials are saved to Non-Volatile Flash (`Preferences` NVS).
   - TARA switches to Station mode (`WIFI_STA`) and acquires its LAN IPv4 address (e.g., `192.168.1.105`).
   - The LAN IP is printed to Serial and shown on the OLED face display.
8. User can now access the full dashboard at `http://<ESP32_LOCAL_IP>`.

*No mDNS or external mobile app required — pure direct IPv4 access.*

---

## 5. REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Current state, emotion, wifi info, IP, uptime, free heap |
| `GET` | `/api/wifi` | Current Wi-Fi state, RSSI, MAC, SSID |
| `POST` | `/api/wifi` | Save new Wi-Fi credentials and connect |
| `GET` | `/api/brain` | Active AI provider, model, endpoint, settings |
| `POST` | `/api/brain` | Update AI provider, API key, model |
| `GET` | `/api/voice` | Volume, language, TTS endpoint |
| `POST` | `/api/voice` | Update voice volume and TTS language |
| `GET` | `/api/personality` | Name, traits, speaking style |
| `POST` | `/api/personality` | Update companion personality traits |
| `GET` | `/api/memory` | Conversation turn count, owner name |
| `GET` | `/api/hardware` | GPIO pin map verification |
| `POST` | `/api/restart` | Software reboot of ESP32 |
| `POST` | `/api/reset` | Factory reset (erases NVS credentials) |

*Security: Passwords and API keys are never exposed in GET responses.*

---

## 6. How to Flash TARA to Standard ESP32

### Option A: Using Arduino IDE
1. Install **ESP32 Board Support** in Arduino IDE (`Boards Manager -> esp32 by Espressif Systems`).
2. Select Board: **ESP32 Dev Module** or **NodeMCU-32S**.
3. Settings:
   - Flash Frequency: `80MHz`
   - Flash Size: `4MB (32Mb)`
   - Partition Scheme: `Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)` or `No OTA (2MB APP/2MB SPIFFS)`
4. Open `firmware/TARA.ino`.
5. Connect your ESP32 via USB and click **Upload**.

### Option B: Using PlatformIO (VS Code / CLI)
```bash
cd firmware
pio run --target upload
pio device monitor -b 115200
```
