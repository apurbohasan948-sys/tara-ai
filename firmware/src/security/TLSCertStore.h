#ifndef TARA_TLSCERTSTORE_H
#define TARA_TLSCERTSTORE_H

#include <Arduino.h>
#include <WiFiClientSecure.h>

class TLSCertStore {
public:
    static void init();

    // Applies proper TLS certificate trust to WiFiClientSecure
    static bool applyTrust(WiFiClientSecure* client, const char* host);

    // Development-only insecure mode guard
    static bool isDevInsecureModeEnabled();
    static void setDevInsecureMode(bool enable);

private:
    static bool devInsecureMode;

    // Standard Root CA Certificates used by OpenAI, Google, DeepSeek, and modern HTTPS APIs
    // ISRG Root X1 (Let's Encrypt / OpenAI / DeepSeek / Custom proxies)
    static const char* ISRG_ROOT_X1_CA;

    // GTS Root R1 (Google Trust Services / Gemini)
    static const char* GTS_ROOT_R1_CA;
};

#endif // TARA_TLSCERTSTORE_H
