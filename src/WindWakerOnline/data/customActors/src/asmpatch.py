
import sys
import glob
import os

from gc_filesystem import GameCubeFilesystem
from asm_api import patcher


if len(sys.argv) != 3:
  print("Invalid arguments. Format should be as follows:")
  print("  py asmpatch.py [path to clean WW ISO file] [path to modified output extracted ISO folder]")
  sys.exit(1)

clean_iso_path = sys.argv[1]
modified_iso_folder = sys.argv[2]


gc_fs = GameCubeFilesystem(clean_iso_path)

all_asm_file_paths = glob.glob('./asm_patches/*.asm')
all_asm_files = [os.path.splitext(os.path.basename(asm_path))[0] for asm_path in all_asm_file_paths]
for patch_name in all_asm_files:
  print("Applying patch: %s.asm" % patch_name)
  patcher.apply_patch(gc_fs, patch_name)

gc_fs.save_modified_iso_files(modified_iso_folder)
