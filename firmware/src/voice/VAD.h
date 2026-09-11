#ifndef TARA_VAD_H
#define TARA_VAD_H

#include <Arduino.h>

enum class VADState : uint8_t {
    IDLE = 0,
    LISTENING,
    SPEECH_DETECTED,
    RECORDING,
    SILENCE_DETECTED,
    PROCESSING,
    TRANSCRIBED
};

const char* vadStateToString(VADState state);

struct VADConfig {
    uint16_t speechThresholdRms; // RMS threshold above which speech is considered active (default 1200)
    uint16_t silenceThresholdRms;// RMS threshold below which audio is considered silence (default 600)
    uint16_t minSpeechMs;        // Minimum continuous speech duration to trigger RECORDING (default 200ms)
    uint16_t silenceTimeoutMs;   // Continuous silence duration after speech to finalize (default 1200ms)
    uint16_t maxRecordingMs;     // Hard timeout for recording (default 4500ms)
};

class VADDetector {
public:
    VADDetector(const VADConfig& config = {1200, 600, 200, 1200, 4500});

    void reset();
    void startListening();
    void stop();

    // Process a frame of 16-bit PCM samples (typically 256 or 512 samples)
    VADState processFrame(const int16_t* samples, size_t count, uint32_t sampleRate = 16000);

    VADState getState() const { return state; }
    float getCurrentRms() const { return currentRms; }
    float getSmoothedRms() const { return smoothedRms; }
    uint32_t getRecordingDurationMs() const;

    void setConfig(const VADConfig& newConfig) { config = newConfig; }
    VADConfig getConfig() const { return config; }

    static float calculateRms(const int16_t* samples, size_t count);

private:
    VADConfig config;
    VADState state;
    float currentRms;
    float smoothedRms;

    uint32_t listeningStartMs;
    uint32_t speechStartMs;
    uint32_t lastSpeechMs;
    uint32_t recordingStartMs;
    bool speechConfirmed;
};

#endif // TARA_VAD_H
