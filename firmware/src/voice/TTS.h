#ifndef TARA_TTS_H
#define TARA_TTS_H

#include <Arduino.h>

class AudioHardware;

class TTSProvider {
public:
    virtual ~TTSProvider() {}
    virtual bool begin() = 0;
    virtual bool speak(const char* text, const char* language = "en") = 0;
    virtual void stop() = 0;
    virtual bool isPlaying() const = 0;
};

// gTTS (Google Translate TTS HTTP service) implementation
class GttsTTSProvider : public TTSProvider {
public:
    GttsTTSProvider(AudioHardware* audioHw);
    virtual ~GttsTTSProvider();

    bool begin() override;
    bool speak(const char* text, const char* language = "en") override;
    void stop() override;
    bool isPlaying() const override { return playing; }

    String buildGttsUrl(const char* text, const char* language);

private:
    AudioHardware* audio;
    bool playing;
    String urlEncode(const char* str);
};

#endif // TARA_TTS_H
