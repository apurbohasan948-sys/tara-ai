#include "TaraCore.h"
#include "../storage/StorageManager.h"
#include "../wifi/WiFiManager.h"
#include "../web/WebServerManager.h"
#include "../face/FaceManager.h"
#include "../brain/Brain.h"
#include "../voice/VoiceManager.h"
#include "../memory/MemoryManager.h"
#include "../personality/PersonalityManager.h"
#include "../emotion/EmotionManager.h"
#include "../ota/OTAManager.h"
#include "../security/AuthManager.h"
#include "../security/SecurityLogger.h"
#include "../hardware/DisplayDriver.h"
#include "../hardware/AudioHardware.h"
#include "../hardware/LEDController.h"
#include "../hardware/SensorManager.h"
#include "../hardware/ActuatorManager.h"

TaraCore TARA;

static DisplayDriver sDisplayDriver;
static AudioHardware sAudioHardware;
static LEDController sLEDController;
static SensorManager sSensorManager;
static ActuatorManager sActuatorManager;

TaraCore::TaraCore()
    : currentState(RobotState::CONNECTING),
      bootTimestamp(0),
      lastHeartbeat(0),
      lastStateChangeMs(0),
      storage(nullptr),
      wifi(nullptr),
      webServer(nullptr),
      face(nullptr),
      brain(nullptr),
      voice(nullptr),
      memory(nullptr),
      personality(nullptr),
      emotion(nullptr),
      ota(nullptr),
      auth(nullptr),
      securityLogger(nullptr) {}

TaraCore::~TaraCore() {
    if (webServer) delete webServer;
    if (wifi) delete wifi;
    if (brain) delete brain;
    if (voice) delete voice;
    if (memory) delete memory;
    if (personality) delete personality;
    if (emotion) delete emotion;
    if (face) delete face;
    if (ota) delete ota;
    if (auth) delete auth;
    if (securityLogger) delete securityLogger;
    if (storage) delete storage;
}

bool TaraCore::begin() {
    bootTimestamp = millis();
    Serial.begin(115200);
    delay(100);
    Serial.println("\n==================================================");
    Serial.printf("  TARA Modular AI Companion Framework (v%s)\n", TARA_VERSION_STRING);
    Serial.println("  Target: Standard ESP32 Xtensa Dual-Core");
    Serial.println("==================================================");

    // 1. Storage Manager (NVS Preferences)
    storage = new StorageManager();
    storage->begin();

    // 1b. Security Layer (Device Authentication & Event Logging)
    securityLogger = new SecurityLogger();
    auth = new AuthManager();
    auth->begin();

    // 2. Hardware Drivers
    sDisplayDriver.begin();
    sAudioHardware.begin(16000);
    sLEDController.begin();
    sSensorManager.begin();
    sActuatorManager.begin();

    // 3. Face System
    face = new FaceManager(&sDisplayDriver);
    face->begin();
    face->showTextNotification("TARA Starting...", "ESP32 Ready", 2000);

    // 4. Identity & Emotion
    personality = new PersonalityManager(storage);
    personality->begin();

    emotion = new EmotionManager();
    emotion->begin();

    // 5. Memory System
    memory = new MemoryManager(storage);
    memory->begin();

    // 6. Voice & Brain
    voice = new VoiceManager(storage, &sAudioHardware);
    voice->begin();

    brain = new Brain(storage, personality);
    brain->begin();

    // 7. OTA
    ota = new OTAManager();
    ota->begin();

    // 8. Wi-Fi Manager (AP Provisioning or Station Auto-Connect)
    wifi = new WiFiManager(storage);
    wifi->begin();

    // 9. Web Configuration Server & REST API
    webServer = new WebServerManager(this, 80);
    webServer->begin();

    // 10. Subscribe EventBus to update face and emotion automatically
    GlobalEventBus.subscribe(EventType::STATE_CHANGED, [](const EventData& ev, void* ctx) {
        TaraCore* self = (TaraCore*)ctx;
        if (self->face) self->face->onStateChange(ev.oldState, ev.newState);
        if (self->emotion) self->emotion->onStateChange(ev.oldState, ev.newState);
    }, this);

    GlobalEventBus.subscribe(EventType::WIFI_AP_STARTED, [](const EventData& ev, void* ctx) {
        TaraCore* self = (TaraCore*)ctx;
        if (self->face) {
            self->face->showTextNotification("Wi-Fi Setup:", ev.message, 5000);
        }
        sLEDController.setPattern(LEDPattern::BLINK_SLOW);
    }, this);

    GlobalEventBus.subscribe(EventType::WIFI_CONNECTED, [](const EventData& ev, void* ctx) {
        TaraCore* self = (TaraCore*)ctx;
        if (self->face) {
            self->face->showTextNotification("Connected!", ev.message, 4000);
        }
        sLEDController.setPattern(LEDPattern::BREATHE);
    }, this);

    setState(RobotState::IDLE, "Startup complete");
    return true;
}

void TaraCore::setState(RobotState newState, const char* reason) {
    if (currentState != newState) {
        RobotState oldState = currentState;
        currentState = newState;
        lastStateChangeMs = millis();
        GlobalEventBus.publishStateChange(oldState, newState, reason);
    }
}

uint32_t TaraCore::getUptimeSeconds() const {
    return (millis() - bootTimestamp) / 1000;
}

size_t TaraCore::getFreeHeap() const {
    return ESP.getFreeHeap();
}

void TaraCore::update() {
    // 1. Maintain Wi-Fi and Web Server
    if (wifi) wifi->update();
    if (webServer) webServer->update();

    // 2. Update Hardware & Sensors
    sSensorManager.update();
    sLEDController.update();

    // 3. Update Emotional State
    if (emotion) emotion->update();

    // 4. Update OLED Face Animation (at ~30 FPS)
    if (face) face->update();

    // 5. Autonomous robot behaviors
    handleAutonomousBehaviors();
}

void TaraCore::handleAutonomousBehaviors() {
    uint32_t now = millis();

    // Heartbeat log every 30 seconds
    if (now - lastHeartbeat > 30000) {
        lastHeartbeat = now;
        Serial.printf("[TARA Core] Uptime: %us | State: %s | Free Heap: %u B | IP: %s\n",
                      getUptimeSeconds(),
                      robotStateToString(currentState),
                      getFreeHeap(),
                      wifi ? wifi->getLocalIPString().c_str() : "0.0.0.0");
    }

    // Touch interaction: touching the head triggers a cheerful reaction
    if (sSensorManager.isTouched() && currentState == RobotState::IDLE) {
        setState(RobotState::HAPPY, "Head stroked");
        sAudioHardware.playStateSound(2); // Happy chirp
    } else if (!sSensorManager.isTouched() && currentState == RobotState::HAPPY && (now - lastStateChangeMs > 3000)) {
        setState(RobotState::IDLE, "Calmed down");
    }
}
