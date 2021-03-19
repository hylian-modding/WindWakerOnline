
; command buffer for WWOnline.
.open "sys/main.dol"
.org 0x80234BF8 ; In dScnPly_Draw
  b check_command_start
.close