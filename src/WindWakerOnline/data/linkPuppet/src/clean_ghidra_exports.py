
import re
from collections import OrderedDict
import yaml


with open("overloaded_funcs.txt", "r") as f:
  overloaded_funcs = yaml.safe_load(f)

NAMESPACES_TO_NOT_QUALIFY = [
  "Global",
  "d_com_inf_game",
  "f_pc_leaf",
  "f_op_actor",
  "f_op_actor_mng",
  "mtx",
  "d_kankyo",
  "d_bg_s",
  "m_Do_ext",
  "m_Do_printf",
  "m_Do_mtx",
]

NAMESPACES_TO_NOT_QUALIFY_FOR_FUNCS = NAMESPACES_TO_NOT_QUALIFY + [
  "d_npc",
  "SComponent",
  "Runtime.PPCEABI.H",
]

ENUM_NAMES_TO_NOT_QUALIFY = [
  "PhaseState",
]

DATA_TYPE_TO_BYTE_SIZE = {
  "u8": 1,
  "u16": 2,
  "u32": 4,
  "s8": 1,
  "s16": 2,
  "s32": 4,
  "char": 1,
  "short": 2,
  "int": 4,
  "long": 4,
  "unsigned char": 1,
  "unsigned short": 2,
  "unsigned int": 4,
  "unsigned long": 4,
  "pointer": 4,
  "float": 4,
  "double": 8,
  
  "struct cXyz": 0xC,
  "struct csXyz": 6,
  
  "GXTexObj": 0x20,
  "GXTlutObj": 0xC,
  "struct _GXTexObj": 0x20,
  "GXTexWrapMode": 1,
  "GXTexFilter": 1,
  "GXTexFmt": 1,
  "GXSpotFn": 4,
  "GXTlutFmt": 1,
  "enum _GXDistAttnFn": 4,
  "TELight": 4,
  "struct TObject": 4,
  "J3DAlphaComp": 4,
  "J3DGXColor": 4,
  "J3DTevOrder": 4,
  "OSMessage": 4,
  "EMountDirection": 4,
  "__off_t": 4,
  "__off64_t": 8,
  "size_t": 4,
}

DATA_TYPES_TO_IGNORE_ALIGNMENT = [
  "struct _GXColor",
]

def clean_symbol_name(symbol_name):
  symbol_name = symbol_name.replace("new[]", "new_array")
  symbol_name = symbol_name.replace("delete[]", "delete_array")
  symbol_name = symbol_name.replace("operator_()", "operator_parentheses")
  symbol_name = symbol_name.replace("operator_==", "operator_equal_to")
  symbol_name = symbol_name.replace("operator_!=", "operator_not_equal_to")
  symbol_name = symbol_name.replace("operator_=", "operator_set")
  symbol_name = symbol_name.replace("operator_+=", "operator_plus_set")
  symbol_name = symbol_name.replace("operator_-=", "operator_minus_set")
  symbol_name = symbol_name.replace("operator*=", "operator_times_set")
  symbol_name = symbol_name.replace("operator_/=", "operator_divide_set")
  symbol_name = symbol_name.replace("operator_+", "operator_plus")
  symbol_name = symbol_name.replace("operator_-", "operator_minus")
  symbol_name = symbol_name.replace("operator*", "operator_times")
  symbol_name = symbol_name.replace("operator_/", "operator_divide")
  symbol_name = re.sub(r"[@:\.,\-]", "_", symbol_name)
  #symbol_name = re.sub(r"[@:\.,\-%\"!&()|]", "_", symbol_name)
  symbol_name = re.sub(r"<", "__", symbol_name)
  symbol_name = re.sub(r">", "__", symbol_name)
  symbol_name = symbol_name.replace("*", "_star")
  return symbol_name


# Clean up structs exported from Ghidra.

with open("./ghidra_exports/ww_structs_from_ghidra.h") as f:
  input_str = f.read()

