#ifndef TARA_CLOUDPROVIDER_H
#define TARA_CLOUDPROVIDER_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "ModelProvider.h"

class CloudProvider : public ModelProvider {
public:
    CloudProvider();
    virtual ~CloudProvider();

    bool begin(const BrainConfig& config) override;
    BrainResponse generateResponse(const char* prompt, const char* systemPrompt = nullptr) override;
    const char* getProviderName() const override { return "CloudProvider"; }

private:
    BrainConfig config;
    WiFiClientSecure* secureClient;

    String extractMessageContent(const String& jsonPayload);
};

#endif // TARA_CLOUDPROVIDER_H
