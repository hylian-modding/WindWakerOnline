
import os
import yaml
import sys

sys.path.insert(0, "./wwrando")

from wwlib.rarc import RARC
from wwlib.dol import DOL
from wwlib.rel import REL, RELRelocation, RELRelocationType
from wwlib.gcm import GCM

ASM_API_PATH = "./asm_api"
ASM_PATCHES_PATH = "./asm_patches"

class GameCubeFilesystem:
  def __init__(self, clean_iso_path):
    self.arcs_by_path = {}
    self.rels_by_path = {}
    self.symbol_maps_by_path = {}
    self.used_actor_ids = list(range(0x1F6))
    
    self.read_text_file_lists()
    
    if not os.path.isfile(clean_iso_path):
      raise InvalidCleanISOError("Clean ISO does not exist: %s" % clean_iso_path)
    
    self.gcm = GCM(clean_iso_path)
    self.gcm.read_entire_disc()
    
    dol_data = self.gcm.read_file_data("sys/main.dol")
    self.dol = DOL()
    self.dol.read(dol_data)
  
  def read_text_file_lists(self):
    with open(os.path.join(ASM_PATCHES_PATH, "custom_symbols.txt"), "r") as f:
      self.custom_symbols = yaml.safe_load(f)
    self.main_custom_symbols = self.custom_symbols["sys/main.dol"]
    
    with open(os.path.join(ASM_API_PATH, "free_space_start_offsets.txt"), "r") as f:
      self.free_space_start_offsets = yaml.safe_load(f)
  
  def save_modified_iso_files(self, output_folder_path):
    self.dol.save_changes()
    self.gcm.changed_files["sys/main.dol"] = self.dol.data
    
    for rel_path, rel in self.rels_by_path.items():
      rel.save_changes(preserve_section_data_offsets=True)
      
      rel_name = os.path.basename(rel_path)
      rels_arc = self.get_arc("files/RELS.arc")
      rel_file_entry = rels_arc.get_file_entry(rel_name)
      if rel_file_entry:
        # The REL already wrote to the same BytesIO object as the file entry uses, so no need to do anything more here.
        assert rel_file_entry.data == rel.data
      else:
        self.gcm.changed_files[rel_path] = rel.data
    
    for arc_path, arc in self.arcs_by_path.items():
      assert arc_path == "files/RELS.arc"
      arc.save_changes()
      self.gcm.changed_files[arc_path] = arc.data
    
    generator = self.gcm.export_disc_to_folder_with_changed_files(output_folder_path, only_changed_files=True)
    
    while True:
      # Need to use a while loop to go through the generator instead of a for loop, as a for loop would silently exit if a StopIteration error ever happened for any reason.
      next_progress_text, files_done = next(generator)
      if files_done == -1:
        break
    
    print()
    print("Successfully wrote %d changed files" % len(self.gcm.changed_files))
  
  def get_arc(self, arc_path):
    arc_path = arc_path.replace("\\", "/")
    
    if arc_path in self.arcs_by_path:
      return self.arcs_by_path[arc_path]
    else:
      data = self.gcm.read_file_data(arc_path)
      arc = RARC()
      arc.read(data)
      self.arcs_by_path[arc_path] = arc
      return arc
  
  def get_rel(self, rel_path):
    rel_path = rel_path.replace("\\", "/")
    
    if rel_path in self.rels_by_path:
      return self.rels_by_path[rel_path]
    else:
      if not rel_path.startswith("files/rels/"):
        raise Exception("Invalid REL path: %s" % rel_path)
      
      rel_name = os.path.basename(rel_path)
      rels_arc = self.get_arc("files/RELS.arc")
      rel_file_entry = rels_arc.get_file_entry(rel_name)
      
      if rel_file_entry:
        rel_file_entry.decompress_data_if_necessary()
        data = rel_file_entry.data
      else:
        data = self.gcm.read_file_data(rel_path)
      
      rel = REL()
      rel.read(data)
      self.rels_by_path[rel_path] = rel
      return rel
  
  def get_symbol_map(self, map_path):
    map_path = map_path.replace("\\", "/")
    
    if map_path in self.symbol_maps_by_path:
      return self.symbol_maps_by_path[map_path]
    else:
      data = self.gcm.read_file_data(map_path)
      map_text = read_all_bytes(data).decode("ascii")
      
      if map_path == "files/maps/framework.map":
        addr_to_name_map = disassemble.get_main_symbols(map_text)
      else:
        rel_name = os.path.splitext(os.path.basename(map_path))[0]
        rel = self.get_rel("files/rels/%s.rel" % rel_name)
        addr_to_name_map = disassemble.get_rel_symbols(rel, map_text)
      
      symbol_map = {}
      for address, name in addr_to_name_map.items():
        symbol_map[name] = address
      
      self.symbol_maps_by_path[map_path] = symbol_map
      return symbol_map
  
  def replace_arc(self, arc_path, new_data):
    if arc_path not in self.gcm.files_by_path:
      raise Exception("Cannot replace RARC that doesn't exist: " + arc_path)
    
    arc = RARC()
    arc.read(new_data)
    self.arcs_by_path[arc_path] = arc
  
  def add_new_rel(self, rel_path, new_rel, section_index_of_actor_profile, offset_of_actor_profile):
    if not rel_path.startswith("files/rels/"):
      raise Exception("Cannot add a new REL to a folder besides files/rels/: " + rel_path)
    if rel_path.lower() in self.gcm.files_by_path_lowercase:
      raise Exception("Cannot add a new REL that has the same name as an existing one: " + rel_path)
    
    # Read the actor ID out of the actor profile.
    section_data_actor_profile = new_rel.sections[section_index_of_actor_profile].data
    new_actor_id = read_u16(section_data_actor_profile, offset_of_actor_profile+8)
    
    if new_actor_id in self.used_actor_ids:
      raise Exception("Cannot add a new REL with an actor ID that is already used:\nActor ID: %03X\nNew REL path: %s" % (new_actor_id, rel_path))
    
    # We need to add the new REL to the profile list.
    profile_list = self.get_rel("files/rels/f_pc_profile_lst.rel")
    
    rel_relocation = RELRelocation()
    rel_relocation.relocation_type = RELRelocationType.R_PPC_ADDR32
    
    rel_relocation.curr_section_num = 4 # List section
    rel_relocation.relocation_offset = new_actor_id*4 # Offset in the list
    
    # Write a null placeholder for the pointer to the profile that will be relocated.
    list_data = profile_list.sections[rel_relocation.curr_section_num].data
    write_u32(list_data, new_actor_id*4, 0)
    # For some reason, there's an extra four 0x00 bytes after the last entry in the list, so we put that there just to be safe.
    write_u32(list_data, new_actor_id*4+4, 0)
    
    rel_relocation.section_num_to_relocate_against = section_index_of_actor_profile
    rel_relocation.symbol_address = offset_of_actor_profile
    
    if new_rel.id in profile_list.relocation_entries_for_module:
      raise Exception("Cannot add a new REL with a unique ID that is already present in the profile list:\nREL ID: %03X\nNew REL path: %s" % (new_rel.id, rel_path))
    
    profile_list.relocation_entries_for_module[new_rel.id] = [rel_relocation]
    
    # Then add the REL to the game's filesystem.
    self.gcm.add_new_file(rel_path)
    self.rels_by_path[rel_path] = new_rel
    
    # Don't allow this actor ID to be used again by any more custom RELs we add.
    self.used_actor_ids.append(new_actor_id)
