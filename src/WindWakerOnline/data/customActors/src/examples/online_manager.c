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
int daNPCTest_Create(NPC_Test_class *this) //Init
{
  return 1;
}

int daNPCTest_Execute(NPC_Test_class *this) //Play
{

  return 1;
}

int daNPCTest_Draw(NPC_Test_class *this) //Draw
{
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

void daNPCTest__daNPCTest(NPC_Test_class *this)
{

}

void daNPCTest__wait_action(NPC_Test_class *this)
{

}

ulong daNPCTest__getMsg(NPC_Test_class *this)
{
  return 0;
}

int daNPCTest__next_msgStatus(NPC_Test_class *this, ulong *msgIDPtr)
{
  return fopNpc_npc_c__MessageStatus__Finished;
}

/** MISC FUNCTIONS **/
void daNPCTest__anmAtr(NPC_Test_class *this, ushort unk)
{
  return;
}