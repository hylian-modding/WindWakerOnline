
; nop out a couple lines so the long intro movie is skipped.
.open "sys/main.dol"
.org 0x80234BF8 ; In dScnPly_Draw
  b check_run_custom_code
.close