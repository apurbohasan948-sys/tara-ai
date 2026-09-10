#include "Expressions.h"

FaceGeometry getExpressionGeometry(FaceExpression expr) {
    FaceGeometry geom;
    
    // Default base eye dimensions for 128x64 OLED
    EyeParameters baseEye;
    baseEye.width = 28;
    baseEye.height = 36;
    baseEye.cornerRadius = 8;
    baseEye.pupilOffsetX = 0;
    baseEye.pupilOffsetY = 0;
    baseEye.upperEyelid = 0.0f;
    baseEye.lowerEyelid = 0.0f;
    baseEye.crescentUp = false;
    baseEye.crescentDown = false;

    geom.leftEye = baseEye;
    geom.rightEye = baseEye;
    geom.mouthWidth = 0;
    geom.mouthHeight = 0;
    geom.showMouth = false;
    geom.mouthY = 56;

    switch (expr) {
        case FaceExpression::NEUTRAL:
            break;

        case FaceExpression::HAPPY:
            geom.leftEye.crescentUp = true;
            geom.rightEye.crescentUp = true;
            geom.leftEye.height = 24;
            geom.rightEye.height = 24;
            geom.showMouth = true;
            geom.mouthWidth = 24;
            geom.mouthHeight = 6;
            break;

        case FaceExpression::SAD:
            geom.leftEye.crescentDown = true;
            geom.rightEye.crescentDown = true;
            geom.leftEye.upperEyelid = 0.4f;
            geom.rightEye.upperEyelid = 0.4f;
            geom.leftEye.pupilOffsetY = 4;
            geom.rightEye.pupilOffsetY = 4;
            break;

        case FaceExpression::ANGRY:
            geom.leftEye.upperEyelid = 0.5f;
            geom.rightEye.upperEyelid = 0.5f;
            geom.leftEye.cornerRadius = 3;
            geom.rightEye.cornerRadius = 3;
            break;

        case FaceExpression::SURPRISED:
            geom.leftEye.width = 34;
            geom.leftEye.height = 44;
            geom.leftEye.cornerRadius = 16;
            geom.rightEye.width = 34;
            geom.rightEye.height = 44;
            geom.rightEye.cornerRadius = 16;
            break;

        case FaceExpression::SLEEPY:
            geom.leftEye.upperEyelid = 0.85f;
            geom.rightEye.upperEyelid = 0.85f;
            geom.leftEye.height = 8;
            geom.rightEye.height = 8;
            break;

        case FaceExpression::THINKING:
            geom.leftEye.pupilOffsetX = 6;
            geom.leftEye.pupilOffsetY = -5;
            geom.rightEye.pupilOffsetX = 6;
            geom.rightEye.pupilOffsetY = -5;
            geom.leftEye.upperEyelid = 0.2f;
            break;

        case FaceExpression::LISTENING:
            geom.leftEye.width = 30;
            geom.leftEye.height = 38;
            geom.rightEye.width = 30;
            geom.rightEye.height = 38;
            break;

        case FaceExpression::SPEAKING:
            geom.showMouth = true;
            geom.mouthWidth = 20;
            geom.mouthHeight = 8;
            break;

        case FaceExpression::ERROR_FACE:
            geom.leftEye.upperEyelid = 0.6f;
            geom.rightEye.upperEyelid = 0.6f;
            break;
    }

    return geom;
}
