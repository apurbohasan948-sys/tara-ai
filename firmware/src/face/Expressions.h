#ifndef TARA_EXPRESSIONS_H
#define TARA_EXPRESSIONS_H

#include <Arduino.h>

enum class FaceExpression : uint8_t {
    NEUTRAL = 0,
    HAPPY,
    SAD,
    ANGRY,
    SURPRISED,
    SLEEPY,
    THINKING,
    LISTENING,
    SPEAKING,
    ERROR_FACE
};

struct EyeParameters {
    int16_t width;
    int16_t height;
    int16_t cornerRadius;
    int16_t pupilOffsetX;
    int16_t pupilOffsetY;
    float upperEyelid; // 0.0 = fully open, 1.0 = fully closed
    float lowerEyelid; // 0.0 = fully open, 1.0 = fully closed
    bool crescentUp;   // Happy arc
    bool crescentDown; // Sad arc
};

struct FaceGeometry {
    EyeParameters leftEye;
    EyeParameters rightEye;
    int16_t mouthWidth;
    int16_t mouthHeight;
    bool showMouth;
    int16_t mouthY;
};

FaceGeometry getExpressionGeometry(FaceExpression expr);

#endif // TARA_EXPRESSIONS_H
