#ifndef TARA_MEMORYMANAGER_H
#define TARA_MEMORYMANAGER_H

#include <Arduino.h>
#include "ConversationMemory.h"
#include "PersistentMemory.h"

class StorageManager;

class MemoryManager {
public:
    MemoryManager(StorageManager* storage);
    ~MemoryManager();

    bool begin();

    ConversationMemory* getConversation() { return conversation; }
    PersistentMemory* getPersistent() { return persistent; }

    void recordTurn(const char* userMsg, const char* assistantMsg);
    void clearAll();

private:
    StorageManager* storage;
    ConversationMemory* conversation;
    PersistentMemory* persistent;
};

#endif // TARA_MEMORYMANAGER_H
