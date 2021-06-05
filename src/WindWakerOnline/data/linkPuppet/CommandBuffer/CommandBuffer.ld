OUTPUT_FORMAT ("elf32-powerpc")
OUTPUT_ARCH (powerpc)
EXTERN (CommandBuffer_Update)

SECTIONS
{
    . = 0x80000000;
    dCcS_Move = 0x800AE81C;
    Actor_SpawnFast = 0x80024614;
    Actor_Despawn = 0x80024478;

    . = 0x81800000;
    CommandBuffer_Update = 0x81800000;

    cmdBuffer = 0x81801000;
}
