#ifndef TARA_WEBAPI_H
#define TARA_WEBAPI_H

#include <Arduino.h>
#include <WebServer.h>

class TaraCore;

class WebAPI {
public:
    WebAPI(TaraCore* core, WebServer* server);

    void registerRoutes();

    // Authentication Handlers
    void handlePostLogin();
    void handlePostLogout();
    void handleGetAuthStatus();
    void handlePostSetPassword();
    void handleGetSecurityLogs();

    // Public / Non-Sensitive Handlers
    void handleGetStatus();

    // Protected GET Handlers
    void handleGetWiFi();
    void handleGetBrain();
    void handleGetVoice();
    void handleGetPersonality();
    void handleGetMemory();
    void handleGetHardware();
    void handleGetConfig();

    // Protected POST Handlers
    void handlePostWiFi();
    void handlePostBrain();
    void handlePostVoice();
    void handlePostPersonality();
    void handlePostMemory();
    void handlePostRestart();
    void handlePostReset();
    void handlePostOTA();

    // Method Not Allowed Handlers for GET on destructive endpoints
    void handleMethodNotAllowed();

private:
    TaraCore* core;
    WebServer* server;

    // Security Verification
    bool checkAuthentication();
    String extractBearerToken();
    String getClientIP();

    // Secure Response Helpers (No wildcard CORS on sensitive routes)
    void sendJson(int code, const String& json, bool isSensitive = true);
    void sendUnauthorized(const String& message = "Unauthorized. Please authenticate.");
    
    // JSON & Input Sanitization
    String parseJsonField(const String& body, const char* field);
    bool parseJsonBool(const String& body, const char* field, bool defaultValue = false);
    bool validatePayloadLength(const String& body, size_t maxLen);
};

#endif // TARA_WEBAPI_H
