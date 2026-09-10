#include "PersonalityManager.h"
#include "../storage/StorageManager.h"

PersonalityManager::PersonalityManager(StorageManager* storageMgr)
    : storage(storageMgr) {
    memset(&config, 0, sizeof(PersonalityConfig));
    strncpy(config.name, "TARA", sizeof(config.name) - 1);
    strncpy(config.primaryTrait, "Curious & Empathetic", sizeof(config.primaryTrait) - 1);
    strncpy(config.speakingStyle, "Warm and concise", sizeof(config.speakingStyle) - 1);
    strncpy(config.language, "en", sizeof(config.language) - 1);
    config.energyLevel = 85;
    config.wakeWordEnabled = true;
}

bool PersonalityManager::begin() {
    if (storage) {
        storage->loadPersonalityConfig(config);
    }
    Serial.printf("[PersonalityManager] Loaded companion identity: %s (%s)\n",
                  config.name, config.primaryTrait);
    return true;
}

bool PersonalityManager::updateConfig(const PersonalityConfig& newConfig) {
    config = newConfig;
    if (storage) {
        storage->savePersonalityConfig(config);
    }
    Serial.printf("[PersonalityManager] Updated personality: %s\n", config.name);
    return true;
}
