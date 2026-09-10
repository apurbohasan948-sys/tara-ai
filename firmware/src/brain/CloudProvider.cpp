#include "CloudProvider.h"
#include <WiFi.h>

CloudProvider::CloudProvider() : secureClient(nullptr) {}

CloudProvider::~CloudProvider() {
    if (secureClient) {
        delete secureClient;
        secureClient = nullptr;
    }
}

bool CloudProvider::begin(const BrainConfig& cfg) {
    config = cfg;
    if (secureClient) {
        delete secureClient;
    }
    secureClient = new WiFiClientSecure();
    secureClient->setInsecure(); // Allows custom cloud proxy / dev SSL without CA bundle RAM hit on standard ESP32
    secureClient->setTimeout(config.timeoutMs > 0 ? (config.timeoutMs / 1000) : 8);
    return true;
}

String CloudProvider::extractMessageContent(const String& json) {
    // Lightweight streaming extractor without importing heavy ArduinoJson that consumes 20KB heap
    int contentIdx = json.indexOf("\"content\":");
    if (contentIdx == -1) {
        contentIdx = json.indexOf("\"text\":");
    }
    if (contentIdx == -1) return "";

    int startQuote = json.indexOf('"', contentIdx + 9);
    if (startQuote == -1) return "";

    int endQuote = startQuote + 1;
    bool escaped = false;
    while (endQuote < json.length()) {
        char c = json.charAt(endQuote);
        if (c == '\\') {
            escaped = !escaped;
        } else if (c == '"' && !escaped) {
            break;
        } else {
            escaped = false;
        }
        endQuote++;
    }

    String extracted = json.substring(startQuote + 1, endQuote);
    extracted.replace("\\n", "\n");
    extracted.replace("\\\"", "\"");
    return extracted;
}

BrainResponse CloudProvider::generateResponse(const char* prompt, const char* systemPrompt) {
    BrainResponse resp;
    resp.success = false;
    resp.latencyMs = 0;
    resp.httpCode = 0;

    if (!WiFi.isConnected()) {
        resp.errorMessage = "Wi-Fi not connected";
        return resp;
    }

    if (!config.enabled) {
        resp.errorMessage = "Brain is disabled in settings";
        return resp;
    }

    uint32_t startMs = millis();
    HTTPClient http;
    http.setTimeout(config.timeoutMs > 0 ? config.timeoutMs : 8000);

    bool isHttps = String(config.endpoint).startsWith("https://");
    if (isHttps && secureClient) {
        http.begin(*secureClient, config.endpoint);
    } else {
        http.begin(config.endpoint);
    }

    http.addHeader("Content-Type", "application/json");
    if (strlen(config.apiKey) > 0) {
        String auth = "Bearer " + String(config.apiKey);
        http.addHeader("Authorization", auth);
    }

    // Build compact JSON payload
    String payload = "{";
    payload += "\"model\":\"" + String(config.model) + "\",";
    payload += "\"temperature\":" + String(config.temperature, 1) + ",";
    payload += "\"max_tokens\":" + String(config.maxTokens) + ",";
    payload += "\"messages\":[";
    if (systemPrompt && strlen(systemPrompt) > 0) {
        payload += "{\"role\":\"system\",\"content\":\"" + String(systemPrompt) + "\"},";
    }
    payload += "{\"role\":\"user\",\"content\":\"" + String(prompt) + "\"}";
    payload += "]}";

    int httpCode = http.POST(payload);
    resp.httpCode = httpCode;
    resp.latencyMs = millis() - startMs;

    if (httpCode == 200) {
        String responseBody = http.getString();
        String parsed = extractMessageContent(responseBody);
        if (parsed.length() > 0) {
            resp.success = true;
            resp.text = parsed;
        } else {
            resp.success = true;
            resp.text = responseBody; // fallback
        }
    } else {
        resp.errorMessage = http.errorToString(httpCode);
        Serial.printf("[CloudProvider] HTTP error %d: %s\n", httpCode, resp.errorMessage.c_str());
    }

    http.end();
    return resp;
}
