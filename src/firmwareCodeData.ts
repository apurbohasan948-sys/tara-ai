export interface FirmwareFile {
  path: string;
  name: string;
  category: 'Core' | 'Wi-Fi' | 'Brain' | 'Voice' | 'Face' | 'Hardware' | 'Memory' | 'Web' | 'Storage' | 'OTA' | 'Config';
  description: string;
  code: string;
}

export const FIRMWARE_FILES: FirmwareFile[] = [
  {
    path: 'TARA.ino',
    name: 'TARA.ino',
    category: 'Core',
    description: 'Arduino IDE main sketch entry point',
    code: `// TARA - Modular AI Companion Robot Framework (v0.1.0)
// Designed specifically for standard dual-core ESP32

#include "src/core/TaraCore.h"

void setup() {
    TARA.begin();
}

void loop() {
    TARA.update();
}
`
  },
  {
    path: 'platformio.ini',
    name: 'platformio.ini',
    category: 'Config',
    description: 'PlatformIO configuration for standard ESP32 (esp32dev)',
    code: `; PlatformIO Project Configuration for TARA
[env:esp32dev]
platform = espressif32@^6.5.0
board = esp32dev
framework = arduino
board_build.f_cpu = 240000000L
board_build.flash_mode = qio
board_build.partitions = min_spiffs.csv
monitor_speed = 115200

build_flags = 
    -D CORE_DEBUG_LEVEL=3
    -I include
    -I src

lib_deps =
    WiFi
    WebServer
    Update
    Preferences
    Wire
    HTTPClient
    WiFiClientSecure
`
  },
  {
    path: 'include/TaraCommon.h',
    name: 'TaraCommon.h',
    category: 'Core',
    description: 'Shared constants, version info, and target verification',
    code: `#ifndef TARA_COMMON_H
#define TARA_COMMON_H

#include <Arduino.h>

#define TARA_VERSION_STRING "0.1.0-alpha"
#define TARA_DEVICE_NAME "TARA"
#define TARA_DEFAULT_AP_SSID_PREFIX "TARA-Robot-"
#define TARA_DEFAULT_AP_PASS "tara1234"
#define TARA_DEFAULT_AP_IP IPAddress(192, 168, 4, 1)

#endif`
  },
  {
    path: 'src/hardware/HardwareConfig.h',
    name: 'HardwareConfig.h',
    category: 'Hardware',
    description: 'Centralized GPIO pin map for standard ESP32 (No magic numbers)',
    code: `#ifndef TARA_HARDWARECONFIG_H
#define TARA_HARDWARECONFIG_H

#include <Arduino.h>

namespace TaraPins {
    // I2C 128x64 OLED (SSD1306)
    constexpr int8_t OLED_SDA        = 21;
    constexpr int8_t OLED_SCL        = 22;
    constexpr int8_t OLED_RST        = -1;
    constexpr uint8_t OLED_I2C_ADDR  = 0x3C;

    // I2S Audio Interface (Mic INMP441 + Speaker MAX98357A)
    constexpr int8_t I2S_BCLK        = 26;
    constexpr int8_t I2S_LRC         = 25;
    constexpr int8_t I2S_DOUT        = 19;
    constexpr int8_t I2S_DIN         = 34;

    // Human Interface & Sensors
    constexpr int8_t LED_STATUS      = 2;
    constexpr int8_t BTN_ACTION      = 0;
    constexpr int8_t TOUCH_HEAD      = 4;
    constexpr int8_t BATTERY_ADC     = 35;
}

#endif`
  },
  {
    path: 'src/core/TaraState.h',
    name: 'TaraState.h',
    category: 'Core',
    description: 'Central RobotState enumeration & helpers',
    code: `#ifndef TARA_STATE_H
#define TARA_STATE_H

#include <Arduino.h>

enum class RobotState : uint8_t {
    IDLE = 0,
    LISTENING,
    THINKING,
    SPEAKING,
    HAPPY,
    SAD,
    ANGRY,
    SURPRISED,
    SLEEPING,
    CONNECTING,
    ERROR
};

const char* robotStateToString(RobotState state);
RobotState stringToRobotState(const char* str);

#endif`
  },
  {
    path: 'src/core/EventBus.h',
    name: 'EventBus.h',
    category: 'Core',
    description: 'Decoupled observer pattern for inter-module event notification',
    code: `#ifndef TARA_EVENTBUS_H
#define TARA_EVENTBUS_H

#include <Arduino.h>
#include "TaraState.h"

enum class EventType : uint8_t {
    STATE_CHANGED = 0,
    WIFI_CONNECTED,
    WIFI_DISCONNECTED,
    WIFI_AP_STARTED,
    AUDIO_RECORDING_START,
    AUDIO_RECORDING_END,
    TTS_PLAYING_START,
    TTS_PLAYING_END,
    BRAIN_THINKING,
    BRAIN_RESPONDED,
    BUTTON_PRESSED
};

struct EventData {
    EventType type;
    RobotState oldState;
    RobotState newState;
    const char* message;
    int32_t value;
};

typedef void (*EventCallback)(const EventData& event, void* context);

class EventBus {
public:
    static const size_t MAX_LISTENERS = 16;
    EventBus();
    bool subscribe(EventType type, EventCallback callback, void* context = nullptr);
    void publish(const EventData& event);
    void publishStateChange(RobotState oldState, RobotState newState, const char* reason = nullptr);
};

extern EventBus GlobalEventBus;
#endif`
  },
  {
    path: 'src/wifi/WiFiManager.h',
    name: 'WiFiManager.h',
    category: 'Wi-Fi',
    description: 'AP Provisioning and Station Wi-Fi manager',
    code: `#ifndef TARA_WIFIMANAGER_H
#define TARA_WIFIMANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include "NetworkStatus.h"
#include "Provisioning.h"
#include "../core/TaraConfig.h"

class StorageManager;

class WiFiManager {
public:
    WiFiManager(StorageManager* storage);
    ~WiFiManager();
    bool begin();
    void update();
    bool connectSTA(const char* ssid, const char* password);
    void startProvisioningAP();
    NetworkInfo getNetworkInfo();
    String getLocalIPString() const;
};

#endif`
  },
  {
    path: 'src/face/FaceManager.h',
    name: 'FaceManager.h',
    category: 'Face',
    description: 'OLED face renderer, procedural eyes, eyelids & expressions',
    code: `#ifndef TARA_FACEMANAGER_H
#define TARA_FACEMANAGER_H

#include <Arduino.h>
#include "Animation.h"
#include "Expressions.h"
#include "../core/TaraState.h"

class DisplayDriver;

class FaceManager {
public:
    FaceManager(DisplayDriver* displayDriver);
    bool begin();
    void update();
    void onStateChange(RobotState oldState, RobotState newState);
    void setExpression(FaceExpression expr, bool immediate = false);
    void showTextNotification(const char* line1, const char* line2 = nullptr, uint32_t durationMs = 2500);
};

#endif`
  },
  {
    path: 'src/voice/TTS.h',
    name: 'TTS.h',
    category: 'Voice',
    description: 'Google Translate TTS streaming interface without external cost',
    code: `#ifndef TARA_TTS_H
#define TARA_TTS_H

#include <Arduino.h>

class AudioHardware;

class TTSProvider {
public:
    virtual ~TTSProvider() {}
    virtual bool begin() = 0;
    virtual bool speak(const char* text, const char* language = "en") = 0;
    virtual void stop() = 0;
    virtual bool isPlaying() const = 0;
};

class GttsTTSProvider : public TTSProvider {
public:
    GttsTTSProvider(AudioHardware* audioHw);
    bool begin() override;
    bool speak(const char* text, const char* language = "en") override;
    void stop() override;
    bool isPlaying() const override { return playing; }
    String buildGttsUrl(const char* text, const char* language);
};

#endif`
  },
  {
    path: 'src/brain/Brain.h',
    name: 'Brain.h',
    category: 'Brain',
    description: 'AI model router, system prompt builder & cloud connection',
    code: `#ifndef TARA_BRAIN_H
#define TARA_BRAIN_H

#include <Arduino.h>
#include "ModelProvider.h"
#include "Response.h"
#include "../core/TaraConfig.h"

class StorageManager;
class PersonalityManager;

class Brain {
public:
    Brain(StorageManager* storage, PersonalityManager* personality);
    bool begin();
    BrainResponse ask(const char* userPrompt);
    BrainConfig getConfig() const;
    bool updateConfig(const BrainConfig& newConfig);
};

#endif`
  },
  {
    path: 'src/storage/StorageManager.h',
    name: 'StorageManager.h',
    category: 'Storage',
    description: 'Non-volatile flash preferences (Wi-Fi, secrets, traits)',
    code: `#ifndef TARA_STORAGEMANAGER_H
#define TARA_STORAGEMANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include "../core/TaraConfig.h"

class StorageManager {
public:
    StorageManager();
    bool begin();
    bool hasWiFiCredentials();
    bool loadWiFiConfig(WiFiConfig& config);
    bool saveWiFiConfig(const WiFiConfig& config);
    bool loadBrainConfig(BrainConfig& config);
    bool saveBrainConfig(const BrainConfig& config);
    bool factoryReset();
};

#endif`
  },
  {
    path: 'src/web/WebAPI.h',
    name: 'WebAPI.h',
    category: 'Web',
    description: 'RESTful API handlers for local IP browser management',
    code: `#ifndef TARA_WEBAPI_H
#define TARA_WEBAPI_H

#include <Arduino.h>
#include <WebServer.h>

class TaraCore;

class WebAPI {
public:
    WebAPI(TaraCore* core, WebServer* server);
    void registerRoutes();
    void handleGetStatus();
    void handleGetWiFi();
    void handlePostWiFi();
    void handleGetBrain();
    void handlePostBrain();
    void handlePostRestart();
    void handlePostReset();
};

#endif`
  }
];
