.open "sys/main.dol"
.org 0x818001E0

.global check_scene_change

check_scene_change:
lis r18,33152 ; Address to write scene change check flag
addi r18,r18,8192
li r19,0x1
stb r19, 0(r18)
; Line of replaced code
addi r11,r1,0x18
; Return to normal code
lis r15, 0x80053878@ha
addi r15, r15, 0x80053878@l
mtctr r15
bctrl

.close