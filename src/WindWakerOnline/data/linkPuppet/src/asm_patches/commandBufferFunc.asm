.open "sys/main.dol"
.org 0x81800000

.global check_command_start
.global check_scene_change

check_command_start:
lis r20,33152 ; 0x81801000@ha ; Set CommandBuffer Function Recieve Addr (Hi)
addi r20,r20,4096 ; 0x81801000@l ; Set CommandBuffer Function Recieve Addr (Lo)
lwz r22,0(r20) ; Read the command ML64 sent 
cmpwi r22,0 ; Check if command == nothing (0x00000000)
beq check_command_end
cmpwi r22,1 ; Check if command == spawn (0x00000001)
beq spawn_actor
cmpwi r22,2 ; Check if command == despawn (0x00000002)
beq despawn_actor
b check_command_end
; End of Function

spawn_actor:
li r22,0 ; Make Sure Last Command Buffer Param Is Reset
stw r22,0(r20)
lis r20,33152 ; 0x81801006@ha ; Set Entity Actor ID From ML64 (Hi)
addi r20,r20,4102 ; 0x81801006@l ; Set Entity Actor ID From ML64 (Lo)
lhz r3,0(r20) ; load the spawn info
cmpwi r3,0 ; check if spawn info is valid
beq check_command_end ; skip spawn routine if Actor ID is blank
lis r18,33152 ;0x81801008@ha ; Flag Address for Spawn Attempt  (Hi)
addi r18,r18,4104 ; 0x81801008@l ; Flag Address for Spawn Attempt (Lo)
li r19,0x1 ; set flag val
stb r19,0(r18) ; write flag to address
li r4,0 ; set spawn args to 0
li r5,0
lis r6,32831 ; current room pointer addr
addi r6,r6,27256
lbz r6,0(r6) ; load current room data
li r7,0 ; more empty args
li r8,0
li r9,0
li r10,0
lis r21,32770 ; 0x8002451C@ha ; fopAcM_create
addi r21,r21,17692 ; 0x8002451C@l
mtctr r21 ; move to link register
bctrl ; jump to func addr (r21)
li r22,0 ; Make Sure Last Command Buffer Param Is Reset
stw r22,0(r20)
b check_command_end
; End of Function

despawn_actor:
li r22,0 ; Make Sure Last Command Buffer Param Is Reset
stw r22,0(r20)
lis r20,33152 ; 0x81801008@ha ; Set Entity Pointer Addr From ML64 (Hi)
addi r20,r20,4104; 0x81801008@l ; Set Entity Pointer Addr From ML64 (Lo)
lis r21,32770 ; 0x80024478@ha ; Set Despawn Function Addr (Hi)
addi r21,r21,17528 ; 0x80024478@l ; Set Despawn Function Addr (Lo)
lhz r3,0(r20) ; Load The Entity Pointer from ML64 in Despawn Param
cmpwi r3,0 ; Check if Entity Pointer is Valid
beq check_command_end ; return if despawn is not true
mtctr r21 ; move to link register
bctrl ; jump to func addr (r21)
li r22,0 ; Make Sure Last Command Buffer Param Is Reset
stw r22,0(r20)
b check_command_end
; End of Function

check_command_end:
li r22,0 ; Make Sure Last Command Buffer Param Is Reset
stw r22,0(r20)
li r22,0 ; Make Sure Last Command Buffer Param Is Reset
lha r0,8(r27) ; Replace a line of code we overwrote to jump here
; Return to normal code
lis r3,32803; 0x80234BFC@ha ; Return to code hook source
addi r3,r3,19452 ; 0x80234BFC@l
mtctr r3
bctrl
; End of Function

check_scene_change:
lis r18,33152 ; 0x8180100C@ha ; Flag Address for Scene Change Detection (Hi)
addi r18,r18,4108 ; 0x8180100C@l ; Flag Address for Scene Change Detection (Lo)
li r19,0x1 ; set flag val
stb r19,0(r18) ; write flag to address
; Line of replaced code
addi r11,r1,0x18
; Return to normal code
lis r15,32773 ; 0x80053878@ha ; Within Scene Change Function
addi r15,r15,14456; 0x80053878@l ; Within Scene Change Function
mtctr r15
bctrl
; End of Function

.close