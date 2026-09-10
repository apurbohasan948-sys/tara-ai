#include "TaraState.h"
#include <string.h>

const char* robotStateToString(RobotState state) {
    switch (state) {
        case RobotState::IDLE:       return "IDLE";
        case RobotState::LISTENING:  return "LISTENING";
        case RobotState::THINKING:   return "THINKING";
        case RobotState::SPEAKING:   return "SPEAKING";
        case RobotState::HAPPY:      return "HAPPY";
        case RobotState::SAD:        return "SAD";
        case RobotState::ANGRY:      return "ANGRY";
        case RobotState::SURPRISED:  return "SURPRISED";
        case RobotState::SLEEPING:   return "SLEEPING";
        case RobotState::CONNECTING: return "CONNECTING";
        case RobotState::ERROR:      return "ERROR";
        default:                     return "UNKNOWN";
    }
}

RobotState stringToRobotState(const char* str) {
    if (!str) return RobotState::IDLE;
    if (strcmp(str, "LISTENING") == 0)  return RobotState::LISTENING;
    if (strcmp(str, "THINKING") == 0)   return RobotState::THINKING;
    if (strcmp(str, "SPEAKING") == 0)   return RobotState::SPEAKING;
    if (strcmp(str, "HAPPY") == 0)      return RobotState::HAPPY;
    if (strcmp(str, "SAD") == 0)        return RobotState::SAD;
    if (strcmp(str, "ANGRY") == 0)      return RobotState::ANGRY;
    if (strcmp(str, "SURPRISED") == 0)  return RobotState::SURPRISED;
    if (strcmp(str, "SLEEPING") == 0)   return RobotState::SLEEPING;
    if (strcmp(str, "CONNECTING") == 0) return RobotState::CONNECTING;
    if (strcmp(str, "ERROR") == 0)      return RobotState::ERROR;
    return RobotState::IDLE;
}
