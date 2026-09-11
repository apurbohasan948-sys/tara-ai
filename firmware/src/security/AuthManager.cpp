#include "AuthManager.h"
#include <Preferences.h>
#include <esp_system.h>
#include <mbedtls/sha256.h>

AuthManager::AuthManager()
    : passwordConfigured(false), failedAttempts(0), lockoutStartMs(0) {
    memset(passwordHash, 0, sizeof(passwordHash));
    memset(salt, 0, sizeof(salt));
    memset(setupPIN, 0, sizeof(setupPIN));
    memset(&activeSession, 0, sizeof(activeSession));
}

void AuthManager::generateRandomHex(char* buffer, size_t length) {
    for (size_t i = 0; i < length; i++) {
        uint32_t r = esp_random() % 16;
        buffer[i] = (r < 10) ? ('0' + r) : ('a' + (r - 10));
    }
    buffer[length] = '\0';
}

String AuthManager::computeHash(const String& password, const char* saltStr) {
    String payload = String(saltStr) + ":" + password;
    unsigned char hash[32];
    mbedtls_sha256_context ctx;
    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts(&ctx, 0); // 0 = SHA-256
    mbedtls_sha256_update(&ctx, (const unsigned char*)payload.c_str(), payload.length());
    mbedtls_sha256_finish(&ctx, hash);
    mbedtls_sha256_free(&ctx);

    char hexOutput[65];
    for (int i = 0; i < 32; i++) {
        sprintf(&hexOutput[i * 2], "%02x", hash[i]);
    }
    hexOutput[64] = '\0';
    return String(hexOutput);
}

void AuthManager::begin() {
    Preferences prefs;
    prefs.begin("tara_sec", true);

    String storedHash = prefs.getString("pwd_hash", "");
    String storedSalt = prefs.getString("pwd_salt", "");
    String storedPIN  = prefs.getString("setup_pin", "");
    prefs.end();

    if (storedHash.length() == 64 && storedSalt.length() == 16) {
        strncpy(passwordHash, storedHash.c_str(), sizeof(passwordHash) - 1);
        strncpy(salt, storedSalt.c_str(), sizeof(salt) - 1);
        passwordConfigured = true;
    } else {
        passwordConfigured = false;
        // Generate random salt
        generateRandomHex(salt, 16);
    }

    if (storedPIN.length() == 8) {
        strncpy(setupPIN, storedPIN.c_str(), sizeof(setupPIN) - 1);
    } else {
        // Generate secure 8-character setup PIN for first boot
        generateRandomHex(setupPIN, 8);
        prefs.begin("tara_sec", false);
        prefs.putString("setup_pin", String(setupPIN));
        prefs.end();
    }

    // Sessions are strictly stored in volatile RAM; automatically reset on boot
    activeSession.active = false;
}

bool AuthManager::isPasswordSet() const {
    return passwordConfigured;
}

String AuthManager::getSetupPIN() const {
    return String(setupPIN);
}

bool AuthManager::setDevicePassword(const String& newPassword) {
    if (newPassword.length() < 6 || newPassword.length() > 64) {
        return false; // Minimum 6 characters, max 64
    }

    generateRandomHex(salt, 16);
    String hash = computeHash(newPassword, salt);
    strncpy(passwordHash, hash.c_str(), sizeof(passwordHash) - 1);
    passwordConfigured = true;

    Preferences prefs;
    prefs.begin("tara_sec", false);
    prefs.putString("pwd_hash", String(passwordHash));
    prefs.putString("pwd_salt", String(salt));
    prefs.end();

    invalidateAllSessions();
    return true;
}

bool AuthManager::verifyPassword(const String& inputPassword) {
    if (isLockedOut()) {
        return false;
    }

    // If device password is not yet configured, accept the hardware setup PIN
    if (!passwordConfigured) {
        if (inputPassword.equals(setupPIN)) {
            recordSuccessfulAuth();
            return true;
        } else {
            recordFailedAttempt();
            return false;
        }
    }

    String computed = computeHash(inputPassword, salt);
    // Constant-time string comparison to prevent timing attacks
    if (computed.length() != 64) {
        recordFailedAttempt();
        return false;
    }

    int diff = 0;
    for (size_t i = 0; i < 64; i++) {
        diff |= (computed.charAt(i) ^ passwordHash[i]);
    }

    if (diff == 0) {
        recordSuccessfulAuth();
        return true;
    } else {
        recordFailedAttempt();
        return false;
    }
}

String AuthManager::createSession() {
    generateRandomHex(activeSession.token, 32);
    activeSession.createdUptime = esp_timer_get_time() / 1000000;
    activeSession.lastUsedUptime = activeSession.createdUptime;
    activeSession.active = true;
    return String(activeSession.token);
}

bool AuthManager::validateToken(const String& bearerToken) {
    if (!activeSession.active) return false;
    if (bearerToken.length() != 32) return false;

    // Verify token match in constant-time
    int diff = 0;
    for (size_t i = 0; i < 32; i++) {
        diff |= (bearerToken.charAt(i) ^ activeSession.token[i]);
    }
    if (diff != 0) return false;

    // Check expiration
    uint32_t now = esp_timer_get_time() / 1000000;
    if (now - activeSession.lastUsedUptime > TARA_SESSION_TIMEOUT_SEC) {
        activeSession.active = false;
        return false;
    }

    activeSession.lastUsedUptime = now;
    return true;
}

void AuthManager::invalidateSession(const String& bearerToken) {
    if (activeSession.active && bearerToken.equals(activeSession.token)) {
        activeSession.active = false;
        memset(&activeSession, 0, sizeof(activeSession));
    }
}

void AuthManager::invalidateAllSessions() {
    activeSession.active = false;
    memset(&activeSession, 0, sizeof(activeSession));
}

bool AuthManager::isLockedOut() const {
    if (failedAttempts < TARA_MAX_AUTH_FAILURES) return false;
    uint32_t elapsed = millis() - lockoutStartMs;
    return (elapsed < TARA_LOCKOUT_PERIOD_MS);
}

uint32_t AuthManager::getRemainingLockoutSeconds() const {
    if (!isLockedOut()) return 0;
    uint32_t elapsed = millis() - lockoutStartMs;
    if (elapsed >= TARA_LOCKOUT_PERIOD_MS) return 0;
    return (TARA_LOCKOUT_PERIOD_MS - elapsed) / 1000;
}

void AuthManager::recordFailedAttempt() {
    failedAttempts++;
    if (failedAttempts >= TARA_MAX_AUTH_FAILURES) {
        lockoutStartMs = millis();
    }
}

void AuthManager::recordSuccessfulAuth() {
    failedAttempts = 0;
    lockoutStartMs = 0;
}
