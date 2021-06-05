#ifndef ACTOR_H
#define ACTOR_H

#include "Vec3.h"
#include "inttypes.h"

extern uint32_t Actor_SpawnFast(uint16_t actorID, uint32_t parameters, Vec3f* pPos, int roomNo, Vec3s* pAngle, Vec3f* pScale, uint8_t subtype, void* pCallBack, void* pCallBackUserData);
extern void Actor_Despawn(void* this);

typedef struct {
    /* 0x00 */ Vec3f position;
    /* 0x0C */ Vec3s rotation;
    /* 0x12 */ uint16_t pad;
} ActorParams; /* sizeof = 0x14 */

typedef union {
    Vec3s rot;
    uint64_t dirty;
    struct {
        uint32_t dirtyl;
        uint32_t dirtyh;
    };
} ActorAux; /* sizeof = 0x08 */

typedef struct {
    /* 0x00 */ void* actor;
} ActorDespawnParams; /* sizeof = 0x04 */

#endif

