#include "WebAPI.h"
#include "../core/TaraCore.h"
#include "../wifi/WiFiManager.h"
#include "../brain/Brain.h"
#include "../voice/VoiceManager.h"
#include "../personality/PersonalityManager.h"
#include "../emotion/EmotionManager.h"
#include "../memory/MemoryManager.h"
#include "../storage/StorageManager.h"
#include "../ota/OTAManager.h"
#include "../security/AuthManager.h"
#include "../security/SecurityLogger.h"
#include "../security/EndpointValidator.h"

WebAPI::WebAPI(TaraCore* taraCore, WebServer* srv)
    : core(taraCore), server(srv) {}

String WebAPI::getClientIP() {
    return server->client().remoteIP().toString();
}

void WebAPI::sendJson(int code, const String& json, bool isSensitive) {
    if (isSensitive) {
        // Strict CORS: Do NOT output wildcard Access-Control-Allow-Origin: * for sensitive APIs
        String origin = server->header("Origin");
        if (origin.length() > 0 && (origin.indexOf("192.168.") != -1 || origin.indexOf("10.") != -1 || origin.indexOf("localhost") != -1)) {
            server->sendHeader("Access-Control-Allow-Origin", origin);
            server->sendHeader("Access-Control-Allow-Credentials", "true");
        }
    } else {
        // Public status query may allow standard cross-origin reading
        server->sendHeader("Access-Control-Allow-Origin", "*");
    }
    server->sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server->sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    server->send(code, "application/json", json);
}

void WebAPI::sendUnauthorized(const String& message) {
    sendJson(401, "{\"error\":\"" + message + "\",\"authenticated\":false}", true);
}

String WebAPI::extractBearerToken() {
    String authHeader = server->header("Authorization");
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
        return authHeader.substring(7);
    }
    // Also support token passed as URL query param in emergency fallback (e.g. ?token=xxx)
    if (server->hasArg("token")) {
        return server->arg("token");
    }
    return "";
}

