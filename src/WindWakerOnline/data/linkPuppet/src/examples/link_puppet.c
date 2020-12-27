#define RES_NAME "LinkPuppet"

#define MODEL_NAME "cl.bdl"

#define HEAD_JNT_NAME "head_jnt"
#define SPINE_JNT_NAME "chest_jnt"

#pragma pack(1)
#include "../vanilla_defines/ww_defines.h"
#pragma pack(0)

#include "./link_puppet.h"

static void *_ctors SECTION(".ctors");
static void *_dtors SECTION(".dtors");

/** REL LINK FUNCTIONS **/
void _prolog()
{
  DynamicLink__ModuleConstructorsX(&_ctors);
  DynamicLink__ModuleProlog();
}

void _epilog()
{
  DynamicLink__ModuleEpilog();
  DynamicLink__ModuleDestructorsX(&_dtors);
}

void _unresolved()
{
  DynamicLink__ModuleUnresolved();
}

/** INTERFACE FUNCTIONS **/
int daNPCTest_Create(NPC_Test_class *this)
{
  // Run the constructor if it hasn't already been run.
  if ((this->parent.parent.mMiscFlags & fopAc_ac_c__MiscFlags__Constructed) == 0)
  {
    daNPCTest__daNPCTest(this);

    // Mark that the constructor has run.
    this->parent.parent.mMiscFlags |= fopAc_ac_c__MiscFlags__Constructed;
  }

  // Load the archive.
  PhaseState phaseState = dComIfG_resLoad(&this->mPhaseRequest, RES_NAME);
  if (phaseState != cPhs_COMPLEATE_e)
  {
    // Not finished loading yet, check again next frame.
    return phaseState;
  }

  // Try to load our resources into memory...
  int maxHeapMemoryNeeded = 0; // No maximum
  int success = fopAcM_entrySolidHeap(&this->parent.parent, (int (*)(fopAc_ac_c *)) & daNPCTest_createSolidHeap_CB, maxHeapMemoryNeeded);
  if (success == 0)
  {
    // Failed to load resources, error out!
    return cPhs_ERROR_e;
  }

  // Connect our transform matrix to our model's transform matrix
  // this->parent.parent.mpMtx = &this->parent.mpMcaMorf->mpModel->mBaseMtx;

  // Set the actor's Cc collision.
  dCcD_Stts__Init(&this->parent.mStts, 0xff, 0xff, &this->parent.parent);
  this->parent.mCyl.parent.parent.parent.mpStts = &this->parent.mStts;
  dCcD_Cyl__Set(&this->parent.mCyl, &d_npc__dNpc_cyl_src);

  mDoExt_McaMorf__setMorf(this->parent.mpMcaMorf, 0.0f);

  *(void **)0x81801FFC = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->mpCLModel->mpNodeMtx; // Player Model

  for (u32 i = 0; i < 128; i += 4)
  {
    if (*(void **)(0x81802000 + i) == 0x00000000)
    {
      *(void **)(0x81802000 + i) = this->parent.mpMcaMorf->mpModel->mpNodeMtx; // Puppet Model
      break;
    }
  }

  this->drawPreventTimer = 0;

  return cPhs_COMPLEATE_e;
}

