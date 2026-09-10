#ifndef TARA_BRAIN_H
#define TARA_BRAIN_H

#include <Arduino.h>
#include "ModelProvider.h"
#include "CloudProvider.h"
#include "Response.h"
#include "../core/TaraConfig.h"

class StorageManager;
class PersonalityManager;

class Brain {
public:
    Brain(StorageManager* storage, PersonalityManager* personality);
    ~Brain();

    bool begin();
    BrainResponse ask(const char* userPrompt);

    void setModelProvider(ModelProvider* provider);
    ModelProvider* getModelProvider() const { return currentProvider; }

    BrainConfig getConfig() const { return config; }
    bool updateConfig(const BrainConfig& newConfig);

private:
    StorageManager* storage;
    PersonalityManager* personality;
    ModelProvider* currentProvider;
    CloudProvider defaultCloudProvider;
    BrainConfig config;

    String buildSystemPrompt();
};

#endif // TARA_BRAIN_H
