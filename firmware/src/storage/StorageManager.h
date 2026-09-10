#ifndef TARA_STORAGEMANAGER_H
#define TARA_STORAGEMANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include "../core/TaraConfig.h"

class StorageManager {
public:
    StorageManager();
    bool begin();

    // Wi-Fi credentials
    bool hasWiFiCredentials();
    bool loadWiFiConfig(WiFiConfig& config);
    bool saveWiFiConfig(const WiFiConfig& config);
    void clearWiFiConfig();

    // Brain configuration
    bool loadBrainConfig(BrainConfig& config);
    bool saveBrainConfig(const BrainConfig& config);

    // Voice configuration
    bool loadVoiceConfig(VoiceConfig& config);
    bool saveVoiceConfig(const VoiceConfig& config);

    // Personality configuration
    bool loadPersonalityConfig(PersonalityConfig& config);
    bool savePersonalityConfig(const PersonalityConfig& config);

    // Hardware configuration
    bool loadHardwareConfig(HardwareConfigData& config);
    bool saveHardwareConfig(const HardwareConfigData& config);

    // Key-value memory
    String getMemoryValue(const char* key, const char* defaultVal = "");
    bool setMemoryValue(const char* key, const char* value);
    bool clearMemory();

    // Factory reset
    bool factoryReset();

private:
    Preferences prefs;
    bool initialized;
};

#endif // TARA_STORAGEMANAGER_H