int daNPCTest_Execute(NPC_Test_class *this)
{
  //this->parent.parent.mCurrent.mPos.x = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mPos.x;
  //this->parent.parent.mCurrent.mPos.y = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mPos.y;
  //this->parent.parent.mCurrent.mPos.z = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mPos.z + 300;

  //this->parent.parent.mCurrent.mRot.x = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mRot.x;
  //this->parent.parent.mCurrent.mRot.y = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mRot.y;
  //this->parent.parent.mCurrent.mRot.z = g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mRot.z;

  dNpc_JntCtrl_c__setParam(
      &this->parent.mJntCtrl,
      daNPCTest__JntCtrl_Params.unk_0x08, daNPCTest__JntCtrl_Params.mMaxSpineRot,
      daNPCTest__JntCtrl_Params.unk_0x0C, daNPCTest__JntCtrl_Params.mMinSpineRot,
      daNPCTest__JntCtrl_Params.unk_0x00, daNPCTest__JntCtrl_Params.mMaxHeadRot,
      daNPCTest__JntCtrl_Params.unk_0x04, daNPCTest__JntCtrl_Params.mMinHeadRot,
      daNPCTest__JntCtrl_Params.unk_0x10);

  // Check our current event state.
  daNPCTest__checkOrder(this);

  if (this->parent.parent.mEvtInfo.mActMode == dEvt__ActorActMode__InTalk)
  {
    daNPCTest__Actions[this->mCurrActionIndex](this);
    //this->parent.parent.mVelocityFwd = 0.0f;
  }
  else
  {
    daNPCTest__event_proc(this);
  }

  daNPCTest__eventOrder(this);

  // daNPCTest__setMtx(this, false);

  // Set the actor's Cc collision with a height of 50 and a radius of 140.
  //fopNpc_npc_c__setCollision(&this->parent, 60.0f, 50.0f);
  fopNpc_npc_c__setCollision(&this->parent, 15.0f, 40.0f);

  return 1;
}

u32 offon1[] = {0x80371b9c, 0, 0, 0};
u32 offon2[] = {0x80371b9c, 0, 0, 0};
u32 onoff1[] = {0x80371b84, 0, 0, 0};
u32 onoff2[] = {0x80371b84, 0, 0, 0};

