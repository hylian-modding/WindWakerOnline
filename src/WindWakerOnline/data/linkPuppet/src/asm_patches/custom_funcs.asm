.open "sys/main.dol"
.org 0x81800000

; Checks if the player is holding down Y, Z and D-Pad Down.

.global check_run_custom_code
check_run_custom_code:

;lis r3, mPadButton__10JUTGamePad@ha ; Bitfield of currently pressed buttons
;addi r3, r3, mPadButton__10JUTGamePad@l
;lwz r0, 0 (r3)
;li r3, 0x0814 ; Custom button combo. Y, Z, and D-pad down.
;and r0, r0, r3 ; AND to get which buttons in the combo are currently being pressed
;cmpw r0, r3 ; Check to make sure all of the buttons in the combo are pressed
;bne do_not_run_custom_code

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
sth r22,0(r21)
lha r0, 8 (r27) ; Replace a line of code we overwrote to jump here
; Return to normal code
lis r3, 0x80234BFC@ha
addi r3, r3, 0x80234BFC@l
mtctr r3
bctrl

.close