#include "VoiceQueue.h"

const char* voiceModeToString(VoiceMode mode) {
    switch (mode) {
        case VoiceMode::NORMAL_SPEECH: return "NORMAL_SPEECH";
        case VoiceMode::EXCITED_SPEECH: return "EXCITED_SPEECH";
        case VoiceMode::SAD_SPEECH: return "SAD_SPEECH";
        case VoiceMode::QUIET_SPEECH: return "QUIET_SPEECH";
        case VoiceMode::SINGING: return "SINGING";
        default: return "NORMAL_SPEECH";
    }
}

VoiceMode parseVoiceMode(const char* str) {
    if (!str) return VoiceMode::NORMAL_SPEECH;
    String s(str);
    s.toUpperCase();
    if (s.indexOf("EXCITED") != -1) return VoiceMode::EXCITED_SPEECH;
    if (s.indexOf("SAD") != -1) return VoiceMode::SAD_SPEECH;
    if (s.indexOf("QUIET") != -1) return VoiceMode::QUIET_SPEECH;
    if (s.indexOf("SING") != -1) return VoiceMode::SINGING;
    return VoiceMode::NORMAL_SPEECH;
}

VoiceQueue::VoiceQueue() : count(0) {
    clear();
}

bool VoiceQueue::enqueue(const char* text, const char* language, uint8_t priority, VoiceMode mode) {
    if (!text || strlen(text) == 0 || isFull()) return false;

    VoiceQueueItem newItem;
    memset(&newItem, 0, sizeof(VoiceQueueItem));
    strncpy(newItem.text, text, sizeof(newItem.text) - 1);
    strncpy(newItem.language, (language && strlen(language) > 0) ? language : "en", sizeof(newItem.language) - 1);
    newItem.priority = priority;
    newItem.mode = mode;
    newItem.cancelled = false;
    newItem.queuedTimestamp = millis();

    // Insert sorted by priority (lowest number = highest priority)
    size_t insertIdx = count;
    for (size_t i = 0; i < count; i++) {
        if (priority < items[i].priority) {
            insertIdx = i;
            break;
        }
    }

    // Shift items
    for (size_t i = count; i > insertIdx; i--) {
        items[i] = items[i - 1];
    }
    items[insertIdx] = newItem;
    count++;
    return true;
}

bool VoiceQueue::dequeue(VoiceQueueItem& item) {
    if (isEmpty()) return false;
    item = items[0];
    for (size_t i = 0; i < count - 1; i++) {
        items[i] = items[i + 1];
    }
    count--;
    return true;
}

bool VoiceQueue::peek(VoiceQueueItem& item) const {
    if (isEmpty()) return false;
    item = items[0];
    return true;
}

void VoiceQueue::clear() {
    for (size_t i = 0; i < MAX_QUEUE_SIZE; i++) {
        items[i].cancelled = true;
    }
    count = 0;
}
