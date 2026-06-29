import * as React from "react";
import { useState } from "react";
import { X, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useListSettingOptions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ProductRow { code: string; lot: string; description: string; }

export const DEVIATION_TYPES = [
  "Site quality deviation", "Process deviation", "Equipment failure",
  "Environmental", "Documentation", "Material", "Personnel", "Other",
];

export const OPERATIONS = [
  "Documentation", "Manufacturing", "Quality Control", "Packaging",
  "Storage", "Distribution", "Laboratory", "Engineering", "Other",
];

export const LAB_EQUIPMENT = [
  "Analytical Balance", "Autoclave", "Automated Dissolution system", "Autotitrator",
  "Average Mass Balance", "Bio-Safety Cabinet", "Centrifuge", "Climatic Chamber",
  "Colony Counter", "Disintegration Tester", "Dissolution Bath", "Friability tester",
  "Fridge", "Furnace", "GC", "Glassware Washer", "Hardness Tester", "HPLC",
  "Incubator", "IR Spectrophotometer", "Karl Fischer", "Laboratory Purified Water System",
  "Laminar Flow cabinet", "LOD Oven", "Melting Point Apparatus", "Micro Balance",
  "Microscope", "pH Meter", "Photostability chamber", "Polarimeter", "Precision balance",
  "Refractometer", "Semi Micro Balance", "Stability room", "Top load Balance",
  "UPLC", "UV/Vis Spectrophotometer", "Vacuum Oven", "Viscometer", "Volumeter",
];

export const MANUFACTURING_EQUIPMENT = [
  "Alexanderwerk", "Diosna", "Hi-Speed Mixer", "Fluid Bed Dryer", "Drying Oven",
  "Ribbon Blender", "Double Cone Blender", "Cloma", "Drum Mixer", "Russell Vibrator Sieve",
  "Process Vessel", "Bin Blender", "Bin Lifter", "Film Coater", "Accela cota",
  "Sugar Coating Pan", "Compression machine", "Capsule filling machine",
  "Empty Capsule sorter", "Capsule Sorter Elevator", "Unimix", "LCO Storage tank",
  "LCO Manufacturing Tank", "Frewitt sieve", "Sade Weight sorter", "Sachet Filling Machine",
  "Metal Detector", "Deduster", "HVAC", "Compressed Air System",
  "Aqua Rodi Purified Water System", "Stilmas Purified Water System", "TOC Meter",
];

export const PACKAGING_EQUIPMENT = [
  "Tube filler", "Checkweigher", "Cartoner", "Blister Machine", "Labeling Machine",
  "Shrink Wrapper", "Tablet Counter", "Capper", "Data Matrix", "Unscrambler",
];

export const EQUIPMENT_GROUPS = [
  { label: "Laboratory Equipment", items: LAB_EQUIPMENT },
  { label: "Manufacturing Equipment", items: MANUFACTURING_EQUIPMENT },
  { label: "Packaging Equipment", items: PACKAGING_EQUIPMENT },
];

export function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

/* ── Equipment multi-select popover ──────────────────────────────── */
interface EquipmentPickerProps {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

export function EquipmentPicker({ value, onChange, disabled }: EquipmentPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: labData } = useListSettingOptions({ category: "lab_equipment" });
  const { data: mfgData } = useListSettingOptions({ category: "manufacturing_equipment" });
  const { data: pkgData } = useListSettingOptions({ category: "packaging_equipment" });
  const equipmentGroups = [
    { label: "Laboratory Equipment", items: labData?.map((o) => o.value) ?? LAB_EQUIPMENT },
    { label: "Manufacturing Equipment", items: mfgData?.map((o) => o.value) ?? MANUFACTURING_EQUIPMENT },
    { label: "Packaging Equipment", items: pkgData?.map((o) => o.value) ?? PACKAGING_EQUIPMENT },
  ];
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);

  return (
    <div className="space-y-2">
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal text-muted-foreground">
              <span>Select equipment...</span>
              <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[440px] p-3 max-h-[400px] overflow-y-auto" align="start">
            <div className="space-y-4">
              {equipmentGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.label}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggle(item)}
                      >
                        <Checkbox checked={value.includes(item)} onCheckedChange={() => toggle(item)} id={`eq-${item}`} />
                        <label htmlFor={`eq-${item}`} className="text-xs cursor-pointer leading-tight">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20 min-h-[44px]">
          {value.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {item}
              {!disabled && (
                <button onClick={() => toggle(item)} className="ml-1 hover:text-blue-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        !disabled && <p className="text-xs text-muted-foreground">No equipment selected</p>
      )}
    </div>
  );
}

/* ── Products table editor ────────────────────────────────────────── */
interface ProductsEditorProps {
  rows: ProductRow[];
  onChange: (r: ProductRow[]) => void;
  disabled?: boolean;
}

export function ProductsEditor({ rows, onChange, disabled }: ProductsEditorProps) {
  const add = () => onChange([...rows, { code: "", lot: "", description: "" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ProductRow, val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs w-[140px]">Product Code</TableHead>
                <TableHead className="text-xs w-[120px]">Lot</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                {!disabled && <TableHead className="w-[40px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="p-1.5">
                    {disabled ? (
                      <span className="text-sm">{row.code || "—"}</span>
                    ) : (
                      <Input value={row.code} onChange={(e) => update(i, "code", e.target.value)} className="h-8 text-sm" placeholder="Code" />
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    {disabled ? (
                      <span className="text-sm">{row.lot || "—"}</span>
                    ) : (
                      <Input value={row.lot} onChange={(e) => update(i, "lot", e.target.value)} className="h-8 text-sm" placeholder="Lot" />
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    {disabled ? (
                      <span className="text-sm">{row.description || "—"}</span>
                    ) : (
                      <Input value={row.description} onChange={(e) => update(i, "description", e.target.value)} className="h-8 text-sm" placeholder="Description" />
                    )}
                  </TableCell>
                  {!disabled && (
                    <TableCell className="p-1.5">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!disabled && (
        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Product
        </Button>
      )}
      {rows.length === 0 && disabled && <p className="text-sm text-muted-foreground italic">No products listed</p>}
    </div>
  );
}
