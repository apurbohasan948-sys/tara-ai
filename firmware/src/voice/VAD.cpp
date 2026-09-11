#include "VAD.h"
#include <math.h>

const char* vadStateToString(VADState state) {
    switch (state) {
        case VADState::IDLE: return "IDLE";
        case VADState::LISTENING: return "LISTENING";
        case VADState::SPEECH_DETECTED: return "SPEECH_DETECTED";
        case VADState::RECORDING: return "RECORDING";
        case VADState::SILENCE_DETECTED: return "SILENCE_DETECTED";
        case VADState::PROCESSING: return "PROCESSING";
        case VADState::TRANSCRIBED: return "TRANSCRIBED";
        default: return "UNKNOWN";
    }
}

VADDetector::VADDetector(const VADConfig& cfg)
    : config(cfg),
      state(VADState::IDLE),
      currentRms(0.0f),
      smoothedRms(0.0f),
      listeningStartMs(0),
      speechStartMs(0),
      lastSpeechMs(0),
      recordingStartMs(0),
      speechConfirmed(false) {}

void VADDetector::reset() {
    state = VADState::IDLE;
    currentRms = 0.0f;
    smoothedRms = 0.0f;
    listeningStartMs = 0;
    speechStartMs = 0;
    lastSpeechMs = 0;
    recordingStartMs = 0;
    speechConfirmed = false;
}

void VADDetector::startListening() {
    state = VADState::LISTENING;
    listeningStartMs = millis();
    speechStartMs = 0;
    lastSpeechMs = 0;
    recordingStartMs = 0;
    speechConfirmed = false;
    currentRms = 0.0f;
    smoothedRms = 0.0f;
}

void VADDetector::stop() {
    state = VADState::IDLE;
}

uint32_t VADDetector::getRecordingDurationMs() const {
    if (recordingStartMs == 0) return 0;
    return millis() - recordingStartMs;
}

float VADDetector::calculateRms(const int16_t* samples, size_t count) {
    if (!samples || count == 0) return 0.0f;
    int64_t sumSquares = 0;
    for (size_t i = 0; i < count; i++) {
        int32_t s = samples[i];
        sumSquares += (s * s);
    }
    float meanSquare = (float)sumSquares / (float)count;
    return sqrtf(meanSquare);
}

VADState VADDetector::processFrame(const int16_t* samples, size_t count, uint32_t sampleRate) {
    if (state == VADState::IDLE) return state;

    uint32_t now = millis();
    currentRms = calculateRms(samples, count);

    // Apply exponential smoothing to RMS
    smoothedRms = (smoothedRms * 0.75f) + (currentRms * 0.25f);

    bool frameHasVoice = (smoothedRms >= (float)config.speechThresholdRms);
    bool frameIsSilence = (smoothedRms <= (float)config.silenceThresholdRms);

    switch (state) {
        case VADState::LISTENING: {
            if (frameHasVoice) {
                if (speechStartMs == 0) {
                    speechStartMs = now;
                } else if (now - speechStartMs >= config.minSpeechMs) {
                    // Confirmed speech onset
                    state = VADState::SPEECH_DETECTED;
                    recordingStartMs = speechStartMs;
                    lastSpeechMs = now;
                    speechConfirmed = true;
                    state = VADState::RECORDING;
                }
            } else {
                speechStartMs = 0;
            }

            // Listening timeout if no speech detected at all after extended period
            if (!speechConfirmed && (now - listeningStartMs > 10000)) {
                state = VADState::SILENCE_DETECTED;
            }
            break;
        }

        case VADState::SPEECH_DETECTED:
        case VADState::RECORDING: {
            if (frameHasVoice) {
                lastSpeechMs = now;
            }

            // Check silence timeout (user stopped speaking)
            if (frameIsSilence && lastSpeechMs > 0 && (now - lastSpeechMs >= config.silenceTimeoutMs)) {
                state = VADState::SILENCE_DETECTED;
                break;
            }

            // Check hard max recording duration
            if (recordingStartMs > 0 && (now - recordingStartMs >= config.maxRecordingMs)) {
                state = VADState::SILENCE_DETECTED;
                break;
            }
            break;
        }

        case VADState::SILENCE_DETECTED:
        case VADState::PROCESSING:
        case VADState::TRANSCRIBED:
            // Terminal or transitional states handled by VoiceManager
            break;

        default:
            break;
    }

    return state;
}
