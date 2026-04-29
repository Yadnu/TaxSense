"use client";

import { useState, useCallback } from "react";
import { Edit2, Check, X, FileQuestion, Cpu, UserCheck } from "lucide-react";
import type { FieldSource } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "./confidence-badge";
import {
  FIELD_GROUP_LABELS,
  FIELD_GROUP_ORDER,
  getFieldLabel,
} from "@/types/extraction";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedFieldData {
  id: string;
  fieldName: string;
  fieldValue: string | null;
  confidence: number;
  pageNumber: number | null;
  fieldGroup: string | null;
  source: FieldSource;
}

interface ExtractedFieldsTableProps {
  documentId: string;
  documentType: string;
  fields: ExtractedFieldData[];
  onFieldUpdate?: (updated: ExtractedFieldData) => void;
}

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  FieldSource,
  { label: string; Icon: React.ElementType; className: string }
> = {
  OCR:           { label: "OCR",          Icon: FileQuestion, className: "text-muted-foreground/50" },
  LLM_INFERENCE: { label: "AI Extracted", Icon: Cpu,          className: "text-blue-500 dark:text-blue-400" },
  USER_PROVIDED: { label: "Verified",     Icon: UserCheck,    className: "text-emerald-600 dark:text-emerald-400" },
};

// ─── Left-border accent by confidence ────────────────────────────────────────

function confidenceBorder(confidence: number, source: FieldSource) {
  if (source === "USER_PROVIDED") return "border-l-emerald-500/60";
  if (confidence >= 0.8)          return "border-l-emerald-500/40";
  if (confidence >= 0.5)          return "border-l-amber-500/60";
  return                                  "border-l-red-500/60";
}

// ─── Single editable field row ────────────────────────────────────────────────

interface FieldRowProps {
  field: ExtractedFieldData;
  label: string;
  documentId: string;
  onUpdate: (updated: ExtractedFieldData) => void;
}

