
typedef struct NPC_Test_class {
  fopNpc_npc_c parent;
  dNpc_EventCut_c eventActor;
  
  request_of_phase_process_class mPhaseRequest;
  dNpc_PathRun_c mPathRun;
  
  int mCurrActionIndex;
  s8 mCurrCutIdx;
  
  short mMaxFollowRotVel;
  s8 mHeadJntIdx;
  s8 mSpineJntIdx;
} NPC_Test_class;

/** REL LINK FUNCTIONS **/
/** Called to link and unlink the REL. Don't change these! **/
void _prolog();
void _epilog();
void _unresolved();

/** INTERFACE FUNCTIONS **/
/** Called directly by the game for construction, destruction, and updating. **/
int daNPCTest_Create(NPC_Test_class* this);
int daNPCTest_Execute(NPC_Test_class* this);
int daNPCTest_Draw(NPC_Test_class* this);
int daNPCTest_IsDelete(NPC_Test_class* this);
int daNPCTest_Delete(NPC_Test_class* this);

/** CONSTRUCTION FUNCTIONS **/
/** These set up our actor when it's first created. **/
void daNPCTest__daNPCTest(NPC_Test_class* this);
int daNPCTest_createSolidHeap_CB(NPC_Test_class* this);
void daNPCTest__InitCollision(NPC_Test_class* this);
int daNPCTest__InitPath(NPC_Test_class* this);
void daNPCTest__InitJntCtrl(NPC_Test_class* this, J3DModelData* modelData);

/** EXECUTION STATE FUNCTIONS **/
/** These handle the actor's frame to frame execution state - whether it's waiting, walking, talking, etc. **/
void daNPCTest__wait_action(NPC_Test_class* this);
int daNPCTest__talk(NPC_Test_class* this);
void daNPCTest__UpdatePathFollowing(NPC_Test_class* this);
void daNPCTest__setMtx(NPC_Test_class* this, bool unk);

/** ATTENTION FUNCTIONS **/
/** These handle Link's ability to interact with the actor - L-targeting, talking to it, etc. as well as the NPC's ability to react to Link's presence. **/
bool daNPCTest__chkAttention(NPC_Test_class* this);
void daNPCTest__setAttention(NPC_Test_class* this, bool unk);
int daNPCTest_nodeCallBack(J3DNode* node, int unk);
void daNPCTest__lookBack(NPC_Test_class* this);

/** MESSAGE FUNCTIONS **/
/** In NPCs that can speak, these handle the flow of the conversation. **/
ulong daNPCTest__getMsg(NPC_Test_class* this);
int daNPCTest__next_msgStatus(NPC_Test_class* this, ulong* msgIDPtr);

/** EVENT FUNCTIONS **/
/** These handle how the actor participates in the game's event system, like being talked to or having event actions executed. **/
void daNPCTest__eventOrder(NPC_Test_class* this);
void daNPCTest__checkOrder(NPC_Test_class* this);
void daNPCTest__event_proc(NPC_Test_class* this);
void daNPCTest__privateCut(NPC_Test_class* this);
void daNPCTest__event_actionInit(NPC_Test_class* this, int staffId);
void daNPCTest__event_action(NPC_Test_class* this);
void daNPCTest__endEvent(NPC_Test_class* this);

/** MISC FUNCTIONS **/
/** These don't really fit in a single category. **/
void daNPCTest__anmAtr(NPC_Test_class* this, ushort unk);


profile_method_class l_daNPCTest_Method = {
  .parent = {
    .mpCreate = &daNPCTest_Create,
    .mpDelete = &daNPCTest_Delete,
    .mpExecute = &daNPCTest_Execute,
    .mpIsDelete = &daNPCTest_IsDelete,
    .mpDraw = &daNPCTest_Draw,
  },
  .mpUnkFunc1 = 0,
  .mpUnkFunc2 = 0,
  .mpUnkFunc3 = 0,
};

const f_pc_profile__Profile_Actor g_profile_NPC_Test = {
  .parent = {
    .mLayerID = -3,
    .mListID = 7, // Affects execution order of actors in a given frame. Lower numbers execute first.
    .mListPrio = -3,
    .mPName = 0xB5, // Actor ID
    0,
    0,
    .mpMtd0 = &g_fpcLf_Method,
    .mSize = sizeof(NPC_Test_class),
    .mSizeOther = 0,
    .mDefaultParameters = 0,
    .mpMtd1 = &g_fopAc_Method,
  },
  
  .mDrawPriority = 0x9F,
  0,
  0,
  .mpMtd2 = &l_daNPCTest_Method,
  .mStatus = 0,
  .mActorType = fopAc_ac_c__Type__Some_NPCs,
  .mCullType = 0,
  0,
  0,
};

const fopNpc_npc_c__vtbl daNpc_Test_c_vtbl = {
  0,
  0,
  .next_msgStatus = (pointer)&daNPCTest__next_msgStatus,
  .getMsg = (pointer)&daNPCTest__getMsg,
  .anmAtr = (pointer)&daNPCTest__anmAtr,
};

void (*daNPCTest__Actions[])(NPC_Test_class* this) = {
  &daNPCTest__wait_action,
};

#define daNPCTest__Num_Cuts 1
const char* daNPCTest__Cut_Names[daNPCTest__Num_Cuts] = {
  "DUMMY_CUT",
};

struct JntCtrl_Params {
  short mMaxHeadRot;
  short mMinHeadRot;
  short mMaxSpineRot;
  short mMinSpineRot;
  
  short unk_0x00;
  short unk_0x04;
  short unk_0x08;
  short unk_0x0C;
  short unk_0x10;
  
  short mDesiredFollowRotVel;
  
  float mAttArrowYOffset;
  
  bool headOnlyFollow;
};
const struct JntCtrl_Params daNPCTest__JntCtrl_Params = {
  .mMaxHeadRot =  0x2000,
  .mMinHeadRot = -0x2000,
  .mMaxSpineRot =  0x1800,
  .mMinSpineRot = -0x1800,
  
  .unk_0x00 =  0x2000,
  .unk_0x04 = -0x1000,
  .unk_0x08 =  0x0000,
  .unk_0x0C =  0x0000,
  
  .unk_0x10 =  0x0708,
  
  .mDesiredFollowRotVel =  0x0800,
  
  .mAttArrowYOffset =  150.0f,
  
  .headOnlyFollow = true,
};
