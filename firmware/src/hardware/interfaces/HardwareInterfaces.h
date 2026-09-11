#ifndef TARA_HARDWAREINTERFACES_H
#define TARA_HARDWAREINTERFACES_H

#include <Arduino.h>

// =============================================================================
// Abstract Interfaces for TARA Hardware Layer
// Enables seamless switching between Real ESP32 Hardware & Hardware-Free Simulation
// =============================================================================

// 1. Display Interface
class IDisplay {
public:
    virtual ~IDisplay() = default;
    virtual bool init() = 0;
    virtual void clear() = 0;
    virtual void update() = 0;
    virtual void drawPixel(int16_t x, int16_t y, uint16_t color) = 0;
    virtual void drawFastHLine(int16_t x, int16_t y, int16_t w, uint16_t color) = 0;
    virtual void drawFastVLine(int16_t x, int16_t y, int16_t h, uint16_t color) = 0;
    virtual void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) = 0;
    virtual void fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint16_t color) = 0;
    virtual void drawString(int16_t x, int16_t y, const char* str) = 0;
    virtual uint8_t* getBuffer() = 0;
    virtual bool isSimulated() const = 0;
};

// 2. Microphone Interface
class IMicrophone {
public:
    virtual ~IMicrophone() = default;
    virtual bool init(int bclk, int lrc, int din) = 0;
    virtual size_t readSamples(int16_t* buffer, size_t maxSamples) = 0;
    virtual void startListening() = 0;
    virtual void stopListening() = 0;
    virtual bool isListening() const = 0;
    virtual bool isSimulated() const = 0;
};

// 3. Speaker Interface
class ISpeaker {
public:
    virtual ~ISpeaker() = default;
    virtual bool init(int bclk, int lrc, int dout) = 0;
    virtual void setVolume(uint8_t volumePercent) = 0;
    virtual uint8_t getVolume() const = 0;
    virtual size_t playSamples(const int16_t* buffer, size_t sampleCount) = 0;
    virtual void stopPlayback() = 0;
    virtual bool isPlaying() const = 0;
    virtual bool isSimulated() const = 0;
};

// 4. Status LED Interface
class ILED {
public:
    virtual ~ILED() = default;
    virtual bool init(int pin) = 0;
    virtual void setPattern(const char* patternName) = 0;
    virtual void update() = 0;
    virtual bool isSimulated() const = 0;
};

// 5. Sensor Interface
class ISensor {
public:
    virtual ~ISensor() = default;
    virtual bool init() = 0;
    virtual void update() = 0;
    virtual bool isTouched() const = 0;
    virtual bool isButtonPressed() const = 0;
    virtual uint32_t getBatteryMv() const = 0;
    virtual uint8_t getBatteryPercent() const = 0;
    virtual bool isSimulated() const = 0;
};

// 6. Servo Interface
class IServo {
public:
    virtual ~IServo() = default;
    virtual bool attach(int pin) = 0;
    virtual void writeAngle(int angleDeg) = 0;
    virtual int getAngle() const = 0;
    virtual bool isSimulated() const = 0;
};

// 7. Motor Interface
class IMotor {
public:
    virtual ~IMotor() = default;
    virtual bool init(int pinA, int pinB) = 0;
    virtual void setSpeed(int speedPercent) = 0;
    virtual void stop() = 0;
    virtual bool isSimulated() const = 0;
};

#endif // TARA_HARDWAREINTERFACES_H
