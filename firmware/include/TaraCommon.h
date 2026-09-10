// =============================================================================
// TARA - Modular AI Companion Robot Framework (v0.1.0)
// Designed specifically for standard ESP32 (ESP32-D0WDQ6 / ESP32-WROOM-32)
// =============================================================================

#ifndef TARA_COMMON_H
#define TARA_COMMON_H

#include <Arduino.h>

#define TARA_VERSION_MAJOR 0
#define TARA_VERSION_MINOR 1
#define TARA_VERSION_PATCH 0
#define TARA_VERSION_STRING "0.1.0-alpha"

#define TARA_DEVICE_NAME "TARA"
#define TARA_DEFAULT_AP_SSID_PREFIX "TARA-Robot-"
#define TARA_DEFAULT_AP_PASS "tara1234"
#define TARA_DEFAULT_AP_IP IPAddress(192, 168, 4, 1)

// Standard ESP32 target check
#if defined(CONFIG_IDF_TARGET_ESP32S3) || defined(CONFIG_IDF_TARGET_ESP32C3) || defined(CONFIG_IDF_TARGET_ESP32C6)
  #warning "TARA v0.1 is targeted specifically for standard dual-core ESP32. S3/C3/C6 peripherals differ."
#endif

// Serial baudrate
#define TARA_SERIAL_BAUD 115200

#endif // TARA_COMMON_H
