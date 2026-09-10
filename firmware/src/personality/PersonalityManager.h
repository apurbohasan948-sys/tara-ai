#ifndef TARA_PERSONALITYMANAGER_H
#define TARA_PERSONALITYMANAGER_H

#include <Arduino.h>
#include "../core/TaraConfig.h"

class StorageManager;

class PersonalityManager {
public:
    PersonalityManager(StorageManager* storage);

    bool begin();

    const char* getName() const { return config.name; }
    const char* getTrait() const { return config.primaryTrait; }
    const char* getSpeakingStyle() const { return config.speakingStyle; }
    const char* getLanguage() const { return config.language; }
    uint8_t getEnergyLevel() const { return config.energyLevel; }
    bool isWakeWordEnabled() const { return config.wakeWordEnabled; }

    PersonalityConfig getConfig() const { return config; }
    bool updateConfig(const PersonalityConfig& newConfig);

private:
    StorageManager* storage;
    PersonalityConfig config;
};

#endif // TARA_PERSONALITYMANAGER_H
