#ifndef TARA_HARDWARECONFIG_H
#define TARA_HARDWARECONFIG_H

#include <Arduino.h>

// =============================================================================
// Centralized GPIO Pin Map for Standard Dual-Core ESP32 (ESP32-WROOM / DevKit)
// Do NOT hardcode GPIO numbers in other modules!
// =============================================================================

namespace TaraPins {
    // -------------------------------------------------------------------------
    // I2C OLED Display (SSD1306 / SH1106 128x64)
    // -------------------------------------------------------------------------
    constexpr int8_t OLED_SDA        = 21; // Standard ESP32 I2C Data
    constexpr int8_t OLED_SCL        = 22; // Standard ESP32 I2C Clock
    constexpr int8_t OLED_RST        = -1; // -1 if shared with ESP32 reset
    constexpr uint8_t OLED_I2C_ADDR  = 0x3C;

    // -------------------------------------------------------------------------
    // I2S Audio Interface (Microphone INMP441 + Speaker MAX98357A / DAC)
    // -------------------------------------------------------------------------
    constexpr int8_t I2S_BCLK        = 26; // Bit Clock
    constexpr int8_t I2S_LRC         = 25; // Word Select (Left/Right clock)
    constexpr int8_t I2S_DOUT        = 19; // Data OUT to MAX98357A Speaker Amp
    constexpr int8_t I2S_DIN         = 34; // Data IN from INMP441 Mic (Input Only)

    // -------------------------------------------------------------------------
    // Indicators & Human Interface
    // -------------------------------------------------------------------------
    constexpr int8_t LED_STATUS      = 2;  // Built-in Blue LED on NodeMCU-32S / DevKit
    constexpr int8_t BTN_ACTION      = 0;  // Built-in BOOT Button (Active LOW)
    constexpr int8_t TOUCH_HEAD      = 4;  // Capacitive Touch Pad T0 (GPIO 4)

    // -------------------------------------------------------------------------
    // Optional Actuators / Sensors (Reserved for Future Expansion)
    // -------------------------------------------------------------------------
    constexpr int8_t SERVO_NECK_PAN  = 18; // Head horizontal pan
    constexpr int8_t SERVO_NECK_TILT = 5;  // Head vertical tilt
    constexpr int8_t SENSOR_PIR      = 27; // Passive Infrared Motion Sensor
    constexpr int8_t BATTERY_ADC     = 35; // Battery voltage divider (ADC1_CH7)
}

#endif // TARA_HARDWARECONFIG_H
