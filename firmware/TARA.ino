// =============================================================================
// TARA - Modular AI Companion Robot Framework (v0.1.0)
// Designed specifically for standard ESP32 (ESP32-D0WDQ6 / ESP32-WROOM-32)
//
// Target Hardware: Standard ESP32 DevKit V1 / NodeMCU-32S
// Display: 0.96" or 1.3" I2C OLED (SSD1306/SH1106 128x64) -> SDA: GPIO 21, SCL: GPIO 22
// Audio DAC: MAX98357A I2S -> BCLK: 26, LRC: 25, DIN: 19
// Audio Mic: INMP441 I2S   -> BCLK: 26, LRC: 25, DOUT: 34
// Status LED: GPIO 2
// =============================================================================

#include "src/core/TaraCore.h"

void setup() {
    // Initialize TARA Robot Subsystems
    TARA.begin();
}

void loop() {
    // Non-blocking main loop
    TARA.update();
}
