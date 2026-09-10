#ifndef TARA_AUDIOHARDWARE_H
#define TARA_AUDIOHARDWARE_H

#include <Arduino.h>
#include <driver/i2s.h>
#include "HardwareConfig.h"

class AudioHardware {
public:
    AudioHardware(int8_t bclk = TaraPins::I2S_BCLK,
                  int8_t lrc  = TaraPins::I2S_LRC,
                  int8_t dout = TaraPins::I2S_DOUT,
                  int8_t din  = TaraPins::I2S_DIN);
    ~AudioHardware();

    bool begin(uint32_t sampleRate = 16000);
    void setVolume(uint8_t volumePercent); // 0 - 100
    uint8_t getVolume() const { return volume; }

    // Speaker playback
    size_t writeAudio(const uint8_t* pcmData, size_t bytes);
    void playChirp(uint16_t freqHz, uint16_t durationMs);
    void playStateSound(uint8_t soundId);

    // Microphone capture
    size_t readMicrophone(int16_t* buffer, size_t samples);

    bool isMicReady() const { return micInitialized; }
    bool isSpeakerReady() const { return speakerInitialized; }

private:
    int8_t bclkPin;
    int8_t lrcPin;
    int8_t doutPin;
    int8_t dinPin;
    uint8_t volume;
    bool micInitialized;
    bool speakerInitialized;

    void installI2S();
};

#endif // TARA_AUDIOHARDWARE_H
