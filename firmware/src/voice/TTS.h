#ifndef TARA_TTS_H
#define TARA_TTS_H

#include <Arduino.h>
#include "VoiceQueue.h"

class AudioHardware;
class AudioDecoder;

enum class TTSState : uint8_t {
    IDLE = 0,
    REQUESTING,
    CONNECTING,
    DOWNLOADING,
    DECODING,
    PLAYING,
    COMPLETED,
    ERROR
};

const char* ttsStateToString(TTSState state);

typedef void (*TTSAmplitudeListener)(float amplitude, void* userData);

class ITTSProvider {
public:
    virtual ~ITTSProvider() {}
    virtual bool begin() = 0;
    virtual bool speak(const char* text, const char* language = "en", VoiceMode mode = VoiceMode::NORMAL_SPEECH) = 0;
    virtual void stop() = 0;
    virtual bool isPlaying() const = 0;
    virtual TTSState getState() const = 0;
    virtual float getCurrentAmplitude() const = 0;
    virtual void setAmplitudeListener(TTSAmplitudeListener listener, void* userData) = 0;
};

// Real Google Translate TTS / HTTPS TTS Streaming Provider
class GttsTTSProvider : public ITTSProvider {
public:
    GttsTTSProvider(AudioHardware* audioHw, AudioDecoder* decoder);
    virtual ~GttsTTSProvider();

    bool begin() override;
    bool speak(const char* text, const char* language = "en", VoiceMode mode = VoiceMode::NORMAL_SPEECH) override;
    void stop() override;
    bool isPlaying() const override { return state == TTSState::PLAYING || state == TTSState::DOWNLOADING || state == TTSState::DECODING; }
    TTSState getState() const override { return state; }
    float getCurrentAmplitude() const override;
    void setAmplitudeListener(TTSAmplitudeListener listener, void* userData) override;

    void setEndpoint(const char* customEndpoint);
    String buildGttsUrl(const char* text, const char* language, VoiceMode mode);

private:
    AudioHardware* audio;
    AudioDecoder* decoder;
    TTSState state;
    bool shouldStop;
    char customEndpointUrl[128];

    TTSAmplitudeListener ampListener;
    void* ampUserData;

    String urlEncode(const char* str);
};

#endif // TARA_TTS_H
