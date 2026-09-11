#include "MockCloudProvider.h"
#include <string.h>

MockCloudProvider::MockCloudProvider()
    : customEmotion(RobotEmotion::JOY), useCustomReply(false) {
    memset(customReply, 0, sizeof(customReply));
}

bool MockCloudProvider::begin(const BrainConfig& cfg) {
    config = cfg;
    return true;
}

bool MockCloudProvider::isAvailable() const {
    return true; // Mock provider is always available without network or hardware
}

void MockCloudProvider::setCustomReply(const char* reply, RobotEmotion emotion) {
    if (reply) {
        strncpy(customReply, reply, sizeof(customReply) - 1);
        customReply[sizeof(customReply) - 1] = '\0';
        customEmotion = emotion;
        useCustomReply = true;
    }
}

BrainResponse MockCloudProvider::generateResponse(const char* prompt, const char* systemPrompt) {
    BrainResponse resp;
    resp.success = true;
    resp.httpCode = 200;
    resp.latencyMs = 150;

    if (useCustomReply) {
        resp.text = String(customReply);
        resp.suggestedEmotion = customEmotion;
        return resp;
    }

    String p = String(prompt ? prompt : "");
    p.toLowerCase();

    if (p.indexOf("hello") != -1 || p.indexOf("hi") != -1 || p.indexOf("hey") != -1) {
        resp.text = "Hello! I am TARA in Simulation Mode. All systems are operational!";
        resp.suggestedEmotion = RobotEmotion::JOY;
    } else if (p.indexOf("joke") != -1) {
        resp.text = "Why do robots love standard ESP32? Because it has two cores and zero unnecessary drama!";
        resp.suggestedEmotion = RobotEmotion::JOY;
    } else if (p.indexOf("sleep") != -1 || p.indexOf("tired") != -1) {
        resp.text = "Entering low-power sleep state. Goodnight!";
        resp.suggestedEmotion = RobotEmotion::DROWSY;
    } else if (p.indexOf("who are you") != -1) {
        resp.text = "I am TARA, a modular companion robot running with full simulation support!";
        resp.suggestedEmotion = RobotEmotion::CURIOSITY;
    } else {
        resp.text = "I received your message: \"" + String(prompt) + "\". Processing completed successfully!";
        resp.suggestedEmotion = RobotEmotion::CALM;
    }

    return resp;
}