bool WebAPI::checkAuthentication() {
    AuthManager* auth = core->getAuth();
    if (!auth) return false;

    String token = extractBearerToken();
    if (token.length() == 0) {
        core->getSecurityLogger()->logEvent(SecurityEventType::INVALID_TOKEN, getClientIP(), "Missing Authorization token");
        sendUnauthorized("Missing Authorization: Bearer <token>");
        return false;
    }

    if (!auth->validateToken(token)) {
        core->getSecurityLogger()->logEvent(SecurityEventType::INVALID_TOKEN, getClientIP(), "Invalid or expired session token");
        sendUnauthorized("Invalid or expired session token. Please re-authenticate.");
        return false;
    }

    return true;
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

bool WebAPI::parseJsonBool(const String& body, const char* field, bool defaultValue) {
    String val = parseJsonField(body, field);
    val.toLowerCase();
    if (val == "true" || val == "1") return true;
    if (val == "false" || val == "0") return false;
    return defaultValue;
}

bool WebAPI::validatePayloadLength(const String& body, size_t maxLen) {
    if (body.length() > maxLen) {
        sendJson(413, "{\"error\":\"Payload exceeds maximum allowed size\"}", true);
        return false;
    }
    return true;
}

void WebAPI::handleMethodNotAllowed() {
    sendJson(405, "{\"error\":\"HTTP Method Not Allowed. Destructive actions require POST.\"}", true);
}

void WebAPI::registerRoutes() {
    // Collect Authorization and Origin headers
    const char* headerKeys[] = {"Authorization", "Origin", "Content-Type"};
    server->collectHeaders(headerKeys, 3);

    // OPTIONS pre-flight handler
    auto handleOptions = [this]() {
        server->sendHeader("Access-Control-Allow-Origin", "*");
        server->sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        server->sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        server->send(204);
    };

    // Public / Authentication endpoints
    server->on("/api/status", HTTP_GET, [this]() { handleGetStatus(); });
    server->on("/api/status", HTTP_OPTIONS, handleOptions);

    server->on("/api/auth/login", HTTP_POST, [this]() { handlePostLogin(); });
    server->on("/api/auth/login", HTTP_OPTIONS, handleOptions);
    server->on("/api/auth/logout", HTTP_POST, [this]() { handlePostLogout(); });
    server->on("/api/auth/logout", HTTP_OPTIONS, handleOptions);
    server->on("/api/auth/status", HTTP_GET, [this]() { handleGetAuthStatus(); });
    server->on("/api/auth/status", HTTP_OPTIONS, handleOptions);
    server->on("/api/auth/password", HTTP_POST, [this]() { handlePostSetPassword(); });

    // Protected GET Handlers
    server->on("/api/wifi", HTTP_GET, [this]() { handleGetWiFi(); });
    server->on("/api/wifi", HTTP_POST, [this]() { handlePostWiFi(); });
    server->on("/api/wifi", HTTP_OPTIONS, handleOptions);

    server->on("/api/brain", HTTP_GET, [this]() { handleGetBrain(); });
    server->on("/api/brain", HTTP_POST, [this]() { handlePostBrain(); });
    server->on("/api/brain", HTTP_OPTIONS, handleOptions);

    server->on("/api/voice", HTTP_GET, [this]() { handleGetVoice(); });
    server->on("/api/voice", HTTP_POST, [this]() { handlePostVoice(); });
    server->on("/api/voice", HTTP_OPTIONS, handleOptions);

    server->on("/api/voice/listen", HTTP_POST, [this]() { handlePostListen(); });
    server->on("/api/voice/listen", HTTP_OPTIONS, handleOptions);

    server->on("/api/audio/diagnostics", HTTP_GET, [this]() { handleGetAudioDiagnostics(); });
    server->on("/api/audio/diagnostics", HTTP_OPTIONS, handleOptions);

    server->on("/api/hardware/test/microphone", HTTP_POST, [this]() { handlePostTestMicrophone(); });
    server->on("/api/hardware/test/microphone", HTTP_OPTIONS, handleOptions);

    server->on("/api/hardware/test/speaker", HTTP_POST, [this]() { handlePostTestSpeaker(); });
    server->on("/api/hardware/test/speaker", HTTP_OPTIONS, handleOptions);

    server->on("/api/hardware/test/tts", HTTP_POST, [this]() { handlePostTestTTS(); });
    server->on("/api/hardware/test/tts", HTTP_OPTIONS, handleOptions);

    server->on("/api/hardware/test/stt", HTTP_POST, [this]() { handlePostTestSTT(); });
    server->on("/api/hardware/test/stt", HTTP_OPTIONS, handleOptions);

    server->on("/api/personality", HTTP_GET, [this]() { handleGetPersonality(); });
    server->on("/api/personality", HTTP_POST, [this]() { handlePostPersonality(); });
    server->on("/api/personality", HTTP_OPTIONS, handleOptions);

    server->on("/api/memory", HTTP_GET, [this]() { handleGetMemory(); });
    server->on("/api/memory", HTTP_POST, [this]() { handlePostMemory(); });
    server->on("/api/memory", HTTP_OPTIONS, handleOptions);

    server->on("/api/hardware", HTTP_GET, [this]() { handleGetHardware(); });
    server->on("/api/hardware", HTTP_OPTIONS, handleOptions);

    server->on("/api/security/logs", HTTP_GET, [this]() { handleGetSecurityLogs(); });
    server->on("/api/security/logs", HTTP_OPTIONS, handleOptions);

    // Guard destructive endpoints: strictly reject GET with 405 Method Not Allowed
    server->on("/api/restart", HTTP_GET, [this]() { handleMethodNotAllowed(); });
    server->on("/api/restart", HTTP_POST, [this]() { handlePostRestart(); });
    server->on("/api/restart", HTTP_OPTIONS, handleOptions);

    server->on("/api/reset", HTTP_GET, [this]() { handleMethodNotAllowed(); });
    server->on("/api/reset", HTTP_POST, [this]() { handlePostReset(); });
    server->on("/api/reset", HTTP_OPTIONS, handleOptions);

    server->on("/api/ota", HTTP_GET, [this]() { handleMethodNotAllowed(); });
    server->on("/api/ota", HTTP_POST, [this]() { handlePostOTA(); });
    server->on("/api/ota", HTTP_OPTIONS, handleOptions);
}

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

void WebAPI::handlePostLogin() {
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing login credentials\"}", true);
        return;
    }

    String body = server->arg("plain");
    if (!validatePayloadLength(body, 256)) return;

    String password = parseJsonField(body, "password");
    AuthManager* auth = core->getAuth();
    String clientIP = getClientIP();

    if (auth->isLockedOut()) {
        uint32_t secs = auth->getRemainingLockoutSeconds();
        core->getSecurityLogger()->logEvent(SecurityEventType::AUTH_FAILURE, clientIP, "Brute force lockout active");
        sendJson(429, "{\"error\":\"Too many failed attempts. Locked out for " + String(secs) + " seconds.\",\"lockedOut\":true}", true);
        return;
    }

    if (auth->verifyPassword(password)) {
        String token = auth->createSession();
        core->getSecurityLogger()->logEvent(SecurityEventType::AUTH_SUCCESS, clientIP, "Login successful");

        String resp = "{";
        resp += "\"status\":\"ok\",";
        resp += "\"token\":\"" + token + "\",";
        resp += "\"expiresIn\":" + String(TARA_SESSION_TIMEOUT_SEC) + ",";
        resp += "\"isFirstBoot\":" + String(!auth->isPasswordSet() ? "true" : "false");
        resp += "}";
        sendJson(200, resp, true);
    } else {
        core->getSecurityLogger()->logEvent(SecurityEventType::AUTH_FAILURE, clientIP, "Incorrect password attempt");
        sendJson(401, "{\"error\":\"Invalid password\",\"status\":\"failed\"}", true);
    }
}

