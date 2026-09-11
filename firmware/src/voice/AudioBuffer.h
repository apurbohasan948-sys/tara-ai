#ifndef TARA_AUDIOBUFFER_H
#define TARA_AUDIOBUFFER_H

#include <Arduino.h>

/**
 * AudioBuffer: Fixed-capacity PCM audio buffer for 16-bit 16kHz audio capture.
 * Designed for standard ESP32 with zero heap reallocation during recording.
 */
class AudioBuffer {
public:
    static const size_t DEFAULT_CAPACITY_SAMPLES = 48000; // 3.0 seconds @ 16kHz mono (96 KB)

    AudioBuffer(size_t capacitySamples = DEFAULT_CAPACITY_SAMPLES)
        : maxSamples(capacitySamples),
          sampleCount(0),
          buffer(nullptr) {
        // Allocate buffer once during initialization
        buffer = (int16_t*)malloc(maxSamples * sizeof(int16_t));
        if (!buffer) {
            // Fallback to 2 seconds (64 KB) if memory is constrained
            maxSamples = 32000;
            buffer = (int16_t*)malloc(maxSamples * sizeof(int16_t));
        }
    }

    ~AudioBuffer() {
        if (buffer) {
            free(buffer);
            buffer = nullptr;
        }
    }

    bool isAllocated() const {
        return buffer != nullptr;
    }

    void clear() {
        sampleCount = 0;
    }

    size_t pushSamples(const int16_t* samples, size_t count) {
        if (!buffer || !samples || count == 0) return 0;
        size_t available = maxSamples - sampleCount;
        size_t toCopy = (count > available) ? available : count;
        if (toCopy > 0) {
            memcpy(buffer + sampleCount, samples, toCopy * sizeof(int16_t));
            sampleCount += toCopy;
        }
        return toCopy;
    }

    const int16_t* getSamples() const {
        return buffer;
    }

    int16_t* getWritableBuffer() {
        return buffer;
    }

    size_t getSampleCount() const {
        return sampleCount;
    }

    size_t getByteCount() const {
        return sampleCount * sizeof(int16_t);
    }

    size_t getMaxSamples() const {
        return maxSamples;
    }

    bool isFull() const {
        return sampleCount >= maxSamples;
    }

    /**
     * Creates standard 44-byte WAV header in the provided buffer.
     */
    static void writeWavHeader(uint8_t* header44, uint32_t pcmByteCount, uint32_t sampleRate = 16000, uint16_t channels = 1, uint16_t bitsPerSample = 16) {
        uint32_t totalDataLen = pcmByteCount;
        uint32_t totalAudioLen = totalDataLen + 36;
        uint32_t byteRate = sampleRate * channels * (bitsPerSample / 8);
        uint16_t blockAlign = channels * (bitsPerSample / 8);

        // RIFF chunk descriptor
        header44[0] = 'R'; header44[1] = 'I'; header44[2] = 'F'; header44[3] = 'F';
        header44[4] = (uint8_t)(totalAudioLen & 0xff);
        header44[5] = (uint8_t)((totalAudioLen >> 8) & 0xff);
        header44[6] = (uint8_t)((totalAudioLen >> 16) & 0xff);
        header44[7] = (uint8_t)((totalAudioLen >> 24) & 0xff);
        header44[8] = 'W'; header44[9] = 'A'; header44[10] = 'V'; header44[11] = 'E';

        // "fmt " sub-chunk
        header44[12] = 'f'; header44[13] = 'm'; header44[14] = 't'; header44[15] = ' ';
        header44[16] = 16; header44[17] = 0; header44[18] = 0; header44[19] = 0; // 16 for PCM
        header44[20] = 1; header44[21] = 0; // PCM format = 1
        header44[22] = (uint8_t)channels;
        header44[23] = 0;
        header44[24] = (uint8_t)(sampleRate & 0xff);
        header44[25] = (uint8_t)((sampleRate >> 8) & 0xff);
        header44[26] = (uint8_t)((sampleRate >> 16) & 0xff);
        header44[27] = (uint8_t)((sampleRate >> 24) & 0xff);
        header44[28] = (uint8_t)(byteRate & 0xff);
        header44[29] = (uint8_t)((byteRate >> 8) & 0xff);
        header44[30] = (uint8_t)((byteRate >> 16) & 0xff);
        header44[31] = (uint8_t)((byteRate >> 24) & 0xff);
        header44[32] = (uint8_t)blockAlign;
        header44[33] = 0;
        header44[34] = (uint8_t)bitsPerSample;
        header44[35] = 0;

        // "data" sub-chunk
        header44[36] = 'd'; header44[37] = 'a'; header44[38] = 't'; header44[39] = 'a';
        header44[40] = (uint8_t)(totalDataLen & 0xff);
        header44[41] = (uint8_t)((totalDataLen >> 8) & 0xff);
        header44[42] = (uint8_t)((totalDataLen >> 16) & 0xff);
        header44[43] = (uint8_t)((totalDataLen >> 24) & 0xff);
    }

private:
    size_t maxSamples;
    size_t sampleCount;
    int16_t* buffer;
};

#endif // TARA_AUDIOBUFFER_H