output_str = "\n"
output_str += "struct cXyz {\n    float x;\n    float y;\n    float z;\n};\n\n"
output_str += "struct csXyz {\n    short x;\n    short y;\n    short z;\n};\n\n"
current_enum_name = None
current_struct_name = None
current_enum_data_size = None
offset_in_current_struct = None
for line in input_str.splitlines():
  comment_match = re.search(r" //| /\*", line)
  if comment_match:
    comment_start_index = comment_match.start()
    comment = line[comment_start_index:]
    line = line[:comment_start_index]
    
    if comment in [" /* PlaceHolder Class Structure */", " /* PlaceHolder Structure */", " /* Created by retype action */"]:
      comment = ""
  else:
    comment = ""
  
  line = re.sub(r"[@:\?!]", "_", line)
  line = re.sub(r"\+", "Plus", line)
  
  typedef_match = re.search(r"^typedef ([^,]+?) {3,4}([^,;]+);$", line)
  if typedef_match:
    base_type_name = typedef_match.group(1)
    new_type_name = typedef_match.group(2)
    if new_type_name in DATA_TYPE_TO_BYTE_SIZE:
      raise Exception("Duplicate data type defined: %s" % new_type_name)
    if base_type_name in DATA_TYPE_TO_BYTE_SIZE:
      #print("%s = %s = 0x%02X" % (new_type_name, base_type_name, DATA_TYPE_TO_BYTE_SIZE[base_type_name]))
      DATA_TYPE_TO_BYTE_SIZE[new_type_name] = DATA_TYPE_TO_BYTE_SIZE[base_type_name]
  
  if line == "typedef struct TVec3<float> TVec3<float>, *PTVec3<float>;":
    line = "//" + line
  elif line == "typedef struct TVec3<short> TVec3<short>, *PTVec3<short>;":
    line = "//" + line
  elif line == "typedef dword ...;":
    line = "//" + line
  else:
    line = re.sub(r"TVec3<float>( [^{])", "cXyz\\1", line)
    line = re.sub(r"TVec3<short>( [^{])", "csXyz\\1", line)
    #line = re.sub(r"(\S+)<([^<>]+)>", "\\1__\\2", line)
    line = re.sub(r"<", "__", line)
    line = re.sub(r">", "__", line)
  
  line = re.sub(r"pointer ~;", "pointer destructor;", line)
  #line = re.sub(r"pointer ~([^;]+);", "pointer \\1_destructor;", line)
  line = re.sub(r"pointer ~([^;]+);", "pointer destructor;", line)
  
  if line == "typedef struct struct struct, *Pstruct;":
    line = "//" + line
  
  if line in ["typedef ulong size_t;", "typedef struct _IO_FILE __FILE;", "typedef short    wchar_t;", "typedef long __off_t;"]:
    line = "//" + line
  
  if line.startswith("typedef struct ") or line.startswith("struct "):
    line = re.sub(r"\*", "_star", line)
    line = re.sub(r",(\S)", "_\\1", line)
  if current_enum_name is not None:
    line = re.sub(r"[()]", "_", line)
  
  enum_def_match = re.search(r"^typedef enum (\S+) {", line)
  if enum_def_match:
    current_enum_name = enum_def_match.group(1)
  
  struct_def_match = re.search(r"^struct (\S+) {", line)
  if struct_def_match:
    current_struct_name = struct_def_match.group(1)
  
  if current_enum_name is not None:
    enum_value_match = re.search(r"^    ([^=]+)=([^,]+)(,?)$", line)
    if enum_value_match:
      # We have to add the enum name as a qualifier to the beginning of each enum value to prevent duplicate identifier issues.
      enum_value_name = enum_value_match.group(1)
      enum_value = enum_value_match.group(2)
      maybe_comma = enum_value_match.group(3)
      if current_enum_name not in ENUM_NAMES_TO_NOT_QUALIFY:
        enum_value_name = "%s__%s" % (current_enum_name, enum_value_name)
      line = "    %s=%s%s" % (enum_value_name, enum_value, maybe_comma)
      
      # Also handle calculating the data size of the enum.
      this_value_data_size = (int(enum_value).bit_length()+7)//8
      if this_value_data_size <= 0:
        this_value_data_size = 1
      if this_value_data_size >= 3:
        this_value_data_size = 4
      if this_value_data_size > current_enum_data_size:
        current_enum_data_size = this_value_data_size
  
  if current_struct_name in ["profile_method_class", "profile_leaf_method_class"]:
    # Fix the actor methods to take any argument type.
    line = re.sub(r"\(void \*\);$", "();", line)
  
  if enum_def_match:
    current_enum_data_size = 1
  
  # Handle adding offset comments to structs.
  if offset_in_current_struct is not None:
    field_def_match = re.search(r"^(    )(?:((?:struct |enum )?\S+(?: \*){0,}) (\S+)|(\S+ \(\*+ \S+\)\([^)]*\)));$", line)
    data_type_size = None
    if field_def_match:
      indentation = field_def_match.group(1)
      data_type = field_def_match.group(2)
      field_name = field_def_match.group(3)
      method_field_def = field_def_match.group(4)
      
      if method_field_def:
        # e.g.:
        # int (* mpCreate)();
        # void (* mpCallback)(struct fopAc_ac_c *, struct cXyz *, ulong);
        data_type = "pointer"
        field_name = ""
        orig_line_to_keep = method_field_def
      else:
        orig_line_to_keep = data_type + " " + field_name
      
      #print(data_type, line)
      if data_type.endswith(" *"):
        data_type = "pointer"
      field_array_multiplier = 1
      while array_field_match := re.search(r"^(.+?)\[(\d+)\]$", field_name):
        field_name_before_array = array_field_match.group(1)
        array_size = int(array_field_match.group(2))
        field_array_multiplier *= array_size
        field_name = field_name_before_array
      
      field_hex_offset_name_match = re.search(r"^field_0x([0-9a-f]+)$", field_name)
      if field_hex_offset_name_match:
        correct_offset = int(field_hex_offset_name_match.group(1), 16)
        if correct_offset != offset_in_current_struct:
          print("Inaccuracy calculating offset within struct %s! Calculated offset is 0x%02X, but correct offset is 0x%02X." % (current_struct_name, offset_in_current_struct, correct_offset))
          data_type = "" # Don't continue adding offsets after this field
      
      if data_type in DATA_TYPE_TO_BYTE_SIZE:
        data_type_size = DATA_TYPE_TO_BYTE_SIZE[data_type]
        if data_type not in DATA_TYPES_TO_IGNORE_ALIGNMENT:
          if data_type_size == 2 and (offset_in_current_struct % 2) != 0:
            print("Offset is not halfword aligned at offset 0x%02X in struct %s" % (offset_in_current_struct, current_struct_name))
          if data_type_size == 4 and (offset_in_current_struct % 4) != 0:
            print("Offset is not word aligned at offset 0x%02X in struct %s" % (offset_in_current_struct, current_struct_name))
        
        data_type_size *= field_array_multiplier
        if data_type_size == 0:
          raise Exception("Field data size is zero for data type %s in struct %s" % (data_type, current_struct_name))
        
        curr_offset_comment = "/* 0x%02X */ " % offset_in_current_struct
        field_size_comment = " // 0x%02X bytes" % (data_type_size)
        line = indentation + curr_offset_comment + orig_line_to_keep + ";" + field_size_comment
        offset_in_current_struct += data_type_size
      else:
        # We don't know the size of this field, so quit showing offsets for the rest of this struct after this field.
        print("Unknown field data size at offset 0x%02X in struct %s" % (offset_in_current_struct, current_struct_name))
        offset_in_current_struct = None
    elif line != "};":
      # Failed to parse this field, so quit showing offsets for the rest of this struct.
      print("Failed to parse line at offset 0x%02X in struct %s" % (offset_in_current_struct, current_struct_name))
      offset_in_current_struct = None
  
  if struct_def_match:
    offset_in_current_struct = 0
  
  if current_struct_name in ["cXyz", "csXyz"]:
    # We added these to the beginning so we don't want them duplicated.
    pass
  elif current_struct_name in ["struct", "_IO_FILE", "_IO_marker"]:
    line_with_comment = line + comment
    output_str += ("// " + line_with_comment + "\n")
  else:
    line_with_comment = line + comment
    output_str += (line_with_comment + "\n")
  
  if current_enum_name is not None and line == "} %s;" % current_enum_name:
    if current_enum_data_size is not None and current_enum_data_size != 0:
      DATA_TYPE_TO_BYTE_SIZE["enum " + current_enum_name] = current_enum_data_size
    current_enum_name = None
    current_enum_data_size = None
  if current_struct_name is not None and line == "};":
    if offset_in_current_struct is not None and offset_in_current_struct != 0:
      DATA_TYPE_TO_BYTE_SIZE["struct " + current_struct_name] = offset_in_current_struct
    current_struct_name = None
    offset_in_current_struct = None

