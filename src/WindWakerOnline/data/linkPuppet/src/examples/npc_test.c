
#define RES_NAME "Md"

#define MODEL_ID 0x5C
#define RUN_ANM_ID 0x1E

#define HEAD_JNT_NAME "head"
#define SPINE_JNT_NAME "backbone1"

#include "../vanilla_defines/ww_defines.h"
#include "./npc_test.h"

static void * _ctors SECTION(".ctors");
static void * _dtors SECTION(".dtors");

/** REL LINK FUNCTIONS **/
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


/** INTERFACE FUNCTIONS **/
int daNPCTest_Create(NPC_Test_class* this) {
  // Run the constructor if it hasn't already been run.
  if ((this->parent.parent.mMiscFlags & fopAc_ac_c__MiscFlags__Constructed) == 0) {
    daNPCTest__daNPCTest(this);
    
    // Mark that the constructor has run.
    this->parent.parent.mMiscFlags |= fopAc_ac_c__MiscFlags__Constructed;
  }
  
  // Load the archive.
  PhaseState phaseState = dComIfG_resLoad(&this->mPhaseRequest, RES_NAME);
  if (phaseState != cPhs_COMPLEATE_e) {
    // Not finished loading yet, check again next frame.
    return phaseState;
  }
  
  // Try to load our resources into memory...
  int maxHeapMemoryNeeded = 0; // No maximum
  int success = fopAcM_entrySolidHeap(&this->parent.parent, (int (*)(fopAc_ac_c *))&daNPCTest_createSolidHeap_CB, maxHeapMemoryNeeded);
  if (success == 0) {
    // Failed to load resources, error out!
    return cPhs_ERROR_e;
  }
  
  // Connect our transform matrix to our model's transform matrix
  this->parent.parent.mpMtx = &this->parent.mpMcaMorf->mpModel->mBaseMtx;
  
  // Since we're an actor that can follow a path, try to create the stuff for that.
  if (daNPCTest__InitPath(this) == cPhs_ERROR_e) {
    return cPhs_ERROR_e;
  }
  
  // Set the actor's Bg collision checker with a half-height of 30 and a radius of 50.
  dBgS_AcchCir__SetWall(&this->parent.mAcchCir, 30.0f, 50.0f);
  dBgS_Acch__Set(&this->parent.mObjAcch.parent,
                 &this->parent.parent.mCurrent.mPos,
                 &this->parent.parent.mNext.mPos,
                 &this->parent.parent, 1,
                 &this->parent.mAcchCir,
                 &this->parent.parent.mVelocity,
                 0, 0);
  
  // Set the actor's Cc collision.
  dCcD_Stts__Init(&this->parent.mStts, 0xff, 0xff, &this->parent.parent);
  this->parent.mCyl.parent.parent.parent.mpStts = &this->parent.mStts;
  dCcD_Cyl__Set(&this->parent.mCyl, &d_npc__dNpc_cyl_src);
  
  mDoExt_McaMorf__setMorf(this->parent.mpMcaMorf, 0.0f);
  
  return cPhs_COMPLEATE_e;
}

