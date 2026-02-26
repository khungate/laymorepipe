"use client";

import React from "react";
import { ReinforcementBar, BarShape, BarZone, SteelType } from "@/lib/types/culvert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { barWeightPerFoot } from "@/lib/calculations/quantities";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface ReinforcementTableProps {
  bars: ReinforcementBar[];
  onChange: (bars: ReinforcementBar[]) => void;
}

const ZONES: { value: BarZone; label: string }[] = [
  { value: "top_slab", label: "Top Slab" },
  { value: "bottom_slab", label: "Bot. Slab" },
  { value: "left_wall", label: "Wall Ext." },
  { value: "right_wall", label: "Wall Int." },
  { value: "haunch", label: "Haunch" },
  { value: "longitudinal", label: "Long." },
];

const STEEL_TYPES: { value: SteelType; label: string }[] = [
  { value: "black", label: "Black" },
  { value: "epoxy", label: "Epoxy" },
  { value: "galvanized", label: "Galv." },
  { value: "low_carbon_chromium", label: "LCC" },
];

const BAR_SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 11];

export function ReinforcementTable({ bars, onChange }: ReinforcementTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const updateBar = (id: string, patch: Partial<ReinforcementBar>) => {
    onChange(bars.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const addBar = () => {
    const newBar: ReinforcementBar = {
      id: String(Date.now()),
      barMark: "",
      barSize: 4,
      quantity: 1,
      spacing: 8,
      length: 0,
      shape: "straight",
      leg1: null,
      leg2: null,
      location: "",
      steelType: "black",
      zone: "top_slab",
    };
    onChange([...bars, newBar]);
  };

  const removeBar = (id: string) => {
    onChange(bars.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20px]"></TableHead>
              <TableHead className="w-[60px] text-xs">Mark</TableHead>
              <TableHead className="w-[50px] text-xs">Size</TableHead>
              <TableHead className="w-[45px] text-xs">Qty</TableHead>
              <TableHead className="w-[45px] text-xs">Spc</TableHead>
              <TableHead className="w-[55px] text-xs">Length</TableHead>
              <TableHead className="w-[65px] text-xs">Shape</TableHead>
              <TableHead className="w-[75px] text-xs">Zone</TableHead>
              <TableHead className="w-[65px] text-xs">Steel</TableHead>
              <TableHead className="w-[28px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bars.map((bar) => {
              const hasBend = bar.shape !== "straight";
              const isExpanded = expandedId === bar.id;

              return (
                <React.Fragment key={bar.id}>
                  <TableRow className="h-9">
                    <TableCell className="p-0.5 w-5">
                      {hasBend && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : bar.id)}
                          className="p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Input value={bar.barMark} onChange={(e) => updateBar(bar.id, { barMark: e.target.value })} className="h-7 text-xs font-mono px-1" />
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Select value={String(bar.barSize)} onValueChange={(v) => updateBar(bar.id, { barSize: Number(v) })}>
                        <SelectTrigger className="h-7 text-xs px-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BAR_SIZES.map((s) => (<SelectItem key={s} value={String(s)}>#{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Input type="number" value={bar.quantity} onChange={(e) => updateBar(bar.id, { quantity: Number(e.target.value) })} className="h-7 text-xs font-mono px-1" min={1} />
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Input type="number" value={bar.spacing} onChange={(e) => updateBar(bar.id, { spacing: Number(e.target.value) })} className="h-7 text-xs font-mono px-1" min={0} />
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Input type="number" value={bar.length} onChange={(e) => updateBar(bar.id, { length: Number(e.target.value) })} className="h-7 text-xs font-mono px-1" min={0} />
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Select value={bar.shape} onValueChange={(v) => updateBar(bar.id, { shape: v as BarShape })}>
                        <SelectTrigger className="h-7 text-xs px-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="straight">Str</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="U">U</SelectItem>
                          <SelectItem value="Z">Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Select value={bar.zone} onValueChange={(v) => updateBar(bar.id, { zone: v as BarZone })}>
                        <SelectTrigger className="h-7 text-xs px-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ZONES.map((z) => (<SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Select value={bar.steelType} onValueChange={(v) => updateBar(bar.id, { steelType: v as SteelType })}>
                        <SelectTrigger className="h-7 text-xs px-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STEEL_TYPES.map((st) => (<SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeBar(bar.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {/* Expanded row for bent bar leg dimensions */}
                  {hasBend && isExpanded && (
                    <TableRow className="h-8 bg-muted/30">
                      <TableCell colSpan={10} className="p-1 pl-7">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Leg 1:</span>
                            <Input
                              type="number"
                              value={bar.leg1 ?? ""}
                              onChange={(e) => updateBar(bar.id, { leg1: e.target.value ? Number(e.target.value) : null })}
                              className="h-6 w-16 text-xs font-mono px-1" placeholder='"'
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Leg 2:</span>
                            <Input
                              type="number"
                              value={bar.leg2 ?? ""}
                              onChange={(e) => updateBar(bar.id, { leg2: e.target.value ? Number(e.target.value) : null })}
                              className="h-6 w-16 text-xs font-mono px-1" placeholder='"'
                            />
                          </div>
                          <svg width="36" height="24" viewBox="0 0 36 24" className="text-foreground shrink-0">
                            {bar.shape === "L" && <path d="M 4 4 L 4 20 L 32 20" fill="none" stroke="currentColor" strokeWidth={1.5} />}
                            {bar.shape === "U" && <path d="M 4 4 L 4 20 L 32 20 L 32 4" fill="none" stroke="currentColor" strokeWidth={1.5} />}
                            {bar.shape === "Z" && <path d="M 4 4 L 4 12 L 32 12 L 32 20" fill="none" stroke="currentColor" strokeWidth={1.5} />}
                          </svg>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Inline location for all bars */}
                  <TableRow className="h-6 border-b">
                    <TableCell colSpan={10} className="p-0 pl-7 pb-1">
                      <Input
                        value={bar.location}
                        onChange={(e) => updateBar(bar.id, { location: e.target.value })}
                        className="h-5 text-xs px-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        placeholder="Location (e.g. Top slab interior)"
                      />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" size="sm" onClick={addBar} className="w-full">
        <Plus className="h-3 w-3 mr-1" />
        Add Bar
      </Button>
    </div>
  );
}
