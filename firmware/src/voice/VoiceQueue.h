#ifndef TARA_VOICEQUEUE_H
#define TARA_VOICEQUEUE_H

#include <Arduino.h>

enum class VoiceMode : uint8_t {
    NORMAL_SPEECH = 0,
    EXCITED_SPEECH,
    SAD_SPEECH,
    QUIET_SPEECH,
    SINGING
};

const char* voiceModeToString(VoiceMode mode);
VoiceMode parseVoiceMode(const char* str);

struct VoiceQueueItem {
    char text[192];
    char language[12];
    uint8_t priority; // 0 = highest, 255 = lowest
    VoiceMode mode;
    bool cancelled;
    uint32_t queuedTimestamp;
};

class VoiceQueue {
public:
    static const size_t MAX_QUEUE_SIZE = 8;

    VoiceQueue();

    bool enqueue(const char* text, const char* language = "en", uint8_t priority = 1, VoiceMode mode = VoiceMode::NORMAL_SPEECH);
    bool dequeue(VoiceQueueItem& item);
    bool peek(VoiceQueueItem& item) const;
    void clear();
    size_t size() const { return count; }
    bool isEmpty() const { return count == 0; }
    bool isFull() const { return count >= MAX_QUEUE_SIZE; }

private:
    VoiceQueueItem items[MAX_QUEUE_SIZE];
    size_t count;
};

#endif // TARA_VOICEQUEUE_H
