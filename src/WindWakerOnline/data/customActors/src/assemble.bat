py -3.8 asm_api/assemble.py
if %errorlevel% neq 0 exit /b %errorlevel%
py -3.8 asmpatch.py "D:/Modding/WW/WW.iso" "./Vanilla ISOs/WW ASM Patched"
