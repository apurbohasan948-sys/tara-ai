#include "PersistentMemory.h"
#include "../storage/StorageManager.h"

PersistentMemory::PersistentMemory(StorageManager* storageMgr)
    : storage(storageMgr) {}

bool PersistentMemory::setFact(const char* key, const char* value) {
    if (!storage || !key || !value) return false;
    return storage->setMemoryValue(key, value);
}

String PersistentMemory::getFact(const char* key, const char* defaultVal) {
    if (!storage || !key) return String(defaultVal);
    return storage->getMemoryValue(key, defaultVal);
}

bool PersistentMemory::clearAllFacts() {
    if (!storage) return false;
    return storage->clearMemory();
}

String PersistentMemory::getUserName() {
    return getFact("owner_name", "Friend");
}

void PersistentMemory::setUserName(const char* name) {
    setFact("owner_name", name);
}
