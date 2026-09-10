#include "Brain.h"
#include "../storage/StorageManager.h"
#include "../personality/PersonalityManager.h"
#include "../core/EventBus.h"

Brain::Brain(StorageManager* storageMgr, PersonalityManager* persMgr)
    : storage(storageMgr),
      personality(persMgr),
      currentProvider(&defaultCloudProvider) {}

Brain::~Brain() {}

bool Brain::begin() {
    if (storage) {
        storage->loadBrainConfig(config);
    }
    defaultCloudProvider.begin(config);
    currentProvider = &defaultCloudProvider;
    Serial.println("[Brain] Initialized AI Brain subsystem.");
    return true;
}

void Brain::setModelProvider(ModelProvider* provider) {
    if (provider) {
        currentProvider = provider;
        currentProvider->begin(config);
    }
}

bool Brain::updateConfig(const BrainConfig& newConfig) {
    config = newConfig;
    if (storage) {
        storage->saveBrainConfig(config);
    }
    if (currentProvider) {
        currentProvider->begin(config);
    }
    return true;
}

String Brain::buildSystemPrompt() {
    String sys = "You are TARA, a friendly and expressive physical desktop companion robot. ";
    if (personality) {
        sys += "Name: " + String(personality->getName()) + ". ";
        sys += "Personality Traits: " + String(personality->getTrait()) + ". ";
        sys += "Speaking Style: " + String(personality->getSpeakingStyle()) + ". ";
    }
    sys += "Keep your answers very brief (1 to 2 short sentences max) because they will be spoken aloud on an ESP32 speaker.";
    return sys;
}

BrainResponse Brain::ask(const char* userPrompt) {
    EventData data;
    data.type = EventType::BRAIN_THINKING;
    data.message = userPrompt;
    GlobalEventBus.publish(data);

    String systemPrompt = buildSystemPrompt();

    BrainResponse resp;
    if (currentProvider) {
        resp = currentProvider->generateResponse(userPrompt, systemPrompt.c_str());
    } else {
        resp.success = false;
        resp.errorMessage = "No ModelProvider registered";
    }

    EventData doneData;
    doneData.type = EventType::BRAIN_RESPONDED;
    doneData.message = resp.success ? resp.text.c_str() : resp.errorMessage.c_str();
    GlobalEventBus.publish(doneData);

    return resp;
}
