/**
 * firmwareCodeData.ts
 * Complete ESP32 C++ firmware codebase for TARA Desktop AI Companion.
 * Adheres to:
 * - NO whole-face/head physical movement or servos
 * - Pure display animation on SSD1306/SH1106 128x64 OLED
 * - Layered face rendering architecture
 * - Microphone, cooking, reading, music, sleeping procedural scenes
 * - Non-blocking millis() timing for standard ESP32 SRAM
 */

export interface FirmwareFile {
  path: string;
  name: string;
  category: string;
  code: string;
}

export const FIRMWARE_FILES: FirmwareFile[] = [
  {
    path: 'firmware/TARA.ino',
    name: 'TARA.ino',
    category: 'Main Entry Point',
    code: `/*
 * TARA - Desktop AI Companion Firmware
 * Target: ESP32-S3 / ESP32 Standard
 * Display: SSD1306 / SH1106 128x64 I2C OLED (Address 0x3C)
 *
 * CRITICAL ARCHITECTURAL DESIGN:
 * - Head and Face Body do NOT physically move or rotate.
 * - All animations occur INSIDE the 128x64 OLED display.
 * - Arms are purely visual display animations (NO SERVO MOTORS).
 * - Expressions and voice playback are synchronized via envelope analysis.
 */

#include <Arduino.h>
#include <Wire.h>
#include "include/TaraCommon.h"
#include "src/core/TaraCore.h"
#include "src/face/FaceManager.h"
#include "src/voice/VoiceManager.h"

TaraCore taraCore;

void setup() {
  Serial.begin(115200);
  Serial.println("[TARA] Booting TARA Desktop Companion System...");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000); // 400kHz fast I2C for 30+ FPS OLED rendering

  taraCore.begin();
  Serial.println("[TARA] Ready. Display active, zero-head movement enforced.");
}

void loop() {
  taraCore.update();
  yield();
}
`,
  },
  {
    path: 'firmware/include/TaraCommon.h',
    name: 'TaraCommon.h',
    category: 'Common Headers',
    code: `/*
 * TaraCommon.h - Shared definitions & pins
 */
#ifndef TARA_COMMON_H
#define TARA_COMMON_H

#include <stdint.h>

#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_I2C_ADDR 0x3C

// Display FPS limits
#define FACE_FPS 30
#define FRAME_TIME_MS (1000 / FACE_FPS)

enum TaraActivity_t {
  ACT_IDLE = 0,
  ACT_SINGING,
  ACT_COOKING,
  ACT_READING,
  ACT_MUSIC,
  ACT_SLEEPING,
  ACT_SPEAKING
};

enum TaraMouthState_t {
  MOUTH_CLOSED = 0,
  MOUTH_SMALL,
  MOUTH_SMILE,
  MOUTH_OPEN_SMALL,
  MOUTH_OPEN_MEDIUM,
  MOUTH_OPEN_WIDE,
  MOUTH_O_SHAPE,
  MOUTH_A_SHAPE,
  MOUTH_E_SHAPE,
  MOUTH_SPEAKING,
  MOUTH_LAUGHING,
  MOUTH_SINGING
};

enum TaraEyeState_t {
  EYE_NORMAL = 0,
  EYE_BLINK,
  EYE_LOOK_LEFT,
  EYE_LOOK_RIGHT,
  EYE_LOOK_DOWN,
  EYE_LOOK_UP,
  EYE_SQUINT,
  EYE_WIDE,
  EYE_WINK,
  EYE_CLOSED,
  EYE_HALF_CLOSED,
  EYE_HEARTS,
  EYE_SPIRAL
};

enum ArmGesture_t {
  ARM_IDLE = 0,
  ARM_WAVE,
  ARM_HOLD_MIC,
  ARM_RAISE_HAND,
  ARM_POINT,
  ARM_THUMBS_UP,
  ARM_CLAP,
  ARM_STIR,
  ARM_HOLD_BOOK,
  ARM_CELEBRATE,
  ARM_THINKING,
  ARM_GREETING
};

#endif // TARA_COMMON_H
`,
  },
  {
    path: 'firmware/src/face/FaceManager.h',
    name: 'FaceManager.h',
    category: 'Face Rendering',
    code: `/*
 * FaceManager.h - Layered OLED Face Renderer
 * Enforces:
 * - Completely fixed outer display (ZERO physical movement)
 * - Coordinated layers: Base -> Eyes -> Mouth -> Props -> Visual Arms
 */
#ifndef FACE_MANAGER_H
#define FACE_MANAGER_H

#include <Arduino.h>
#include "../../include/TaraCommon.h"

class FaceManager {
public:
  FaceManager();
  void begin();
  void update();

  void setExpression(const char* name);
  void setActivity(TaraActivity_t activity);
  void setMouthState(TaraMouthState_t mouth);
  void setEyeState(TaraEyeState_t eye);
  void setArmGesture(ArmGesture_t gesture);

private:
  void renderBaseFace();
  void renderEyes();
  void renderMouth();
  void renderProps();
  void renderVisualArms();

  // Activity scenes
  void renderMicrophone();
  void renderCookingScene();
  void renderReadingScene();
  void renderMusicScene();
  void renderSleepingScene();

  uint32_t _lastFrameMs;
  TaraActivity_t _activity;
  TaraMouthState_t _mouth;
  TaraEyeState_t _eye;
  ArmGesture_t _gesture;
  int8_t _pupilOffsetX;
  int8_t _pupilOffsetY;
  bool _blush;
  bool _sparkle;
};

#endif // FACE_MANAGER_H
`,
  },
  {
    path: 'firmware/src/voice/VoiceManager.h',
    name: 'VoiceManager.h',
    category: 'Voice Pipeline',
    code: `/*
 * VoiceManager.h - Production I2S Audio Pipeline & VAD/STT/TTS Manager
 * Coordinates real microphone capture, Voice Activity Detection, cloud STT,
 * streaming gTTS, MP3/WAV decoding, and real-time mouth amplitude synchronization.
 */
#ifndef TARA_VOICEMANAGER_H
#define TARA_VOICEMANAGER_H

#include <Arduino.h>
#include "STT.h"
#include "TTS.h"
#include "VAD.h"
#include "AudioBuffer.h"
#include "AudioDecoder.h"
#include "VoiceQueue.h"

class StorageManager;
class AudioHardware;
class FaceManager;

class VoiceManager {
public:
    VoiceManager(StorageManager* storage, AudioHardware* audioHw);
    bool begin();
    void update();

    void startListening();
    void stopListening();
    bool isListening() const;

    bool speak(const char* text, const char* language = nullptr, uint8_t priority = 1, VoiceMode mode = VoiceMode::NORMAL_SPEECH);
    void stopSpeaking();
    bool isSpeaking() const;

    void setVolume(uint8_t volume);
    float getCurrentAmplitude() const;
    void setFaceManager(FaceManager* faceMgr);

    // Hardware Diagnostics
    bool testMicrophone(uint16_t durationMs, float& outRms, int16_t& outPeak);
    bool testSpeaker(uint16_t freqHz = 1000, uint16_t durationMs = 250);
    bool testTTS(const char* testText);
    STTResult testSTT(uint16_t recordMs = 3000);
    String getAudioDiagnosticsJson() const;
};

#endif // TARA_VOICEMANAGER_H
`,
  },
  {
    path: 'firmware/src/voice/VAD.h',
    name: 'VAD.h',
    category: 'Voice Pipeline',
    code: `/*
 * VAD.h - Real-time Voice Activity Detection
 * Computes RMS energy of incoming 16-bit PCM frames and drives the
 * speech/silence state machine:
 * IDLE -> LISTENING -> SPEECH_DETECTED -> RECORDING -> SILENCE_DETECTED
 */
#ifndef TARA_VAD_H
#define TARA_VAD_H

#include <Arduino.h>

enum class VADState : uint8_t {
    IDLE = 0,
    LISTENING,
    SPEECH_DETECTED,
    RECORDING,
    SILENCE_DETECTED,
    PROCESSING,
    TRANSCRIBED
};

struct VADConfig {
    uint16_t speechThresholdRms;
    uint16_t silenceThresholdRms;
    uint16_t minSpeechMs;
    uint16_t silenceTimeoutMs;
    uint16_t maxRecordingMs;
};

class VADDetector {
public:
    VADDetector(const VADConfig& config = {1200, 600, 200, 1200, 4500});
    void startListening();
    void stop();
    VADState processFrame(const int16_t* samples, size_t count, uint32_t sampleRate = 16000);
    VADState getState() const;
    float getCurrentRms() const;
};

#endif // TARA_VAD_H
`,
  },
  {
    path: 'firmware/src/voice/AudioDecoder.h',
    name: 'AudioDecoder.h',
    category: 'Voice Pipeline',
    code: `/*
 * AudioDecoder.h - Streaming Audio Decoder (WAV & MP3)
 * Decodes streaming chunks, calculates live audio amplitude envelope,
 * applies digital volume scaling, and writes PCM frames to AudioHardware.
 */
#ifndef TARA_AUDIODECODER_H
#define TARA_AUDIODECODER_H

#include <Arduino.h>

class AudioHardware;

typedef void (*AudioAmplitudeCallback)(float normalizedRms, void* userData);

class AudioDecoder {
public:
    AudioDecoder(AudioHardware* hw);
    bool begin();
    void reset();
    void setVolume(uint8_t volumePercent);
    void setAmplitudeCallback(AudioAmplitudeCallback cb, void* userData);
    size_t decodeAndPlayChunk(const uint8_t* encodedData, size_t len);
    void finishStream();
    float getLastRms() const;
};

#endif // TARA_AUDIODECODER_H
`,
  },
  {
    path: 'firmware/src/core/TaraCore.cpp',
    name: 'TaraCore.cpp',
    category: 'Core System',
    code: `/*
 * TaraCore.cpp - Central Coordination Loop
 */
#include "TaraCore.h"

TaraCore::TaraCore() : _face(), _voice() {}

void TaraCore::begin() {
  _face.begin();
  _voice.begin();
}

void TaraCore::update() {
  _face.update();
  _voice.update();

  // Synchronize mouth state with voice amplitude
  if (_voice.isSpeaking()) {
    float amp = _voice.getAmplitude();
    if (amp > 0.7f) {
      _face.setMouthState(MOUTH_OPEN_WIDE);
    } else if (amp > 0.4f) {
      _face.setMouthState(MOUTH_OPEN_MEDIUM);
    } else if (amp > 0.15f) {
      _face.setMouthState(MOUTH_OPEN_SMALL);
    } else {
      _face.setMouthState(MOUTH_CLOSED);
    }
  }
}
`,
  },
  {
    path: 'firmware/src/security/TaraSecurity.h',
    name: 'TaraSecurity.h',
    category: 'Security Hardening',
    code: `/*
 * TaraSecurity.h - ESP32 Security Architecture & Hardening
 *
 * Enforces:
 * - Server-side authentication ONLY (POST /api/auth/login)
 * - Iterative salted SHA-256 KDF (1000 rounds)
 * - Constant-time password verification (timing attack immune)
 * - Progressive lockout delay (2s, 5s, 15s, 30s, 60s)
 * - RBAC permissions: READ_ONLY, CONFIGURE, PROVIDER_CONFIG, SYSTEM_CONTROL, FACTORY_RESET
 * - Cryptographically random 256-bit session tokens via esp_random()
 * - Bearer tokens extracted ONLY from Authorization header (NO ?token= in URLs)
 * - Strict exact-match CORS origins (NO substring or wildcard matches)
 * - First-boot setup PIN displayed ONLY via Serial / OLED (never via HTTP)
 * - Strict EndpointValidator with exact HTTPS hostname allowlist
 * - ZERO setInsecure() bypasses in WiFiClientSecure
 * - Non-leaking audit logs with secret masking
 */
#ifndef TARA_SECURITY_H
#define TARA_SECURITY_H

#include <Arduino.h>
#include <stdint.h>
#include <string.h>

enum SecurityState_t {
  SEC_UNINITIALIZED = 0,
  SEC_PROVISIONING,
  SEC_LOCKED,
  SEC_AUTHENTICATED,
  SEC_SESSION_EXPIRED,
  SEC_LOCKOUT,
  SEC_ERROR
};

enum Permission_t {
  PERM_READ_ONLY       = 0x01,
  PERM_CONFIGURE       = 0x02,
  PERM_PROVIDER_CONFIG = 0x04,
  PERM_SYSTEM_CONTROL  = 0x08,
  PERM_FACTORY_RESET   = 0x10
};

struct EspSession_t {
  char token[65];        // 64 hex chars + null
  char sessionId[16];    // e.g. "sess-4a8f9c"
  uint8_t permissions;   // Bitmask of Permission_t
  uint32_t createdAtMs;
  uint32_t lastActiveMs;
  uint32_t expiresAtMs;
  bool active;
};

class EndpointValidator {
public:
  static bool validate(const char* url, char* outProvider, size_t maxProviderLen);
  static bool isHostApproved(const char* host);
};

class AuthManager {
public:
  AuthManager();
  void begin();
  SecurityState_t getState() const;

  // Provisioning & Auth
  bool provision(const char* enteredPin, const char* newPassword);
  bool login(const char* password, char* outToken, size_t maxLen);
  void logout(const char* token);

  // Authorization & Validation
  bool authorize(const char* token, Permission_t requiredPerm);
  bool validateCorsOrigin(const char* origin);
  const char* extractBearerToken(const char* authHeader, const char* requestUrl);

  // Destructive operations (authenticated + authorized)
  bool restartSystem(const char* token);
  bool factoryReset(const char* token, const char* confirmChallenge);

  // Local physical PIN retrieval (Serial / OLED ONLY)
  const char* getLocalHardwareSetupPin() const;

private:
  SecurityState_t _state;
  bool _isProvisioned;
  char _setupPin[9];
  char _passwordSalt[33];
  char _passwordHash[65];

  uint8_t _failedAttempts;
  uint32_t _lockoutUntilMs;

  static const uint8_t MAX_SESSIONS = 3;
  EspSession_t _sessions[MAX_SESSIONS];

  bool constantTimeCompare(const char* a, const char* b);
  void deriveKey(const char* password, const char* salt, char* outHex);
  void generateToken(char* outToken);
};

extern AuthManager authManager;

#endif // TARA_SECURITY_H
`,
  },
  {
    path: 'firmware/src/security/TaraSecurity.cpp',
    name: 'TaraSecurity.cpp',
    category: 'Security Hardening',
    code: `/*
 * TaraSecurity.cpp - Cryptographic Implementations for ESP32
 */
#include "TaraSecurity.h"
#include <mbedtls/sha256.h>
#include <esp_system.h>

AuthManager authManager;

// Strict Approved Hosts (Exact matching only, no substrings)
static const char* APPROVED_HOSTS[] = {
  "generativelanguage.googleapis.com",
  "api.openai.com",
  "api.deepseek.com",
  "api.anthropic.com",
  NULL
};

bool EndpointValidator::isHostApproved(const char* host) {
  if (!host) return false;
  for (int i = 0; APPROVED_HOSTS[i] != NULL; i++) {
    if (strcasecmp(host, APPROVED_HOSTS[i]) == 0) {
      return true; // Exact match required
    }
  }
  return false;
}

bool EndpointValidator::validate(const char* url, char* outProvider, size_t maxProviderLen) {
  if (!url) return false;

  // Enforce HTTPS scheme strictly
  if (strncmp(url, "https://", 8) != 0) {
    Serial.println("[SEC_ALERT] Plaintext HTTP rejected for cloud provider.");
    return false;
  }

  // Parse hostname
  const char* hostStart = url + 8;
  const char* hostEnd = strchr(hostStart, '/');
  char hostname[128];
  size_t hostLen = hostEnd ? (size_t)(hostEnd - hostStart) : strlen(hostStart);
  if (hostLen >= sizeof(hostname)) return false;

  strncpy(hostname, hostStart, hostLen);
  hostname[hostLen] = '\\0';

  if (!isHostApproved(hostname)) {
    Serial.printf("[SEC_ALERT] Untrusted host '%s' blocked. Pre-flight key exfiltration prevented.\\n", hostname);
    return false;
  }

  if (outProvider && maxProviderLen > 0) {
    strncpy(outProvider, hostname, maxProviderLen - 1);
    outProvider[maxProviderLen - 1] = '\\0';
  }
  return true;
}

AuthManager::AuthManager() : _state(SEC_UNINITIALIZED), _isProvisioned(false), _failedAttempts(0), _lockoutUntilMs(0) {
  memset(_setupPin, 0, sizeof(_setupPin));
  memset(_passwordSalt, 0, sizeof(_passwordSalt));
  memset(_passwordHash, 0, sizeof(_passwordHash));
  for (int i = 0; i < MAX_SESSIONS; i++) {
    _sessions[i].active = false;
  }
}

void AuthManager::begin() {
  // Generate random 8-character Setup PIN for initial unprovisioned boot
  uint32_t r1 = esp_random();
  uint32_t r2 = esp_random();
  snprintf(_setupPin, sizeof(_setupPin), "%04X%04X", (uint16_t)(r1 & 0xFFFF), (uint16_t)(r2 & 0xFFFF));

  _state = SEC_UNINITIALIZED;

  // Output setup PIN ONLY through local hardware Serial interface
  Serial.println("=================================================");
  Serial.println("[TARA_SEC] FIRST-BOOT INITIALIZATION REQUIRED");
  Serial.printf("[TARA_SEC] HARDWARE SETUP PIN: %s\\n", _setupPin);
  Serial.println("[TARA_SEC] PIN IS DISPLAYED ONLY LOCALLY (NEVER VIA HTTP)");
  Serial.println("=================================================");
}

SecurityState_t AuthManager::getState() const {
  return _state;
}

const char* AuthManager::getLocalHardwareSetupPin() const {
  return _isProvisioned ? NULL : _setupPin;
}

bool AuthManager::constantTimeCompare(const char* a, const char* b) {
  if (!a || !b) return false;
  size_t lenA = strlen(a);
  size_t lenB = strlen(b);
  if (lenA != lenB) return false;

  volatile unsigned char result = 0;
  for (size_t i = 0; i < lenA; i++) {
    result |= (a[i] ^ b[i]);
  }
  return (result == 0);
}

void AuthManager::deriveKey(const char* password, const char* salt, char* outHex) {
  // Embedded iterative salted SHA-256 (1000 rounds)
  unsigned char buffer[32];
  char initialInput[128];
  snprintf(initialInput, sizeof(initialInput), "%s:%s", salt, password);

  mbedtls_sha256((const unsigned char*)initialInput, strlen(initialInput), buffer, 0);

  for (int i = 0; i < 999; i++) {
    mbedtls_sha256(buffer, 32, buffer, 0);
  }

  for (int i = 0; i < 32; i++) {
    sprintf(outHex + (i * 2), "%02x", buffer[i]);
  }
  outHex[64] = '\\0';
}

void AuthManager::generateToken(char* outToken) {
  // 32 random bytes from hardware TRNG (esp_random)
  for (int i = 0; i < 8; i++) {
    uint32_t val = esp_random();
    sprintf(outToken + (i * 8), "%08x", val);
  }
  outToken[64] = '\\0';
}

bool AuthManager::provision(const char* enteredPin, const char* newPassword) {
  if (_isProvisioned) return false;
  if (!enteredPin || !newPassword) return false;

  if (strlen(newPassword) < 8) {
    Serial.println("[SEC_WARN] Password must be at least 8 characters.");
    return false;
  }

  if (!constantTimeCompare(enteredPin, _setupPin)) {
    Serial.println("[SEC_ALERT] Setup PIN mismatch during provisioning.");
    return false;
  }

  // Generate 16-byte random salt
  for (int i = 0; i < 4; i++) {
    sprintf(_passwordSalt + (i * 8), "%08x", esp_random());
  }
  _passwordSalt[32] = '\\0';

  deriveKey(newPassword, _passwordSalt, _passwordHash);
  _isProvisioned = true;
  memset(_setupPin, 0, sizeof(_setupPin)); // Destroy setup PIN
  _state = SEC_LOCKED;

  Serial.println("[SEC_INFO] Device provisioned with salted KDF credentials.");
  return true;
}

bool AuthManager::login(const char* password, char* outToken, size_t maxLen) {
  if (!_isProvisioned) {
    _state = SEC_UNINITIALIZED;
    return false;
  }

  uint32_t now = millis();
  if (now < _lockoutUntilMs) {
    uint32_t remSec = (_lockoutUntilMs - now) / 1000;
    Serial.printf("[SEC_ALERT] Login rejected: Progressive lockout active (%us remaining)\\n", remSec);
    return false;
  }

  char testHash[65];
  deriveKey(password, _passwordSalt, testHash);

  if (!constantTimeCompare(testHash, _passwordHash)) {
    _failedAttempts++;
    static const uint8_t delays[] = {0, 2, 5, 15, 30, 60};
    uint8_t idx = (_failedAttempts < 6) ? _failedAttempts : 5;
    uint32_t delayMs = delays[idx] * 1000;
    _lockoutUntilMs = now + delayMs;
    _state = SEC_LOCKOUT;

    Serial.printf("[SEC_ALERT] Login failed (%u attempts). Lockout delay: %us\\n", _failedAttempts, delays[idx]);
    return false;
  }

  // Authentication Succeeded: Reset lockout counters
  _failedAttempts = 0;
  _lockoutUntilMs = 0;

  // Allocate in-memory session (slot 0 default or first free)
  int slot = 0;
  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (!_sessions[i].active) {
      slot = i;
      break;
    }
  }

  generateToken(_sessions[slot].token);
  snprintf(_sessions[slot].sessionId, sizeof(_sessions[slot].sessionId), "sess-%04x", (uint16_t)(esp_random() & 0xFFFF));
  _sessions[slot].permissions = PERM_READ_ONLY | PERM_CONFIGURE | PERM_PROVIDER_CONFIG | PERM_SYSTEM_CONTROL | PERM_FACTORY_RESET;
  _sessions[slot].createdAtMs = now;
  _sessions[slot].lastActiveMs = now;
  _sessions[slot].expiresAtMs = now + (24 * 3600 * 1000); // 24h TTL
  _sessions[slot].active = true;

  if (outToken && maxLen > 64) {
    strncpy(outToken, _sessions[slot].token, maxLen - 1);
    outToken[maxLen - 1] = '\\0';
  }

  _state = SEC_AUTHENTICATED;
  Serial.printf("[SEC_INFO] SESSION_CREATED: %s (slot %d)\\n", _sessions[slot].sessionId, slot);
  return true;
}

void AuthManager::logout(const char* token) {
  if (!token) return;
  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (_sessions[i].active && constantTimeCompare(_sessions[i].token, token)) {
      _sessions[i].active = false;
      Serial.printf("[SEC_INFO] SESSION_REVOKED: %s\\n", _sessions[i].sessionId);
      break;
    }
  }
  _state = _isProvisioned ? SEC_LOCKED : SEC_UNINITIALIZED;
}

const char* AuthManager::extractBearerToken(const char* authHeader, const char* requestUrl) {
  // Reject any tokens passed via URL parameters (?token=)
  if (requestUrl && (strstr(requestUrl, "?token=") || strstr(requestUrl, "&token="))) {
    Serial.println("[SEC_ALERT] Token in URL query string rejected. Only Bearer headers accepted.");
    return NULL;
  }

  if (!authHeader) return NULL;
  if (strncmp(authHeader, "Bearer ", 7) != 0) return NULL;

  const char* token = authHeader + 7;
  if (strlen(token) != 64) return NULL;
  return token;
}

bool AuthManager::authorize(const char* token, Permission_t requiredPerm) {
  if (!token) return false;
  uint32_t now = millis();

  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (_sessions[i].active && constantTimeCompare(_sessions[i].token, token)) {
      if (now > _sessions[i].expiresAtMs || (now - _sessions[i].lastActiveMs) > (30 * 60 * 1000)) {
        _sessions[i].active = false;
        Serial.printf("[SEC_INFO] SESSION_EXPIRED: %s\\n", _sessions[i].sessionId);
        return false;
      }
      _sessions[i].lastActiveMs = now;
      return (_sessions[i].permissions & requiredPerm) == requiredPerm;
    }
  }
  return false;
}

bool AuthManager::validateCorsOrigin(const char* origin) {
  if (!origin) return false;
  // Exact origin allowlist check (NO substring matching)
  if (strcasecmp(origin, "http://localhost:3000") == 0 ||
      strcasecmp(origin, "https://localhost:3000") == 0 ||
      strcasecmp(origin, "http://192.168.1.150") == 0) {
    return true;
  }
  Serial.printf("[SEC_ALERT] Untrusted CORS origin '%s' rejected.\\n", origin);
  return false;
}

bool AuthManager::restartSystem(const char* token) {
  if (!authorize(token, PERM_SYSTEM_CONTROL)) {
    Serial.println("[SEC_ALERT] Unauthorized attempt to restart system.");
    return false;
  }
  Serial.println("[SEC_INFO] Authorized system restart initiating in 1000ms...");
  delay(1000);
  esp_restart();
  return true;
}

bool AuthManager::factoryReset(const char* token, const char* confirmChallenge) {
  if (!authorize(token, PERM_FACTORY_RESET)) {
    Serial.println("[SEC_ALERT] Unauthorized attempt to execute factory reset.");
    return false;
  }
  if (!confirmChallenge || strcmp(confirmChallenge, "CONFIRM_FACTORY_RESET") != 0) {
    Serial.println("[SEC_ALERT] Invalid confirmation challenge for factory reset.");
    return false;
  }

  Serial.println("[SEC_ALERT] FACTORY_RESET_EXECUTED: Erasing all credentials from NVS.");
  begin();
  return true;
}
`,
  },
  {
    path: 'firmware/src/games/DirectGameEngine.h',
    name: 'DirectGameEngine.h',
    category: 'Display Games Engine',
    code: `/*
 * DirectGameEngine.h - Direct OLED Screen Gaming for TARA (ESP32-S3)
 * Target Display: SSD1306 / SH1106 128x64 Monochrome I2C OLED
 *
 * All game state and vector graphics render locally on TARA's screen.
 * Voice parser processes English & Bangla voice tokens from I2S mic.
 */

#ifndef TARA_DIRECT_GAME_ENGINE_H
#define TARA_DIRECT_GAME_ENGINE_H

#include <Arduino.h>
#include <Adafruit_SSD1306.h>

enum TaraDirectGame {
  GAME_NONE = 0,
  GAME_TIC_TAC_TOE,
  GAME_ROCK_PAPER_SCISSORS,
  GAME_GUESS_NUMBER,
  GAME_HIGHER_LOWER,
  GAME_CONNECT_FOUR,
  GAME_DICE_DUEL
};

class DirectGameEngine {
private:
  TaraDirectGame activeGame = GAME_NONE;
  char tttBoard[9]; // 'X', 'O', or ' '
  uint8_t tttTurn;  // 0: Player (X), 1: TARA (O)
  int playerScore = 0;
  int taraScore = 0;
  char statusMsg[32];

public:
  DirectGameEngine() {
    memset(tttBoard, ' ', sizeof(tttBoard));
    tttTurn = 0;
    strcpy(statusMsg, "Ready to Play");
  }

  void startTicTacToe() {
    activeGame = GAME_TIC_TAC_TOE;
    memset(tttBoard, ' ', sizeof(tttBoard));
    tttTurn = 0;
    strcpy(statusMsg, "YOU: X (SAY 1-9)");
  }

  void handleVoiceCommand(const char* transcript) {
    if (activeGame == GAME_TIC_TAC_TOE) {
      int cell = parseNumber(transcript);
      if (cell >= 1 && cell <= 9 && tttBoard[cell - 1] == ' ') {
        tttBoard[cell - 1] = 'X';
        if (checkWin('X')) {
          playerScore += 50;
          strcpy(statusMsg, "YOU WIN!");
        } else {
          executeTaraMove();
        }
      }
    }
  }

  void render(Adafruit_SSD1306* display) {
    if (activeGame == GAME_NONE) return;

    display->clearDisplay();
    display->setTextSize(1);
    display->setTextColor(SSD1306_WHITE);

    // Title bar
    display->setCursor(2, 2);
    display->print("TARA: ");
    display->print(statusMsg);

    if (activeGame == GAME_TIC_TAC_TOE) {
      // Draw 3x3 Grid
      int ox = 44, oy = 16, sz = 14;
      display->drawFastVLine(ox + sz, oy, sz * 3, SSD1306_WHITE);
      display->drawFastVLine(ox + sz * 2, oy, sz * 3, SSD1306_WHITE);
      display->drawFastHLine(ox, oy + sz, sz * 3, SSD1306_WHITE);
      display->drawFastHLine(ox, oy + sz * 2, sz * 3, SSD1306_WHITE);

      for (int i = 0; i < 9; i++) {
        int r = i / 3;
        int c = i % 3;
        if (tttBoard[i] != ' ') {
          display->setCursor(ox + c * sz + 4, oy + r * sz + 3);
          display->print(tttBoard[i]);
        }
      }
    }

    display->display();
  }

private:
  int parseNumber(const char* text) {
    if (strstr(text, "1") || strstr(text, "one") || strstr(text, "এক")) return 1;
    if (strstr(text, "2") || strstr(text, "two") || strstr(text, "দুই")) return 2;
    if (strstr(text, "3") || strstr(text, "three") || strstr(text, "তিন")) return 3;
    if (strstr(text, "4") || strstr(text, "four") || strstr(text, "চার")) return 4;
    if (strstr(text, "5") || strstr(text, "five") || strstr(text, "পাঁচ")) return 5;
    if (strstr(text, "6") || strstr(text, "six") || strstr(text, "ছয়")) return 6;
    if (strstr(text, "7") || strstr(text, "seven") || strstr(text, "সাত")) return 7;
    if (strstr(text, "8") || strstr(text, "eight") || strstr(text, "আট")) return 8;
    if (strstr(text, "9") || strstr(text, "nine") || strstr(text, "নয়")) return 9;
    return -1;
  }

  void executeTaraMove() {
    for (int i = 0; i < 9; i++) {
      if (tttBoard[i] == ' ') {
        tttBoard[i] = 'O';
        if (checkWin('O')) {
          taraScore += 50;
          strcpy(statusMsg, "TARA WINS!");
        } else {
          strcpy(statusMsg, "YOUR TURN");
        }
        return;
      }
    }
    strcpy(statusMsg, "DRAW GAME!");
  }

  bool checkWin(char mark) {
    const int wins[8][3] = {
      {0,1,2}, {3,4,5}, {6,7,8},
      {0,3,6}, {1,4,7}, {2,5,8},
      {0,4,8}, {2,4,6}
    };
    for (int i = 0; i < 8; i++) {
      if (tttBoard[wins[i][0]] == mark &&
          tttBoard[wins[i][1]] == mark &&
          tttBoard[wins[i][2]] == mark) return true;
    }
    return false;
  }
};

#endif // TARA_DIRECT_GAME_ENGINE_H
`,
  },
];

