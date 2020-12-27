
#include "../vanilla_defines/ww_defines.h"
#include "./switch_op.h"

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


int daSwOp_Create(SwitchOperator_class* this) {
  this->mOperation           = (this->parent.parent.parent.mParameters & 0x0000000F);
  this->mContinuous          = (this->parent.parent.parent.mParameters & 0x00000010) >> 4;
  this->mSwitchToSet         = (this->parent.parent.parent.mParameters & 0x0000FF00) >> 8;
  this->mFirstSwitchToCheck  = (this->parent.parent.parent.mParameters & 0x00FF0000) >> 0x10;
  this->mNumSwitchesToCheck  = (this->parent.parent.parent.mParameters & 0xFF000000) >> 0x18;
  this->mEVNTIndexToStart    = (this->parent.mOld.mRot.x & 0x00FF);
  this->mTotalFramesToWait   = (this->parent.mOld.mRot.z & 0xFFFF);
  
  this->mEventIndexToStart = dEvent_manager_c__getEventIdx(&g_dComIfG_gameInfo.mPlay.mEventMgr, 0, this->mEVNTIndexToStart);
  
  // Initialize the counter.
  this->mRemainingFramesToWait = this->mTotalFramesToWait;
  
  if (!this->mContinuous) {
    bool switchIsAlreadySet = dSv_info_c__isSwitch(&g_dComIfG_gameInfo.mSvInfo, this->mSwitchToSet, this->parent.mCurrent.mRoomNo);
    if (switchIsAlreadySet) {
      this->isDisabled = true;
    }
  }
  
  return cPhs_COMPLEATE_e;
}

int daSwOp_IsDelete(SwitchOperator_class* this) {
  return 1;
}

int daSwOp_Delete(SwitchOperator_class* this) {
  return 1;
}

int daSwOp_Draw(SwitchOperator_class* this) {
  return 1;
}

int daSwOp_Execute(SwitchOperator_class* this) {
  if (this->mEventProgressState == 1) {
    bool eventFinished = dEvent_manager_c__endCheck(&g_dComIfG_gameInfo.mPlay.mEventMgr, this->mEventIndexToStart);
    if (eventFinished) {
      g_dComIfG_gameInfo.mPlay.mEvtCtrl.mStateFlags |= 8; // Should go back to checking if any events are ready to play.
      this->mEventProgressState++;
    }
    return 1;
  }
  if (this->mEventProgressState != 0) {
    // Event already played?
    return 1;
  }
  
  if (this->isDisabled) {
    return 1;
  }
  
  u8 switchToCheck = this->mFirstSwitchToCheck;
  int numSet = 0;
  int numUnset = 0;
  for (int i = 0; i < this->mNumSwitchesToCheck; i++) {
    bool currSwitchIsSet = dSv_info_c__isSwitch(&g_dComIfG_gameInfo.mSvInfo, switchToCheck, this->parent.mCurrent.mRoomNo);
    
    if (currSwitchIsSet) {
      numSet++;
    } else {
      numUnset++;
    }
    
    switchToCheck++;
  }
  
  bool conditionMet = false;
  if (this->mOperation == SwOp_AND && numUnset == 0) {
    conditionMet = true;
  } else if (this->mOperation == SwOp_NAND && numUnset > 0) {
    conditionMet = true;
  } else if (this->mOperation == SwOp_OR && numSet > 0) {
    conditionMet = true;
  } else if (this->mOperation == SwOp_NOR && numSet == 0) {
    conditionMet = true;
  } else if (this->mOperation == SwOp_XOR && numSet == 1) {
    conditionMet = true;
  } else if (this->mOperation == SwOp_XNOR && numSet != 1) {
    conditionMet = true;
  }
  
  if (this->mRemainingFramesToWait > 0) {
    if (conditionMet) {
      // Count down as long as the condition is met.
      this->mRemainingFramesToWait--;
    } else {
      // Condition no longer met. Reset the counter.
      this->mRemainingFramesToWait = this->mTotalFramesToWait;
    }
  } else if (conditionMet) {
    // Set the switch.
    dSv_info_c__onSwitch(&g_dComIfG_gameInfo.mSvInfo, this->mSwitchToSet, this->parent.mCurrent.mRoomNo);
    
    if (this->mEventIndexToStart != -1) {
      if (this->parent.mEvtInfo.mActMode == dEvt__ActorActMode__InDemo) {
        this->mEventProgressState++;
      } else {
        // Start the event.
        fopAcM_orderOtherEventId(&this->parent, this->mEventIndexToStart, this->mEVNTIndexToStart, 0xFFFF, 0, 1);
      }
    }
    
    if (!this->mContinuous) {
      this->isDisabled = true;
    }
  } else if (this->mContinuous) {
    dSv_info_c__offSwitch(&g_dComIfG_gameInfo.mSvInfo, this->mSwitchToSet, this->parent.mCurrent.mRoomNo);
    // TODO: maybe have an event param for unsetting, too?
  }
  
  return 1;
}
