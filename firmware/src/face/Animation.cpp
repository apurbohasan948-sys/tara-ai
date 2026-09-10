#include "Animation.h"
#include <math.h>

AnimationController::AnimationController()
    : currentExpression(FaceExpression::NEUTRAL),
      targetExpression(FaceExpression::NEUTRAL),
      isBlinking(false),
      blinkProgressMs(0),
      blinkDurationMs(180),
      nextBlinkMs(3500),
      targetLookX(0),
      targetLookY(0),
      currentLookX(0),
      currentLookY(0),
      nextGlanceMs(4000),
      wavePhase(0.0f) {
    currentGeometry = getExpressionGeometry(FaceExpression::NEUTRAL);
    targetGeometry = currentGeometry;
}

void AnimationController::setExpression(FaceExpression expr, bool immediate) {
    targetExpression = expr;
    targetGeometry = getExpressionGeometry(expr);

    if (immediate) {
        currentExpression = targetExpression;
        currentGeometry = targetGeometry;
    }
}

void AnimationController::triggerBlink() {
    isBlinking = true;
    blinkProgressMs = 0;
}

void AnimationController::update(uint32_t deltaMs) {
    wavePhase += 0.006f * deltaMs;
    if (wavePhase > 6.28318f) wavePhase -= 6.28318f;

    updateBlink(deltaMs);
    updateGlances(deltaMs);

    // Smoothly interpolate current geometry toward target
    interpolateGeometry(0.18f);
}

void AnimationController::updateBlink(uint32_t deltaMs) {
    if (isBlinking) {
        blinkProgressMs += deltaMs;
        float progress = (float)blinkProgressMs / (float)blinkDurationMs;

        if (progress >= 1.0f) {
            isBlinking = false;
            // Schedule next spontaneous blink between 2.5s and 6.0s
            nextBlinkMs = 2500 + (esp_random() % 3500);
        } else {
            // Eyelid drops down and springs back up
            float lid = (progress < 0.5f) ? (progress * 2.0f) : ((1.0f - progress) * 2.0f);
            currentGeometry.leftEye.upperEyelid = fmaxf(currentGeometry.leftEye.upperEyelid, lid);
            currentGeometry.rightEye.upperEyelid = fmaxf(currentGeometry.rightEye.upperEyelid, lid);
        }
    } else {
        if (nextBlinkMs > deltaMs) {
            nextBlinkMs -= deltaMs;
        } else {
            // Don't blink if sleeping
            if (targetExpression != FaceExpression::SLEEPY) {
                triggerBlink();
            } else {
                nextBlinkMs = 5000;
            }
        }
    }
}

void AnimationController::updateGlances(uint32_t deltaMs) {
    if (nextGlanceMs > deltaMs) {
        nextGlanceMs -= deltaMs;
    } else {
        // Natural eye saccades: occasionally look slightly left, right, or center
        int r = esp_random() % 100;
        if (r < 40) {
            targetLookX = 0;
            targetLookY = 0;
        } else if (r < 65) {
            targetLookX = (esp_random() % 7) - 3; // -3 to +3 px
            targetLookY = (esp_random() % 5) - 2;
        } else {
            targetLookX = (esp_random() % 11) - 5;
            targetLookY = (esp_random() % 7) - 3;
        }
        nextGlanceMs = 1800 + (esp_random() % 3000);
    }

    // Smooth lerp for looking around
    currentLookX = currentLookX + (targetLookX - currentLookX) * 0.15f;
    currentLookY = currentLookY + (targetLookY - currentLookY) * 0.15f;
}

void AnimationController::interpolateGeometry(float factor) {
    auto lerp = [](float a, float b, float t) { return a + (b - a) * t; };
    auto lerpI = [](int16_t a, int16_t b, float t) { return (int16_t)(a + (b - a) * t); };

    currentGeometry.leftEye.width = lerpI(currentGeometry.leftEye.width, targetGeometry.leftEye.width, factor);
    currentGeometry.leftEye.height = lerpI(currentGeometry.leftEye.height, targetGeometry.leftEye.height, factor);
    currentGeometry.leftEye.cornerRadius = lerpI(currentGeometry.leftEye.cornerRadius, targetGeometry.leftEye.cornerRadius, factor);
    currentGeometry.leftEye.upperEyelid = lerp(currentGeometry.leftEye.upperEyelid, targetGeometry.leftEye.upperEyelid, factor);
    currentGeometry.leftEye.crescentUp = targetGeometry.leftEye.crescentUp;
    currentGeometry.leftEye.crescentDown = targetGeometry.leftEye.crescentDown;

    currentGeometry.rightEye.width = lerpI(currentGeometry.rightEye.width, targetGeometry.rightEye.width, factor);
    currentGeometry.rightEye.height = lerpI(currentGeometry.rightEye.height, targetGeometry.rightEye.height, factor);
    currentGeometry.rightEye.cornerRadius = lerpI(currentGeometry.rightEye.cornerRadius, targetGeometry.rightEye.cornerRadius, factor);
    currentGeometry.rightEye.upperEyelid = lerp(currentGeometry.rightEye.upperEyelid, targetGeometry.rightEye.upperEyelid, factor);
    currentGeometry.rightEye.crescentUp = targetGeometry.rightEye.crescentUp;
    currentGeometry.rightEye.crescentDown = targetGeometry.rightEye.crescentDown;

    currentGeometry.showMouth = targetGeometry.showMouth;
    currentGeometry.mouthWidth = lerpI(currentGeometry.mouthWidth, targetGeometry.mouthWidth, factor);
    currentGeometry.mouthHeight = lerpI(currentGeometry.mouthHeight, targetGeometry.mouthHeight, factor);
}
