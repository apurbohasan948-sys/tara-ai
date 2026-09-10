#include "ConversationMemory.h"
#include <string.h>

ConversationMemory::ConversationMemory() : head(0), count(0) {
    clear();
}

void ConversationMemory::clear() {
    head = 0;
    count = 0;
    for (size_t i = 0; i < MAX_TURNS; i++) {
        turns[i].active = false;
        turns[i].user[0] = '\0';
        turns[i].assistant[0] = '\0';
        turns[i].timestamp = 0;
    }
}

void ConversationMemory::addTurn(const char* userMsg, const char* assistantMsg) {
    if (!userMsg || !assistantMsg) return;

    strncpy(turns[head].user, userMsg, sizeof(turns[head].user) - 1);
    turns[head].user[sizeof(turns[head].user) - 1] = '\0';

    strncpy(turns[head].assistant, assistantMsg, sizeof(turns[head].assistant) - 1);
    turns[head].assistant[sizeof(turns[head].assistant) - 1] = '\0';

    turns[head].timestamp = millis();
    turns[head].active = true;

    head = (head + 1) % MAX_TURNS;
    if (count < MAX_TURNS) count++;
}

const ConversationTurn* ConversationMemory::getTurn(size_t index) const {
    if (index >= count) return nullptr;
    // Circular index calculation from oldest to newest
    size_t start = (head + MAX_TURNS - count) % MAX_TURNS;
    size_t actual = (start + index) % MAX_TURNS;
    return &turns[actual];
}
