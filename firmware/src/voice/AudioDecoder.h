#ifndef TARA_AUDIODECODER_H
#define TARA_AUDIODECODER_H

#include <Arduino.h>

class AudioHardware;

enum class AudioFormat : uint8_t {
    UNKNOWN = 0,
    WAV_PCM,
    MP3,
    RAW_PCM
};

enum class DecoderState : uint8_t {
    IDLE = 0,
    ACTIVE,
    ERROR
};

const char* audioFormatToString(AudioFormat fmt);
const char* decoderStateToString(DecoderState state);

typedef void (*AudioAmplitudeCallback)(float normalizedRms, void* userData);

class AudioDecoder {
public:
    AudioDecoder(AudioHardware* hw);
    ~AudioDecoder();

    bool begin();
    void reset();

    // Volume scaling (0 - 100%)
    void setVolume(uint8_t volumePercent);
    uint8_t getVolume() const { return volume; }

    // Register callback for real-time amplitude envelope (synchronizes mouth)
    void setAmplitudeCallback(AudioAmplitudeCallback cb, void* userData);

    // Stream decoder entry point: receives incoming HTTP/HTTPS chunk
    size_t decodeAndPlayChunk(const uint8_t* encodedData, size_t len);

    // Concludes stream playback and flushes residual buffers
    void finishStream();

    bool isActive() const { return active; }
    DecoderState getState() const { return state; }
    AudioFormat getDetectedFormat() const { return detectedFormat; }
    float getLastRms() const { return lastRms; }
    size_t getTotalBytesPlayed() const { return totalBytesPlayed; }
    uint32_t getSampleRate() const { return sampleRate; }

private:
    AudioHardware* audioHw;
    uint8_t volume;
    bool active;
    DecoderState state;
    AudioFormat detectedFormat;
    bool headerParsed;
    uint32_t sampleRate;
    uint8_t channels;
    uint8_t bitsPerSample;
    float lastRms;
    size_t totalBytesPlayed;

    AudioAmplitudeCallback amplitudeCb;
    void* amplitudeUserData;

    // Header buffer for format identification
    uint8_t headerBuffer[64];
    size_t headerBufferLen;

    bool parseWavHeader(const uint8_t* data, size_t len, size_t& pcmOffset);
    bool detectFormat(const uint8_t* data, size_t len);
    void playPcmChunk(const int16_t* pcm, size_t sampleCount);
    float computeChunkRms(const int16_t* pcm, size_t sampleCount);
};

#endif // TARA_AUDIODECODER_H
