#ifndef TARA_AUTHMANAGER_H
#define TARA_AUTHMANAGER_H

#include <Arduino.h>

constexpr uint32_t TARA_SESSION_TIMEOUT_SEC = 3600; // 1 hour session lifetime
constexpr uint8_t TARA_MAX_AUTH_FAILURES = 5;       // Brute-force threshold
constexpr uint32_t TARA_LOCKOUT_PERIOD_MS = 30000;   // 30 seconds lockout

struct SessionToken {
    char token[33];         // 32-hex chars + null terminator
    uint32_t createdUptime; // Seconds since boot
    uint32_t lastUsedUptime;// Seconds since boot
    bool active;
};

class AuthManager {
public:
    AuthManager();

    void begin();

    // Password Management
    bool isPasswordSet() const;
    bool setDevicePassword(const String& newPassword);
    bool verifyPassword(const String& inputPassword);

    // Session Management (RAM-only, invalidated upon ESP32 reboot)
    String createSession();
    bool validateToken(const String& bearerToken);
    void invalidateSession(const String& bearerToken);
    void invalidateAllSessions();

    // Brute-force lockout protection
    bool isLockedOut() const;
    uint32_t getRemainingLockoutSeconds() const;
    void recordFailedAttempt();
    void recordSuccessfulAuth();

    // Setup PIN for First Boot
    String getSetupPIN() const;

private:
    char passwordHash[65]; // SHA256 hex string
    char salt[17];         // 16 hex chars salt
    char setupPIN[9];      // 8-character hardware setup PIN
    bool passwordConfigured;

    SessionToken activeSession; // Single active configuration session for standard ESP32 RAM efficiency
    uint8_t failedAttempts;
    uint32_t lockoutStartMs;

    String computeHash(const String& password, const char* saltStr);
    void generateRandomHex(char* buffer, size_t length);
};

#endif // TARA_AUTHMANAGER_H
