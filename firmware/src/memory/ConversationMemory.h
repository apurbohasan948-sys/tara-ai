#ifndef TARA_CONVERSATIONMEMORY_H
#define TARA_CONVERSATIONMEMORY_H

#include <Arduino.h>

struct ConversationTurn {
    char user[128];
    char assistant[128];
    uint32_t timestamp;
    bool active;
};

class ConversationMemory {
public:
    static constexpr size_t MAX_TURNS = 4; // Lightweight for standard ESP32 SRAM

    ConversationMemory();

    void addTurn(const char* userMsg, const char* assistantMsg);
    void clear();

    size_t getTurnCount() const { return count; }
    const ConversationTurn* getTurn(size_t index) const;

private:
    ConversationTurn turns[MAX_TURNS];
    size_t head;
    size_t count;
};

#endif // TARA_CONVERSATIONMEMORY_H