with open("./vanilla_defines/ww_structs.h", "w") as f:
  f.write(output_str)



# Clean up function signatures exported from Ghidra.

with open("./ghidra_exports/ww_functions_from_ghidra.csv") as f:
  input_str = f.read()

# First parse the CSV.
func_datas = []
func_name_to_namespaces = OrderedDict()
for line in input_str.splitlines()[1:]:
  line = line[1:-1] # Remove first and last quotation mark since split won't get these
  func_name, address, func_signature, func_size, namespace = line.split("\",\"")
  address = int(address, 16)
  func_size = int(func_size, 16)
  
  if address >= 0x80338680:
    # Not in main.dol
    continue
  
  func_sign_match = re.search(r"^(\S+(?: \*){0,}) (.+)$", func_signature)
  return_value = func_sign_match.group(1)
  rest_of_func_sign = func_sign_match.group(2)
  assert rest_of_func_sign.startswith(func_name)
  arguments = rest_of_func_sign[len(func_name):]
  
  if address in overloaded_funcs:
    # Manually rename some overloaded functions to prevent conflicts because C does not support overloading.
    func_name = overloaded_funcs[address]
  
  if func_name not in func_name_to_namespaces:
    func_name_to_namespaces[func_name] = []
  
  if namespace not in func_name_to_namespaces[func_name]:
    func_name_to_namespaces[func_name].append(namespace)
  
  func_datas.append((func_name, address, return_value, arguments, func_size, namespace))

