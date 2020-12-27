
enum SwOpLogicalOperation {
  SwOp_AND=0,
  SwOp_NAND=1,
  SwOp_OR=2,
  SwOp_NOR=3,
  SwOp_XOR=4,
  SwOp_XNOR=5,
};

typedef struct SwitchOperator_class {
  fopAc_ac_c parent;
  
  enum SwOpLogicalOperation mOperation;
  bool mContinuous;
  
  u8 mSwitchToSet;
  u8 mFirstSwitchToCheck;
  u8 mNumSwitchesToCheck;
  
  u8 mEVNTIndexToStart;
  s16 mEventIndexToStart;
  u8 mEventProgressState;
  
  u8 mTotalFramesToWait;
  u8 mRemainingFramesToWait;
  
  bool isDisabled;
} SwitchOperator_class;

void _prolog();
void _epilog();
void _unresolved();
int daSwOp_Create(SwitchOperator_class* this);
int daSwOp_IsDelete(SwitchOperator_class* this);
int daSwOp_Delete(SwitchOperator_class* this);
int daSwOp_Draw(SwitchOperator_class* this);
int daSwOp_Execute(SwitchOperator_class* this);

profile_method_class l_daSwOp_Method = {
  .parent = {
    .mpCreate = &daSwOp_Create,
    .mpDelete = &daSwOp_Delete,
    .mpExecute = &daSwOp_Execute,
    .mpIsDelete = &daSwOp_IsDelete,
    .mpDraw = &daSwOp_Draw,
  },
  .mpUnkFunc1 = 0,
  .mpUnkFunc2 = 0,
  .mpUnkFunc3 = 0,
};

const f_pc_profile__Profile_Actor g_profile_SwitchOperator = {
  .parent = {
    .mLayerID = -3,
    .mListID = 7, // Affects execution order of actors in a given frame. Lower numbers execute first.
    .mListPrio = -3,
    .mPName = 0x1F6, // Actor ID
    0,
    0,
    .mpMtd0 = &g_fpcLf_Method,
    .mSize = sizeof(SwitchOperator_class),
    .mSizeOther = 0,
    .mDefaultParameters = 0,
    .mpMtd1 = &g_fopAc_Method,
  },
  
  .mDrawPriority = 0x9F,
  0,
  0,
  .mpMtd2 = &l_daSwOp_Method,
  .mStatus = 0,
  .mActorType = fopAc_ac_c__Type__Regular,
  .mCullType = 0,
  0,
  0,
};
