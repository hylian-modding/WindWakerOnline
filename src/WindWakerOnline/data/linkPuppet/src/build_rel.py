
import os
from subprocess import call
import sys
import elf2rel


if len(sys.argv) < 4 or len(sys.argv) > 5:
  print("Invalid arguments. Format should be as follows:")
  print("  py build_rel.py [path to C source file] [REL module ID number in hexadecimal] [actor profile symbol name] [optional: path to RELS.arc to insert the REL into]")
  sys.exit(1)

c_src_path = sys.argv[1]
rel_id = int(sys.argv[2], 16)
actor_profile_name = sys.argv[3]
if len(sys.argv) == 5:
  rels_arc_path = sys.argv[4]
else:
  rels_arc_path = None


if sys.platform == "win32":
  DEVKIT_BIN_PATH = r"C:\devkitPro\devkitPPC\bin"
else:
  if not "DEVKITPPC" in os.environ:
    raise Exception(r"Could not find devkitPPC. Path to devkitPPC should be in the DEVKITPPC env var")
  DEVKIT_BIN_PATH = os.environ.get("DEVKITPPC") + "/bin"

def get_bin(name):
  if not sys.platform == "win32":
    return os.path.join(DEVKIT_BIN_PATH, name)
  return os.path.join(DEVKIT_BIN_PATH, name + ".exe")

if not os.path.isfile(get_bin("powerpc-eabi-gcc")):
  raise Exception(r"Failed to assemble code: Could not find devkitPPC. devkitPPC should be installed to: C:\devkitPro\devkitPPC")


build_dir = "./build"
basename = os.path.basename(c_src_path)
basename_no_ext = os.path.splitext(basename)[0]
linker_script_path = "./vanilla_defines/ww_linker.ld"

if not os.path.isdir(build_dir):
  os.makedirs(build_dir)


elf_path = os.path.join(build_dir, basename_no_ext + ".o")
command = [
  get_bin("powerpc-eabi-gcc"),
  "-mcpu=750",
  "-fno-inline",
  "-Wall",
  "-Og",
  "-g",
  "-fshort-enums",
  "-c", c_src_path,
  "-o", elf_path,
]
print(" ".join(command))
print()
result = call(command)
if result != 0:
  raise Exception("Compiler call failed")


linked_elf_path = os.path.join(build_dir, basename_no_ext + "_linked.o")
command = [
  get_bin("powerpc-eabi-ld"),
  "--relocatable",
  "-T", linker_script_path,
  "-o", linked_elf_path,
  elf_path,
]
print(" ".join(command))
print()
result = call(command)
if result != 0:
  raise Exception("Linker call failed")


disassembled_elf_path = os.path.join(build_dir, basename_no_ext + "_disassembled_elf.asm")
command = [
  get_bin("powerpc-eabi-objdump"),
  "-m", "powerpc",
  "-D",
  "-EB",
  linked_elf_path,
]
print(" ".join(command))
print()
with open(disassembled_elf_path, "w") as f:
  result = call(command, stdout=f)
if result != 0:
  raise Exception("Objdump call failed")


out_rel_path = os.path.join(build_dir, "d_a_%s.rel" % basename_no_ext)
elf2rel.convert_elf_to_rel(linked_elf_path, out_rel_path, rel_id, actor_profile_name, rels_arc_path)


disassembled_rel_path = os.path.join(build_dir, basename_no_ext + "_disassembled_rel.asm")
command = [
  get_bin("powerpc-eabi-objdump"),
  "-m", "powerpc",
  "-D",
  "-EB",
  "--disassemble-zeroes",
  "-b", "binary",
  out_rel_path,
]
print(" ".join(command))
print()
with open(disassembled_rel_path, "w") as f:
  result = call(command, stdout=f)
if result != 0:
  raise Exception("Objdump call failed")

