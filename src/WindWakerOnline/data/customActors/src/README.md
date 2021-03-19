
### About

This is a work-in-progress API for writing custom code for The Legend of Zelda: The Wind Waker (USA GameCube version).

Currently, it allows you to create brand new actors from scratch coded in C, and will compile them into GameCube REL files.  
It can also insert those REL files into the game, replacing an existing actor.  
In the future it will also allow adding as many new actors as you want into the game without having to replace existing ones.  

The C code you write can call the vanilla game's functions and use its global variables seamlessly, for example:
```c
// Check if a switch is set.
bool isSwitchSet = dSv_info_c__isSwitch(&g_dComIfG_gameInfo.mSvInfo, switchToCheck, this->parent.mCurrent.mRoomNo);
```
```c
// Load the file with index 4 from files/res/Object/Ecube.arc, and instantiate it as a 3D model.
J3DModelData* modelData = dRes_control_c__getRes("Ecube", 4, g_dComIfG_gameInfo.mResCtrl.mObjectInfo, 0x40);
this->mpModel = mDoExt_J3DModel__create(modelData, 0x80000, 0x11000000);
```

You can use any function, variable, or struct that has been documented. Not every single one in the game has been documented, but hundreds of them have, so you should be able to do quite a lot.  
Huge thanks to [Jasper](https://github.com/magcius) for documenting tons of them.  

### Requirements

Download and install the following:
* Python 3.8.2: https://www.python.org/downloads/release/python-382/
* devkitPro: https://devkitpro.org/

### Usage

First, clone the repository with this command:
`git clone --recurse-submodules https://github.com/LagoLunatic/WW_Hacking_API.git`

You can compile a custom actor into a REL file like so:  
`py build_rel.py [path to C source file] [REL module ID number in hexadecimal] [actor profile symbol name] [optional: path to RELS.arc to insert the REL into]`

`[path to C source file]` is the path to your .c file containing your custom actor's code.  
`[REL module ID number in hexadecimal]` is the module ID to give to the new REL file. Do not confuse this with the actor ID - this is only used for linking RELs, and must be unique among all RELs in the game.  
`[actor profile symbol name]` is the variable name you gave to your custom actor's actor profile.  
`[optional: path to RELS.arc to insert the REL into]` is the path to a RELS.arc. If specified, the script will insert the new REL into this RELS.arc, replacing one of the vanilla RELs, and will also update the profile list located in RELS.arc so the new REL works properly.  

For example:
`py build_rel.py "./examples/switch_op.c" 0x58 g_profile_SwitchOperator "../Wind Waker Extracted/files/RELS.arc"`

As for how to choose the REL module ID, if replacing an existing REL, simply look at the first 4 bytes of the original REL in a hex editor. That's the module ID for it - so specify that ID and it will replace that actor.  
If you don't want to break anything in the game, using 0x58 is recommended - that's the module ID for the actor `hotest`, aka `d_a_rectangle.rel` - this is a useless test actor that was never placed and doesn't do anything, so replacing it has no side effects.  
If you want to add a new REL to the game without replacing an existing one (not supported by this API yet), the first unused module ID is 0x1A0.  
