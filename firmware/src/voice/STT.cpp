#include "STT.h"
#include "AudioBuffer.h"
#include "../hardware/AudioHardware.h"
#include "../security/EndpointValidator.h"
#include "../security/TLSCertStore.h"
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* sttStateToString(STTState state) {
    switch (state) {
        case STTState::IDLE: return "IDLE";
        case STTState::LISTENING: return "LISTENING";
        case STTState::RECORDING: return "RECORDING";
        case STTState::PROCESSING: return "PROCESSING";
        case STTState::COMPLETED: return "COMPLETED";
        case STTState::ERROR: return "ERROR";
        default: return "IDLE";
    }
}

CloudSTTProvider::CloudSTTProvider(AudioHardware* audioHw, const char* endpoint)
    : audio(audioHw), state(STTState::IDLE) {
    memset(sttEndpoint, 0, sizeof(sttEndpoint));
    memset(apiKey, 0, sizeof(apiKey));
    if (endpoint && strlen(endpoint) > 0) {
        strncpy(sttEndpoint, endpoint, sizeof(sttEndpoint) - 1);
    } else {
        strncpy(sttEndpoint, "https://speech.googleapis.com/v1/speech:recognize", sizeof(sttEndpoint) - 1);
    }
}

CloudSTTProvider::~CloudSTTProvider() {}

bool CloudSTTProvider::begin() {
    state = STTState::IDLE;
    Serial.println("[STT] Production Cloud Speech-to-Text provider initialized.");
    return true;
}

void CloudSTTProvider::setEndpoint(const char* url) {
    if (url && strlen(url) > 0) {
        strncpy(sttEndpoint, url, sizeof(sttEndpoint) - 1);
    }
}

void CloudSTTProvider::setApiKey(const char* key) {
    if (key) {
        strncpy(apiKey, key, sizeof(apiKey) - 1);
    }
}

void CloudSTTProvider::startListening() {
    state = STTState::LISTENING;
    Serial.println("[STT] Real microphone listening cycle initiated.");
}

void CloudSTTProvider::stopListening() {
    if (state == STTState::LISTENING || state == STTState::RECORDING) {
        state = STTState::IDLE;
    }
    Serial.println("[STT] Real microphone listening stopped.");
}

STTResult CloudSTTProvider::parseCloudResponse(int httpCode, const String& responseBody) {
    STTResult res;
    res.success = false;
    res.confidence = 0.0f;

    if (httpCode != 200) {
        res.errorCode = "STT_HTTP_ERROR";
        res.errorMessage = "Server returned HTTP status " + String(httpCode);
        return res;
    }

    if (responseBody.length() == 0) {
        res.errorCode = "STT_EMPTY_RESPONSE";
        res.errorMessage = "Empty response body from STT endpoint";
        return res;
    }

    // Parse transcript from Google Cloud Speech, Whisper, or Custom STT JSON formats:
    // 1. Google Speech format: {"results":[{"alternatives":[{"transcript":"...","confidence":0.92}]}]}
    // 2. Whisper format: {"text":"..."}
    // 3. Custom format: {"transcript":"..."}
    String transcript = "";
    float confidence = 0.85f;

    int idx = responseBody.indexOf("\"transcript\":\"");
    if (idx != -1) {
        int start = idx + 14;
        int end = responseBody.indexOf('"', start);
        if (end != -1) {
            transcript = responseBody.substring(start, end);
        }
    } else {
        idx = responseBody.indexOf("\"text\":\"");
        if (idx != -1) {
            int start = idx + 8;
            int end = responseBody.indexOf('"', start);
            if (end != -1) {
                transcript = responseBody.substring(start, end);
            }
        }
    }

    // Parse confidence if present
    int confIdx = responseBody.indexOf("\"confidence\":");
    if (confIdx != -1) {
        int start = confIdx + 13;
        int end = responseBody.indexOf(',', start);
        if (end == -1) end = responseBody.indexOf('}', start);
        if (end != -1) {
            confidence = responseBody.substring(start, end).toFloat();
        }
    }

    transcript.trim();
    if (transcript.length() > 0) {
        res.success = true;
        res.transcript = transcript;
        res.confidence = confidence;
    } else {
        res.errorCode = "STT_NO_SPEECH";
        res.errorMessage = "No intelligible speech recognized in captured audio";
    }

    return res;
}

STTResult CloudSTTProvider::processAudio(const int16_t* pcmBuffer, size_t sampleCount, uint32_t sampleRate, const char* language) {
    STTResult res;
    res.success = false;
    res.confidence = 0.0f;

    if (!pcmBuffer || sampleCount == 0) {
        state = STTState::ERROR;
        res.errorCode = "STT_AUDIO_ERROR";
        res.errorMessage = "Captured audio buffer is empty";
        return res;
    }

    // Reject extremely short audio (under 100ms)
    if (sampleCount < (sampleRate / 10)) {
        state = STTState::ERROR;
        res.errorCode = "STT_NO_SPEECH";
        res.errorMessage = "Audio snippet too brief for speech recognition";
        return res;
    }

    state = STTState::PROCESSING;
    Serial.printf("[STT] Processing real audio: %u samples @ %u Hz (lang: %s)...\n",
                  sampleCount, sampleRate, (language ? language : "en-US"));

    // Validate STT endpoint
    EndpointValidationResult val = EndpointValidator::validate(ModelProviderType::CUSTOM, sttEndpoint, true);
    if (!val.valid) {
        state = STTState::ERROR;
        res.errorCode = "STT_INVALID_ENDPOINT";
        res.errorMessage = val.rejectionReason;
        return res;
    }

    // Build standard 44-byte WAV header
    uint32_t pcmByteCount = sampleCount * sizeof(int16_t);
    uint8_t wavHeader[44];
    AudioBuffer::writeWavHeader(wavHeader, pcmByteCount, sampleRate, 1, 16);

    WiFiClientSecure client;
    TLSCertStore::applyTrust(&client, val.host.c_str());
    client.setTimeout(10000); // 10s timeout for network STT

    HTTPClient http;
    String url = sttEndpoint;
    if (strlen(apiKey) > 0 && url.indexOf("key=") == -1) {
        url += (url.indexOf('?') == -1) ? "?key=" : "&key=";
        url += apiKey;
    }

    if (!http.begin(client, url)) {
        state = STTState::ERROR;
        res.errorCode = "STT_NETWORK_ERROR";
        res.errorMessage = "Failed to establish secure TLS connection to STT service";
        return res;
    }

    http.addHeader("Content-Type", "audio/wav");
    http.addHeader("X-Language-Code", (language && strlen(language) > 0) ? language : "en-US");

    // Total payload size = 44 bytes header + PCM data
    int totalPayloadBytes = 44 + pcmByteCount;

    // Send payload using chunked or buffered write
    int httpCode = http.sendRequest("POST", [wavHeader, pcmBuffer, pcmByteCount](WiFiClient* stream) {
        stream->write(wavHeader, 44);
        stream->write((const uint8_t*)pcmBuffer, pcmByteCount);
    }, totalPayloadBytes);

    if (httpCode > 0) {
        String responseBody = http.getString();
        http.end();
        res = parseCloudResponse(httpCode, responseBody);
        state = res.success ? STTState::COMPLETED : STTState::ERROR;
    } else {
        http.end();
        state = STTState::ERROR;
        res.errorCode = "STT_TIMEOUT";
        res.errorMessage = "Network timeout or connection drop during STT request: " + http.errorToString(httpCode);
    }

    return res;
}