int daNPCTest_Draw(NPC_Test_class *this)
{
  dScnKy_env_light_c__settingTevStruct(&g_env_light, settingTevStruct__LightType__Player, &this->parent.parent.mCurrent.mPos, &this->parent.parent.mTevStr);
  dScnKy_env_light_c__setLightTevColorType(&g_env_light, this->parent.mpMcaMorf->mpModel, &this->parent.parent.mTevStr);

  //mDoExt_McaMorf__entryDL(this->parent.mpMcaMorf);

  //mDoExt_modelEntryDL(this->parent.mpMcaMorf->mpModel);

  J3DModel *self = this->parent.mpMcaMorf->mpModel;
  if (((self->mpModelData->mJointTree).mbIsBDL == 1) &&
      (*(short *)&self->mpModelData->mShapeTable != 1))
  {
    (*(code)self->vtbl->calcMaterial)(self);
    J3DModel__diff(self);
    {
      J3DJoint *pJVar1;
      ushort uVar2;

      if ((self->mFlags & 4) == 0)
      {
        *(u32 *)0x803eda8c &= 0xfffffffb;
      }
      else
      {
        *(u32 *)0x803eda8c |= 4;
      }
      if ((self->mFlags & 8) == 0)
      {
        *(u32 *)0x803eda8c &= 0xfffffff7;
      }
      else
      {
        *(u32 *)0x803eda8c |= 8;
      }
      *(void **)0x803edab0 = self->mpModelData->mMaterialTable.mpTexture;
      *(void **)0x803eda90 = self;

      J3DGraphBase__j3dSys.mpCurDrawBuffers[0] = g_dComIfG_gameInfo.mDlstList.field_0x8;
      J3DGraphBase__j3dSys.mpCurDrawBuffers[1] = g_dComIfG_gameInfo.mDlstList.field_0x8;

      self->mpModelData->mJointTree.mpJoints[0x8]->mpMaterial->mpShape->mVisFlags &= 1;
      self->mpModelData->mJointTree.mpJoints[0xc]->mpMaterial->mpShape->mVisFlags &= 1;

      for (uVar2 = 1; uVar2 < self->mpModelData->mJointTree.mJointCount; ++uVar2)
      {
        pJVar1 = self->mpModelData->mJointTree.mpJoints[uVar2];
        if (uVar2 == 0x13 || uVar2 == 0x15)
          continue;
        if (pJVar1->mpMaterial)
        {
          (*(code)pJVar1->parent.vtbl->entryIn)(pJVar1);
        }
      }

      J3DJoint *j13 = self->mpModelData->mJointTree.mpJoints[0x13];
      J3DJoint *j15 = self->mpModelData->mJointTree.mpJoints[0x15];
      J3DJoint *j0 = self->mpModelData->mJointTree.mpJoints[0];

      j0->mpMaterial->mpNextMaterial->mpNextMaterial->mpNextMaterial->mpNextMaterial->mpShape->mVisFlags &= ~1;

      J3DMaterial *mtptr = j0->mpMaterial;
      int i = 4;
      do
      {
        mtptr = mtptr->mpNextMaterial;
        --i;
      } while (i);
      mtptr->mpShape->mVisFlags &= ~1;

      J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)onoff2, 0);

      for (int i = 0; i < 4; ++i)
      {
        this->zoff_blend[i]->mVisFlags |= 1;
        this->zon[i]->mVisFlags |= 1;
        this->zoff_none[i]->mVisFlags &= ~1;
      }

      (*(code)j13->parent.vtbl->entryIn)(j13);
      (*(code)j15->parent.vtbl->entryIn)(j15);

      J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)offon2, 0);

      for (int i = 0; i < 4; ++i)
      {
        this->zoff_blend[i]->mVisFlags &= ~1;
        //this->zon[i]->mVisFlags |= 1;
        this->zoff_none[i]->mVisFlags |= 1;
      }

      (*(code)j13->parent.vtbl->entryIn)(j13);
      (*(code)j15->parent.vtbl->entryIn)(j15);

      J3DMaterial *matptr = j0->mpMaterial;
      int matid = 0;
      while (matptr)
      {
        if (matid != 2 && matid != 5)
          matptr->mFlag = 1;
        matptr = matptr->mpNextMaterial;
      }
      (*(code)j0->parent.vtbl->entryIn)(j0);

      J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)onoff1, 0);
      {
        for (int i = 0; i < 4; ++i)
        {
          this->zoff_blend[i]->mVisFlags |= 1;
          this->zon[i]->mVisFlags &= ~1;
          this->zoff_none[i]->mVisFlags |= 1;
        }

        (*(code)j13->parent.vtbl->entryIn)(j13);
        (*(code)j15->parent.vtbl->entryIn)(j15);
      }
      J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)offon1, 0);
      for (int i = 0; i < 4; ++i)
      {
        this->zon[i]->mVisFlags |= 1;
      }
    }
  }
  else
  {
    if (*(short *)0x803e724a == 0)
    {
      J3DModel__unlock(self);
    }
    //(*(code)this->parent.mpMcaMorf->mpModel->vtbl->entry)(this->parent.mpMcaMorf->mpModel);

    {
      J3DJoint *pJVar1;
      ushort uVar2;

      if ((self->mFlags & 4) == 0)
      {
        *(u32 *)0x803eda8c &= 0xfffffffb;
      }
      else
      {
        *(u32 *)0x803eda8c |= 4;
      }
      if ((self->mFlags & 8) == 0)
      {
        *(u32 *)0x803eda8c &= 0xfffffff7;
      }
      else
      {
        *(u32 *)0x803eda8c |= 8;
      }
      *(void **)0x803edab0 = self->mpModelData->mMaterialTable.mpTexture;
      *(void **)0x803eda90 = self;
      for (uVar2 = 0; uVar2 < self->mpModelData->mJointTree.mJointCount; ++uVar2)
      {
        pJVar1 = (self->mpModelData->mJointTree).mpJoints[uVar2];
        if (pJVar1->mpMaterial)
        {
          (*(code)pJVar1->parent.vtbl->entryIn)(pJVar1);
        }
      }
    }

    J3DModel__lock(self);
  }

  (*(code)self->vtbl->viewCalc)(self);

  /*
	J3DJoint *pJVar24;
	J3DJoint *pJVar26;
	J3DJoint **ppJVar14;

	int iVar13 = 0;
	u32 *iVar28;
	u32 *iVar20;
	u32 *iVar22;
	J3DJoint *pJVar27;
	J3DMaterial *pJVar16;

	ppJVar14 = (this->parent.mpMcaMorf->mpModel->mpModelData->mJointTree).mpJoints;
    pJVar27 = *ppJVar14;
	pJVar26 = ppJVar14[0x13];
	pJVar24 = ppJVar14[0x15];
	

	J3DGraphBase__j3dSys.mpCurDrawBuffers[0] = g_dComIfG_gameInfo.mDlstList.field_0x8;
	J3DGraphBase__j3dSys.mpCurDrawBuffers[1] = g_dComIfG_gameInfo.mDlstList.field_0x8;

	J3DDrawBuffer__entryImm(g_dComIfG_gameInfo.mDlstList.field_0x8, (J3DPacket *)onoff2, 0);

	(*(code)((pJVar26->parent).vtbl)->entryIn)(pJVar26); // crash occurs here
	(*(code)((pJVar24->parent).vtbl)->entryIn)(pJVar24);
	//J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)offon2, 0);

	iVar13 = 0;
	iVar28 = 4;
	(*(code)((pJVar26->parent).vtbl)->entryIn)(pJVar26);
	(*(code)((pJVar24->parent).vtbl)->entryIn)(pJVar24);
	pJVar16 = pJVar27->mpMaterial;
	(*(code)((pJVar27->parent).vtbl)->entryIn)(pJVar27);
	J3DGraphBase__j3dSys.mpCurModel = this->parent.mpMcaMorf->mpModel;
	J3DGraphBase__j3dSys.mpCurTex = this->parent.mpMcaMorf->mpModel->mpModelData->mMaterialTable.mpTexture;
	J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)onoff1, 0);
	iVar28 = 4;
	(*(code)((pJVar26->parent).vtbl)->entryIn)(pJVar26);
	(*(code)((pJVar24->parent).vtbl)->entryIn)(pJVar24);
	J3DDrawBuffer__entryImm(J3DGraphBase__j3dSys.mpCurDrawBuffers[0], (J3DPacket *)offon1, 0);
*/

  MTX34 *pMVar5;
  cXyz local_30[2];

  pMVar5 = this->parent.mpMcaMorf->mpModel->mpNodeMtx;
  local_30[0].x = *pMVar5->m[3];
  local_30[0].y = *pMVar5->m[7];
  local_30[0].z = *pMVar5->m[0xb];

  dComIfGd_setShadow(*(ulong *)&g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->field_0x3614, 0, this->parent.mpMcaMorf->mpModel, local_30, (double)1400.0, (double)30.0, (double)(this->parent.parent).mCurrent.mPos.y, *(float *)&g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->field_0x35dc, (ushort *)&(this->parent.mAcchCir).mPolyInfo, &(this->parent.parent).mTevStr, 0, (double)1.0, &dDlst_shadowControl_c__mSimpleTexObj);

  return 1;
}