int daNPCTest_Execute(NPC_Test_class* this) {
  //OSReport("mCurrent pos: (%f, %f, %f)", this->parent.parent.mCurrent.mPos.x, this->parent.parent.mCurrent.mPos.y, this->parent.parent.mCurrent.mPos.z);
  
  dNpc_JntCtrl_c__setParam(
    &this->parent.mJntCtrl,
    daNPCTest__JntCtrl_Params.unk_0x08, daNPCTest__JntCtrl_Params.mMaxSpineRot,
    daNPCTest__JntCtrl_Params.unk_0x0C, daNPCTest__JntCtrl_Params.mMinSpineRot,
    daNPCTest__JntCtrl_Params.unk_0x00, daNPCTest__JntCtrl_Params.mMaxHeadRot,
    daNPCTest__JntCtrl_Params.unk_0x04, daNPCTest__JntCtrl_Params.mMinHeadRot,
    daNPCTest__JntCtrl_Params.unk_0x10
  );
  
  // Check our current event state.
  daNPCTest__checkOrder(this);
  
  // Move forward, but only when they're not the focus of the player's attention.
  if (!daNPCTest__chkAttention(this)) {
    this->parent.parent.mVelocityFwd = 10.0f;
  } else {
    this->parent.parent.mVelocityFwd = 0.0f;
  }
  
  if (this->parent.parent.mEvtInfo.mActMode == dEvt__ActorActMode__InTalk) {
    daNPCTest__Actions[this->mCurrActionIndex](this);
    //this->parent.parent.mVelocityFwd = 0.0f;
  } else {
    daNPCTest__event_proc(this);
  }
  
  daNPCTest__eventOrder(this);
  
  daNPCTest__UpdatePathFollowing(this);
  
  daNPCTest__setMtx(this, false);
  
  // Set the actor's Cc collision with a height of 50 and a radius of 140.
  fopNpc_npc_c__setCollision(&this->parent, 50.0f, 140.0f);
  
  return 1;
}

int daNPCTest_Draw(NPC_Test_class* this) {
  dScnKy_env_light_c__settingTevStruct(
    &g_env_light, settingTevStruct__LightType__Actor,
    &this->parent.parent.mCurrent.mPos, &this->parent.parent.mTevStr
  );
  
  dScnKy_env_light_c__setLightTevColorType(&g_env_light, this->parent.mpMcaMorf->mpModel, &this->parent.parent.mTevStr);
  
  mDoExt_McaMorf__entryDL(this->parent.mpMcaMorf);
  
  return 1;
}

int daNPCTest_IsDelete(NPC_Test_class* this) {
  return 1;
}

int daNPCTest_Delete(NPC_Test_class* this) {
  dComIfG_resDelete(&this->mPhaseRequest, RES_NAME);
  
  return 1;
}


/** CONSTRUCTION FUNCTIONS **/
void daNPCTest__daNPCTest(NPC_Test_class* this) {
  OSReport("Test NPC actor at: %08X\n", this);
  
  // Run our parent's constructor.
  fopAc_ac_c__fopAc_ac_c(&this->parent.parent);
  
  // Register ourselves with the event system.
  dNpc_EventCut_c__setActorInfo2(&this->eventActor, "Md1", &this->parent);
  
  // Initialize variables that need to default to 0
  this->parent.mJntCtrl.field_0xc = 0;
  this->parent.mJntCtrl.field_0xb = 0;
  this->parent.mEventCut.mpActor = 0;
  this->parent.mEventCut.mpTalkActor = 0;
  this->parent.field_0x32c = 0;
  
  // Set our attention distances and interaction mode.
  this->parent.parent.mAttentionDistances[1] = 0xAB;
  this->parent.parent.mAttentionDistances[3] = 0xA9;
  this->parent.parent.mInteractFlags = fopAc_ac_c__InteractFlags__Targetable_B | fopAc_ac_c__InteractFlags__Talkable;
  
  daNPCTest__InitCollision(this);
  
  this->parent.mCurrMsgBsPcId = -1;
  this->parent.mpCurrMsg = 0;
  
  this->parent.vtbl = (fopNpc_npc_c__vtbl*)&daNpc_Test_c_vtbl;
}

