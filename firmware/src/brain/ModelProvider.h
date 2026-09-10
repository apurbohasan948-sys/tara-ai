#ifndef TARA_MODELPROVIDER_H
#define TARA_MODELPROVIDER_H

#include <Arduino.h>
#include "Response.h"
#include "../core/TaraConfig.h"

class ModelProvider {
public:
    virtual ~ModelProvider() {}
    virtual bool begin(const BrainConfig& config) = 0;
    virtual BrainResponse generateResponse(const char* prompt, const char* systemPrompt = nullptr) = 0;
    virtual const char* getProviderName() const = 0;
};

#endif // TARA_MODELPROVIDER_H
