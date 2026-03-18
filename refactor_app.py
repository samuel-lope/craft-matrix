import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The entire return block from `return (` to the end.
# We will split standard parts.
# 1. Sidebar Controls (which we'll turn into Properties Sidebar)
# 2. Main Grid Area

def extract_section(text, start_marker, end_marker):
    start_idx = text.find(start_marker)
    if start_idx == -1: return ""
    end_idx = text.find(end_marker, start_idx)
    return text[start_idx:end_idx]

# Let's extract specific inner blocks
grid_params = extract_section(content, "{/* Grid Parameters - Optimized */}", "<div className=\"border-b")
outer_border = extract_section(content, "<div className=\"border-b border-neutral-800 pb-6\">", "{/* Global Inner")
global_inner = extract_section(content, "{/* Global Inner Background Setting */}", "{/* External Margin")
external_margin = extract_section(content, "{/* External Margin Setting */}", "{/* Workspace Background")
workspace_bg = extract_section(content, "{/* Workspace Background Setting */}", "{/* Background Tools")

bg_tools_props = extract_section(content, "{activeTool === 'bg-color' && (", "</ToolSection>")
item_tools_props = extract_section(content, "{activeTool === 'item-svg' && (", "</ToolSection>")
label_tools_props = extract_section(content, "{activeTool === 'label' && (", "</ToolSection>")
border_tools_props_start = content.find("{(activeTool === 'cell-border' || activeTool === 'cell-border-eraser') && (")
border_tools_props_end = content.find("</ToolSection>", border_tools_props_start)
border_tools_props = content[border_tools_props_start:border_tools_props_end]

main_grid = content[content.find("{/* Main Grid Area */}"):content.find("</div>\n  );\n}\n")]

# Build new return block
new_return = """  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-200 font-sans overflow-hidden">
      
      {/* Left Toolbar (Tools) */}
      <aside className="w-16 flex flex-col items-center py-4 gap-4 z-20 border-r border-neutral-800 bg-black shrink-0 overflow-y-auto custom-scrollbar shadow-xl">
        <ToolButton icon={MousePointer2} title="Pointer" isActive={activeTool === 'pointer'} onClick={() => setActiveTool('pointer')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={PaintBucket} title="Fill Background Color" isActive={activeTool === 'bg-color'} onClick={() => setActiveTool('bg-color')} />
        <ToolButton icon={ImageIcon} title="Fill Background SVG" isActive={activeTool === 'bg-svg'} onClick={() => setActiveTool('bg-svg')} />
        <ToolButton icon={Eraser} title="Erase Background" isActive={activeTool === 'bg-eraser'} onClick={() => setActiveTool('bg-eraser')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={ImageIcon} title="Place Item SVG" isActive={activeTool === 'item-svg'} onClick={() => setActiveTool('item-svg')} />
        <ToolButton icon={Eraser} title="Erase Item" isActive={activeTool === 'item-eraser'} onClick={() => setActiveTool('item-eraser')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={Type} title="Place Text Label" isActive={activeTool === 'label'} onClick={() => setActiveTool('label')} />
        <ToolButton icon={Eraser} title="Erase Text Label" isActive={activeTool === 'label-eraser'} onClick={() => setActiveTool('label-eraser')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={Square} title="Apply Cell Borders" isActive={activeTool === 'cell-border'} onClick={() => setActiveTool('cell-border')} />
        <ToolButton icon={Eraser} title="Erase Cell Borders" isActive={activeTool === 'cell-border-eraser'} onClick={() => setActiveTool('cell-border-eraser')} />

        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <button
          onClick={() => setActiveTool('eraser-all')}
          className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'eraser-all' ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'tool-btn-inactive'}`}
          title="Erase All in Cell"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </aside>

      """ + main_grid + """

      {/* Properties Sidebar (Right) */}
      <aside className="w-80 flex-col overflow-y-auto z-20 custom-scrollbar border-l border-neutral-800 bg-black shrink-0 shadow-2xl">
        <div className="p-4 space-y-6 pb-24">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-white" />
              <h1 className="text-xs font-bold text-white tracking-widest uppercase">Grid & Properties</h1>
            </div>
            <button
              onClick={() => setGridState(prev => ({ ...prev, cells: {} }))}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
              title="Clear entire grid content"
            >
              Clear Grid
            </button>
          </div>
          
          <div className="w-full h-px bg-neutral-800" />

          {/* Grid Parameters Base */}
          """ + grid_params + outer_border + global_inner + external_margin + workspace_bg + """
          
          {/* Active Tool Properties */}
          <div className="w-full h-px bg-neutral-800 my-6" />
          <h2 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            Tool Settings
          </h2>
          <div className="px-1">
            """ + bg_tools_props + item_tools_props + label_tools_props + border_tools_props + """
          </div>
        </div>
      </aside>
    </div>
  );
}
"""

with open('src/App.tsx.new', 'w', encoding='utf-8') as f:
    f.write(content[:content.find("  return (\n    <div className=\"flex h-screen w-full")] + new_return)
