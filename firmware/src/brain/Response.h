#ifndef TARA_RESPONSE_H
#define TARA_RESPONSE_H

#include <Arduino.h>

struct BrainResponse {
    bool success;
    String text;
    String emotionTag;    // e.g. "happy", "curious", "neutral"
    uint16_t latencyMs;
    int httpCode;
    String errorMessage;
};

#endif // TARA_RESPONSE_H
