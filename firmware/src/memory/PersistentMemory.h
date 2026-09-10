#ifndef TARA_PERSISTENTMEMORY_H
#define TARA_PERSISTENTMEMORY_H

#include <Arduino.h>

class StorageManager;

class PersistentMemory {
public:
    PersistentMemory(StorageManager* storage);

    bool setFact(const char* key, const char* value);
    String getFact(const char* key, const char* defaultVal = "");
    bool clearAllFacts();

    // Common memory helpers
    String getUserName();
    void setUserName(const char* name);

private:
    StorageManager* storage;
};

#endif // TARA_PERSISTENTMEMORY_H
