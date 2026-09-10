#include "LEDController.h"

LEDController::LEDController(int8_t pin)
    : ledPin(pin),
      currentPattern(LEDPattern::OFF),
      lastUpdateMs(0),
      phase(0),
      state(false) {}

bool LEDController::begin() {
    if (ledPin >= 0) {
        pinMode(ledPin, OUTPUT);
        digitalWrite(ledPin, LOW);
        return true;
    }
    return false;
}

void LEDController::setPattern(LEDPattern pattern) {
    currentPattern = pattern;
    if (pattern == LEDPattern::OFF) {
        off();
    } else if (pattern == LEDPattern::SOLID) {
        on();
    }
}

void LEDController::on() {
    if (ledPin >= 0) {
        digitalWrite(ledPin, HIGH);
        state = true;
    }
}

void LEDController::off() {
    if (ledPin >= 0) {
        digitalWrite(ledPin, LOW);
        state = false;
    }
}

void LEDController::update() {
    if (ledPin < 0) return;
    uint32_t now = millis();

    switch (currentPattern) {
        case LEDPattern::BLINK_SLOW:
            if (now - lastUpdateMs > 1000) {
                lastUpdateMs = now;
                state = !state;
                digitalWrite(ledPin, state ? HIGH : LOW);
            }
            break;

        case LEDPattern::BLINK_FAST:
            if (now - lastUpdateMs > 200) {
                lastUpdateMs = now;
                state = !state;
                digitalWrite(ledPin, state ? HIGH : LOW);
            }
            break;

        case LEDPattern::BREATHE:
            if (now - lastUpdateMs > 20) {
                lastUpdateMs = now;
                phase = (phase + 1) % 360;
                // Software PWM or LEDC channel can be used for dimming
                int duty = (int)(128.0f + 127.0f * sinf(phase * 0.017453f));
                analogWrite(ledPin, duty);
            }
            break;

        default:
            break;
    }
}
