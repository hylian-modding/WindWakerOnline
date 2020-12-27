
typedef struct THWOMP_class {
  fopAc_ac_c parent;
  
  request_of_phase_process_class mPhaseRequest;
  mDoExt_3DlineMat0_c mLine;
  J3DModel* mpModel;
  dBgW* mpCollision;
  //dBgS_AcchCir mAcchCir;
  //dBgS_Acch mCollisionChecker;
  MTX34 mMtx;
  
  bool sawPlayer;
  bool playerIsRiding;
  int framesUntilStartChase;
  bool isChasing;
} THWOMP_class;

void _prolog();
void _epilog();
void _unresolved();
int daThwomp_Create(THWOMP_class* this);
int daThwomp_IsDelete(THWOMP_class* this);
int daThwomp_Delete(THWOMP_class* this);
int daThwomp_Draw(THWOMP_class* this);
int daThwomp_Execute(THWOMP_class* this);

void THWOMP_test_pushpull(fopAc_ac_c* this, fopAc_ac_c * otherActor, short unk3, PushPullLabel unk4);
int createSolidHeap_CB(THWOMP_class* this);

profile_method_class l_daThwomp_Method = {
  .parent = {
    .mpCreate = &daThwomp_Create,
    .mpDelete = &daThwomp_Delete,
    .mpExecute = &daThwomp_Execute,
    .mpIsDelete = &daThwomp_IsDelete,
    .mpDraw = &daThwomp_Draw,
  },
  .mpUnkFunc1 = 0,
  .mpUnkFunc2 = 0,
  .mpUnkFunc3 = 0,
};

const f_pc_profile__Profile_Actor g_profile_THWOMP = {
  .parent = {
    .mLayerID = -3,
    .mListID = 3, // Affects execution order of actors in a given frame. Lower numbers execute first.
    .mListPrio = -3,
    .mPName = 0xB5, // Actor ID
    0,
    0,
    .mpMtd0 = &g_fpcLf_Method,
    .mSize = sizeof(THWOMP_class),
    .mSizeOther = 0,
    .mDefaultParameters = 0,
    .mpMtd1 = &g_fopAc_Method,
  },
  
  .mDrawPriority = 0x9F,
  0,
  0,
  .mpMtd2 = &l_daThwomp_Method,
  .mStatus = 0,
  .mActorType = fopAc_ac_c__Type__Regular,
  .mCullType = 0xE,
  0,
  0,
};
