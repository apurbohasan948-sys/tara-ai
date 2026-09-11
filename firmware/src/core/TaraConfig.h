#ifndef TARA_CONFIG_H
#define TARA_CONFIG_H

#include <Arduino.h>

struct WiFiConfig {
    char ssid[33];
    char password[65];
    bool autoConnect;
    uint8_t retryCount;
};

struct BrainConfig {
    char provider[16];     // "cloud", "local", "custom"
    char endpoint[128];    // API endpoint URL
    char apiKey[96];       // Secret API key
    char model[32];        // Model name (e.g., "gemini-1.5-flash", "llama3")
    float temperature;     // 0.0 - 2.0
    uint16_t maxTokens;    // default 256
    uint16_t timeoutMs;    // default 8000
    bool streaming;        // true/false
    bool enabled;          // AI enabled
};

struct VoiceConfig {
    char ttsEndpoint[128]; // e.g. gTTS proxy or direct gTTS service
    char ttsLanguage[8];   // e.g. "en", "es", "ja", "bn"
    char sttEndpoint[128]; // STT cloud endpoint (e.g. Google Speech-to-Text / Whisper / proxy)
    char sttLanguage[12];  // e.g. "en-US", "bn-BD"
    uint8_t volume;        // 0 - 100
    uint16_t sampleRate;   // default 16000
    bool micEnabled;
    bool speakerEnabled;
    uint16_t vadThreshold; // Speech RMS threshold (default 1200)
    uint16_t silenceTimeoutMs; // Silence timeout to conclude speech (default 1200ms)
    uint16_t maxRecordingMs;   // Max recording duration (default 4500ms)
};

struct PersonalityConfig {
    char name[24];         // Default "TARA"
    char primaryTrait[32]; // "Curious & Empathetic"
    char speakingStyle[32];// "Warm and concise"
    char language[12];     // "English"
    uint8_t energyLevel;   // 0 - 100
    bool wakeWordEnabled;  // Wake word activation
};

struct HardwareConfigData {
    int8_t oledSdaPin;     // Standard ESP32 default: 21
    int8_t oledSclPin;     // Standard ESP32 default: 22
    int8_t oledResetPin;   // -1 if shared
    int8_t i2sBclkPin;     // 26
    int8_t i2sLrcPin;      // 25
    int8_t i2sDoutPin;     // 19 (Speaker DAC)
    int8_t i2sDinPin;      // 34 (Mic INMP441)
    int8_t ledStatusPin;   // 2 (Built-in LED on most ESP32 DevKits)
    int8_t buttonActionPin;// 0 (BOOT button on GPIO 0)
};

#endif // TARA_CONFIG_H
