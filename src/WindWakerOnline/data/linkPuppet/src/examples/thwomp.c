
#include "../vanilla_defines/ww_defines.h"
#include "math.h"
#include "thwomp.h"

static void * _ctors SECTION(".ctors");
static void * _dtors SECTION(".dtors");

void _prolog() {
  DynamicLink__ModuleConstructorsX(&_ctors);
  DynamicLink__ModuleProlog();
}

void _epilog() {
  DynamicLink__ModuleEpilog();
  DynamicLink__ModuleDestructorsX(&_dtors);
}

void _unresolved() {
  DynamicLink__ModuleUnresolved();
}


void THWOMP_test_pushpull(fopAc_ac_c* this, fopAc_ac_c * otherActor, short unk3, PushPullLabel unk4) {
  OSReport("this actor ID: %04X", this->parent.parent.mProcName);
  OSReport("otherActor actor ID: %04X", otherActor->parent.parent.mProcName);
  OSReport("unk3: %04X", unk3);
  OSReport("unk4: %08X", unk4);
}

int createSolidHeap_CB(THWOMP_class* this) {
  // Create the cube model.
  J3DModelData* modelData = dRes_control_c__getRes("Ecube", 4, g_dComIfG_gameInfo.mResCtrl.mObjectInfo, 0x40);
  this->mpModel = mDoExt_J3DModel__create(modelData, 0x80000, 0x11000000);
  if (this->mpModel == 0) {
    return 0;
  }
  this->mpModel->mBaseScale.x = this->parent.mScale.x;
  this->mpModel->mBaseScale.y = this->parent.mScale.y;
  this->mpModel->mBaseScale.z = this->parent.mScale.z;
  
  // Create the linemat.
  int num_lines = 1;
  int segments_per_line = 10;
  mDoExt_3DlineMat0_c__init(&this->mLine, num_lines, segments_per_line, 0);
  this->mLine.parent.vtbl = &mDoExt_3DlineMat0_c____vt;
  
  // Create the collision.
  cBgD_t* collisionData = dRes_control_c__getRes("Ecube", 7, g_dComIfG_gameInfo.mResCtrl.mObjectInfo, 0x40);
  this->mpCollision = dBgW__dBgW((dBgW*)JKernel__operator_new(sizeof(dBgW)));
  cBgW__Set(&this->mpCollision->parent, collisionData, 1, &this->mMtx);
  int error = dBgS__Regist(&g_dComIfG_gameInfo.mPlay.mBgS, this->mpCollision, &this->parent);
  if (error != 0) {
    return cPhs_ERROR_e;
  }
  this->mpCollision->mpTransPosCb = (pointer)&dBgS_MoveBGProc_Typical;
  this->mpCollision->mpPushPullCb = (pointer)&THWOMP_test_pushpull;
  
  // Create the collision checker.
  //dBgS_Acch___ct(&this->mCollisionChecker);
  //dBgS_AcchCir___ct(&this->mAcchCir);
  //dBgS_AcchCir_SetWall(&this->mAcchCir, 30.0f, 0.0f);
  //dBgS_Acch_Set(&this->mCollisionChecker, &this->parent.mCurrent.mPos, &this->parent.mCurrent.mPos, &this->parent, 1, &this->mAcchCir, &this->parent.mCurrent.mPos, &this->parent.mRot, &this->parent.mRot); // TODO!!! what are these positions and rotations actually supposed to be...?
  
  return 1;
}

int daThwomp_Create(THWOMP_class* this) {
  // Load the Object/Ecube.arc archive.
  PhaseState phaseState = dComIfG_resLoad(&this->mPhaseRequest, "Ecube");
  if (phaseState != cPhs_COMPLEATE_e) {
    // Not finished loading yet, check again next frame.
    return phaseState;
  }
  
  int maxHeapMemoryNeeded = 0; // No maximum
  int error = fopAcM_entrySolidHeap(&this->parent, (int (*)(fopAc_ac_c *))&createSolidHeap_CB, maxHeapMemoryNeeded);
  if (error == 0) {
    return cPhs_ERROR_e;
  }
  
  this->sawPlayer = false;
  this->playerIsRiding = false;
  this->framesUntilStartChase = 0;
  this->isChasing = false;
  
  // Log the entity's position to the console.
  OSReport("mPos:  (%f, %f, %f)", this->parent.mOld.mPos.x,  this->parent.mOld.mPos.y,  this->parent.mOld.mPos.z);
  OSReport("mPos2: (%f, %f, %f)", this->parent.mNext.mPos.x, this->parent.mNext.mPos.y, this->parent.mNext.mPos.z);
  OSReport("mPos3: (%f, %f, %f)", this->parent.mCurrent.mPos.x, this->parent.mCurrent.mPos.y, this->parent.mCurrent.mPos.z);
  OSReport("mPos4: (%f, %f, %f)", this->parent.mEyePos.x, this->parent.mEyePos.y, this->parent.mEyePos.z);
  OSReport("mPos5: (%f, %f, %f)", this->parent.mAttentionPos.x, this->parent.mAttentionPos.y, this->parent.mAttentionPos.z);
  
  return cPhs_COMPLEATE_e;
}

