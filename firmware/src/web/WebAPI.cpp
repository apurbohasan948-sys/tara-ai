#include "WebAPI.h"
#include "../core/TaraCore.h"
#include "../wifi/WiFiManager.h"
#include "../brain/Brain.h"
#include "../voice/VoiceManager.h"
#include "../personality/PersonalityManager.h"
#include "../emotion/EmotionManager.h"
#include "../memory/MemoryManager.h"
#include "../storage/StorageManager.h"

WebAPI::WebAPI(TaraCore* taraCore, WebServer* srv)
    : core(taraCore), server(srv) {}

void WebAPI::sendJson(int code, const String& json) {
    server->sendHeader("Access-Control-Allow-Origin", "*");
    server->sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server->sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server->send(code, "application/json", json);
}

String WebAPI::parseJsonField(const String& body, const char* field) {
    String search = "\"" + String(field) + "\":\"";
    int idx = body.indexOf(search);
    if (idx == -1) {
        search = "\"" + String(field) + "\":";
        idx = body.indexOf(search);
        if (idx == -1) return "";
        int start = idx + search.length();
        int end = body.indexOf(',', start);
        if (end == -1) end = body.indexOf('}', start);
        if (end == -1) return "";
        String val = body.substring(start, end);
        val.trim();
        val.replace("\"", "");
        return val;
    }
    int start = idx + search.length();
    int end = body.indexOf('"', start);
    if (end == -1) return "";
    return body.substring(start, end);
}

void WebAPI::registerRoutes() {
    server->on("/api/status", HTTP_GET, [this]() { handleGetStatus(); });
    server->on("/api/wifi", HTTP_GET, [this]() { handleGetWiFi(); });
    server->on("/api/wifi", HTTP_POST, [this]() { handlePostWiFi(); });
    server->on("/api/brain", HTTP_GET, [this]() { handleGetBrain(); });
    server->on("/api/brain", HTTP_POST, [this]() { handlePostBrain(); });
    server->on("/api/voice", HTTP_GET, [this]() { handleGetVoice(); });
    server->on("/api/voice", HTTP_POST, [this]() { handlePostVoice(); });
    server->on("/api/personality", HTTP_GET, [this]() { handleGetPersonality(); });
    server->on("/api/personality", HTTP_POST, [this]() { handlePostPersonality(); });
    server->on("/api/memory", HTTP_GET, [this]() { handleGetMemory(); });
    server->on("/api/hardware", HTTP_GET, [this]() { handleGetHardware(); });
    server->on("/api/restart", HTTP_POST, [this]() { handlePostRestart(); });
    server->on("/api/reset", HTTP_POST, [this]() { handlePostReset(); });
}

void WebAPI::handleGetStatus() {
    NetworkInfo net = core->getWiFi()->getNetworkInfo();
    String json = "{";
    json += "\"status\":\"ok\",";
    json += "\"state\":\"" + String(robotStateToString(core->getState())) + "\",";
    json += "\"emotion\":\"" + String(robotEmotionToString(core->getEmotion()->getEmotion())) + "\",";
    json += "\"wifi\":{";
    json += "\"state\":\"" + String(wifiStateToString(net.state)) + "\",";
    json += "\"ssid\":\"" + String(net.ssid) + "\",";
    json += "\"ip\":\"" + net.localIP.toString() + "\",";
    json += "\"rssi\":" + String(net.rssi) + ",";
    json += "\"internet\":" + String(net.hasInternet ? "true" : "false");
    json += "},";
    json += "\"system\":{";
    json += "\"firmware\":\"" + String(TARA_VERSION_STRING) + "\",";
    json += "\"uptime\":" + String(core->getUptimeSeconds()) + ",";
    json += "\"free_heap\":" + String(core->getFreeHeap());
    json += "}}";
    sendJson(200, json);
}

void WebAPI::handleGetWiFi() {
    NetworkInfo net = core->getWiFi()->getNetworkInfo();
    String json = "{";
    json += "\"state\":\"" + String(wifiStateToString(net.state)) + "\",";
    json += "\"ssid\":\"" + String(net.ssid) + "\",";
    json += "\"ip\":\"" + net.localIP.toString() + "\",";
    json += "\"mac\":\"" + String(net.macAddress) + "\",";
    json += "\"rssi\":" + String(net.rssi);
    json += "}";
    sendJson(200, json);
}

void WebAPI::handlePostWiFi() {
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}");
        return;
    }
    String body = server->arg("plain");
    String ssid = parseJsonField(body, "ssid");
    String pass = parseJsonField(body, "password");

    if (ssid.length() == 0) {
        sendJson(400, "{\"error\":\"SSID required\"}");
        return;
    }

    WiFiConfig cfg;
    memset(&cfg, 0, sizeof(WiFiConfig));
    strncpy(cfg.ssid, ssid.c_str(), sizeof(cfg.ssid) - 1);
    strncpy(cfg.password, pass.c_str(), sizeof(cfg.password) - 1);
    cfg.autoConnect = true;
    cfg.retryCount = 10;
    core->getStorage()->saveWiFiConfig(cfg);

    sendJson(200, "{\"status\":\"saved\",\"message\":\"Connecting to Wi-Fi...\"}");
    core->getWiFi()->connectSTA(cfg.ssid, cfg.password);
}