#namespaces_that_need_qualification = []
#for func_name, namespaces in func_name_to_namespaces.items():
#  if len(namespaces) > 1:
#    print(func_name)
#    #for namespace in namespaces:
#    #  if namespace not in namespaces_that_need_qualification:
#    #    if namespace == "f_op_actor_mng":
#    #      print(func_name)
#    #      input()
#    #    namespaces_that_need_qualification.append(namespace)
##print(namespaces_that_need_qualification)

output_str = "\n"
linker_str = "\n"
seen_symbol_names = []
for func_name, address, return_value, arguments, func_size, namespace in func_datas:
  symbol_name = func_name
  if symbol_name.startswith("~"):
    symbol_name = symbol_name[1:] + "_destructor"
  
  # Add the namespace to the symbol name.
  if namespace not in NAMESPACES_TO_NOT_QUALIFY_FOR_FUNCS:
    symbol_name = "%s__%s" % (namespace, symbol_name)
  
  # Clean up the symbol name.
  symbol_name = clean_symbol_name(symbol_name)
  
  # Clean up the arguments.
  arguments = re.sub(r"[@:]", "_", arguments)
  arguments = re.sub(r"TVec3<float>( [^{])", "cXyz\\1", arguments)
  arguments = re.sub(r"TVec3<short>( [^{])", "csXyz\\1", arguments)
  def fix_type_arg(match):
    return "__%s__" % match.group(1).replace("*", "_star").replace(",", "_")
  while "<" in arguments:
    arguments = re.sub(r"<([^<>]+)>", fix_type_arg, arguments)
  # Remove argument name from ... variable number of argument indicators
  arguments = re.sub(r"\.\.\. [^()\s,]+", "...", arguments)
  # Function argument definitions don't get exported from Ghidra, so we need to convert these manually.
  # Manually replace some specific known function argument definitions.
  arguments = re.sub(r"cPhs__Handler \* ([^()\s,]+)", "int \\1(void * )", arguments)
  # For the others, just make them able to take any type of function here.
  arguments = re.sub(r"FuncDef\d+ \*", "void *", arguments)
  # Fix array arguments. e.g. "float[6] * param_2" -> "float param_2[6]"
  def fix_array_arg(match):
    data_type = match.group(1)
    array_length = match.group(2)
    arg_name = match.group(3)
    return "%s %s[%s]" % (data_type, arg_name, array_length)
  arguments = re.sub(r"([^\s,()\[\]]+)\[(\d+)\] \* ([^\s,()\[\]]+)", fix_array_arg, arguments)
  
  func_signature = "%s %s%s" % (return_value, symbol_name, arguments)
  
  should_comment_out = False
  if symbol_name in seen_symbol_names:
    # Duplicate name. Comment it out for now.
    should_comment_out = True
  
  if symbol_name == "MSL_C_PPCEABI_bare_H__fwide":
    # Causes issues for some reason, just comment it out since it's unimportant
    should_comment_out = True
  
  if should_comment_out:
    output_str += "// "
    linker_str += "/* "
  
  output_str += "%s;" % func_signature
  linker_str += "%s = 0x%08X;" % (symbol_name, address)
  
  if should_comment_out:
    linker_str += " */"
  
  output_str += "\n"
  linker_str += "\n"
  
  seen_symbol_names.append(symbol_name)

