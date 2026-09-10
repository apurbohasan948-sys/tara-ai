#ifndef TARA_AUDIOMANAGER_H
#define TARA_AUDIOMANAGER_H

#include <Arduino.h>

class AudioHardware;

class AudioManager {
public:
    AudioManager(AudioHardware* hardware);

    bool begin();
    void setVolume(uint8_t volumePercent);
    uint8_t getVolume() const;

    void playBeep(uint16_t freq = 1000, uint16_t duration = 100);
    void playChirp(uint8_t type);

    AudioHardware* getHardware() { return hw; }

private:
    AudioHardware* hw;
};

#endif // TARA_AUDIOMANAGER_H