void WebAPI::handlePostLogout() {
    String token = extractBearerToken();
    if (token.length() > 0) {
        core->getAuth()->invalidateSession(token);
    }
    sendJson(200, "{\"status\":\"ok\",\"message\":\"Logged out successfully\"}", true);
}

void WebAPI::handleGetAuthStatus() {
    String token = extractBearerToken();
    bool isValid = (token.length() > 0) && core->getAuth()->validateToken(token);
    bool passwordSet = core->getAuth()->isPasswordSet();

    String resp = "{";
    resp += "\"authenticated\":" + String(isValid ? "true" : "false") + ",";
    resp += "\"passwordConfigured\":" + String(passwordSet ? "true" : "false");
    resp += "}";
    sendJson(200, resp, false);
}

void WebAPI::handlePostSetPassword() {
    if (!checkAuthentication()) return;

    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}", true);
        return;
    }

    String body = server->arg("plain");
    String newPassword = parseJsonField(body, "newPassword");
    if (newPassword.length() < 6 || newPassword.length() > 64) {
        sendJson(400, "{\"error\":\"New password must be between 6 and 64 characters\"}", true);
        return;
    }

    if (core->getAuth()->setDevicePassword(newPassword)) {
        core->getSecurityLogger()->logEvent(SecurityEventType::CONFIG_CHANGED, getClientIP(), "Device password updated");
        // Issue fresh session token after password change
        String newToken = core->getAuth()->createSession();
        sendJson(200, "{\"status\":\"ok\",\"token\":\"" + newToken + "\"}", true);
    } else {
        sendJson(500, "{\"error\":\"Failed to persist new password\"}", true);
    }
}

void WebAPI::handleGetSecurityLogs() {
    if (!checkAuthentication()) return;
    String logsJson = core->getSecurityLogger()->toJson();
    sendJson(200, logsJson, true);
}

// -----------------------------------------------------------------------------
// Core Endpoints
// -----------------------------------------------------------------------------

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
    json += "\"free_heap\":" + String(core->getFreeHeap()) + ",";
    json += "\"total_heap\":327680,";
    json += "\"cpu_mhz\":240";
    json += "}}";
    sendJson(200, json, false); // Public general status
}

void WebAPI::handleGetWiFi() {
    if (!checkAuthentication()) return;

    NetworkInfo net = core->getWiFi()->getNetworkInfo();
    String json = "{";
    json += "\"state\":\"" + String(wifiStateToString(net.state)) + "\",";
    json += "\"ssid\":\"" + String(net.ssid) + "\",";
    json += "\"ip\":\"" + net.localIP.toString() + "\",";
    json += "\"mac\":\"" + String(net.macAddress) + "\",";
    json += "\"rssi\":" + String(net.rssi) + ",";
    json += "\"internet\":" + String(net.hasInternet ? "true" : "false");
    json += "}";
    sendJson(200, json, true);
}

