#include "SensorManager.h"
#include "../core/EventBus.h"

SensorManager::SensorManager(int8_t btn, int8_t touch, int8_t bat)
    : btnPin(btn),
      touchPin(touch),
      batPin(bat),
      buttonPressed(false),
      headTouched(false),
      lastReadMs(0),
      cachedVoltage(4.15f) {}

bool SensorManager::begin() {
    if (btnPin >= 0) {
        pinMode(btnPin, INPUT_PULLUP);
    }
    if (batPin >= 0) {
        pinMode(batPin, INPUT);
    }
    Serial.printf("[SensorManager] Sensors initialized (Button=%d, Touch=%d, Battery=%d)\n",
                  btnPin, touchPin, batPin);
    return true;
}

void SensorManager::update() {
    uint32_t now = millis();
    if (now - lastReadMs < 50) return;
    lastReadMs = now;

    // Check button (active LOW on ESP32 BOOT button)
    if (btnPin >= 0) {
        bool pressed = (digitalRead(btnPin) == LOW);
        if (pressed && !buttonPressed) {
            buttonPressed = true;
            EventData data;
            data.type = EventType::BUTTON_PRESSED;
            data.message = "BOOT Button Pressed";
            data.value = 1;
            GlobalEventBus.publish(data);
        } else if (!pressed) {
            buttonPressed = false;
        }
    }

    // Touch read (ESP32 touchRead function)
    if (touchPin >= 0) {
        uint16_t touchVal = touchRead(touchPin);
        headTouched = (touchVal < 35); // Typical touch threshold
    }
}

float SensorManager::getBatteryVoltage() {
    if (batPin < 0) return 4.20f; // Mock USB powered
    // Simple 2:1 resistor divider read on ESP32 ADC1
    int raw = analogRead(batPin);
    cachedVoltage = ((float)raw / 4095.0f) * 3.3f * 2.0f;
    return cachedVoltage;
}

uint8_t SensorManager::getBatteryPercent() {
    float v = getBatteryVoltage();
    if (v >= 4.2f) return 100;
    if (v <= 3.3f) return 0;
    return (uint8_t)(((v - 3.3f) / (4.2f - 3.3f)) * 100.0f);
}
