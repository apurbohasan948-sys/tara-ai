#ifndef TARA_SECURITYLOGGER_H
#define TARA_SECURITYLOGGER_H

#include <Arduino.h>

enum class SecurityEventType {
    AUTH_SUCCESS,
    AUTH_FAILURE,
    INVALID_TOKEN,
    INVALID_ENDPOINT,
    CONFIG_CHANGED,
    FACTORY_RESET,
    RESTART_REQUEST,
    OTA_REQUEST,
    TLS_FAILURE
};

const char* securityEventTypeToString(SecurityEventType type);

struct SecurityLogEntry {
    SecurityEventType eventType;
    uint32_t timestamp;  // Uptime in seconds
    char clientIP[16];   // IPv4 string
    char details[48];    // Sanitized detail message (No secrets!)
};

constexpr size_t TARA_SECURITY_LOG_CAPACITY = 20; // Lightweight circular buffer

class SecurityLogger {
public:
    SecurityLogger();

    void logEvent(SecurityEventType type, const String& clientIP, const String& details = "");
    String toJson() const;
    void clear();

private:
    SecurityLogEntry entries[TARA_SECURITY_LOG_CAPACITY];
    size_t head;
    size_t count;

    String sanitizeDetails(const String& raw);
};

#endif // TARA_SECURITYLOGGER_H
