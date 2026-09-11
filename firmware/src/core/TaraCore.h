#ifndef TARA_CORE_H
#define TARA_CORE_H

#include <Arduino.h>
#include "TaraState.h"
#include "TaraConfig.h"
#include "EventBus.h"

// Forward declarations
class StorageManager;
class WiFiManager;
class WebServerManager;
class FaceManager;
class Brain;
class VoiceManager;
class MemoryManager;
class PersonalityManager;
class EmotionManager;
class OTAManager;
class AuthManager;
class SecurityLogger;

class TaraCore {
public:
    TaraCore();
    ~TaraCore();

    bool begin();
    void update();

    RobotState getState() const { return currentState; }
    void setState(RobotState newState, const char* reason = nullptr);

    uint32_t getUptimeSeconds() const;
    size_t getFreeHeap() const;

    // Subsystem accessors
    StorageManager* getStorage() { return storage; }
    WiFiManager* getWiFi() { return wifi; }
    WebServerManager* getWebServer() { return webServer; }
    FaceManager* getFace() { return face; }
    Brain* getBrain() { return brain; }
    VoiceManager* getVoice() { return voice; }
    MemoryManager* getMemory() { return memory; }
    PersonalityManager* getPersonality() { return personality; }
    EmotionManager* getEmotion() { return emotion; }
    OTAManager* getOTA() { return ota; }
    AuthManager* getAuth() { return auth; }
    SecurityLogger* getSecurityLogger() { return securityLogger; }

private:
    RobotState currentState;
    uint32_t bootTimestamp;
    uint32_t lastHeartbeat;
    uint32_t lastStateChangeMs;

    StorageManager* storage;
    WiFiManager* wifi;
    WebServerManager* webServer;
    FaceManager* face;
    Brain* brain;
    VoiceManager* voice;
    MemoryManager* memory;
    PersonalityManager* personality;
    EmotionManager* emotion;
    OTAManager* ota;
    AuthManager* auth;
    SecurityLogger* securityLogger;

    void handleAutonomousBehaviors();
};

extern TaraCore TARA;

#endif // TARA_CORE_H
