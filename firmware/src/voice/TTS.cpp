#include "TTS.h"
#include "AudioDecoder.h"
#include "../hardware/AudioHardware.h"
#include "../security/EndpointValidator.h"
#include "../security/TLSCertStore.h"
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ttsStateToString(TTSState state) {
    switch (state) {
        case TTSState::IDLE: return "IDLE";
        case TTSState::REQUESTING: return "REQUESTING";
        case TTSState::CONNECTING: return "CONNECTING";
        case TTSState::DOWNLOADING: return "DOWNLOADING";
        case TTSState::DECODING: return "DECODING";
        case TTSState::PLAYING: return "PLAYING";
        case TTSState::COMPLETED: return "COMPLETED";
        case TTSState::ERROR: return "ERROR";
        default: return "IDLE";
    }
}

GttsTTSProvider::GttsTTSProvider(AudioHardware* audioHw, AudioDecoder* dec)
    : audio(audioHw),
      decoder(dec),
      state(TTSState::IDLE),
      shouldStop(false),
      ampListener(nullptr),
      ampUserData(nullptr) {
    memset(customEndpointUrl, 0, sizeof(customEndpointUrl));
}

GttsTTSProvider::~GttsTTSProvider() {}

bool GttsTTSProvider::begin() {
    state = TTSState::IDLE;
    shouldStop = false;
    Serial.println("[TTS] Real Google Translate TTS Streaming Provider initialized.");
    return true;
}

void GttsTTSProvider::setEndpoint(const char* url) {
    if (url && strlen(url) > 0) {
        strncpy(customEndpointUrl, url, sizeof(customEndpointUrl) - 1);
    }
}

void GttsTTSProvider::setAmplitudeListener(TTSAmplitudeListener listener, void* userData) {
    ampListener = listener;
    ampUserData = userData;
    if (decoder) {
        decoder->setAmplitudeCallback([](float rms, void* udata) {
            GttsTTSProvider* self = (GttsTTSProvider*)udata;
            if (self && self->ampListener) {
                self->ampListener(rms, self->ampUserData);
            }
        }, this);
    }
}

float GttsTTSProvider::getCurrentAmplitude() const {
    return decoder ? decoder->getLastRms() : 0.0f;
}

void GttsTTSProvider::stop() {
    shouldStop = true;
    if (decoder) {
        decoder->finishStream();
    }
    state = TTSState::IDLE;
    Serial.println("[TTS] Speech playback interrupted.");
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

String GttsTTSProvider::buildGttsUrl(const char* text, const char* language, VoiceMode mode) {
    String lang = (language && strlen(language) > 0) ? language : "en";
    
    // Support custom endpoint if configured
    if (strlen(customEndpointUrl) > 0) {
        String url = customEndpointUrl;
        url += (url.indexOf('?') == -1) ? "?q=" : "&q=";
        url += urlEncode(text);
        url += "&lang=" + lang;
        return url;
    }

    // Google Translate TTS direct HTTPS service
    String url = "https://translate.google.com/translate_tts?ie=UTF-8";
    url += "&tl=" + lang;
    url += "&client=tw-ob";
    url += "&q=" + urlEncode(text);

    // Apply voice mode modulation where supported (e.g. pitch / rate parameter hints)
    if (mode == VoiceMode::EXCITED_SPEECH) {
        url += "&ttsspeed=1.1";
    } else if (mode == VoiceMode::SAD_SPEECH || mode == VoiceMode::QUIET_SPEECH) {
        url += "&ttsspeed=0.9";
    }

    return url;
}

bool GttsTTSProvider::speak(const char* text, const char* language, VoiceMode mode) {
    if (!text || strlen(text) == 0) return false;

    shouldStop = false;
    state = TTSState::REQUESTING;
    Serial.printf("[TTS] Initiating real speech stream for: '%s' (lang: %s, mode: %s)\n",
                  text, (language ? language : "en"), voiceModeToString(mode));

    String url = buildGttsUrl(text, language, mode);

    // Validate endpoint
    EndpointValidationResult val = EndpointValidator::validate(ModelProviderType::CUSTOM, url, true);
    if (!val.valid) {
        state = TTSState::ERROR;
        Serial.printf("[TTS] Endpoint validation rejected: %s\n", val.rejectionReason.c_str());
        return false;
    }

    state = TTSState::CONNECTING;
    WiFiClientSecure client;
    TLSCertStore::applyTrust(&client, val.host.c_str());
    client.setTimeout(8000);

    HTTPClient http;
    if (!http.begin(client, url)) {
        state = TTSState::ERROR;
        Serial.println("[TTS] Failed to begin HTTP client for TTS stream");
        return false;
    }

    // gTTS requires a realistic User-Agent header
    http.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    http.addHeader("Accept", "audio/mpeg, audio/wav, audio/*");

    int httpCode = http.GET();
    if (httpCode != HTTP_CODE_OK) {
        state = TTSState::ERROR;
        Serial.printf("[TTS] HTTP error during TTS request: %d\n", httpCode);
        http.end();
        return false;
    }

    int len = http.getSize();
    Serial.printf("[TTS] Connected. Stream size: %d bytes. Decoding and playing...\n", len);

    state = TTSState::DOWNLOADING;
    if (decoder) {
        decoder->reset();
    }

    WiFiClient* stream = http.getStreamPtr();
    uint8_t chunkBuffer[512];
    state = TTSState::PLAYING;

    while (http.connected() && (len > 0 || len == -1)) {
        if (shouldStop) {
            Serial.println("[TTS] Playback stream cancelled by user.");
            break;
        }

        size_t available = stream->available();
        if (available > 0) {
            size_t toRead = (available > sizeof(chunkBuffer)) ? sizeof(chunkBuffer) : available;
            int bytesRead = stream->readBytes(chunkBuffer, toRead);
            if (bytesRead > 0) {
                if (decoder) {
                    decoder->decodeAndPlayChunk(chunkBuffer, bytesRead);
                }
                if (len > 0) len -= bytesRead;
            }
        } else {
            delay(1); // Yield to ESP32 RTOS scheduler
        }
    }

    if (decoder) {
        decoder->finishStream();
    }

    http.end();

    if (shouldStop) {
        state = TTSState::IDLE;
        return false;
    }

    state = TTSState::COMPLETED;
    Serial.println("[TTS] Speech playback finished cleanly.");
    state = TTSState::IDLE;
    return true;
}
