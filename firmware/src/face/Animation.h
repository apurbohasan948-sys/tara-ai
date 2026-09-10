#ifndef TARA_ANIMATION_H
#define TARA_ANIMATION_H

#include <Arduino.h>
#include "Expressions.h"

class AnimationController {
public:
    AnimationController();

    void update(uint32_t deltaMs);
    void triggerBlink();
    void setExpression(FaceExpression expr, bool immediate = false);
    
    FaceGeometry getCurrentGeometry() const { return currentGeometry; }
    FaceExpression getTargetExpression() const { return targetExpression; }

    // Wave / Audio dynamics for listening/speaking/thinking
    float getWavePhase() const { return wavePhase; }
    int16_t getLookX() const { return currentLookX; }
    int16_t getLookY() const { return currentLookY; }

private:
    FaceExpression currentExpression;
    FaceExpression targetExpression;
    FaceGeometry currentGeometry;
    FaceGeometry targetGeometry;

    // Blinking
    bool isBlinking;
    uint32_t blinkProgressMs;
    uint32_t blinkDurationMs;
    uint32_t nextBlinkMs;

    // Saccadic look-around movement
    int16_t targetLookX;
    int16_t targetLookY;
    int16_t currentLookX;
    int16_t currentLookY;
    uint32_t nextGlanceMs;

    // Continuous wave animation
    float wavePhase;

    void updateBlink(uint32_t deltaMs);
    void updateGlances(uint32_t deltaMs);
    void interpolateGeometry(float factor);
};

#endif // TARA_ANIMATION_H