void WebAPI::handlePostWiFi() {
    if (!checkAuthentication()) return;

    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}", true);
        return;
    }
    String body = server->arg("plain");
    if (!validatePayloadLength(body, 512)) return;

    String ssid = parseJsonField(body, "ssid");
    String pass = parseJsonField(body, "password");

    if (ssid.length() == 0 || ssid.length() > 32 || pass.length() > 64) {
        sendJson(400, "{\"error\":\"Invalid SSID or password length\"}", true);
        return;
    }

    core->getSecurityLogger()->logEvent(SecurityEventType::CONFIG_CHANGED, getClientIP(), "Wi-Fi credentials updated");
    bool ok = core->getWiFi()->connectSTA(ssid.c_str(), pass.c_str());
    if (ok) {
        sendJson(200, "{\"status\":\"connecting\",\"ssid\":\"" + ssid + "\"}", true);
    } else {
        sendJson(400, "{\"error\":\"Failed to initiate Wi-Fi connection\"}", true);
    }
}

void WebAPI::handleGetBrain() {
    if (!checkAuthentication()) return;

    BrainConfig cfg = core->getBrain()->getConfig();
    String json = "{";
    json += "\"enabled\":" + String(cfg.enabled ? "true" : "false") + ",";
    json += "\"provider\":\"" + String(cfg.provider) + "\",";
    json += "\"model\":\"" + String(cfg.model) + "\",";
    json += "\"endpoint\":\"" + String(cfg.endpoint) + "\",";
    json += "\"system_prompt\":\"" + String(cfg.systemPrompt) + "\",";
    json += "\"temperature\":" + String(cfg.temperature, 2) + ",";
    json += "\"max_tokens\":" + String(cfg.maxTokens) + ",";
    // CRITICAL SECURITY FIX: Never return the real API key to the browser!
    json += "\"hasKey\":" + String((strlen(cfg.apiKey) > 0) ? "true" : "false");
    json += "}";
    sendJson(200, json, true);
}

void WebAPI::handlePostBrain() {
    if (!checkAuthentication()) return;

    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}", true);
        return;
    }
    String body = server->arg("plain");
    if (!validatePayloadLength(body, 2048)) return;

    String provider = parseJsonField(body, "provider");
    String endpoint = parseJsonField(body, "endpoint");
    String apiKey   = parseJsonField(body, "apiKey");
    String model    = parseJsonField(body, "model");
    String tempStr  = parseJsonField(body, "temperature");
    String maxTok   = parseJsonField(body, "max_tokens");
    bool allowCustom = parseJsonBool(body, "allowCustom", false);

    // Validate provider & endpoint
    ModelProviderType provType = parseProviderType(provider);
    EndpointValidationResult val = EndpointValidator::validate(provType, endpoint, allowCustom);
    if (!val.valid) {
        core->getSecurityLogger()->logEvent(SecurityEventType::INVALID_ENDPOINT, getClientIP(), val.rejectionReason);
        sendJson(400, "{\"error\":\"" + val.rejectionReason + "\"}", true);
        return;
    }

    BrainConfig cfg = core->getBrain()->getConfig();
    cfg.enabled = parseJsonBool(body, "enabled", cfg.enabled);
    if (provider.length() > 0 && provider.length() < 32) strncpy(cfg.provider, provider.c_str(), sizeof(cfg.provider) - 1);
    if (val.sanitizedUrl.length() > 0 && val.sanitizedUrl.length() < 256) strncpy(cfg.endpoint, val.sanitizedUrl.c_str(), sizeof(cfg.endpoint) - 1);
    if (model.length() > 0 && model.length() < 64) strncpy(cfg.model, model.c_str(), sizeof(cfg.model) - 1);
    
    // Only update API key if a non-empty, non-masked key is provided
    if (apiKey.length() > 0 && apiKey.indexOf("****") == -1) {
        if (apiKey.length() < 128) {
            strncpy(cfg.apiKey, apiKey.c_str(), sizeof(cfg.apiKey) - 1);
        }
    }

    if (tempStr.length() > 0) cfg.temperature = tempStr.toFloat();
    if (maxTok.length() > 0) cfg.maxTokens = maxTok.toInt();

    core->getBrain()->begin(cfg);
    core->getSecurityLogger()->logEvent(SecurityEventType::CONFIG_CHANGED, getClientIP(), "Brain configuration updated");
    sendJson(200, "{\"status\":\"ok\",\"provider\":\"" + String(cfg.provider) + "\",\"hasKey\":" + String(strlen(cfg.apiKey) > 0 ? "true" : "false") + "}", true);
}

