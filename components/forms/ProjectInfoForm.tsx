"use client";

import React from "react";
import { ProjectInfo } from "@/lib/types/culvert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField } from "./TextField";

interface ProjectInfoFormProps {
  project: ProjectInfo;
  onChange: (project: ProjectInfo) => void;
}

export function ProjectInfoForm({ project, onChange }: ProjectInfoFormProps) {
  const update = (patch: Partial<ProjectInfo>) =>
    onChange({ ...project, ...patch });

  return (
    <div className="space-y-4">
      <TextField
        label="Project Name"
        value={project.projectName}
        onChange={(v) => update({ projectName: v })}
      />
      <TextField
        label="Client Name"
        value={project.clientName}
        onChange={(v) => update({ clientName: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Project Number"
          value={project.projectNumber}
          onChange={(v) => update({ projectNumber: v })}
        />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">State Standard</Label>
          <Select
            value={project.stateStandard}
            onValueChange={(v) => update({ stateStandard: v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VDOT">VDOT</SelectItem>
              <SelectItem value="NCDOT">NCDOT</SelectItem>
              <SelectItem value="TDOT">TDOT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <TextField
        label="Location"
        value={project.location}
        onChange={(v) => update({ location: v })}
      />
      <TextField
        label="Engineer"
        value={project.engineer}
        onChange={(v) => update({ engineer: v })}
      />
      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="Drawn By"
          value={project.drawnBy}
          onChange={(v) => update({ drawnBy: v })}
        />
        <TextField
          label="Checked By"
          value={project.checkedBy}
          onChange={(v) => update({ checkedBy: v })}
        />
        <TextField
          label="Approved By"
          value={project.approvedBy}
          onChange={(v) => update({ approvedBy: v })}
        />
      </div>
    </div>
  );
}