function FieldRow({ field, label, documentId, onUpdate }: FieldRowProps) {
  const [isEditing, setIsEditing]       = useState(false);
  const [editValue, setEditValue]       = useState(field.fieldValue ?? "");
  const [isSaving, setIsSaving]         = useState(false);
  const [currentField, setCurrentField] = useState(field);

  const handleSave = useCallback(async () => {
    if (editValue === currentField.fieldValue) { setIsEditing(false); return; }

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/fields/${currentField.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldValue: editValue }),
        }
      );
      if (!res.ok) throw new Error("Update failed");

      const updated: ExtractedFieldData = {
        ...currentField,
        fieldValue: editValue,
        confidence: 1.0,
        source: "USER_PROVIDED",
      };
      setCurrentField(updated);
      onUpdate(updated);
      setIsEditing(false);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [editValue, currentField, documentId, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditValue(currentField.fieldValue ?? "");
    setIsEditing(false);
  }, [currentField.fieldValue]);

  const sourceCfg = SOURCE_CONFIG[currentField.source];

  return (
    <tr
      className={cn(
        "group border-b border-border/60 last:border-0 transition-colors",
        "hover:bg-muted/30",
        currentField.confidence < 0.5 && currentField.source !== "USER_PROVIDED"
          ? "bg-red-50/50 dark:bg-red-950/10"
          : currentField.confidence < 0.8 && currentField.source !== "USER_PROVIDED"
          ? "bg-amber-50/50 dark:bg-amber-950/10"
          : ""
      )}
    >
      {/* Field label — left accent border via first cell */}
      <td
        className={cn(
          "py-3.5 pl-4 pr-3 align-top border-l-2",
          confidenceBorder(currentField.confidence, currentField.source)
        )}
      >
        <span className="text-sm font-medium text-foreground leading-snug">
          {label}
        </span>
        {currentField.pageNumber != null && (
          <span className="block text-xs text-muted-foreground/50 mt-0.5">
            Box {currentField.pageNumber}
          </span>
        )}
      </td>

      {/* Field value */}
      <td className="py-3.5 px-3 align-top">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="h-7 w-full min-w-0 rounded border border-primary bg-background px-2 text-sm text-foreground outline-none ring-1 ring-primary/50 focus:ring-primary placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              aria-label="Save"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-50 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 disabled:opacity-50 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancel}
              aria-label="Cancel"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span
            className={cn(
              "text-sm font-numeric",
              currentField.fieldValue
                ? "text-foreground font-medium"
                : "italic text-muted-foreground/40"
            )}
          >
            {currentField.fieldValue ?? "—"}
          </span>
        )}
      </td>

      {/* Confidence */}
      <td className="py-3.5 px-3 align-top">
        <ConfidenceBadge confidence={currentField.confidence} showPercent={false} />
      </td>

      {/* Action — source icon + edit button */}
      <td className="py-3.5 pl-3 pr-4 align-top">
        <div className="flex items-center gap-2">
          <span
            className={cn("flex items-center gap-1 text-xs", sourceCfg.className)}
            title={sourceCfg.label}
          >
            <sourceCfg.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </span>

          {!isEditing && (
            <button
              onClick={() => { setEditValue(currentField.fieldValue ?? ""); setIsEditing(true); }}
              aria-label={`Edit ${label}`}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 transition-all opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main table component ─────────────────────────────────────────────────────

export function ExtractedFieldsTable({
  documentId,
  documentType,
  fields,
  onFieldUpdate,
}: ExtractedFieldsTableProps) {
  const [localFields, setLocalFields] = useState<ExtractedFieldData[]>(fields);

  const handleFieldUpdate = useCallback(
    (updated: ExtractedFieldData) => {
      setLocalFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      onFieldUpdate?.(updated);
    },
    [onFieldUpdate]
  );

  if (localFields.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground/50">No extracted fields to display.</p>
      </div>
    );
  }

  const grouped = groupFields(localFields);

  return (
    <div className="space-y-5">
      {grouped.map(({ group, groupLabel, groupFields: gFields }) => {
        const filled    = gFields.filter((f) => f.fieldValue !== null).length;
        const verified  = gFields.filter((f) => f.source === "USER_PROVIDED").length;
        const needsWork = gFields.filter(
          (f) => f.confidence < 0.8 && f.source !== "USER_PROVIDED"
        ).length;

        return (
          <section key={group}>
            {/* Group header */}
            <div className="mb-2 flex items-center gap-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {groupLabel}
              </h3>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {filled}/{gFields.length}
              </span>
              {verified > 0 && (
                <span className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {verified} confirmed
                </span>
              )}
              {needsWork > 0 && (
                <span className="rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {needsWork} to review
                </span>
              )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full min-w-0 table-fixed">
                <colgroup>
                  <col className="w-[33%]" />
                  <col className="w-[40%]" />
                  <col className="w-[17%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Field
                    </th>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Extracted Value
                    </th>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Confidence
                    </th>
                    <th className="py-2.5 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gFields.map((f) => (
                    <FieldRow
                      key={f.id}
                      field={f}
                      label={getFieldLabel(f.fieldName, documentType)}
                      documentId={documentId}
                      onUpdate={handleFieldUpdate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Grouping helper ──────────────────────────────────────────────────────────

interface FieldGroupData {
  group: string;
  groupLabel: string;
  groupFields: ExtractedFieldData[];
}

function groupFields(fields: ExtractedFieldData[]): FieldGroupData[] {
  const map = new Map<string, ExtractedFieldData[]>();

  for (const field of fields) {
    const group = field.fieldGroup ?? "other";
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(field);
  }

  return Array.from(map.entries())
    .map(([group, gFields]) => ({
      group,
      groupLabel:
        FIELD_GROUP_LABELS[group] ??
        group.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      groupFields: gFields,
    }))
    .sort(
      (a, b) =>
        (FIELD_GROUP_ORDER[a.group] ?? 99) - (FIELD_GROUP_ORDER[b.group] ?? 99)
    );
}