void WebAPI::handleGetBrain() {
    BrainConfig cfg = core->getBrain()->getConfig();
    String json = "{";
    json += "\"provider\":\"" + String(cfg.provider) + "\",";
    json += "\"endpoint\":\"" + String(cfg.endpoint) + "\",";
    json += "\"model\":\"" + String(cfg.model) + "\",";
    json += "\"hasKey\":" + String(strlen(cfg.apiKey) > 0 ? "true" : "false") + ",";
    json += "\"temperature\":" + String(cfg.temperature, 1) + ",";
    json += "\"maxTokens\":" + String(cfg.maxTokens) + ",";
    json += "\"streaming\":" + String(cfg.streaming ? "true" : "false") + ",";
    json += "\"enabled\":" + String(cfg.enabled ? "true" : "false");
    json += "}";
    sendJson(200, json);
}

void WebAPI::handlePostBrain() {
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}");
        return;
    }
    String body = server->arg("plain");
    BrainConfig cfg = core->getBrain()->getConfig();

    String prov = parseJsonField(body, "provider");
    String ep   = parseJsonField(body, "endpoint");
    String key  = parseJsonField(body, "apiKey");
    String mod  = parseJsonField(body, "model");

    if (prov.length() > 0) strncpy(cfg.provider, prov.c_str(), sizeof(cfg.provider) - 1);
    if (ep.length() > 0) strncpy(cfg.endpoint, ep.c_str(), sizeof(cfg.endpoint) - 1);
    if (key.length() > 0 && key != "********") strncpy(cfg.apiKey, key.c_str(), sizeof(cfg.apiKey) - 1);
    if (mod.length() > 0) strncpy(cfg.model, mod.c_str(), sizeof(cfg.model) - 1);

    core->getBrain()->updateConfig(cfg);
    sendJson(200, "{\"status\":\"updated\"}");
}

void WebAPI::handleGetVoice() {
    VoiceConfig cfg = core->getVoice()->getConfig();
    String json = "{";
    json += "\"volume\":" + String(cfg.volume) + ",";
    json += "\"language\":\"" + String(cfg.ttsLanguage) + "\",";
    json += "\"sampleRate\":" + String(cfg.sampleRate) + ",";
    json += "\"ttsEndpoint\":\"" + String(cfg.ttsEndpoint) + "\",";
    json += "\"micEnabled\":" + String(cfg.micEnabled ? "true" : "false") + ",";
    json += "\"speakerEnabled\":" + String(cfg.speakerEnabled ? "true" : "false");
    json += "}";
    sendJson(200, json);
}

void WebAPI::handlePostVoice() {
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}");
        return;
    }
    String body = server->arg("plain");
    VoiceConfig cfg = core->getVoice()->getConfig();

    String volStr = parseJsonField(body, "volume");
    String lang   = parseJsonField(body, "language");

    if (volStr.length() > 0) cfg.volume = volStr.toInt();
    if (lang.length() > 0) strncpy(cfg.ttsLanguage, lang.c_str(), sizeof(cfg.ttsLanguage) - 1);

    core->getVoice()->updateConfig(cfg);
    sendJson(200, "{\"status\":\"updated\"}");
}

void WebAPI::handleGetPersonality() {
    PersonalityConfig cfg = core->getPersonality()->getConfig();
    String json = "{";
    json += "\"name\":\"" + String(cfg.name) + "\",";
    json += "\"primaryTrait\":\"" + String(cfg.primaryTrait) + "\",";
    json += "\"speakingStyle\":\"" + String(cfg.speakingStyle) + "\",";
    json += "\"language\":\"" + String(cfg.language) + "\",";
    json += "\"energyLevel\":" + String(cfg.energyLevel);
    json += "}";
    sendJson(200, json);
}

void WebAPI::handlePostPersonality() {
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}");
        return;
    }
    String body = server->arg("plain");
    PersonalityConfig cfg = core->getPersonality()->getConfig();

    String name  = parseJsonField(body, "name");
    String trait = parseJsonField(body, "primaryTrait");
    String style = parseJsonField(body, "speakingStyle");

    if (name.length() > 0) strncpy(cfg.name, name.c_str(), sizeof(cfg.name) - 1);
    if (trait.length() > 0) strncpy(cfg.primaryTrait, trait.c_str(), sizeof(cfg.primaryTrait) - 1);
    if (style.length() > 0) strncpy(cfg.speakingStyle, style.c_str(), sizeof(cfg.speakingStyle) - 1);

    core->getPersonality()->updateConfig(cfg);
    sendJson(200, "{\"status\":\"updated\"}");
}

void WebAPI::handleGetMemory() {
    String owner = core->getMemory()->getPersistent()->getUserName();
    String json = "{";
    json += "\"ownerName\":\"" + owner + "\",";
    json += "\"conversationTurns\":" + String(core->getMemory()->getConversation()->getTurnCount());
    json += "}";
    sendJson(200, json);
}

void WebAPI::handleGetHardware() {
    String json = "{";
    json += "\"pins\":{";
    json += "\"oledSda\":" + String(TaraPins::OLED_SDA) + ",";
    json += "\"oledScl\":" + String(TaraPins::OLED_SCL) + ",";
    json += "\"i2sBclk\":" + String(TaraPins::I2S_BCLK) + ",";
    json += "\"i2sLrc\":" + String(TaraPins::I2S_LRC) + ",";
    json += "\"i2sDout\":" + String(TaraPins::I2S_DOUT) + ",";
    json += "\"i2sDin\":" + String(TaraPins::I2S_DIN) + ",";
    json += "\"statusLed\":" + String(TaraPins::LED_STATUS);
    json += "}}";
    sendJson(200, json);
}

void WebAPI::handlePostRestart() {
    sendJson(200, "{\"status\":\"restarting\"}");
    delay(500);
    ESP.restart();
}

void WebAPI::handlePostReset() {
    core->getStorage()->factoryReset();
    sendJson(200, "{\"status\":\"reset_complete\",\"message\":\"Restarting in AP mode...\"}");
    delay(500);
    ESP.restart();
}
