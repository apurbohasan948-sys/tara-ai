#include "WebRoutes.h"
#include "WebUIAssets.h"

void WebRoutes::registerStaticRoutes(WebServer* server) {
    server->on("/", HTTP_GET, [server]() {
        server->send_P(200, "text/html", TARA_INDEX_HTML);
    });

    server->onNotFound([server]() {
        // Captive portal redirect or SPA fallback
        server->sendHeader("Location", "/");
        server->send(302, "text/plain", "");
    });
}
