#include "MockHardware.h"

// 1. MockDisplay
MockDisplay::MockDisplay() : frameCount(0) {
    memset(buffer, 0, sizeof(buffer));
}

MockDisplay::~MockDisplay() {}

bool MockDisplay::init() {
    clear();
    return true;
}

void MockDisplay::clear() {
    memset(buffer, 0, sizeof(buffer));
}

void MockDisplay::update() {
    frameCount++;
}

void MockDisplay::drawPixel(int16_t x, int16_t y, uint16_t color) {
    if (x < 0 || x >= 128 || y < 0 || y >= 64) return;
    if (color) {
        buffer[x + (y / 8) * 128] |= (1 << (y & 7));
    } else {
        buffer[x + (y / 8) * 128] &= ~(1 << (y & 7));
    }
}

void MockDisplay::drawFastHLine(int16_t x, int16_t y, int16_t w, uint16_t color) {
    for (int16_t i = 0; i < w; i++) {
        drawPixel(x + i, y, color);
    }
}

void MockDisplay::drawFastVLine(int16_t x, int16_t y, int16_t h, uint16_t color) {
    for (int16_t i = 0; i < h; i++) {
        drawPixel(x, y + i, color);
    }
}

void MockDisplay::fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
    for (int16_t j = 0; j < h; j++) {
        drawFastHLine(x, y + j, w, color);
    }
}

void MockDisplay::fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint16_t color) {
    fillRect(x + r, y, w - 2 * r, h, color);
    fillRect(x, y + r, w, h - 2 * r, color);
}

void MockDisplay::drawString(int16_t x, int16_t y, const char* str) {
    // Virtual string placeholder for testing
}

uint8_t* MockDisplay::getBuffer() {
    return buffer;
}

// 2. MockMicrophone
MockMicrophone::MockMicrophone() : listening(false) {
    memset(simulatedText, 0, sizeof(simulatedText));
}

bool MockMicrophone::init(int bclk, int lrc, int din) {
    return true;
}

size_t MockMicrophone::readSamples(int16_t* buffer, size_t maxSamples) {
    if (!listening || !buffer) return 0;
    // Generate synthetic audio wave for testing
    for (size_t i = 0; i < maxSamples; i++) {
        buffer[i] = (int16_t)(sin((double)i / 10.0) * 1000.0);
    }
    return maxSamples;
}

void MockMicrophone::startListening() {
    listening = true;
}

void MockMicrophone::stopListening() {
    listening = false;
}

bool MockMicrophone::isListening() const {
    return listening;
}

void MockMicrophone::injectSimulatedSpeech(const char* text) {
    if (text) {
        strncpy(simulatedText, text, sizeof(simulatedText) - 1);
        simulatedText[sizeof(simulatedText) - 1] = '\0';
    }
}

const char* MockMicrophone::getLastInjectedText() const {
    return simulatedText;
}

// 3. MockSpeaker
MockSpeaker::MockSpeaker() : volume(80), playing(false) {}

bool MockSpeaker::init(int bclk, int lrc, int dout) {
    return true;
}

void MockSpeaker::setVolume(uint8_t volumePercent) {
    volume = volumePercent;
}

uint8_t MockSpeaker::getVolume() const {
    return volume;
}

size_t MockSpeaker::playSamples(const int16_t* buffer, size_t sampleCount) {
    playing = true;
    return sampleCount;
}

void MockSpeaker::stopPlayback() {
    playing = false;
}

bool MockSpeaker::isPlaying() const {
    return playing;
}

// 4. MockLED
MockLED::MockLED() {
    strncpy(pattern, "breathe", sizeof(pattern) - 1);
}

bool MockLED::init(int pin) {
    return true;
}

void MockLED::setPattern(const char* patternName) {
    if (patternName) {
        strncpy(pattern, patternName, sizeof(pattern) - 1);
        pattern[sizeof(pattern) - 1] = '\0';
    }
}

void MockLED::update() {}

// 5. MockSensor
MockSensor::MockSensor() : touched(false), buttonPressed(false), batteryMv(4180) {}

bool MockSensor::init() {
    return true;
}

void MockSensor::update() {}

bool MockSensor::isTouched() const {
    return touched;
}

bool MockSensor::isButtonPressed() const {
    return buttonPressed;
}

uint32_t MockSensor::getBatteryMv() const {
    return batteryMv;
}

uint8_t MockSensor::getBatteryPercent() const {
    if (batteryMv >= 4200) return 100;
    if (batteryMv <= 3300) return 0;
    return (uint8_t)(((batteryMv - 3300) * 100) / 900);
}

void MockSensor::setSimulatedTouch(bool t) {
    touched = t;
}

void MockSensor::setSimulatedButton(bool p) {
    buttonPressed = p;
}

void MockSensor::setSimulatedBattery(uint32_t mv) {
    batteryMv = mv;
}

// 6. MockServo
MockServo::MockServo() : angle(90), pin(-1) {}

bool MockServo::attach(int p) {
    pin = p;
    return true;
}

void MockServo::writeAngle(int angleDeg) {
    if (angleDeg < 0) angle = 0;
    else if (angleDeg > 180) angle = 180;
    else angle = angleDeg;
}

int MockServo::getAngle() const {
    return angle;
}

// 7. MockMotor
MockMotor::MockMotor() : speed(0) {}

bool MockMotor::init(int pinA, int pinB) {
    return true;
}

void MockMotor::setSpeed(int speedPercent) {
    speed = speedPercent;
}

void MockMotor::stop() {
    speed = 0;
}
