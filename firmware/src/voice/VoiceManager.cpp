#include "VoiceManager.h"
#include "../storage/StorageManager.h"
#include "../hardware/AudioHardware.h"

VoiceManager::VoiceManager(StorageManager* storageMgr, AudioHardware* hardware)
    : storage(storageMgr),
      audioHw(hardware),
      audioMgr(nullptr),
      stt(nullptr),
      tts(nullptr) {
    audioMgr = new AudioManager(audioHw);
    stt = new CloudSTTProvider(audioHw);
    tts = new GttsTTSProvider(audioHw);
}

VoiceManager::~VoiceManager() {
    if (audioMgr) delete audioMgr;
    if (stt) delete stt;
    if (tts) delete tts;
}

bool VoiceManager::begin() {
    if (storage) {
        storage->loadVoiceConfig(config);
    }
    if (audioMgr) {
        audioMgr->begin();
        audioMgr->setVolume(config.volume);
    }
    if (stt) stt->begin();
    if (tts) tts->begin();

    Serial.println("[VoiceManager] Voice subsystem online.");
    return true;
}

void VoiceManager::update() {
    // Audio streaming update loop
}

void VoiceManager::startListening() {
    if (stt) stt->startListening();
}

void VoiceManager::stopListening() {
    if (stt) stt->stopListening();
}

bool VoiceManager::isListening() const {
    return stt ? stt->isListening() : false;
}

bool VoiceManager::speak(const char* text) {
    if (!tts) return false;
    return tts->speak(text, config.ttsLanguage);
}

void VoiceManager::stopSpeaking() {
    if (tts) tts->stop();
}

bool VoiceManager::isSpeaking() const {
    return tts ? tts->isPlaying() : false;
}

void VoiceManager::setVolume(uint8_t vol) {
    config.volume = vol;
    if (audioMgr) audioMgr->setVolume(vol);
    if (storage) storage->saveVoiceConfig(config);
}

uint8_t VoiceManager::getVolume() const {
    return config.volume;
}

bool VoiceManager::updateConfig(const VoiceConfig& newConfig) {
    config = newConfig;
    if (storage) storage->saveVoiceConfig(config);
    if (audioMgr) audioMgr->setVolume(config.volume);
    return true;
}
