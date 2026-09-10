#include "MemoryManager.h"

MemoryManager::MemoryManager(StorageManager* storageMgr)
    : storage(storageMgr),
      conversation(nullptr),
      persistent(nullptr) {
    conversation = new ConversationMemory();
    persistent = new PersistentMemory(storageMgr);
}

MemoryManager::~MemoryManager() {
    if (conversation) delete conversation;
    if (persistent) delete persistent;
}

bool MemoryManager::begin() {
    Serial.println("[MemoryManager] Dual-tier memory initialized (SRAM circular + NVS Persistent).");
    return true;
}

void MemoryManager::recordTurn(const char* userMsg, const char* assistantMsg) {
    if (conversation) {
        conversation->addTurn(userMsg, assistantMsg);
    }
}

void MemoryManager::clearAll() {
    if (conversation) conversation->clear();
    if (persistent) persistent->clearAllFacts();
    Serial.println("[MemoryManager] Cleared all memories.");
}
