#ifndef TARA_SENSORMANAGER_H
#define TARA_SENSORMANAGER_H

#include <Arduino.h>
#include "HardwareConfig.h"

class SensorManager {
public:
    SensorManager(int8_t btnPin = TaraPins::BTN_ACTION,
                  int8_t touchPin = TaraPins::TOUCH_HEAD,
                  int8_t batAdcPin = TaraPins::BATTERY_ADC);

    bool begin();
    void update();

    bool isButtonPressed() const { return buttonPressed; }
    bool isTouched() const { return headTouched; }
    float getBatteryVoltage();
    uint8_t getBatteryPercent();

private:
    int8_t btnPin;
    int8_t touchPin;
    int8_t batPin;

    bool buttonPressed;
    bool headTouched;
    uint32_t lastReadMs;
    float cachedVoltage;
};

#endif // TARA_SENSORMANAGER_H