int daNPCTest_IsDelete(NPC_Test_class *this)
{
  return 1;
}

int daNPCTest_Delete(NPC_Test_class *this)
{
  return 1;
}

/** CONSTRUCTION FUNCTIONS **/
void daNPCTest__daNPCTest(NPC_Test_class *this)
{
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
  this->parent.parent.mInteractFlags = 0; //fopAc_ac_c__InteractFlags__Targetable_B | fopAc_ac_c__InteractFlags__Talkable;

  daNPCTest__InitCollision(this);

  this->parent.mCurrMsgBsPcId = -1;
  this->parent.mpCurrMsg = 0;

  this->parent.vtbl = (fopNpc_npc_c__vtbl *)&daNpc_Test_c_vtbl;
}

int daNPCTest_createSolidHeap_CB(NPC_Test_class *this)
{
  // Load the model and running animation from res/Object/Md.arc (Medli's archive).
  // Model is file ID 0x5C within the archive.
  J3DModelData *modelData = dRes_control_c__getNameRes(RES_NAME, MODEL_NAME, g_dComIfG_gameInfo.mResCtrl.mObjectInfo, 0x40);

  // Create a new instance of the animation manager. It will handle updating and transitioning between animations for us.
  mDoExt_McaMorf *mcaMorf = (mDoExt_McaMorf *)JKernel__operator_new(sizeof(mDoExt_McaMorf));
  if (mcaMorf == 0)
  {
    return 0;
  }

  // Run McaMorf's constructor and store a reference to it in our parent.
  this->parent.mpMcaMorf = mDoExt_McaMorf__mDoExt_McaMorf(mcaMorf, 0x1, modelData, 0, 0, 0, 2, 1.0f, 0, -1, 0x1, 0, 0x80000, 0x11001222);
  // Error out if we failed to create the McaMorf instance.
  if (this->parent.mpMcaMorf == 0)
  {
    return 0;
  }

  _Static_assert(0x00 == ((u32) & ((J3DJoint *)0)->parent), "parent illdefined");
  _Static_assert(0xc == ((u32) & ((J3DJoint *)0)->parent.field_0xc), "0xc illdefined");
  _Static_assert(0x18 == ((u32) & ((J3DJoint *)0)->parent.mAnmMatrixIdx), "mAnmMatrixIdx illdefined");
  _Static_assert(0x1c == ((u32) & ((J3DJoint *)0)->mTransformInfo), "mTransformInfo illdefined");
  _Static_assert(0x3C == ((u32) & ((J3DJoint *)0)->mBoundingSphereRadius), "mBoundingSphereRadius illdefined");
  _Static_assert(0x60 == ((u32) & ((J3DJoint *)0)->mpMaterial), "material illdefined");

  int k[] = {0x13, 0x15};
  int zoff_blend_cnt = 0;
  int zoff_none_cnt = 0;
  int zon_cnt = 0;

  for (int i = 0; i < 2; ++i)
  {
    J3DMaterial *pJVar19 = modelData->mJointTree.mpJoints[k[i]]->mpMaterial;
    while (pJVar19)
    {
      pJVar19->mFlag = 1;
      ushort *pu6 = (ushort *)pJVar19->mpPEBlock->vtbl->getZMode(pJVar19->mpPEBlock);
      if (J3DGraphBase__j3dZModeTable[*pu6 * 3] == 0)
      {
        u8 *s = (u8 *)pJVar19->mpPEBlock->vtbl->getBlend(pJVar19->mpPEBlock);
        if (*s == 1)
        {
          if (zoff_blend_cnt < 4)
            this->zoff_blend[zoff_blend_cnt++] = pJVar19->mpShape;
        }
        else
        {
          if (zoff_none_cnt < 4)
            this->zoff_none[zoff_none_cnt++] = pJVar19->mpShape;
        }
      }
      else
      {
        if (zon_cnt < 4)
          this->zon[zon_cnt++] = pJVar19->mpShape;
      }
      pJVar19 = pJVar19->mpNextMaterial;
    }
  }

  OSReport("zb %d, zn %d, z %d", zoff_blend_cnt, zoff_none_cnt, zon_cnt);
  // Store a reference to ourselves in the model instance so that it knows who it belongs to.
  this->parent.mpMcaMorf->mpModel->mpUserData = (pointer)this;
  daNPCTest__InitJntCtrl(this, modelData);

  return 1;
}

