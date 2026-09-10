#include "EmotionManager.h"
#include <string.h>

const char* robotEmotionToString(RobotEmotion emotion) {
    switch (emotion) {
        case RobotEmotion::CALM:        return "CALM";
        case RobotEmotion::JOY:         return "JOY";
        case RobotEmotion::CURIOSITY:   return "CURIOSITY";
        case RobotEmotion::EXCITEMENT:  return "EXCITEMENT";
        case RobotEmotion::EMPATHY:     return "EMPATHY";
        case RobotEmotion::DROWSY:      return "DROWSY";
        case RobotEmotion::CONCERN:     return "CONCERN";
        default:                        return "CALM";
    }
}

RobotEmotion stringToRobotEmotion(const char* str) {
    if (!str) return RobotEmotion::CALM;
    if (strcmp(str, "JOY") == 0)        return RobotEmotion::JOY;
    if (strcmp(str, "CURIOSITY") == 0)  return RobotEmotion::CURIOSITY;
    if (strcmp(str, "EXCITEMENT") == 0) return RobotEmotion::EXCITEMENT;
    if (strcmp(str, "EMPATHY") == 0)    return RobotEmotion::EMPATHY;
    if (strcmp(str, "DROWSY") == 0)     return RobotEmotion::DROWSY;
    if (strcmp(str, "CONCERN") == 0)    return RobotEmotion::CONCERN;
    return RobotEmotion::CALM;
}

EmotionManager::EmotionManager()
    : currentEmotion(RobotEmotion::CALM),
      lastEmotionChangeMs(0),
      energyLevel(85) {}

bool EmotionManager::begin() {
    Serial.println("[EmotionManager] Emotion engine initialized.");
    return true;
}

void EmotionManager::setEmotion(RobotEmotion emotion, const char* reason) {
    if (currentEmotion != emotion) {
        Serial.printf("[EmotionManager] Emotion change: %s -> %s (%s)\n",
                      robotEmotionToString(currentEmotion),
                      robotEmotionToString(emotion),
                      reason ? reason : "");
        currentEmotion = emotion;
        lastEmotionChangeMs = millis();
    }
}

void EmotionManager::onStateChange(RobotState oldState, RobotState newState) {
    switch (newState) {
        case RobotState::HAPPY:
            setEmotion(RobotEmotion::JOY, "Happy state");
            break;
        case RobotState::LISTENING:
            setEmotion(RobotEmotion::CURIOSITY, "Attentive listening");
            break;
        case RobotState::THINKING:
            setEmotion(RobotEmotion::CALM, "Deep thought");
            break;
        case RobotState::SLEEPING:
            setEmotion(RobotEmotion::DROWSY, "Asleep");
            break;
        case RobotState::ERROR:
            setEmotion(RobotEmotion::CONCERN, "Hardware or network fault");
            break;
        default:
            break;
    }
}

void EmotionManager::update() {
    // Subtle emotional decay back to calm after long idle
    uint32_t now = millis();
    if (now - lastEmotionChangeMs > 30000 && currentEmotion != RobotEmotion::CALM && currentEmotion != RobotEmotion::DROWSY) {
        setEmotion(RobotEmotion::CALM, "Resting equilibrium");
    }
}
