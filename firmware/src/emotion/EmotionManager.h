#ifndef TARA_EMOTIONMANAGER_H
#define TARA_EMOTIONMANAGER_H

#include <Arduino.h>
#include "EmotionState.h"
#include "../core/TaraState.h"

class EmotionManager {
public:
    EmotionManager();

    bool begin();
    void update();

    RobotEmotion getEmotion() const { return currentEmotion; }
    void setEmotion(RobotEmotion emotion, const char* reason = nullptr);

    void onStateChange(RobotState oldState, RobotState newState);

private:
    RobotEmotion currentEmotion;
    uint32_t lastEmotionChangeMs;
    uint8_t energyLevel; // 0 - 100
};

#endif // TARA_EMOTIONMANAGER_H