void daNPCTest__InitCollision(NPC_Test_class *this)
{
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

/** EXECUTION STATE FUNCTIONS **/
void daNPCTest__wait_action(NPC_Test_class *this)
{
  //OSReport("Wait action called");

  daNPCTest__talk(this);
}

int daNPCTest__talk(NPC_Test_class *this)
{
  fopNpc_npc_c__talk(&this->parent, true);

  if (this->parent.mpCurrMsg == 0)
  {
    return 1;
  }

  if (this->parent.mpCurrMsg->mMode == 19)
  {
    daNPCTest__endEvent(this);
  }

  return 1;
}

void daNPCTest__UpdatePathFollowing(NPC_Test_class *this)
{
  // Determine if we've reached the current path point and advance to the next one if so.
  bool reachedCurrPoint = dNpc_PathRun_c__chkPointPass(&this->mPathRun, &this->parent.parent.mCurrent.mPos, this->mPathRun.mGoingForwards);

  if (reachedCurrPoint)
  {
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

void daNPCTest__setMtx(NPC_Test_class *this, bool unk)
{
  // Update the model's transform.
  PSMTXTrans(this->parent.parent.mCurrent.mPos.x, this->parent.parent.mCurrent.mPos.y, this->parent.parent.mCurrent.mPos.z, &mDoMtx_stack_c__now);
  mDoMtx_YrotM(&mDoMtx_stack_c__now, this->parent.parent.mCurrent.mRot.y);
  PSMTXCopy(&mDoMtx_stack_c__now, &this->parent.mpMcaMorf->mpModel->mBaseMtx);

  // Calculate how the vertices should be deformed by the animation.
  mDoExt_McaMorf__calc(this->parent.mpMcaMorf);
}

/** ATTENTION FUNCTIONS **/
bool daNPCTest__chkAttention(NPC_Test_class *this)
{
  if (dAttention_c__LockonTruth(&g_dComIfG_gameInfo.mPlay.mAttention))
  {
    fopAc_ac_c *lockedOnActor = dAttention_c__LockonTarget(&g_dComIfG_gameInfo.mPlay.mAttention, 0);
    return ((fopAc_ac_c *)this == lockedOnActor);
  }
  else
  {
    fopAc_ac_c *lookedAtActor = dAttention_c__ActionTarget(&g_dComIfG_gameInfo.mPlay.mAttention, 0);
    return ((fopAc_ac_c *)this == lookedAtActor);
  }
}

int daNPCTest_nodeCallBack(J3DNode *node, int unk)
{
  if (unk)
  {
    return 1;
  }

  J3DModel *model = J3DGraphBase__j3dSys.mpCurModel;
  NPC_Test_class *this = (NPC_Test_class *)model->mpUserData;

  if (!this)
  {
    return 1;
  }

  return 1;
}

void daNPCTest__InitJntCtrl(NPC_Test_class *this, J3DModelData *modelData)
{
  for (int i = 0; i < modelData->mJointTree.mJointCount; i++)
  {
    modelData->mJointTree.mpJoints[i]->parent.mpCalcCallBack = (pointer)&daNPCTest_nodeCallBack;
  }
}

void daNPCTest__lookBack(NPC_Test_class *this)
{
  cXyz *dest_pos = &g_dComIfG_gameInfo.mPlay.mpCurPlayerActor->parent.mNext.mPos;

  float xDiff = fabs(this->parent.parent.mCurrent.mPos.x - dest_pos->x);
  float yDiff = fabs(this->parent.parent.mCurrent.mPos.y - dest_pos->y);
  float zDiff = fabs(this->parent.parent.mCurrent.mPos.z - dest_pos->z);

  cXyz dstPos;
  cXyz srcPos = {
      this->parent.parent.mCurrent.mPos.x,
      this->parent.parent.mEyePos.y,
      this->parent.parent.mCurrent.mPos.z,
  };

  dNpc_playerEyePos(-20.0f, &dstPos);

  if (this->parent.mJntCtrl.field_0xa == 0)
  {
    this->mMaxFollowRotVel = 0;
  }
  else
  {
    cLib_addCalcAngleS2(&this->mMaxFollowRotVel, daNPCTest__JntCtrl_Params.mDesiredFollowRotVel, 4, 0x800);
  }

  if (xDiff > 250.0f || yDiff > 250.0f || zDiff > 250.0f)
  {
    dNpc_JntCtrl_c__lookAtTarget(
        &this->parent.mJntCtrl, &this->parent.parent.mCurrent.mRot.y,
        &srcPos, &srcPos,
        this->parent.parent.mCurrent.mRot.y,
        this->mMaxFollowRotVel, daNPCTest__JntCtrl_Params.headOnlyFollow);
  }
  else
  {
    dNpc_JntCtrl_c__lookAtTarget(
        &this->parent.mJntCtrl, &this->parent.parent.mCurrent.mRot.y,
        &dstPos, &srcPos,
        this->parent.parent.mCurrent.mRot.y,
        this->mMaxFollowRotVel, daNPCTest__JntCtrl_Params.headOnlyFollow);
  }
}

/** MESSAGE FUNCTIONS **/
ulong daNPCTest__getMsg(NPC_Test_class *this)
{
  //OSReport("getMsg called");

  if (dKy_daynight_check())
  {
    return 0;
  }

  return 6227;
}

int daNPCTest__next_msgStatus(NPC_Test_class *this, ulong *msgIDPtr)
{
  return fopNpc_npc_c__MessageStatus__Finished;
}

/** EVENT FUNCTIONS **/
void daNPCTest__eventOrder(NPC_Test_class *this)
{
  this->parent.parent.mEvtInfo.mBehaviorFlag |= dEvt__ActorBehaviorFlag__CanTalk;
}

void daNPCTest__checkOrder(NPC_Test_class *this)
{
  //OSReport("mActMode: %X", this->parent.parent.mEvtInfo.mActMode);

  if (this->parent.parent.mEvtInfo.mActMode != dEvt__ActorActMode__InTalk)
  {
    return;
  }
}

void daNPCTest__event_proc(NPC_Test_class *this)
{
  if (!dNpc_EventCut_c__cutProc(&this->eventActor))
  {
    daNPCTest__privateCut(this);
  }

  daNPCTest__lookBack(this);
}

void daNPCTest__privateCut(NPC_Test_class *this)
{
  int staffId = dEvent_manager_c__getMyStaffId(&g_dComIfG_gameInfo.mPlay.mEventMgr, "NPCTest", 0, 0);
  if (staffId == -1)
  {
    return;
  }

  this->mCurrCutIdx = dEvent_manager_c__getMyActIdx(
      &g_dComIfG_gameInfo.mPlay.mEventMgr,
      staffId, (char **)&daNPCTest__Cut_Names, daNPCTest__Num_Cuts,
      1, 0);

  if (this->mCurrCutIdx == -1)
  {
    dEvent_manager_c__cutEnd(&g_dComIfG_gameInfo.mPlay.mEventMgr, staffId);
    return;
  }

  if (dEvent_manager_c__getIsAddvance(&g_dComIfG_gameInfo.mPlay.mEventMgr, staffId))
  {
    if (this->mCurrCutIdx == 0)
    {
      daNPCTest__event_actionInit(this, staffId);
    }
  }

  if (this->mCurrCutIdx == 0)
  {
    daNPCTest__event_action(this);
  }
  else
  {
    dEvent_manager_c__cutEnd(&g_dComIfG_gameInfo.mPlay.mEventMgr, staffId);
  }
}

void daNPCTest__event_actionInit(NPC_Test_class *this, int staffId)
{
  // TODO handle initializing event cuts, get substances etc
}

void daNPCTest__event_action(NPC_Test_class *this)
{
  // TODO handle event cuts
}

void daNPCTest__endEvent(NPC_Test_class *this)
{
  g_dComIfG_gameInfo.mPlay.mEvtCtrl.mStateFlags |= 8;
}

/** MISC FUNCTIONS **/
void daNPCTest__anmAtr(NPC_Test_class *this, ushort unk)
{
  return;
}