void WebAPI::handleGetVoice() {
    if (!checkAuthentication()) return;
    VoiceConfig cfg = core->getVoice()->getConfig();
    String json = "{";
    json += "\"tts_endpoint\":\"" + String(cfg.ttsEndpoint) + "\",";
    json += "\"tts_language\":\"" + String(cfg.ttsLanguage) + "\",";
    json += "\"stt_endpoint\":\"" + String(cfg.sttEndpoint) + "\",";
    json += "\"stt_language\":\"" + String(cfg.sttLanguage) + "\",";
    json += "\"volume\":" + String(cfg.volume) + ",";
    json += "\"sample_rate\":" + String(cfg.sampleRate) + ",";
    json += "\"mic_enabled\":" + String(cfg.micEnabled ? "true" : "false") + ",";
    json += "\"speaker_enabled\":" + String(cfg.speakerEnabled ? "true" : "false") + ",";
    json += "\"vad_threshold\":" + String(cfg.vadThreshold) + ",";
    json += "\"silence_timeout_ms\":" + String(cfg.silenceTimeoutMs) + ",";
    json += "\"max_recording_ms\":" + String(cfg.maxRecordingMs);
    json += "}";
    sendJson(200, json, true);
}

void WebAPI::handlePostVoice() {
    if (!checkAuthentication()) return;
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}", true);
        return;
    }
    String body = server->arg("plain");
    if (!validatePayloadLength(body, 1024)) return;

    VoiceConfig cfg = core->getVoice()->getConfig();
    String ttsEp = parseJsonField(body, "tts_endpoint");
    String ttsLang = parseJsonField(body, "tts_language");
    String sttEp = parseJsonField(body, "stt_endpoint");
    String sttLang = parseJsonField(body, "stt_language");
    String vol = parseJsonField(body, "volume");
    String vadTh = parseJsonField(body, "vad_threshold");
    String silTo = parseJsonField(body, "silence_timeout_ms");
    String maxRec = parseJsonField(body, "max_recording_ms");

    if (ttsEp.length() > 0) {
        EndpointValidationResult val = EndpointValidator::validate(ModelProviderType::CUSTOM, ttsEp, true);
        if (!val.valid) {
            sendJson(400, "{\"error\":\"Invalid TTS endpoint: " + val.rejectionReason + "\"}", true);
            return;
        }
        strncpy(cfg.ttsEndpoint, val.sanitizedUrl.c_str(), sizeof(cfg.ttsEndpoint) - 1);
    }

    if (sttEp.length() > 0) {
        EndpointValidationResult val = EndpointValidator::validate(ModelProviderType::CUSTOM, sttEp, true);
        if (!val.valid) {
            sendJson(400, "{\"error\":\"Invalid STT endpoint: " + val.rejectionReason + "\"}", true);
            return;
        }
        strncpy(cfg.sttEndpoint, val.sanitizedUrl.c_str(), sizeof(cfg.sttEndpoint) - 1);
    }

    if (ttsLang.length() > 0 && ttsLang.length() < 8) {
        strncpy(cfg.ttsLanguage, ttsLang.c_str(), sizeof(cfg.ttsLanguage) - 1);
    }

    if (sttLang.length() > 0 && sttLang.length() < 12) {
        strncpy(cfg.sttLanguage, sttLang.c_str(), sizeof(cfg.sttLanguage) - 1);
    }

    if (vol.length() > 0) {
        int v = vol.toInt();
        if (v >= 0 && v <= 100) cfg.volume = v;
    }

    if (vadTh.length() > 0) {
        int th = vadTh.toInt();
        if (th >= 100 && th <= 10000) cfg.vadThreshold = th;
    }

    if (silTo.length() > 0) {
        int st = silTo.toInt();
        if (st >= 300 && st <= 5000) cfg.silenceTimeoutMs = st;
    }

    if (maxRec.length() > 0) {
        int mr = maxRec.toInt();
        if (mr >= 1000 && mr <= 15000) cfg.maxRecordingMs = mr;
    }

    cfg.micEnabled = parseJsonBool(body, "mic_enabled", cfg.micEnabled);
    cfg.speakerEnabled = parseJsonBool(body, "speaker_enabled", cfg.speakerEnabled);

    core->getVoice()->updateConfig(cfg);
    core->getSecurityLogger()->logEvent(SecurityEventType::CONFIG_CHANGED, getClientIP(), "Voice configuration updated");
    sendJson(200, "{\"status\":\"ok\"}", true);
}

