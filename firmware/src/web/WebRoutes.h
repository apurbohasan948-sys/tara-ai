#ifndef TARA_WEBROUTES_H
#define TARA_WEBROUTES_H

#include <Arduino.h>
#include <WebServer.h>

class WebRoutes {
public:
    static void registerStaticRoutes(WebServer* server);
};

#endif // TARA_WEBROUTES_H
