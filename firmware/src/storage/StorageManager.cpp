#include "StorageManager.h"
#include <string.h>

#define PREF_NAMESPACE_SYS  "tara_sys"
#define PREF_NAMESPACE_WIFI "tara_wifi"
#define PREF_NAMESPACE_AI   "tara_ai"
#define PREF_NAMESPACE_MEM  "tara_mem"

StorageManager::StorageManager() : initialized(false) {}

bool StorageManager::begin() {
    initialized = prefs.begin(PREF_NAMESPACE_SYS, false);
    prefs.end();
    return initialized;
}

bool StorageManager::hasWiFiCredentials() {
    prefs.begin(PREF_NAMESPACE_WIFI, true);
    String ssid = prefs.getString("ssid", "");
    prefs.end();
    return (ssid.length() > 0);
}

bool StorageManager::loadWiFiConfig(WiFiConfig& config) {
    memset(&config, 0, sizeof(WiFiConfig));
    prefs.begin(PREF_NAMESPACE_WIFI, true);
    String ssid = prefs.getString("ssid", "");
    String pass = prefs.getString("pass", "");
    config.autoConnect = prefs.getBool("auto", true);
    config.retryCount = prefs.getUChar("retries", 10);
    prefs.end();

    strncpy(config.ssid, ssid.c_str(), sizeof(config.ssid) - 1);
    strncpy(config.password, pass.c_str(), sizeof(config.password) - 1);
    return (ssid.length() > 0);
}

bool StorageManager::saveWiFiConfig(const WiFiConfig& config) {
    prefs.begin(PREF_NAMESPACE_WIFI, false);
    prefs.putString("ssid", config.ssid);
    prefs.putString("pass", config.password);
    prefs.putBool("auto", config.autoConnect);
    prefs.putUChar("retries", config.retryCount);
    prefs.end();
    return true;
}

void StorageManager::clearWiFiConfig() {
    prefs.begin(PREF_NAMESPACE_WIFI, false);
    prefs.clear();
    prefs.end();
}

bool StorageManager::loadBrainConfig(BrainConfig& config) {
    memset(&config, 0, sizeof(BrainConfig));
    prefs.begin(PREF_NAMESPACE_AI, true);
    String prov = prefs.getString("provider", "cloud");
    String ep   = prefs.getString("endpoint", "https://api.openai.com/v1/chat/completions");
    String key  = prefs.getString("apiKey", "");
    String mod  = prefs.getString("model", "gpt-4o-mini");
    config.temperature = prefs.getFloat("temp", 0.7f);
    config.maxTokens   = prefs.getUShort("tokens", 256);
    config.timeoutMs   = prefs.getUShort("timeout", 8000);
    config.streaming   = prefs.getBool("stream", false);
    config.enabled     = prefs.getBool("enabled", true);
    prefs.end();

    strncpy(config.provider, prov.c_str(), sizeof(config.provider) - 1);
    strncpy(config.endpoint, ep.c_str(), sizeof(config.endpoint) - 1);
    strncpy(config.apiKey, key.c_str(), sizeof(config.apiKey) - 1);
    strncpy(config.model, mod.c_str(), sizeof(config.model) - 1);
    return true;
}

bool StorageManager::saveBrainConfig(const BrainConfig& config) {
    prefs.begin(PREF_NAMESPACE_AI, false);
    prefs.putString("provider", config.provider);
    prefs.putString("endpoint", config.endpoint);
    if (strlen(config.apiKey) > 0) {
        prefs.putString("apiKey", config.apiKey);
    }
    prefs.putString("model", config.model);
    prefs.putFloat("temp", config.temperature);
    prefs.putUShort("tokens", config.maxTokens);
    prefs.putUShort("timeout", config.timeoutMs);
    prefs.putBool("stream", config.streaming);
    prefs.putBool("enabled", config.enabled);
    prefs.end();
    return true;
}

bool StorageManager::loadVoiceConfig(VoiceConfig& config) {
    memset(&config, 0, sizeof(VoiceConfig));
    prefs.begin(PREF_NAMESPACE_SYS, true);
    String ttsEp  = prefs.getString("tts_ep", "https://translate.google.com/translate_tts");
    String ttsLng = prefs.getString("tts_lang", "en");
    String sttEp  = prefs.getString("stt_ep", "https://speech.googleapis.com/v1/speech:recognize");
    String sttLng = prefs.getString("stt_lang", "en-US");
    config.volume = prefs.getUChar("vol", 80);
    config.sampleRate = prefs.getUShort("srate", 16000);
    config.micEnabled = prefs.getBool("mic_on", true);
    config.speakerEnabled = prefs.getBool("spk_on", true);
    config.vadThreshold = prefs.getUShort("vad_th", 1200);
    config.silenceTimeoutMs = prefs.getUShort("sil_to", 1200);
    config.maxRecordingMs = prefs.getUShort("max_rec", 4500);
    prefs.end();

    strncpy(config.ttsEndpoint, ttsEp.c_str(), sizeof(config.ttsEndpoint) - 1);
    strncpy(config.ttsLanguage, ttsLng.c_str(), sizeof(config.ttsLanguage) - 1);
    strncpy(config.sttEndpoint, sttEp.c_str(), sizeof(config.sttEndpoint) - 1);
    strncpy(config.sttLanguage, sttLng.c_str(), sizeof(config.sttLanguage) - 1);
    return true;
}

