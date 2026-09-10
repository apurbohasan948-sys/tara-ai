#include "EventBus.h"

EventBus GlobalEventBus;

EventBus::EventBus() : listenerCount(0) {
    for (size_t i = 0; i < MAX_LISTENERS; i++) {
        listeners[i].active = false;
        listeners[i].callback = nullptr;
        listeners[i].context = nullptr;
    }
}

bool EventBus::subscribe(EventType type, EventCallback callback, void* context) {
    if (!callback) return false;
    if (listenerCount >= MAX_LISTENERS) {
        Serial.println("[EventBus] Warning: Listener pool full!");
        return false;
    }

    listeners[listenerCount].type = type;
    listeners[listenerCount].callback = callback;
    listeners[listenerCount].context = context;
    listeners[listenerCount].active = true;
    listenerCount++;
    return true;
}

void EventBus::publish(const EventData& event) {
    for (size_t i = 0; i < listenerCount; i++) {
        if (listeners[i].active && listeners[i].type == event.type) {
            if (listeners[i].callback) {
                listeners[i].callback(event, listeners[i].context);
            }
        }
    }
}

void EventBus::publishStateChange(RobotState oldState, RobotState newState, const char* reason) {
    EventData data;
    data.type = EventType::STATE_CHANGED;
    data.oldState = oldState;
    data.newState = newState;
    data.message = reason ? reason : "State change";
    data.value = static_cast<int32_t>(newState);

    Serial.printf("[EventBus] State change: %s -> %s (%s)\n",
                  robotStateToString(oldState),
                  robotStateToString(newState),
                  data.message);

    publish(data);
}
