#include "ActuatorManager.h"

ActuatorManager::ActuatorManager(int8_t pan, int8_t tilt)
    : panPin(pan),
      tiltPin(tilt),
      currentPan(90),
      currentTilt(90),
      enabled(false) {}

bool ActuatorManager::begin() {
    Serial.printf("[ActuatorManager] Actuator abstraction ready (Pan=%d, Tilt=%d)\n", panPin, tiltPin);
    return true;
}

void ActuatorManager::setNeckPosition(int16_t panAngle, int16_t tiltAngle) {
    currentPan = constrain(panAngle, 30, 150);
    currentTilt = constrain(tiltAngle, 45, 135);
}

void ActuatorManager::centerNeck() {
    setNeckPosition(90, 90);
}
