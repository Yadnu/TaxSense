"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Save,
  X,
  ChevronDown,
  Info,
} from "lucide-react";

type Confidence = "high" | "medium" | "low";

interface ExtractedField {
  id: string;
  label: string;
  value: string;
  confidence: Confidence;
  fieldCode: string;
}

interface DocumentData {
  id: string;
  name: string;
  type: string;
  fields: ExtractedField[];
}

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; className: string }> = {
  high:   { label: "High confidence",   className: "confidence-high"   },
  medium: { label: "Medium confidence", className: "confidence-medium" },
  low:    { label: "Low confidence",    className: "confidence-low"    },
};

const SAMPLE_DOCS: DocumentData[] = [
  {
    id: "doc-1",
    name: "W2_Employer_2025.pdf",
    type: "W-2",
    fields: [
      { id: "f1",  label: "Employer Name",             value: "Acme Corporation",      confidence: "high",   fieldCode: "Box c"  },
      { id: "f2",  label: "Employer EIN",              value: "12-3456789",            confidence: "high",   fieldCode: "Box b"  },
      { id: "f3",  label: "Employee SSN",              value: "***-**-6789",           confidence: "high",   fieldCode: "Box a"  },
      { id: "f4",  label: "Wages, Tips, Other Comp.",  value: "$87,450.00",            confidence: "high",   fieldCode: "Box 1"  },
      { id: "f5",  label: "Federal Income Tax Withheld", value: "$14,320.00",          confidence: "high",   fieldCode: "Box 2"  },
      { id: "f6",  label: "Social Security Wages",    value: "$87,450.00",            confidence: "medium", fieldCode: "Box 3"  },
      { id: "f7",  label: "Social Security Tax",      value: "$5,422.00",             confidence: "medium", fieldCode: "Box 4"  },
      { id: "f8",  label: "Medicare Wages",           value: "$87,450.00",            confidence: "high",   fieldCode: "Box 5"  },
      { id: "f9",  label: "Medicare Tax",             value: "$1,268.00",             confidence: "high",   fieldCode: "Box 6"  },
      { id: "f10", label: "State (CA) Income Tax",   value: "$5,820.00",             confidence: "low",    fieldCode: "Box 17" },
    ],
  },
  {
    id: "doc-2",
    name: "1099-NEC_Freelance.pdf",
    type: "1099-NEC",
    fields: [
      { id: "g1", label: "Payer Name",                  value: "Startup Inc.",         confidence: "high",   fieldCode: "Payer"  },
      { id: "g2", label: "Payer TIN",                   value: "98-7654321",           confidence: "medium", fieldCode: "TIN"    },
      { id: "g3", label: "Nonemployee Compensation",    value: "$24,800.00",           confidence: "low",    fieldCode: "Box 1"  },
      { id: "g4", label: "Federal Income Tax Withheld", value: "$0.00",               confidence: "high",   fieldCode: "Box 4"  },
    ],
  },
];

export default function ExtractedDataPage() {
  const [selectedDocId, setSelectedDocId] = useState(SAMPLE_DOCS[0].id);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editValue, setEditValue]         = useState("");
  const [fields, setFields]              = useState<Record<string, ExtractedField[]>>(
    Object.fromEntries(SAMPLE_DOCS.map((d) => [d.id, d.fields]))
  );

  const selectedDoc = SAMPLE_DOCS.find((d) => d.id === selectedDocId)!;
  const docFields   = fields[selectedDocId] ?? [];
  const needsReview = docFields.filter((f) => f.confidence !== "high").length;

  const startEdit = (field: ExtractedField) => {
    setEditingId(field.id);
    setEditValue(field.value);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setFields((prev) => ({
      ...prev,
      [selectedDocId]: prev[selectedDocId].map((f) =>
        f.id === editingId ? { ...f, value: editValue, confidence: "high" } : f
      ),
    }));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="text-lg font-semibold text-gray-900">Extracted Data Review</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Review the data extracted from your documents. Correct any errors before proceeding.
        </p>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Document selector ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label htmlFor="doc-select" className="field-label mb-0 shrink-0">
            Viewing document:
          </label>
          <div className="relative max-w-xs">
            <select
              id="doc-select"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="field-input appearance-none pr-8"
            >
              {SAMPLE_DOCS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* ── Review notice ─────────────────────────────────────────── */}
        {needsReview > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {needsReview} field{needsReview > 1 ? "s" : ""} need{needsReview === 1 ? "s" : ""} your review
              </p>
              <p className="text-xs text-amber-700">
                Medium and low-confidence fields are highlighted below. Click the edit icon to correct them.
              </p>
            </div>
          </div>
        )}

        {/* ── Fields table ──────────────────────────────────────────── */}
        <div className="ts-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="section-title">{selectedDoc.name}</h2>
              <p className="section-caption">{selectedDoc.type} · {docFields.length} fields extracted</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge-success">
                <CheckCircle2 className="h-3 w-3" />
                {docFields.filter((f) => f.confidence === "high").length} confirmed
              </span>
              {needsReview > 0 && (
                <span className="badge-warning">
                  <AlertCircle className="h-3 w-3" />
                  {needsReview} to review
                </span>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span>Field</span>
            <span>Extracted Value</span>
            <span>Confidence</span>
            <span>Action</span>
          </div>

          {docFields.map((field) => {
            const isEditing = editingId === field.id;
            const conf      = CONFIDENCE_CONFIG[field.confidence];

            return (
              <div
                key={field.id}
                className={`grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-0 ${
                  field.confidence === "low"
                    ? "bg-red-50/40"
                    : field.confidence === "medium"
                    ? "bg-amber-50/30"
                    : ""
                }`}
              >
                {/* Label */}
                <div>
                  <p className="text-sm font-medium text-gray-700">{field.label}</p>
                  <p className="text-xs text-gray-400">{field.fieldCode}</p>
                </div>

                {/* Value / edit input */}
                <div>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="field-input max-w-[200px] py-1.5 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-mono">{field.value}</p>
                  )}
                </div>

                {/* Confidence badge */}
                <span className={conf.className}>{conf.label}</span>

                {/* Edit / save actions */}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                        aria-label="Save"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-slate-100"
                        aria-label="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(field)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-900"
                      aria-label="Edit field"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Confidence legend ─────────────────────────────────────── */}
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-xs text-gray-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span className="confidence-high">High</span>
              AI is confident in this value
            </span>
            <span className="flex items-center gap-1.5">
              <span className="confidence-medium">Medium</span>
              Please verify before proceeding
            </span>
            <span className="flex items-center gap-1.5">
              <span className="confidence-low">Low</span>
              Correction likely needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