with open("./vanilla_defines/ww_functions.h", "w") as f:
  f.write(output_str)



# Clean up variables exported from Ghidra.

with open("./ghidra_exports/ww_variables_from_ghidra.csv") as f:
  input_str = f.read()


# First parse the CSV.
var_datas = []
for line in input_str.splitlines()[1:]:
  line = line[1:-1] # Remove first and last quotation mark since split won't get these
  var_name, address, data_type, data_size, namespace = line.split("\",\"")
  address = int(address, 16)
  data_size = int(data_size, 16)
  
  if address >= 0x803FCF20:
    # Not in main.dol
    continue
  
  if var_name == "":
    # No name
    continue
  
  base_data_type = data_type.split(" ")[0]
  if base_data_type in ["float", "double", "string", "TerminatedCString", "unicode"]:
    # Ghidra puts the value in the variable name for these, and they're not useful to have anyway.
    continue
  
  var_datas.append((var_name, address, data_type, data_size, namespace))

output_str = "\n"
linker_str += "\n"
for var_name, address, data_type, data_size, namespace in var_datas:
  symbol_name = var_name
  
  if symbol_name.startswith("~"):
    symbol_name = symbol_name[1:] + "_destructor"
  
  # Add the namespace to the symbol name.
  if namespace not in NAMESPACES_TO_NOT_QUALIFY:
    symbol_name = "%s__%s" % (namespace, symbol_name)
  
  # Clean up the symbol name.
  symbol_name = clean_symbol_name(symbol_name)
  
  if symbol_name in seen_symbol_names:
    # Duplicate name. Comment it out for now.
    output_str += "// "
    linker_str += "/* "
  
  if data_type == "TVec3<float>":
    data_type = "cXyz"
  elif data_type == "TVec3<short>":
    data_type = "csXyz"
  
  # Array declarations have to be moved to after the variable name.
  array_dec_match = re.search(r"([^\[\]]+)(\[\d+\])", data_type)
  if array_dec_match:
    data_type = array_dec_match.group(1)
    array_declaration = array_dec_match.group(2)
  else:
    array_declaration = ""
  
  output_str += "extern %s %s%s;" % (data_type, symbol_name, array_declaration)
  linker_str += "%s = 0x%08X;" % (symbol_name, address)
  
  if symbol_name in seen_symbol_names:
    linker_str += " */"
  
  output_str += "\n"
  linker_str += "\n"
  
  seen_symbol_names.append(symbol_name)
  

with open("./vanilla_defines/ww_variables.h", "w") as f:
  f.write(output_str)

with open("./vanilla_defines/ww_linker.ld", "w") as f:
  f.write(linker_str)
