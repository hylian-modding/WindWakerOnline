.open "sys/main.dol"
.org 0x81800000

.global check_run_custom_code
.global check_scene_change

check_run_custom_code:

; Execute custom code here:

lis r21,33152
addi r21,r21,4096
lhz r3,0(r21)
cmpwi r3,0
beq do_not_run_custom_code

li r4,0
li r5,0
lis r6,32831
addi r6,r6,27256
lbz r6,0(r6)
li r7,0
li r8,0
li r9,0
li r10,0
lis r20,-32766
addi r20,r20,17692
mtctr r20
bctrl

; ... until here!

do_not_run_custom_code:
sth r22,0(r21) ; Set 81801000 = 0
lha r0, 8 (r27) ; Replace a line of code we overwrote to jump here
; Return to normal code
lis r3, 0x80234BFC@ha
addi r3, r3, 0x80234BFC@l
mtctr r3
bctrl

check_scene_change:
lis r18,33152
addi r18,r18,4100
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