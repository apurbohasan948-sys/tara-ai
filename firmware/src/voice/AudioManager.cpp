#include "AudioManager.h"
#include "../hardware/AudioHardware.h"

AudioManager::AudioManager(AudioHardware* hardware) : hw(hardware) {}

bool AudioManager::begin() {
    if (hw) {
        return hw->begin(16000);
    }
    return false;
}

void AudioManager::setVolume(uint8_t vol) {
    if (hw) hw->setVolume(vol);
}

uint8_t AudioManager::getVolume() const {
    return hw ? hw->getVolume() : 0;
}

void AudioManager::playBeep(uint16_t freq, uint16_t duration) {
    if (hw) hw->playChirp(freq, duration);
}

void AudioManager::playChirp(uint8_t type) {
    if (hw) hw->playStateSound(type);
}