void WebAPI::handleGetAudioDiagnostics() {
    if (!checkAuthentication()) return;
    String diagJson = core->getVoice()->getAudioDiagnosticsJson();
    sendJson(200, diagJson, true);
}

void WebAPI::handlePostListen() {
    if (!checkAuthentication()) return;
    String action = "start";
    if (server->hasArg("plain")) {
        String body = server->arg("plain");
        String a = parseJsonField(body, "action");
        if (a.length() > 0) action = a;
    }

    if (action == "stop") {
        core->getVoice()->stopListening();
        sendJson(200, "{\"status\":\"ok\",\"listening\":false}", true);
    } else {
        core->getVoice()->startListening();
        sendJson(200, "{\"status\":\"ok\",\"listening\":true}", true);
    }
}

void WebAPI::handlePostTestMicrophone() {
    if (!checkAuthentication()) return;
    float rms = 0.0f;
    int16_t peak = 0;
    bool ok = core->getVoice()->testMicrophone(1000, rms, peak);
    String json = "{";
    json += "\"status\":\"" + String(ok ? "ok" : "error") + "\",";
    json += "\"samples_read\":" + String(ok ? 16000 : 0) + ",";
    json += "\"rms\":" + String(rms, 2) + ",";
    json += "\"peak\":" + String(peak);
    json += "}";
    sendJson(ok ? 200 : 500, json, true);
}

void WebAPI::handlePostTestSpeaker() {
    if (!checkAuthentication()) return;
    bool ok = core->getVoice()->testSpeaker(1000, 250);
    sendJson(ok ? 200 : 500, "{\"status\":\"" + String(ok ? "ok" : "error") + "\",\"tone_hz\":1000,\"duration_ms\":250}", true);
}

void WebAPI::handlePostTestTTS() {
    if (!checkAuthentication()) return;
    String testText = "TARA real audio pipeline operational.";
    if (server->hasArg("plain")) {
        String body = server->arg("plain");
        String t = parseJsonField(body, "text");
        if (t.length() > 0) testText = t;
    }
    bool ok = core->getVoice()->testTTS(testText.c_str());
    sendJson(ok ? 200 : 500, "{\"status\":\"" + String(ok ? "ok" : "error") + "\",\"text\":\"" + testText + "\"}", true);
}

void WebAPI::handlePostTestSTT() {
    if (!checkAuthentication()) return;
    STTResult res = core->getVoice()->testSTT(3000);
    String json = "{";
    json += "\"status\":\"" + String(res.success ? "ok" : "error") + "\",";
    json += "\"success\":" + String(res.success ? "true" : "false") + ",";
    json += "\"transcript\":\"" + res.transcript + "\",";
    json += "\"confidence\":" + String(res.confidence, 2) + ",";
    json += "\"error_code\":\"" + res.errorCode + "\",";
    json += "\"error_message\":\"" + res.errorMessage + "\"";
    json += "}";
    sendJson(res.success ? 200 : 400, json, true);
}

