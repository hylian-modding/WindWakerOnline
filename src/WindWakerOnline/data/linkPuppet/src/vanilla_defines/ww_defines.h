
#pragma once

#include "stddef.h"
#include "types.h"

#include "ww_structs.h"
#include "ww_functions.h"
#include "ww_variables.h"

// The below definition is for ctors/dtors.
#define SECTION( S ) __attribute__ ((section ( S )))
