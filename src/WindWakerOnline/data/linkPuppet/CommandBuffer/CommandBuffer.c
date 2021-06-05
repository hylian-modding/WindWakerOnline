#ifdef _LANGUAGE_C_PLUS_PLUS
extern "C" {
#endif

#include "inttypes.h"
#include "Command.h"
#include "CommandBuffer.h"

extern void dCcS_Move(void* this);
void CommandBuffer_Update(void*);

__attribute__((aligned(0x20))) void CommandBuffer_Update(void* that) {
    uint32_t index;
    uint32_t qndex;
    Command* command;

    // Since we are codecaving this function call, we need to actually call it with its original arguments before doing our stuff
    dCcS_Move(that);

    // iterate through the current active commands on the command buffer
    for (index = 0; index < cmdBuffer.count; index++) {
        // shortcut to current command
        command = &cmdBuffer.commands[index];

        // process this command based on its type
        switch(command->type) {
            // if the command is empty, assume there is nothing to do
            case COMMAND_TYPE_NONE:
                break;

            // if the command is puppet spawn
            case COMMAND_TYPE_PUPPET_SPAWN:
                // check for free return slots (we need to return the pointer to the puppet, so it is important that we can actually do so)
                for (qndex = 0; qndex < COMMAND_MAX; qndex++) {
                    // if the uuid in this slot is 0
                    if (cmdBuffer.returns[qndex].returnUUID == 0) {
                        // we will use this slot
                        cmdBuffer.returns[qndex].type = command->type;
                        cmdBuffer.returns[qndex].returnUUID = command->returnUUID;
                        break;
                    }
                }

                // if free return slot, spawn actor and set the data to the resulting pointer
                if (qndex != COMMAND_MAX) {
                    // set the return pointer to the result of Actor_SpawnFast
                    cmdBuffer.returns[qndex].data = Actor_SpawnFast(0xB5, 0, &command->data.puppetSpawn.params.position, *((uint8_t*)0x803F6A78), &command->data.puppetSpawn.params.rotation, 0, 0, 0, 0);
                }

                break;

            // if the command is puppet despawn
            case COMMAND_TYPE_PUPPET_DESPAWN:
                // despawn the actor given the command data
                Actor_Despawn(command->data.puppetDespawn.params.actor);
                break;
        }

        // clear the current command so that it doesn't get reprocessed
        command->type = COMMAND_TYPE_NONE;
    }

    // we iterated through all of the commands, assume there are no more commands to process
    cmdBuffer.count = 0;

    return;
}

#ifdef _LANGUAGE_C_PLUS_PLUS
}
#endif