int daThwomp_IsDelete(THWOMP_class* this) {
  return 1;
}

int daThwomp_Delete(THWOMP_class* this) {
  dComIfG_resDelete(&this->mPhaseRequest, "Ecube");
  
  cBgS__Release(&g_dComIfG_gameInfo.mPlay.mBgS.parent, &this->mpCollision->parent);
  
  return 1;
}

int daThwomp_Draw(THWOMP_class* this) {
  _GXColor color = {
    0,
    255,
    0,
    255,
  };
  if (this->isChasing) {
    color.r = 255;
    color.g = 0;
  } else if (this->sawPlayer) {
    color.r = 255;
    color.g = 128;
  }
  
  // Draw the model.
  dScnKy_env_light_c__setLightTevColorType(&g_env_light, this->mpModel, &this->parent.mTevStr);
  mDoExt_modelUpdateDL(this->mpModel);
  
  // Draw the linemat.
  mDoExt_3DlineMat0_c__update(&this->mLine, 10, 5.0, &color, 2, &this->parent.mTevStr);
  int materialId = ((int (*)(mDoExt_3DlineMat0_c*))this->mLine.parent.vtbl->getMaterialID)(&this->mLine);
  mDoExt_3DlineMatSortPacket__setMat(&g_dComIfG_gameInfo.mDlstList.m3DLineMatSortPacket[materialId], &this->mLine.parent);
  
  // Draw debug things.
  //dLib_debugDrawAxis(&this->mMtx, 100.0);
  //dLib_debugDrawFan(&this->parent.mCurrent.mPos, 5, 10, 100.0, &color);
  
  return 1;
}

