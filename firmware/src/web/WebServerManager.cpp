#include "WebServerManager.h"
#include "../core/TaraCore.h"

WebServerManager::WebServerManager(TaraCore* taraCore, uint16_t port)
    : core(taraCore),
      server(nullptr),
      api(nullptr),
      running(false) {
    server = new WebServer(port);
    api = new WebAPI(taraCore, server);
}

WebServerManager::~WebServerManager() {
    stop();
    if (api) delete api;
    if (server) delete server;
}

bool WebServerManager::begin() {
    if (!server) return false;

    // Register API and web routes
    WebRoutes::registerStaticRoutes(server);
    api->registerRoutes();

    server->begin();
    running = true;
    Serial.println("[WebServerManager] HTTP server listening on port 80.");
    return true;
}

void WebServerManager::update() {
    if (running && server) {
        server->handleClient();
    }
}

void WebServerManager::stop() {
    if (running && server) {
        server->stop();
        running = false;
        Serial.println("[WebServerManager] HTTP server stopped.");
    }
}