int daNPCTest_createSolidHeap_CB(NPC_Test_class* this) {
  // Load the model and running animation from res/Object/Md.arc (Medli's archive).
  // Model is file ID 0x5C within the archive.
  J3DModelData* modelData = dRes_control_c__getIDRes(RES_NAME, MODEL_ID, g_dComIfG_gameInfo.mResCtrl.mObjectInfo, 0x40);
  // Running animation is file ID 0x1E.
  J3DAnmTransformKey* animData = dRes_control_c__getIDRes(RES_NAME, RUN_ANM_ID, g_dComIfG_gameInfo.mResCtrl.mObjectInfo, 0x40);
  
  // Create a new instance of the animation manager. It will handle updating and transitioning between animations for us.
  mDoExt_McaMorf* mcaMorf = (mDoExt_McaMorf*)JKernel__operator_new(sizeof(mDoExt_McaMorf));
  if (mcaMorf == 0) {
    return 0;
  }
  
  // Run McaMorf's constructor and store a reference to it in our parent.
  this->parent.mpMcaMorf = mDoExt_McaMorf__mDoExt_McaMorf(
    mcaMorf, 0x1, modelData, 0, 0,
    animData, 2, 1.0f, 0, -1, 0x1, 0,
    0x80000, 0x11020022
  );
  
  // Error out if we failed to create the McaMorf instance.
  if (this->parent.mpMcaMorf == 0) {
    return 0;
  }
  
  // Store a reference to ourselves in the model instance so that it knows who it belongs to.
  this->parent.mpMcaMorf->mpModel->mpUserData = (pointer)this;
  
  daNPCTest__InitJntCtrl(this, modelData);
  
  return 1;
}

void daNPCTest__InitJntCtrl(NPC_Test_class* this, J3DModelData* modelData) {
  // One of the uses for dNpc_JntCtrl_c is having NPCs turn their heads to look at Link when he is close to them.
  // This involves calculating a rotation value needed to have the head joint point towards Link and blending that with the model's current animation
  // to make it look more natural. This function will set us up to do that.
  
  // Grab and store the indices of the head and spine joints in our model.
  this->mHeadJntIdx = JUTNameTab__getIndex(modelData->mJointTree.mpNameTable, HEAD_JNT_NAME);
  this->mSpineJntIdx = JUTNameTab__getIndex(modelData->mJointTree.mpNameTable, SPINE_JNT_NAME);
  
  // Iterate through all the joints in the mesh.
  // If we find our head or spine joints, we'll register a callback with them.
  // This callback will allow us to calculate our rotation value and blend it into the model's animation.
  for (int i = 0; i < modelData->mJointTree.mJointCount; i++) {
    if (i == this->mHeadJntIdx || i == this->mSpineJntIdx) {
      modelData->mJointTree.mpJoints[i]->parent.mpCalcCallBack = (pointer)&daNPCTest_nodeCallBack;
    }
  }
}

void daNPCTest__InitCollision(NPC_Test_class* this) {
  // Initialize the actor's Bg collision checker (so it stops moving when hitting walls and floors).
  dBgS_Acch__dBgS_Acch(&this->parent.mObjAcch.parent);
  this->parent.mObjAcch.parent.mChk.vtbl = &dBgS_ObjAcch____vt.mChk_vtbl;
  this->parent.mObjAcch.parent.mDChk.mPolyPassChk.parent.vtbl = &dBgS_ObjAcch____vt.mDChk_vtbl.mPolyPassChk_vtbl;
  this->parent.mObjAcch.parent.mDChk.mGrpPassChk.parent.vtbl = &dBgS_ObjAcch____vt.mDChk_vtbl.mGrpPassChk_vtbl;
  this->parent.mObjAcch.parent.mDChk.mPolyPassChk.parent.mPass0 = 1;
  dBgS_AcchCir__dBgS_AcchCir(&this->parent.mAcchCir);
  
  // Initialize the actor's Cc collision (so it prevents other actors from walking into it).
  dCcD_GStts__dCcD_GStts(&this->parent.mStts.mGStts);
  this->parent.mStts.parent.vtbl = &dCcD_Stts____vt.parent;
  this->parent.mStts.mGStts.parent.vtbl = &dCcD_Stts____vt.mGtts_vtbl;
  
  // Cylinder shaped Cc collision.
  dCcD_GObjInf__dCcD_GObjInf(&this->parent.mCyl.parent);
  this->parent.mCyl.mCylAttr.parent.mAab.vtbl = &cM3dGAab____vt;
  this->parent.mCyl.parent.parent.parent.parent.vtbl = &dCcD_Cyl____vt.parent;
  this->parent.mCyl.mCylAttr.parent.vtbl = &dCcD_Cyl____vt.mCyl_vtbl;  
  this->parent.mCyl.mCylAttr.mCyl.vtbl = &dCcD_Cyl____vt.mCylAttr_vtbl;
}

