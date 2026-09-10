#ifndef TARA_WEBAPI_H
#define TARA_WEBAPI_H

#include <Arduino.h>
#include <WebServer.h>

class TaraCore;

class WebAPI {
public:
    WebAPI(TaraCore* core, WebServer* server);

    void registerRoutes();

    // GET Handlers
    void handleGetStatus();
    void handleGetWiFi();
    void handleGetBrain();
    void handleGetVoice();
    void handleGetPersonality();
    void handleGetMemory();
    void handleGetHardware();

    // POST Handlers
    void handlePostWiFi();
    void handlePostBrain();
    void handlePostVoice();
    void handlePostPersonality();
    void handlePostRestart();
    void handlePostReset();

private:
    TaraCore* core;
    WebServer* server;

    void sendJson(int code, const String& json);
    String parseJsonField(const String& body, const char* field);
};

#endif // TARA_WEBAPI_H
