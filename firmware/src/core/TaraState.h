#ifndef TARA_STATE_H
#define TARA_STATE_H

#include <Arduino.h>

// Primary states of TARA robot
enum class RobotState : uint8_t {
    IDLE = 0,
    LISTENING,
    THINKING,
    SPEAKING,
    HAPPY,
    SAD,
    ANGRY,
    SURPRISED,
    SLEEPING,
    CONNECTING,
    ERROR
};

const char* robotStateToString(RobotState state);
RobotState stringToRobotState(const char* str);

#endif // TARA_STATE_H