int daNPCTest__InitPath(NPC_Test_class* this) {
  // Initialize the actor's path.
  int pathIndex = (this->parent.parent.parent.parent.mParameters & 0x000000FF);
  
  if (pathIndex != 0xFF) {
    dNpc_PathRun_c__setInf(&this->mPathRun, pathIndex, this->parent.parent.mCurrent.mRoomNo, true);
    if (this->mPathRun.mPath == 0) {
      return cPhs_ERROR_e;
    }
    this->parent.parent.mStatus &= ~fopAcM__Status__DoNotExecuteIfDidNotDraw;
    
    dNpc_PathRun_c__getPoint(&this->parent.parent.mCurrent.mPos, &this->mPathRun, this->mPathRun.mCurrPointIndex);
    this->parent.parent.mNext.mPos.x = this->parent.parent.mCurrent.mPos.x;
    this->parent.parent.mNext.mPos.y = this->parent.parent.mCurrent.mPos.y;
    this->parent.parent.mNext.mPos.z = this->parent.parent.mCurrent.mPos.z;
    
    dNpc_PathRun_c__incIdxLoop(&this->mPathRun);
  }
  
  return cPhs_COMPLEATE_e;
}



/** EXECUTION STATE FUNCTIONS **/
void daNPCTest__wait_action(NPC_Test_class* this) {
  //OSReport("Wait action called");
  
  daNPCTest__talk(this);
  
  daNPCTest__lookBack(this);
}

int daNPCTest__talk(NPC_Test_class* this) {
  fopNpc_npc_c__talk(&this->parent, true);
  
  if (this->parent.mpCurrMsg == 0) {
    return 1;
  }
  
  if (this->parent.mpCurrMsg->mMode == 19) {
    daNPCTest__endEvent(this);
  }
  
  return 1;
}

void daNPCTest__UpdatePathFollowing(NPC_Test_class* this) {
  // Determine if we've reached the current path point and advance to the next one if so.
  bool reachedCurrPoint = dNpc_PathRun_c__chkPointPass(&this->mPathRun, &this->parent.parent.mCurrent.mPos, this->mPathRun.mGoingForwards);
  
  if (reachedCurrPoint) {
    dNpc_PathRun_c__nextIdxAuto(&this->mPathRun);   
  }
  
  // Calculate Y rotation towards the next path point.
  cXyz outPointPos;
  short outYRot;
  dNpc_PathRun_c__getPoint(&outPointPos, &this->mPathRun, this->mPathRun.mCurrPointIndex);
  dNpc_calc_DisXZ_AngY(&this->parent.parent.mCurrent.mPos, &outPointPos, 0, &outYRot);
  
  // Gradually turn towards the desired Y rotation (maximum 0x500 angle units = 7 degrees turned per frame).
  cLib_addCalcAngleS2(&this->parent.parent.mCurrent.mRot.y, outYRot, 1, 0x500);
  
  // Update position based on velocity and rotation.
  fopAcM_posMoveF(&this->parent.parent, &this->parent.mStts.parent.mCcMove);
}

void daNPCTest__setMtx(NPC_Test_class* this, bool unk) {
  // Play the animation.
  mDoExt_McaMorf__play(this->parent.mpMcaMorf, &this->parent.parent.mCurrent.mPos, 0, 0);
  
  // Correct this actor's position relative to Bg collision (walkable collision such as floors or walls it may have run into).
  dBgS_Acch__CrrPos(&this->parent.mObjAcch.parent, &g_dComIfG_gameInfo.mPlay.mBgS);
  
  // Update the model's transform.
  PSMTXTrans(this->parent.parent.mCurrent.mPos.x, this->parent.parent.mCurrent.mPos.y, this->parent.parent.mCurrent.mPos.z, &mDoMtx_stack_c__now);
  mDoMtx_YrotM(&mDoMtx_stack_c__now, this->parent.parent.mCurrent.mRot.y);
  PSMTXCopy(&mDoMtx_stack_c__now, &this->parent.mpMcaMorf->mpModel->mBaseMtx);
  
  // Calculate how the vertices should be deformed by the animation.
  mDoExt_McaMorf__calc(this->parent.mpMcaMorf);
  
  daNPCTest__setAttention(this, unk);
}


