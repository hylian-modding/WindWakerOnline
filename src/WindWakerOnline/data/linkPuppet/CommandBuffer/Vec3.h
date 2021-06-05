#ifndef VEC3_H
#define VEC3_H

#include "inttypes.h"

typedef struct {
    /* 0x00 */ int16_t x;
    /* 0x02 */ int16_t y;
    /* 0x04 */ int16_t z;
} Vec3s; /* sizeof = 0x06 */

typedef struct {
    /* 0x00 */ float x;
    /* 0x04 */ float y;
    /* 0x08 */ float z;
} Vec3f; /* sizeof = 0x0C */

#endif

