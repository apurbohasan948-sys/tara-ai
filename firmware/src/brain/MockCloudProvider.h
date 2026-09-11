#ifndef TARA_MOCKCLOUDPROVIDER_H
#define TARA_MOCKCLOUDPROVIDER_H

#include "ModelProvider.h"

class MockCloudProvider : public ModelProvider {
public:
    MockCloudProvider();
    ~MockCloudProvider() override = default;

    bool begin(const BrainConfig& cfg) override;
    BrainResponse generateResponse(const char* prompt, const char* systemPrompt = nullptr) override;
    bool isAvailable() const override;
    const char* getProviderName() const override { return "MockCloudProvider"; }

    void setCustomReply(const char* reply, RobotEmotion emotion = RobotEmotion::JOY);

private:
    BrainConfig config;
    char customReply[256];
    RobotEmotion customEmotion;
    bool useCustomReply;
};

#endif // TARA_MOCKCLOUDPROVIDER_H