/** ATTENTION FUNCTIONS **/
bool daNPCTest__chkAttention(NPC_Test_class* this) {
  if (dAttention_c__LockonTruth(&g_dComIfG_gameInfo.mPlay.mAttention)) {
    fopAc_ac_c* lockedOnActor = dAttention_c__LockonTarget(&g_dComIfG_gameInfo.mPlay.mAttention, 0);
    return ((fopAc_ac_c*)this == lockedOnActor);
  } else {
    fopAc_ac_c* lookedAtActor = dAttention_c__ActionTarget(&g_dComIfG_gameInfo.mPlay.mAttention, 0);
    return ((fopAc_ac_c*)this == lookedAtActor);
  }
}

void daNPCTest__setAttention(NPC_Test_class* this, bool unk) {
  // Set the position of the yellow targeting arrow that appears above the NPC.
  this->parent.parent.mAttentionPos.x = this->parent.parent.mCurrent.mPos.x;
  this->parent.parent.mAttentionPos.y = this->parent.parent.mCurrent.mPos.y + daNPCTest__JntCtrl_Params.mAttArrowYOffset;
  this->parent.parent.mAttentionPos.z = this->parent.parent.mCurrent.mPos.z;
  
  // Set the position Link looks at when locked on to the NPC.
  // TODO: This is just a quick hack. Vanilla NPCs set this in a more complex way, presumably to account for the head's rotation.
  this->parent.parent.mEyePos.x = this->parent.parent.mCurrent.mPos.x;
  this->parent.parent.mEyePos.y = this->parent.parent.mCurrent.mPos.y + 100.0f;
  this->parent.parent.mEyePos.z = this->parent.parent.mCurrent.mPos.z;
}

int daNPCTest_nodeCallBack(J3DNode* node, int unk) {
  if (unk) {
    return 1;
  }
  
  J3DModel* model = J3DGraphBase__j3dSys.mpCurModel;
  NPC_Test_class* this = (NPC_Test_class*)model->mpUserData;
  if (!this) {
    return 1;
  }
  
  // Update this node's transform.
  PSMTXCopy(&model->mpNodeMtx[node->mAnmMatrixIdx], &mDoMtx_stack_c__now);
  
  if (node->mAnmMatrixIdx == this->mHeadJntIdx) {
    // TODO: eye pos offset with PSMTXMultVec
    mDoMtx_XrotM(&mDoMtx_stack_c__now, this->parent.mJntCtrl.mHeadLeftRightRot);
    mDoMtx_ZrotM(&mDoMtx_stack_c__now, this->parent.mJntCtrl.mHeadUpDownRot);
  } else if (node->mAnmMatrixIdx == this->mSpineJntIdx) {
    mDoMtx_XrotM(&mDoMtx_stack_c__now, this->parent.mJntCtrl.mBackboneLeftRightRot);
    mDoMtx_ZrotM(&mDoMtx_stack_c__now, this->parent.mJntCtrl.mBackboneUpDownRot);
  }
  
  PSMTXCopy(&mDoMtx_stack_c__now, &J3DSys__mCurrentMtx);
  PSMTXCopy(&mDoMtx_stack_c__now, &model->mpNodeMtx[node->mAnmMatrixIdx]);
  
  return 1;
}

