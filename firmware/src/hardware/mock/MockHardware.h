#ifndef TARA_MOCKHARDWARE_H
#define TARA_MOCKHARDWARE_H

#include "../interfaces/HardwareInterfaces.h"

// 1. MockDisplay: Maintains virtual 128x64 buffer in memory without physical I2C OLED
class MockDisplay : public IDisplay {
public:
    MockDisplay();
    ~MockDisplay() override;

    bool init() override;
    void clear() override;
    void update() override;
    void drawPixel(int16_t x, int16_t y, uint16_t color) override;
    void drawFastHLine(int16_t x, int16_t y, int16_t w, uint16_t color) override;
    void drawFastVLine(int16_t x, int16_t y, int16_t h, uint16_t color) override;
    void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) override;
    void fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint16_t color) override;
    void drawString(int16_t x, int16_t y, const char* str) override;
    uint8_t* getBuffer() override;
    bool isSimulated() const override { return true; }

    uint32_t getFrameCount() const { return frameCount; }

private:
    uint8_t buffer[1024];
    uint32_t frameCount;
};

// 2. MockMicrophone: Injects simulated speech audio samples
class MockMicrophone : public IMicrophone {
public:
    MockMicrophone();
    bool init(int bclk, int lrc, int din) override;
    size_t readSamples(int16_t* buffer, size_t maxSamples) override;
    void startListening() override;
    void stopListening() override;
    bool isListening() const override;
    bool isSimulated() const override { return true; }

    void injectSimulatedSpeech(const char* text);
    const char* getLastInjectedText() const;

private:
    bool listening;
    char simulatedText[128];
};

// 3. MockSpeaker: Simulates audio output without I2S MAX98357A
class MockSpeaker : public ISpeaker {
public:
    MockSpeaker();
    bool init(int bclk, int lrc, int dout) override;
    void setVolume(uint8_t volumePercent) override;
    uint8_t getVolume() const override;
    size_t playSamples(const int16_t* buffer, size_t sampleCount) override;
    void stopPlayback() override;
    bool isPlaying() const override;
    bool isSimulated() const override { return true; }

private:
    uint8_t volume;
    bool playing;
};

// 4. MockLED: Simulates onboard status LED
class MockLED : public ILED {
public:
    MockLED();
    bool init(int pin) override;
    void setPattern(const char* patternName) override;
    void update() override;
    bool isSimulated() const override { return true; }
    const char* getCurrentPattern() const { return pattern; }

private:
    char pattern[24];
};

// 5. MockSensor: Simulates head touch, BOOT button, battery ADC
class MockSensor : public ISensor {
public:
    MockSensor();
    bool init() override;
    void update() override;
    bool isTouched() const override;
    bool isButtonPressed() const override;
    uint32_t getBatteryMv() const override;
    uint8_t getBatteryPercent() const override;
    bool isSimulated() const override { return true; }

    void setSimulatedTouch(bool touched);
    void setSimulatedButton(bool pressed);
    void setSimulatedBattery(uint32_t mv);

private:
    bool touched;
    bool buttonPressed;
    uint32_t batteryMv;
};

// 6. MockServo: Simulates neck pan & tilt
class MockServo : public IServo {
public:
    MockServo();
    bool attach(int pin) override;
    void writeAngle(int angleDeg) override;
    int getAngle() const override;
    bool isSimulated() const override { return true; }

private:
    int angle;
    int pin;
};

// 7. MockMotor: Simulates companion motion
class MockMotor : public IMotor {
public:
    MockMotor();
    bool init(int pinA, int pinB) override;
    void setSpeed(int speedPercent) override;
    void stop() override;
    bool isSimulated() const override { return true; }

private:
    int speed;
};

#endif // TARA_MOCKHARDWARE_H
