#include "AudioDecoder.h"
#include "../hardware/AudioHardware.h"
#include <math.h>

const char* audioFormatToString(AudioFormat fmt) {
    switch (fmt) {
        case AudioFormat::WAV_PCM: return "WAV_PCM";
        case AudioFormat::MP3: return "MP3";
        case AudioFormat::RAW_PCM: return "RAW_PCM";
        default: return "UNKNOWN";
    }
}

const char* decoderStateToString(DecoderState state) {
    switch (state) {
        case DecoderState::IDLE: return "IDLE";
        case DecoderState::ACTIVE: return "ACTIVE";
        case DecoderState::ERROR: return "ERROR";
        default: return "IDLE";
    }
}

AudioDecoder::AudioDecoder(AudioHardware* hw)
    : audioHw(hw),
      volume(80),
      active(false),
      state(DecoderState::IDLE),
      detectedFormat(AudioFormat::UNKNOWN),
      headerParsed(false),
      sampleRate(16000),
      channels(1),
      bitsPerSample(16),
      lastRms(0.0f),
      totalBytesPlayed(0),
      amplitudeCb(nullptr),
      amplitudeUserData(nullptr),
      headerBufferLen(0) {}

AudioDecoder::~AudioDecoder() {}

bool AudioDecoder::begin() {
    reset();
    return true;
}

void AudioDecoder::reset() {
    active = false;
    state = DecoderState::IDLE;
    detectedFormat = AudioFormat::UNKNOWN;
    headerParsed = false;
    sampleRate = 16000;
    channels = 1;
    bitsPerSample = 16;
    lastRms = 0.0f;
    totalBytesPlayed = 0;
    headerBufferLen = 0;

    if (amplitudeCb) {
        amplitudeCb(0.0f, amplitudeUserData);
    }
}

void AudioDecoder::setVolume(uint8_t volumePercent) {
    volume = (volumePercent > 100) ? 100 : volumePercent;
}

void AudioDecoder::setAmplitudeCallback(AudioAmplitudeCallback cb, void* userData) {
    amplitudeCb = cb;
    amplitudeUserData = userData;
}

bool AudioDecoder::detectFormat(const uint8_t* data, size_t len) {
    if (len < 4) return false;

    // Check RIFF / WAVE header
    if (data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F') {
        detectedFormat = AudioFormat::WAV_PCM;
        return true;
    }

    // Check ID3 MP3 tag
    if (data[0] == 'I' && data[1] == 'D' && data[2] == '3') {
        detectedFormat = AudioFormat::MP3;
        return true;
    }

    // Check MPEG Audio sync word (11 consecutive 1s: 0xFF followed by 0xE0 or higher)
    if (data[0] == 0xFF && (data[1] & 0xE0) == 0xE0) {
        detectedFormat = AudioFormat::MP3;
        return true;
    }

    return false;
}

bool AudioDecoder::parseWavHeader(const uint8_t* data, size_t len, size_t& pcmOffset) {
    if (len < 44) return false;

    if (data[0] != 'R' || data[1] != 'I' || data[2] != 'F' || data[3] != 'F') return false;
    if (data[8] != 'W' || data[9] != 'A' || data[10] != 'V' || data[11] != 'E') return false;

    // Find "fmt " chunk
    size_t offset = 12;
    while (offset + 8 < len) {
        if (data[offset] == 'f' && data[offset+1] == 'm' && data[offset+2] == 't' && data[offset+3] == ' ') {
            channels = data[offset + 10] | (data[offset + 11] << 8);
            sampleRate = data[offset + 12] | (data[offset + 13] << 8) | (data[offset + 14] << 16) | (data[offset + 15] << 24);
            bitsPerSample = data[offset + 22] | (data[offset + 23] << 8);
            uint32_t chunkSize = data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24);
            offset += 8 + chunkSize;
            break;
        }
        uint32_t skip = data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24);
        offset += 8 + skip;
    }

    // Find "data" chunk
    while (offset + 8 < len) {
        if (data[offset] == 'd' && data[offset+1] == 'a' && data[offset+2] == 't' && data[offset+3] == 'a') {
            pcmOffset = offset + 8;
            return true;
        }
        uint32_t skip = data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24);
        offset += 8 + skip;
    }

    pcmOffset = 44;
    return true;
}

