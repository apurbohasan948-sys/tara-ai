#ifndef TARA_ENDPOINTVALIDATOR_H
#define TARA_ENDPOINTVALIDATOR_H

#include <Arduino.h>

enum class ModelProviderType {
    OPENAI,
    GEMINI,
    DEEPSEEK,
    LOCAL_OLLAMA,
    CUSTOM
};

ModelProviderType parseProviderType(const String& providerStr);
const char* providerTypeToString(ModelProviderType provider);

struct EndpointValidationResult {
    bool valid;
    String sanitizedUrl;
    String host;
    uint16_t port;
    bool isHttps;
    String rejectionReason;
};

class EndpointValidator {
public:
    static EndpointValidationResult validate(ModelProviderType provider, const String& rawUrl, bool allowCustomConfirmed = false);

    // Specifically checks if a host is an internal/private/loopback address
    static bool isPrivateOrLoopbackHost(const String& host);

    // Checks if the protocol scheme is secure HTTPS
    static bool isHttpsScheme(const String& url);

private:
    static String extractHost(const String& url);
    static uint16_t extractPort(const String& url, bool isHttps);
};

#endif // TARA_ENDPOINTVALIDATOR_H
