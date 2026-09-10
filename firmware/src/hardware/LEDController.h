#ifndef TARA_LEDCONTROLLER_H
#define TARA_LEDCONTROLLER_H

#include <Arduino.h>
#include "HardwareConfig.h"

enum class LEDPattern : uint8_t {
    OFF = 0,
    SOLID,
    BLINK_SLOW,
    BLINK_FAST,
    BREATHE
};

class LEDController {
public:
    LEDController(int8_t pin = TaraPins::LED_STATUS);

    bool begin();
    void update();

    void setPattern(LEDPattern pattern);
    void on();
    void off();

private:
    int8_t ledPin;
    LEDPattern currentPattern;
    uint32_t lastUpdateMs;
    uint16_t phase;
    bool state;
};

#endif // TARA_LEDCONTROLLER_H
