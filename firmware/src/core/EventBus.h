#ifndef TARA_EVENTBUS_H
#define TARA_EVENTBUS_H

#include <Arduino.h>
#include "TaraState.h"

enum class EventType : uint8_t {
    STATE_CHANGED = 0,
    WIFI_CONNECTED,
    WIFI_DISCONNECTED,
    WIFI_AP_STARTED,
    AUDIO_RECORDING_START,
    AUDIO_RECORDING_END,
    TTS_PLAYING_START,
    TTS_PLAYING_END,
    BRAIN_THINKING,
    BRAIN_RESPONDED,
    BATTERY_LOW,
    BUTTON_PRESSED
};

struct EventData {
    EventType type;
    RobotState oldState;
    RobotState newState;
    const char* message;
    int32_t value;
};

typedef void (*EventCallback)(const EventData& event, void* context);

class EventBus {
public:
    static const size_t MAX_LISTENERS = 16;

    EventBus();
    bool subscribe(EventType type, EventCallback callback, void* context = nullptr);
    void publish(const EventData& event);
    void publishStateChange(RobotState oldState, RobotState newState, const char* reason = nullptr);

private:
    struct Listener {
        EventType type;
        EventCallback callback;
        void* context;
        bool active;
    };

    Listener listeners[MAX_LISTENERS];
    size_t listenerCount;
};

extern EventBus GlobalEventBus;

#endif // TARA_EVENTBUS_H