void WebAPI::handleGetPersonality() {
    if (!checkAuthentication()) return;
    PersonalityConfig cfg = core->getPersonality()->getConfig();
    String json = "{";
    json += "\"name\":\"" + String(cfg.name) + "\",";
    json += "\"energy\":" + String(cfg.energy) + ",";
    json += "\"curiosity\":" + String(cfg.curiosity) + ",";
    json += "\"humor\":" + String(cfg.humor) + ",";
    json += "\"wake_word\":\"" + String(cfg.wakeWord) + "\"";
    json += "}";
    sendJson(200, json, true);
}

void WebAPI::handlePostPersonality() {
    if (!checkAuthentication()) return;
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}", true);
        return;
    }
    String body = server->arg("plain");
    if (!validatePayloadLength(body, 512)) return;

    PersonalityConfig cfg = core->getPersonality()->getConfig();
    String name = parseJsonField(body, "name");
    String wake = parseJsonField(body, "wake_word");
    if (name.length() > 0 && name.length() < 32) strncpy(cfg.name, name.c_str(), sizeof(cfg.name) - 1);
    if (wake.length() > 0 && wake.length() < 32) strncpy(cfg.wakeWord, wake.c_str(), sizeof(cfg.wakeWord) - 1);

    core->getPersonality()->setConfig(cfg);
    sendJson(200, "{\"status\":\"ok\"}", true);
}

void WebAPI::handleGetMemory() {
    if (!checkAuthentication()) return;
    String facts = core->getMemory()->exportAllFacts();
    sendJson(200, facts, true);
}

void WebAPI::handlePostMemory() {
    if (!checkAuthentication()) return;
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Missing payload\"}", true);
        return;
    }
    String body = server->arg("plain");
    if (!validatePayloadLength(body, 1024)) return;

    String key = parseJsonField(body, "key");
    String val = parseJsonField(body, "value");
    if (key.length() > 0 && val.length() > 0) {
        core->getMemory()->storeUserFact(key.c_str(), val.c_str());
        sendJson(200, "{\"status\":\"ok\"}", true);
    } else {
        sendJson(400, "{\"error\":\"Key and value required\"}", true);
    }
}

void WebAPI::handleGetHardware() {
    if (!checkAuthentication()) return;
    String json = "{";
    json += "\"oled\":{\"sda\":21,\"scl\":22,\"addr\":\"0x3C\",\"driver\":\"SSD1306\"},";
    json += "\"audio\":{\"bclk\":26,\"lrc\":25,\"dout\":19,\"din\":34},";
    json += "\"led\":{\"pin\":2},";
    json += "\"touch\":{\"pin\":4},";
    json += "\"battery_mv\":4180";
    json += "}";
    sendJson(200, json, true);
}

void WebAPI::handlePostRestart() {
    if (!checkAuthentication()) return;
    core->getSecurityLogger()->logEvent(SecurityEventType::RESTART_REQUEST, getClientIP(), "ESP32 Restart initiated via API");
    sendJson(200, "{\"status\":\"restarting\",\"message\":\"ESP32 restarting in 1 second...\"}", true);
    delay(1000);
    ESP.restart();
}

void WebAPI::handlePostReset() {
    if (!checkAuthentication()) return;
    if (!server->hasArg("plain")) {
        sendJson(400, "{\"error\":\"Factory reset requires confirmation body\"}", true);
        return;
    }

    String body = server->arg("plain");
    bool confirm = parseJsonBool(body, "confirm", false);
    if (!confirm) {
        sendJson(400, "{\"error\":\"Factory reset confirmation declined. Must pass {\\\"confirm\\\":true}\"}", true);
        return;
    }

    core->getSecurityLogger()->logEvent(SecurityEventType::FACTORY_RESET, getClientIP(), "Factory reset executed");
    sendJson(200, "{\"status\":\"resetting\",\"message\":\"Resetting NVS and rebooting...\"}", true);
    delay(1000);
    core->getStorage()->factoryReset();
    ESP.restart();
}

void WebAPI::handlePostOTA() {
    if (!checkAuthentication()) return;
    core->getSecurityLogger()->logEvent(SecurityEventType::OTA_REQUEST, getClientIP(), "OTA update requested");
    sendJson(200, "{\"status\":\"ok\",\"message\":\"Ready for OTA firmware stream\"}", true);
}
