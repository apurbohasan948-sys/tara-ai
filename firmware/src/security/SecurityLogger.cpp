#include "SecurityLogger.h"
#include <esp_timer.h>

const char* securityEventTypeToString(SecurityEventType type) {
    switch (type) {
        case SecurityEventType::AUTH_SUCCESS:     return "AUTH_SUCCESS";
        case SecurityEventType::AUTH_FAILURE:     return "AUTH_FAILURE";
        case SecurityEventType::INVALID_TOKEN:    return "INVALID_TOKEN";
        case SecurityEventType::INVALID_ENDPOINT: return "INVALID_ENDPOINT";
        case SecurityEventType::CONFIG_CHANGED:   return "CONFIG_CHANGED";
        case SecurityEventType::FACTORY_RESET:    return "FACTORY_RESET";
        case SecurityEventType::RESTART_REQUEST:  return "RESTART_REQUEST";
        case SecurityEventType::OTA_REQUEST:      return "OTA_REQUEST";
        case SecurityEventType::TLS_FAILURE:      return "TLS_FAILURE";
        default:                                  return "UNKNOWN";
    }
}

SecurityLogger::SecurityLogger() : head(0), count(0) {
    memset(entries, 0, sizeof(entries));
}

String SecurityLogger::sanitizeDetails(const String& raw) {
    // Redact any patterns resembling API keys or passwords
    String sanitized = raw;
    int keyIdx = sanitized.indexOf("key=");
    if (keyIdx != -1) {
        sanitized = sanitized.substring(0, keyIdx + 4) + "********";
    }
    int passIdx = sanitized.indexOf("pass=");
    if (passIdx != -1) {
        sanitized = sanitized.substring(0, passIdx + 5) + "********";
    }
    if (sanitized.length() > 47) {
        sanitized = sanitized.substring(0, 44) + "...";
    }
    return sanitized;
}

void SecurityLogger::logEvent(SecurityEventType type, const String& clientIP, const String& details) {
    SecurityLogEntry& entry = entries[head];
    entry.eventType = type;
    entry.timestamp = (uint32_t)(esp_timer_get_time() / 1000000);
    strncpy(entry.clientIP, clientIP.c_str(), sizeof(entry.clientIP) - 1);
    entry.clientIP[sizeof(entry.clientIP) - 1] = '\0';

    String safeDetails = sanitizeDetails(details);
    strncpy(entry.details, safeDetails.c_str(), sizeof(entry.details) - 1);
    entry.details[sizeof(entry.details) - 1] = '\0';

    head = (head + 1) % TARA_SECURITY_LOG_CAPACITY;
    if (count < TARA_SECURITY_LOG_CAPACITY) {
        count++;
    }

    // Output to Serial with redaction
    Serial.printf("[SECURITY] %s from %s: %s\n",
                  securityEventTypeToString(type),
                  entry.clientIP,
                  entry.details);
}

String SecurityLogger::toJson() const {
    String json = "[";
    for (size_t i = 0; i < count; i++) {
        size_t idx = (head + TARA_SECURITY_LOG_CAPACITY - count + i) % TARA_SECURITY_LOG_CAPACITY;
        const SecurityLogEntry& e = entries[idx];
        if (i > 0) json += ",";
        json += "{";
        json += "\"event\":\"" + String(securityEventTypeToString(e.eventType)) + "\",";
        json += "\"timestamp\":" + String(e.timestamp) + ",";
        json += "\"ip\":\"" + String(e.clientIP) + "\",";
        json += "\"details\":\"" + String(e.details) + "\"";
        json += "}";
    }
    json += "]";
    return json;
}

void SecurityLogger::clear() {
    head = 0;
    count = 0;
    memset(entries, 0, sizeof(entries));
}