bool StorageManager::saveVoiceConfig(const VoiceConfig& config) {
    prefs.begin(PREF_NAMESPACE_SYS, false);
    prefs.putString("tts_ep", config.ttsEndpoint);
    prefs.putString("tts_lang", config.ttsLanguage);
    prefs.putString("stt_ep", config.sttEndpoint);
    prefs.putString("stt_lang", config.sttLanguage);
    prefs.putUChar("vol", config.volume);
    prefs.putUShort("srate", config.sampleRate);
    prefs.putBool("mic_on", config.micEnabled);
    prefs.putBool("spk_on", config.speakerEnabled);
    prefs.putUShort("vad_th", config.vadThreshold);
    prefs.putUShort("sil_to", config.silenceTimeoutMs);
    prefs.putUShort("max_rec", config.maxRecordingMs);
    prefs.end();
    return true;
}

bool StorageManager::loadPersonalityConfig(PersonalityConfig& config) {
    memset(&config, 0, sizeof(PersonalityConfig));
    prefs.begin(PREF_NAMESPACE_SYS, true);
    String name   = prefs.getString("name", "TARA");
    String trait  = prefs.getString("trait", "Curious & Friendly");
    String style  = prefs.getString("style", "Warm, witty, concise");
    String lang   = prefs.getString("lang", "en");
    config.energyLevel = prefs.getUChar("energy", 85);
    config.wakeWordEnabled = prefs.getBool("wakeword", true);
    prefs.end();

    strncpy(config.name, name.c_str(), sizeof(config.name) - 1);
    strncpy(config.primaryTrait, trait.c_str(), sizeof(config.primaryTrait) - 1);
    strncpy(config.speakingStyle, style.c_str(), sizeof(config.speakingStyle) - 1);
    strncpy(config.language, lang.c_str(), sizeof(config.language) - 1);
    return true;
}

bool StorageManager::savePersonalityConfig(const PersonalityConfig& config) {
    prefs.begin(PREF_NAMESPACE_SYS, false);
    prefs.putString("name", config.name);
    prefs.putString("trait", config.primaryTrait);
    prefs.putString("style", config.speakingStyle);
    prefs.putString("lang", config.language);
    prefs.putUChar("energy", config.energyLevel);
    prefs.putBool("wakeword", config.wakeWordEnabled);
    prefs.end();
    return true;
}

bool StorageManager::loadHardwareConfig(HardwareConfigData& config) {
    prefs.begin(PREF_NAMESPACE_SYS, true);
    config.oledSdaPin      = prefs.getChar("pin_sda", 21);
    config.oledSclPin      = prefs.getChar("pin_scl", 22);
    config.oledResetPin    = prefs.getChar("pin_rst", -1);
    config.i2sBclkPin      = prefs.getChar("pin_bclk", 26);
    config.i2sLrcPin       = prefs.getChar("pin_lrc", 25);
    config.i2sDoutPin      = prefs.getChar("pin_dout", 19);
    config.i2sDinPin       = prefs.getChar("pin_din", 34);
    config.ledStatusPin    = prefs.getChar("pin_led", 2);
    config.buttonActionPin = prefs.getChar("pin_btn", 0);
    prefs.end();
    return true;
}

bool StorageManager::saveHardwareConfig(const HardwareConfigData& config) {
    prefs.begin(PREF_NAMESPACE_SYS, false);
    prefs.putChar("pin_sda", config.oledSdaPin);
    prefs.putChar("pin_scl", config.oledSclPin);
    prefs.putChar("pin_rst", config.oledResetPin);
    prefs.putChar("pin_bclk", config.i2sBclkPin);
    prefs.putChar("pin_lrc", config.i2sLrcPin);
    prefs.putChar("pin_dout", config.i2sDoutPin);
    prefs.putChar("pin_din", config.i2sDinPin);
    prefs.putChar("pin_led", config.ledStatusPin);
    prefs.putChar("pin_btn", config.buttonActionPin);
    prefs.end();
    return true;
}

String StorageManager::getMemoryValue(const char* key, const char* defaultVal) {
    prefs.begin(PREF_NAMESPACE_MEM, true);
    String val = prefs.getString(key, defaultVal);
    prefs.end();
    return val;
}

bool StorageManager::setMemoryValue(const char* key, const char* value) {
    prefs.begin(PREF_NAMESPACE_MEM, false);
    size_t written = prefs.putString(key, value);
    prefs.end();
    return (written > 0);
}

bool StorageManager::clearMemory() {
    prefs.begin(PREF_NAMESPACE_MEM, false);
    bool ok = prefs.clear();
    prefs.end();
    return ok;
}

bool StorageManager::factoryReset() {
    clearWiFiConfig();
    clearMemory();
    prefs.begin(PREF_NAMESPACE_SYS, false);
    prefs.clear();
    prefs.end();
    prefs.begin(PREF_NAMESPACE_AI, false);
    prefs.clear();
    prefs.end();
    return true;
}
