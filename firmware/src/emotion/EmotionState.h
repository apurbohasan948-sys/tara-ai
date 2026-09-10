#ifndef TARA_EMOTIONSTATE_H
#define TARA_EMOTIONSTATE_H

#include <Arduino.h>

enum class RobotEmotion : uint8_t {
    CALM = 0,
    JOY,
    CURIOSITY,
    EXCITEMENT,
    EMPATHY,
    DROWSY,
    CONCERN
};

const char* robotEmotionToString(RobotEmotion emotion);
RobotEmotion stringToRobotEmotion(const char* str);

#endif // TARA_EMOTIONSTATE_H