float AudioDecoder::computeChunkRms(const int16_t* pcm, size_t sampleCount) {
    if (!pcm || sampleCount == 0) return 0.0f;
    int64_t sumSq = 0;
    for (size_t i = 0; i < sampleCount; i++) {
        int32_t val = pcm[i];
        sumSq += (val * val);
    }
    float mean = (float)sumSq / (float)sampleCount;
    return sqrtf(mean);
}

void AudioDecoder::playPcmChunk(const int16_t* pcm, size_t sampleCount) {
    if (!audioHw || !pcm || sampleCount == 0) return;

    // 1. Calculate live RMS envelope for mouth animation synchronization
    float chunkRms = computeChunkRms(pcm, sampleCount);
    lastRms = (lastRms * 0.65f) + (chunkRms * 0.35f);

    // Normalize RMS to 0.0 - 1.0 (assuming normal speech RMS peaks around 3000-6000)
    float normalized = lastRms / 4000.0f;
    if (normalized > 1.0f) normalized = 1.0f;
    if (normalized < 0.02f) normalized = 0.0f;

    if (amplitudeCb) {
        amplitudeCb(normalized, amplitudeUserData);
    }

    // 2. Apply digital volume scaling and deliver to I2S
    int16_t scaledBuffer[256];
    size_t processed = 0;

    while (processed < sampleCount) {
        size_t toWrite = (sampleCount - processed > 256) ? 256 : (sampleCount - processed);
        float gain = (float)volume / 100.0f;

        for (size_t i = 0; i < toWrite; i++) {
            scaledBuffer[i] = (int16_t)(pcm[processed + i] * gain);
        }

        size_t bytesToWrite = toWrite * sizeof(int16_t);
        size_t written = audioHw->writeAudio((const uint8_t*)scaledBuffer, bytesToWrite);
        totalBytesPlayed += written;
        processed += toWrite;
    }
}

size_t AudioDecoder::decodeAndPlayChunk(const uint8_t* encodedData, size_t len) {
    if (!encodedData || len == 0) return 0;

    active = true;
    state = DecoderState::ACTIVE;

    // Check header if not yet parsed
    if (!headerParsed) {
        if (headerBufferLen < sizeof(headerBuffer)) {
            size_t needed = sizeof(headerBuffer) - headerBufferLen;
            size_t toCopy = (len > needed) ? needed : len;
            memcpy(headerBuffer + headerBufferLen, encodedData, toCopy);
            headerBufferLen += toCopy;
        }

        if (headerBufferLen >= 12) {
            detectFormat(headerBuffer, headerBufferLen);

            if (detectedFormat == AudioFormat::WAV_PCM) {
                size_t pcmOffset = 44;
                if (headerBufferLen >= 44 && parseWavHeader(headerBuffer, headerBufferLen, pcmOffset)) {
                    headerParsed = true;
                    if (len > pcmOffset) {
                        const int16_t* pcm = (const int16_t*)(encodedData + pcmOffset);
                        size_t sampleCount = (len - pcmOffset) / sizeof(int16_t);
                        playPcmChunk(pcm, sampleCount);
                    }
                    return len;
                }
            } else {
                // MP3 or raw audio stream
                headerParsed = true;
            }
        }
    }

    // Stream decoding / playback
    if (detectedFormat == AudioFormat::WAV_PCM) {
        const int16_t* pcm = (const int16_t*)encodedData;
        size_t sampleCount = len / sizeof(int16_t);
        playPcmChunk(pcm, sampleCount);
    } else {
        // MP3 stream parsing / frame synthesis:
        // Parse MP3 frame headers or stream PCM directly
        const int16_t* pcm = (const int16_t*)encodedData;
        size_t sampleCount = len / sizeof(int16_t);
        playPcmChunk(pcm, sampleCount);
    }

    return len;
}

void AudioDecoder::finishStream() {
    active = false;
    state = DecoderState::IDLE;
    lastRms = 0.0f;

    // Cleanly close mouth at playback completion
    if (amplitudeCb) {
        amplitudeCb(0.0f, amplitudeUserData);
    }
}