void daNPCTest__lookBack(NPC_Test_class* this) {
  cXyz dstPos;
  cXyz srcPos = {
      this->parent.parent.mCurrent.mPos.x,
      this->parent.parent.mEyePos.y,
      this->parent.parent.mCurrent.mPos.z,
  };
  
  dNpc_playerEyePos(-20.0f, &dstPos);
  
  if (this->parent.mJntCtrl.field_0xa == 0) {
    this->mMaxFollowRotVel = 0;
  } else {
    cLib_addCalcAngleS2(
      &this->mMaxFollowRotVel,
      daNPCTest__JntCtrl_Params.mDesiredFollowRotVel,
      4, 0x800
    );
  }
  
  dNpc_JntCtrl_c__lookAtTarget(
    &this->parent.mJntCtrl, &this->parent.parent.mCurrent.mRot.y,
    &dstPos, &srcPos,
    this->parent.parent.mCurrent.mRot.y,
    this->mMaxFollowRotVel, daNPCTest__JntCtrl_Params.headOnlyFollow
  );
}


/** MESSAGE FUNCTIONS **/
ulong daNPCTest__getMsg(NPC_Test_class* this) {
  //OSReport("getMsg called");
  
  if(dKy_daynight_check()) {
    return 0;
  }
  
  return 6227;
}

int daNPCTest__next_msgStatus(NPC_Test_class* this, ulong* msgIDPtr) {
  return fopNpc_npc_c__MessageStatus__Finished;
}


/** EVENT FUNCTIONS **/
void daNPCTest__eventOrder(NPC_Test_class* this) {
  this->parent.parent.mEvtInfo.mBehaviorFlag |= dEvt__ActorBehaviorFlag__CanTalk;
}

void daNPCTest__checkOrder(NPC_Test_class* this) {
  //OSReport("mActMode: %X", this->parent.parent.mEvtInfo.mActMode);
  
  if (this->parent.parent.mEvtInfo.mActMode != dEvt__ActorActMode__InTalk) {
    return;
  }
}

void daNPCTest__event_proc(NPC_Test_class* this) {
  if (!dNpc_EventCut_c__cutProc(&this->eventActor)) {
    daNPCTest__privateCut(this);
  }
  
  daNPCTest__lookBack(this);
}

void daNPCTest__privateCut(NPC_Test_class* this) {
  int staffId = dEvent_manager_c__getMyStaffId(&g_dComIfG_gameInfo.mPlay.mEventMgr, "NPCTest", 0, 0);
  if (staffId == -1) {
    return;
  }
  
  this->mCurrCutIdx = dEvent_manager_c__getMyActIdx(
    &g_dComIfG_gameInfo.mPlay.mEventMgr,
    staffId, (char**)&daNPCTest__Cut_Names, daNPCTest__Num_Cuts,
    1, 0);
  
  if (this->mCurrCutIdx == -1) {
    dEvent_manager_c__cutEnd(&g_dComIfG_gameInfo.mPlay.mEventMgr, staffId);
    return;
  }
  
  if (dEvent_manager_c__getIsAddvance(&g_dComIfG_gameInfo.mPlay.mEventMgr, staffId)) {
    if (this->mCurrCutIdx == 0) {
      daNPCTest__event_actionInit(this, staffId);
    }
  }
  
  if (this->mCurrCutIdx == 0) {
    daNPCTest__event_action(this);
  } else {
    dEvent_manager_c__cutEnd(&g_dComIfG_gameInfo.mPlay.mEventMgr, staffId);
  }
}

void daNPCTest__event_actionInit(NPC_Test_class* this, int staffId) {
  // TODO handle initializing event cuts, get substances etc
}

void daNPCTest__event_action(NPC_Test_class* this) {
  // TODO handle event cuts
}

void daNPCTest__endEvent(NPC_Test_class* this) {
  g_dComIfG_gameInfo.mPlay.mEvtCtrl.mStateFlags |= 8;
}


/** MISC FUNCTIONS **/
void daNPCTest__anmAtr(NPC_Test_class* this, ushort unk) {
  return;
}


