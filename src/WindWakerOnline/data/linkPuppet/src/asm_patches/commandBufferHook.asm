
; command buffer for WWOnline.
.open "sys/main.dol"
.org 0x80234bc4 ; In dScnPly_Draw
bl 0x15CB43C ; Command Buffer Func
.close