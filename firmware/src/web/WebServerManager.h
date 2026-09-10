#ifndef TARA_WEBSERVERMANAGER_H
#define TARA_WEBSERVERMANAGER_H

#include <Arduino.h>
#include <WebServer.h>
#include "WebAPI.h"
#include "WebRoutes.h"

class TaraCore;

class WebServerManager {
public:
    WebServerManager(TaraCore* core, uint16_t port = 80);
    ~WebServerManager();

    bool begin();
    void update();
    void stop();

    WebServer* getServer() { return server; }
    WebAPI* getAPI() { return api; }

private:
    TaraCore* core;
    WebServer* server;
    WebAPI* api;
    bool running;
};

#endif // TARA_WEBSERVERMANAGER_H
