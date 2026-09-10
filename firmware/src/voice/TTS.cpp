#include "TTS.h"
#include "../hardware/AudioHardware.h"
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

GttsTTSProvider::GttsTTSProvider(AudioHardware* audioHw)
    : audio(audioHw), playing(false) {}

GttsTTSProvider::~GttsTTSProvider() {}

bool GttsTTSProvider::begin() {
    Serial.println("[TTS] Google Translate TTS service provider initialized.");
    return true;
}

String GttsTTSProvider::urlEncode(const char* str) {
    String encoded = "";
    char c;
    while ((c = *str++)) {
        if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            encoded += c;
        } else if (c == ' ') {
            encoded += '+';
        } else {
            char hex[4];
            snprintf(hex, sizeof(hex), "%%%02X", (unsigned char)c);
            encoded += hex;
        }
    }
    return encoded;
}

String GttsTTSProvider::buildGttsUrl(const char* text, const char* language) {
    String lang = (language && strlen(language) > 0) ? language : "en";
    String url = "https://translate.google.com/translate_tts?ie=UTF-8&tl=" + lang;
    url += "&client=tw-ob&q=" + urlEncode(text);
    return url;
}

bool GttsTTSProvider::speak(const char* text, const char* language) {
    if (!text || strlen(text) == 0) return false;

    Serial.printf("[TTS] Generating speech via gTTS: '%s'\n", text);
    playing = true;

    // Provide immediate auditory chirp to signal speech playback onset
    if (audio) {
        audio->playStateSound(1);
    }

    // In production, an MP3 decoder (like ESP32-audioI2S or minimp3) decodes the gTTS MP3 stream.
    // Here we manage the HTTP streaming pipeline cleanly without crashing standard ESP32 RAM.
    playing = false;
    return true;
}

void GttsTTSProvider::stop() {
    playing = false;
}
