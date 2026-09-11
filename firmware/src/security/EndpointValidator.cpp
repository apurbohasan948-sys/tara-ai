#include "EndpointValidator.h"

ModelProviderType parseProviderType(const String& providerStr) {
    String p = providerStr;
    p.toLowerCase();
    if (p == "openai") return ModelProviderType::OPENAI;
    if (p == "gemini") return ModelProviderType::GEMINI;
    if (p == "deepseek") return ModelProviderType::DEEPSEEK;
    if (p == "local" || p == "ollama" || p == "local_ollama") return ModelProviderType::LOCAL_OLLAMA;
    return ModelProviderType::CUSTOM;
}

const char* providerTypeToString(ModelProviderType provider) {
    switch (provider) {
        case ModelProviderType::OPENAI:       return "OpenAI";
        case ModelProviderType::GEMINI:       return "Gemini";
        case ModelProviderType::DEEPSEEK:     return "DeepSeek";
        case ModelProviderType::LOCAL_OLLAMA: return "LocalOllama";
        case ModelProviderType::CUSTOM:       return "Custom";
        default:                              return "Unknown";
    }
}

bool EndpointValidator::isHttpsScheme(const String& url) {
    return url.startsWith("https://") || url.startsWith("HTTPS://");
}

String EndpointValidator::extractHost(const String& url) {
    int protoEnd = url.indexOf("://");
    if (protoEnd == -1) return "";
    int hostStart = protoEnd + 3;
    int hostEnd = url.indexOf('/', hostStart);
    if (hostEnd == -1) hostEnd = url.length();

    String hostPort = url.substring(hostStart, hostEnd);
    int colonIdx = hostPort.indexOf(':');
    if (colonIdx != -1) {
        return hostPort.substring(0, colonIdx);
    }
    return hostPort;
}

uint16_t EndpointValidator::extractPort(const String& url, bool isHttps) {
    int protoEnd = url.indexOf("://");
    if (protoEnd == -1) return isHttps ? 443 : 80;
    int hostStart = protoEnd + 3;
    int hostEnd = url.indexOf('/', hostStart);
    if (hostEnd == -1) hostEnd = url.length();

    String hostPort = url.substring(hostStart, hostEnd);
    int colonIdx = hostPort.indexOf(':');
    if (colonIdx != -1) {
        int p = hostPort.substring(colonIdx + 1).toInt();
        if (p > 0 && p <= 65535) return (uint16_t)p;
    }
    return isHttps ? 443 : 80;
}

bool EndpointValidator::isPrivateOrLoopbackHost(const String& host) {
    String h = host;
    h.toLowerCase();

    // Loopback checks
    if (h == "localhost" || h == "127.0.0.1" || h == "::1" || h.startsWith("127.")) {
        return true;
    }

    // RFC1918 Private IPv4 checks
    if (h.startsWith("10.")) return true;
    if (h.startsWith("192.168.")) return true;
    if (h.startsWith("172.")) {
        int secondDot = h.indexOf('.', 4);
        if (secondDot != -1) {
            int secondOctet = h.substring(4, secondDot).toInt();
            if (secondOctet >= 16 && secondOctet <= 31) return true;
        }
    }

    // Link-local & cloud metadata IPs
    if (h.startsWith("169.254.")) return true;

    // Reject .local or .internal domains for cloud requests
    if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".lan")) {
        return true;
    }

    return false;
}

EndpointValidationResult EndpointValidator::validate(ModelProviderType provider, const String& rawUrl, bool allowCustomConfirmed) {
    EndpointValidationResult result;
    result.valid = false;
    result.isHttps = false;
    result.port = 443;

    String url = rawUrl;
    url.trim();

    // 1. Length check
    if (url.length() < 8 || url.length() > 256) {
        result.rejectionReason = "URL length must be between 8 and 256 characters.";
        return result;
    }

    // 2. Reject dangerous schemes
    if (url.indexOf("://") == -1) {
        result.rejectionReason = "Missing protocol scheme (e.g. https://).";
        return result;
    }

    String scheme = url.substring(0, url.indexOf("://"));
    scheme.toLowerCase();
    if (scheme != "https" && scheme != "http") {
        result.rejectionReason = "Dangerous or unsupported protocol scheme: " + scheme;
        return result;
    }

    result.isHttps = (scheme == "https");
    result.host = extractHost(url);
    result.port = extractPort(url, result.isHttps);

    if (result.host.length() == 0) {
        result.rejectionReason = "Malformed URL host.";
        return result;
    }

    // 3. Provider-specific domain restrictions
    switch (provider) {
        case ModelProviderType::OPENAI:
            if (!result.isHttps) {
                result.rejectionReason = "OpenAI API requires HTTPS.";
                return result;
            }
            if (result.host != "api.openai.com") {
                result.rejectionReason = "OpenAI endpoint host must be strictly api.openai.com. Received: " + result.host;
                return result;
            }
            break;

        case ModelProviderType::GEMINI:
            if (!result.isHttps) {
                result.rejectionReason = "Gemini API requires HTTPS.";
                return result;
            }
            if (result.host != "generativelanguage.googleapis.com") {
                result.rejectionReason = "Gemini endpoint host must be strictly generativelanguage.googleapis.com. Received: " + result.host;
                return result;
            }
            break;

        case ModelProviderType::DEEPSEEK:
            if (!result.isHttps) {
                result.rejectionReason = "DeepSeek API requires HTTPS.";
                return result;
            }
            if (result.host != "api.deepseek.com") {
                result.rejectionReason = "DeepSeek endpoint host must be strictly api.deepseek.com. Received: " + result.host;
                return result;
            }
            break;

        case ModelProviderType::LOCAL_OLLAMA:
            // Local Ollama runs on private LAN (e.g. 192.168.1.x:11434)
            // HTTP is permitted because local home servers rarely have public CA certs
            // Never send cloud API keys to local Ollama
            break;

        case ModelProviderType::CUSTOM:
            // Custom provider requires user confirmation
            if (!allowCustomConfirmed) {
                result.rejectionReason = "Custom endpoint requires explicit allowCustom confirmation.";
                return result;
            }
            // Strict HTTPS mandatory for custom cloud APIs
            if (!result.isHttps) {
                result.rejectionReason = "Custom cloud provider endpoint MUST use HTTPS. Plaintext HTTP rejected.";
                return result;
            }
            // Cannot use internal / loopback / private IP as a custom "cloud" API to prevent SSRF
            if (isPrivateOrLoopbackHost(result.host)) {
                result.rejectionReason = "Custom cloud provider cannot point to private or loopback IP (SSRF protection).";
                return result;
            }
            break;
    }

    result.valid = true;
    result.sanitizedUrl = url;
    return result;
}