int daThwomp_Execute(THWOMP_class* this) {
  // Move the entity.
  cXyz* dest_pos = &g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mPos;
  float xDiff = fabs(this->parent.mCurrent.mPos.x - dest_pos->x);
  float yDiff = fabs(this->parent.mCurrent.mPos.y - dest_pos->y);
  float zDiff = fabs(this->parent.mCurrent.mPos.z - dest_pos->z);
  short yRotDiff = fopAcM_searchActorAngleY(&this->parent, g_dComIfG_gameInfo.mPlay.mpCurPlayerActor);
  
  OSReport("xDiff: %f", xDiff);
  OSReport("yDiff: %f", yDiff);
  OSReport("zDiff: %f", zDiff);
  OSReport("yRotDiff: %04X", yRotDiff);
  
  this->playerIsRiding = false;
  
  if (xDiff < 75.0 && yDiff < 75.0 &&  zDiff < 75.0) {
    // Player is inside the box. Crush the player and restart the room.
    // TODO: this is buggy. player can hang on the edge of the box and it pushes them out of bounds.
    if (daPy_lk_c__startRestartRoom(g_dComIfG_gameInfo.mPlay.mpLinkActor, 5, 201, -1.0, 0)) {
      ((void (*)(daPy_lk_c *, ulong))g_dComIfG_gameInfo.mPlay.mpLinkActor->vtbl->voiceStart)(g_dComIfG_gameInfo.mPlay.mpLinkActor, 0x2b);
    }
  }
  
  if (this->framesUntilStartChase > 0) {
    this->framesUntilStartChase -= 1;
    
    if (this->framesUntilStartChase == 0) {
      this->isChasing = true;
      this->sawPlayer = false;
      this->parent.mCurrent.mRot.y = (yRotDiff + 0x2000) & ~(0x4000-1); // Round to nearest 90 degrees
    }
  }
  
  if (!this->isChasing) {
    if (xDiff < 40.0 && zDiff < 40.0 && dest_pos->y > this->parent.mCurrent.mPos.y + 100.0) {
      //this->playerIsRiding = true;
    } else if (xDiff < 60.0 && yDiff < 160.0 && zDiff >= 70.0) {
      this->sawPlayer = true;
      if (this->framesUntilStartChase == 0) {
        this->framesUntilStartChase = 45;
      }
    } else if (xDiff >= 70.0 && yDiff < 160.0 && zDiff < 60.0) {
      this->sawPlayer = true;
      if (this->framesUntilStartChase == 0) {
        this->framesUntilStartChase = 45;
      }
    } else {
      this->sawPlayer = false;
      this->framesUntilStartChase = 0;
    }
  }
  
  if (this->isChasing) {
    this->parent.mVelocityFwd = 30.0f;
  } else if (this->playerIsRiding) {
    this->parent.mCurrent.mRot.y = 0x4000;
    this->parent.mVelocityFwd = 5.0f;
  } else {
    this->parent.mVelocityFwd = 0.0f;
  }
  
  fopAcM_calcSpeed(&this->parent);
  
  
  dBgS_LinChk lineCheck;
  lineCheck.parent.parent.mpPolyPassChk = 0;
  lineCheck.parent.parent.mpGrpPassChk = 0;
  lineCheck.parent.parent.mbExcludeSameProcID = true;
  // TODO more things to set for lineCheck!!!
  cBgS_LinChk__ct(&lineCheck.parent);
  cXyz posFrom = {
    this->parent.mCurrent.mPos.x,
    this->parent.mCurrent.mPos.y,
    this->parent.mCurrent.mPos.z,
  };
  cXyz posTo = {
    this->parent.mCurrent.mPos.x + this->parent.mVelocity.x,
    this->parent.mCurrent.mPos.y + this->parent.mVelocity.y,
    this->parent.mCurrent.mPos.z + this->parent.mVelocity.z,
  };
  dBgS_LinChk__Set(&lineCheck, &posFrom, &posTo, &this->parent);
  if (cBgS__LineCross(&g_dComIfG_gameInfo.mPlay.mBgS.parent, &lineCheck.parent)) {
    OSReport("linecross!");
    this->isChasing = false;
    this->parent.mVelocity.x = 0.0f;
    this->parent.mVelocity.y = 0.0f;
    this->parent.mVelocity.z = 0.0f;
  }
  // TODO: destroy the lineCheck?
  
  
  fopAcM_posMove(&this->parent, 0);
  
  
  // Update the model's position.
  PSMTXTrans(this->parent.mCurrent.mPos.x, this->parent.mCurrent.mPos.y, this->parent.mCurrent.mPos.z, &mDoMtx_stack_c__now);
  PSMTXCopy(&mDoMtx_stack_c__now, &this->mMtx);
  PSMTXCopy(&mDoMtx_stack_c__now, &this->mpModel->mBaseMtx);
  
  // Update the collision.
  dBgW__Move(this->mpCollision);
  
  // Check for collisions with solid objects.
  //dBgS_Acch_CrrPos(&this->mCollisionChecker, &g_dComIfG_gameInfo.mPlay.mBgS);
  
  
  // Update the linemat's position.
  cXyz offset_per_segment = {
    (dest_pos->x - this->parent.mCurrent.mPos.x) / (this->mLine.mNumSegmentsPerLine),
    (dest_pos->y - this->parent.mCurrent.mPos.y) / (this->mLine.mNumSegmentsPerLine),
    (dest_pos->z - this->parent.mCurrent.mPos.z) / (this->mLine.mNumSegmentsPerLine),
  };
  for (int i = 0; i < this->mLine.mNumLines; i++) {
    for (int j = 0; j < this->mLine.mNumSegmentsPerLine; j++) {
      this->mLine.mpLines[i].mpSegments[j].x = this->parent.mCurrent.mPos.x + offset_per_segment.x*j;
      this->mLine.mpLines[i].mpSegments[j].y = this->parent.mCurrent.mPos.y + offset_per_segment.y*j;
      this->mLine.mpLines[i].mpSegments[j].z = this->parent.mCurrent.mPos.z + offset_per_segment.z*j;
    }
  }
  
  
  return 1;
}
