#ifndef TARA_ACTUATORMANAGER_H
#define TARA_ACTUATORMANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

class ActuatorManager {
public:
    ActuatorManager(int8_t panPin = TaraPins::SERVO_NECK_PAN,
                    int8_t tiltPin = TaraPins::SERVO_NECK_TILT);

    bool begin();
    void setNeckPosition(int16_t panAngle, int16_t tiltAngle);
    void centerNeck();

    int16_t getPanAngle() const { return currentPan; }
    int16_t getTiltAngle() const { return currentTilt; }

private:
    int8_t panPin;
    int8_t tiltPin;
    int16_t currentPan;
    int16_t currentTilt;
    bool enabled;
};

#endif // TARA_ACTUATORMANAGER_H
