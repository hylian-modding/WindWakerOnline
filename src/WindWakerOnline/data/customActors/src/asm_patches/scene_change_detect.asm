
.open "sys/main.dol"
.org 0x80053874 ; In setNextStage
  b check_scene_change
.close