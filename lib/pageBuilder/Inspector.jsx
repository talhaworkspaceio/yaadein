"use client";

// ---------------------------------------------------------------------------
// Schema-driven inspector.
//
// Every control in the right-hand panel is generated from the field lists in
// schema.js, so a component gets a complete editor the moment it is declared.
// Fields marked `responsive` write to the active breakpoint instead of desktop.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  LAYOUT_FIELDS,
  CONTAINER_FIELDS,
  SPACING_FIELDS,
  TYPOGRAPHY_FIELDS,
  BACKGROUND_FIELDS,
  BORDER_FIELDS,
  EFFECT_FIELDS,
  ADVANCED_FIELDS,
  ICON_NAMES,
  getComponent,
  isContainerBlock,
} from "./schema";
import { resolveValue, rawValue } from "./styles";
import { Icon } from "./BlockView";

const input = {
  width: "100%",
  background: "#151109",
  border: "1px solid rgba(201,168,76,0.2)",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 9,
  fontSize: 13,
  lineHeight: 1.4,
  boxSizing: "border-box",
  fontFamily: "inherit",
  outline: "none",
};

const label = { display: "block", fontSize: 12, color: "#A8A08C", marginBottom: 6 };
const groupBox = { background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.16)", borderRadius: 10, padding: 14 };

// Collapsible sections in one scroll beat eight micro-tabs: everything is
// discoverable, and you can have Content and Spacing open side by side.
const SECTIONS = [
  { id: "content", label: "Content", icon: "✎", hint: "What this block says or shows" },
  { id: "layout", label: "Layout & Size", icon: "▤", hint: "Width, height, position, columns" },
  { id: "spacing", label: "Spacing", icon: "⇹", hint: "Padding and margin" },
  { id: "typography", label: "Typography", icon: "A", hint: "Font, size, colour, alignment" },
  { id: "background", label: "Background", icon: "◧", hint: "Colour, gradient, image, overlay" },
  { id: "border", label: "Border & Corners", icon: "▢", hint: "Border style, width, radius" },
  { id: "effects", label: "Effects & Motion", icon: "✧", hint: "Shadow, opacity, transforms, hover" },
  { id: "advanced", label: "Advanced", icon: "⚙", hint: "CSS id, classes, custom CSS" },
];

function readFile(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => cb(e.target.result);
  reader.readAsDataURL(file);
}

function IconPicker({ value, onChange, allowNone }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ ...input, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "left" }}
      >
        {value && value !== "none" ? <Icon name={value} size={16} color="#C9A84C" /> : <span style={{ opacity: 0.5 }}>◻</span>}
        <span style={{ flex: 1 }}>{value || "none"}</span>
        <span style={{ opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, maxHeight: 170, overflowY: "auto", background: "#0A0805", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: 6 }}>
          {allowNone && (
            <button
              type="button"
              onClick={() => {
                onChange("none");
                setOpen(false);
              }}
              title="No icon"
              style={{ background: value === "none" ? "#C9A84C" : "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 4, padding: 5, cursor: "pointer", color: "#fff", fontSize: 10 }}
            >
              ✕
            </button>
          )}
          {ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              style={{
                background: value === name ? "rgba(201,168,76,.3)" : "transparent",
                border: `1px solid ${value === name ? "#C9A84C" : "rgba(255,255,255,.08)"}`,
                borderRadius: 4,
                padding: 5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={name} size={15} color="#E0D7CD" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Repeater({ field, value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const update = (i, key, v) => {
    const next = [...list];
    next[i] = { ...next[i], [key]: v };
    onChange(next);
  };
  const move = (i, d) => {
    const t = i + d;
    if (t < 0 || t >= list.length) return;
    const next = [...list];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((item, i) => (
        <div key={i} style={{ ...groupBox, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700 }}>
              {field.itemLabel || "Item"} #{i + 1}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={miniBtn(i === 0)}>▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} style={miniBtn(i === list.length - 1)}>▼</button>
              <button type="button" onClick={() => onChange(list.filter((_, x) => x !== i))} style={{ ...miniBtn(false), color: "#FF6B8B", borderColor: "rgba(255,62,108,.5)" }}>✕</button>
            </div>
          </div>
          {(field.fields || []).map((sub) => (
            <div key={sub.key}>
              <label style={label}>{sub.label}</label>
              {sub.type === "textarea" ? (
                <textarea rows={sub.rows || 3} value={item[sub.key] || ""} onChange={(e) => update(i, sub.key, e.target.value)} style={input} />
              ) : sub.type === "select" ? (
                <select value={item[sub.key] || ""} onChange={(e) => update(i, sub.key, e.target.value)} style={input}>
                  {(sub.options || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : sub.type === "toggle" ? (
                <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#E0D7CD", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!item[sub.key]} onChange={(e) => update(i, sub.key, e.target.checked)} />
                  Enabled
                </label>
              ) : sub.type === "icon" ? (
                <IconPicker value={item[sub.key]} onChange={(v) => update(i, sub.key, v)} />
              ) : (
                <input type="text" value={item[sub.key] || ""} onChange={(e) => update(i, sub.key, e.target.value)} style={input} />
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, JSON.parse(JSON.stringify(field.newItem || {}))])}
        style={addBtn}
      >
        + Add {field.itemLabel || "Item"}
      </button>
    </div>
  );
}

const miniBtn = (disabled) => ({
  background: "transparent",
  border: "1px solid rgba(255,255,255,.18)",
  color: disabled ? "rgba(255,255,255,.25)" : "#fff",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 10,
  cursor: disabled ? "not-allowed" : "pointer",
});

const addBtn = {
  background: "rgba(201,168,76,.16)",
  border: "1px dashed #C9A84C",
  color: "#C9A84C",
  padding: "11px 14px",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

function Field({ block, field, device, onChange, onClearDevice }) {
  const dv = (key) => resolveValue(block, key, device);
  if (field.when && !field.when(block, (b, k) => resolveValue(b, k, device))) return null;

  const isResponsive = !!field.responsive;
  const editingDevice = isResponsive ? device : "desktop";
  const stored = rawValue(block, field.key, editingDevice);
  const effective = dv(field.key);
  const overridden = isResponsive && device !== "desktop" && stored !== undefined && stored !== "";
  const set = (v) => onChange(field.key, v, editingDevice);

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: "#C4BCA8", fontWeight: 600 }}>{field.label}</span>
      {isResponsive && device !== "desktop" && (
        <span
          title={`Editing the ${device} value. Desktop stays unchanged.`}
          style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".06em", padding: "1px 5px", borderRadius: 8, background: overridden ? "#C9A84C" : "rgba(201,168,76,.2)", color: overridden ? "#000" : "#C9A84C" }}
        >
          {device.toUpperCase()}
        </span>
      )}
      {overridden && (
        <button type="button" onClick={() => onClearDevice(field.key, device)} title="Clear this override" style={{ background: "none", border: "none", color: "#FF6B8B", fontSize: 10, cursor: "pointer", padding: 0 }}>
          reset
        </button>
      )}
    </div>
  );

  let control = null;

  switch (field.type) {
    case "text":
      control = <input type="text" value={stored ?? ""} placeholder={field.placeholder || (isResponsive && device !== "desktop" ? String(block[field.key] ?? "") : "")} onChange={(e) => set(e.target.value)} style={input} />;
      break;

    case "textarea":
      control = <textarea rows={field.rows || 4} value={stored ?? ""} onChange={(e) => set(e.target.value)} style={{ ...input, fontFamily: field.mono ? "monospace" : "inherit", fontSize: field.mono ? 11 : 12 }} />;
      break;

    case "number":
      control = (
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={stored ?? ""}
          placeholder={field.placeholder ?? (isResponsive && device !== "desktop" ? String(block[field.key] ?? "") : "")}
          onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
          style={input}
        />
      );
      break;

    case "range":
      control = (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="range" min={field.min} max={field.max} step={field.step} value={effective ?? field.min} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "#C9A84C", minWidth: 34, textAlign: "right" }}>{effective ?? "—"}</span>
        </div>
      );
      break;

    case "select":
      control = (
        <select value={stored ?? ""} onChange={(e) => set(e.target.value)} style={input}>
          {isResponsive && device !== "desktop" && <option value="">Inherit ({String(block[field.key] ?? "default")})</option>}
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;

    case "buttons":
      control = (
        <div style={{ display: "flex", gap: 5 }}>
          {(field.options || []).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set(o.value)}
              style={{
                flex: 1,
                background: effective === o.value ? "#C9A84C" : "#14100B",
                color: effective === o.value ? "#000" : "#fff",
                border: "1px solid rgba(201,168,76,.22)",
                padding: "10px 6px",
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
      break;

    case "toggle":
      return (
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#E0D7CD", cursor: "pointer", padding: "10px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 9 }}>
          <input type="checkbox" checked={!!effective} onChange={(e) => set(e.target.checked)} style={{ width: 15, height: 15, accentColor: "#C9A84C" }} />
          <span>{field.label}</span>
          {isResponsive && device !== "desktop" && (
            <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 8, background: overridden ? "#C9A84C" : "rgba(201,168,76,.2)", color: overridden ? "#000" : "#C9A84C" }}>{device.toUpperCase()}</span>
          )}
        </label>
      );

    case "color":
      control = (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(String(effective || "")) ? effective : "#C9A84C"}
            onChange={(e) => set(e.target.value)}
            style={{ width: 44, height: 40, background: "none", border: "1px solid rgba(201,168,76,.22)", borderRadius: 9, padding: 3, cursor: "pointer", flexShrink: 0 }}
          />
          <input type="text" value={stored ?? ""} placeholder={field.placeholder || "#C9A84C / rgba(...)"} onChange={(e) => set(e.target.value)} style={{ ...input, flex: 1 }} />
        </div>
      );
      break;

    case "size":
      control = (
        <div>
          {field.presets && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 5 }}>
              {field.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set(p)}
                  style={{
                    background: effective === p ? "#C9A84C" : "#14100B",
                    color: effective === p ? "#000" : "#fff",
                    border: "1px solid rgba(201,168,76,.22)",
                    padding: "6px 11px",
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <input type="text" value={stored ?? ""} placeholder={field.placeholder || "auto"} onChange={(e) => set(e.target.value)} style={input} />
        </div>
      );
      break;

    case "box4": {
      const keys = field.keys;
      const labels = field.labels || ["T", "R", "B", "L"];
      const allSame = keys.map((k) => dv(k)).every((v, _, arr) => String(v ?? "") === String(arr[0] ?? ""));
      return (
        <div style={{ marginBottom: 2 }}>
          {header}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
            {keys.map((k, i) => (
              <div key={k}>
                <input
                  type="number"
                  value={rawValue(block, k, editingDevice) ?? ""}
                  placeholder={String(dv(k) ?? 0)}
                  onChange={(e) => onChange(k, e.target.value === "" ? "" : Number(e.target.value), editingDevice)}
                  style={{ ...input, padding: "9px 4px", textAlign: "center", fontSize: 12.5 }}
                />
                <div style={{ fontSize: 10, color: "#77715f", textAlign: "center", marginTop: 4, fontWeight: 600 }}>{labels[i]}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const v = dv(keys[0]) ?? 0;
              keys.forEach((k) => onChange(k, v, editingDevice));
            }}
            style={{ marginTop: 5, background: "none", border: "none", color: allSame ? "#6f6a5d" : "#C9A84C", fontSize: 10, cursor: "pointer", padding: 0 }}
          >
            ⇔ match all sides
          </button>
        </div>
      );
    }

    case "image":
    case "video": {
      const isVideo = field.type === "video";
      const val = effective || "";
      control = (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {val && !isVideo && <img src={val} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(201,168,76,.22)" }} />}
          <input
            type="file"
            accept={isVideo ? "video/*" : "image/*"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file, (data) => set(data));
            }}
            style={{ ...input, fontSize: 10, padding: 5 }}
          />
          <input
            type="text"
            value={String(val).startsWith("data:") ? "" : val}
            placeholder={isVideo ? "/videos/reel1.mp4 or https://..." : "/images/photo.png or https://..."}
            onChange={(e) => set(e.target.value)}
            style={input}
          />
        </div>
      );
      break;
    }

    case "icon":
      control = <IconPicker value={effective} onChange={set} allowNone={field.allowNone} />;
      break;

    case "repeater-text": {
      const list = Array.isArray(effective) ? effective : [];
      control = (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 5 }}>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = e.target.value;
                  set(next);
                }}
                style={{ ...input, flex: 1 }}
              />
              <button type="button" onClick={() => set(list.filter((_, x) => x !== i))} style={{ ...miniBtn(false), color: "#FF6B8B", borderColor: "rgba(255,62,108,.5)" }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => set([...list, `New ${field.itemLabel || "item"}`])} style={addBtn}>
            + Add {field.itemLabel || "Item"}
          </button>
        </div>
      );
      break;
    }

    case "repeater-image": {
      const list = Array.isArray(effective) ? effective : [];
      control = (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {list.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ width: "100%", height: 54, objectFit: "cover", borderRadius: 5, border: "1px solid rgba(201,168,76,.22)" }} />
                <button
                  type="button"
                  onClick={() => set(list.filter((_, x) => x !== i))}
                  style={{ position: "absolute", top: 2, right: 2, background: "rgba(255,62,108,.85)", border: "none", color: "#fff", width: 16, height: 16, borderRadius: "50%", fontSize: 9, cursor: "pointer", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              let collected = [...list];
              let done = 0;
              files.forEach((file) =>
                readFile(file, (data) => {
                  collected = [...collected, data];
                  done += 1;
                  if (done === files.length) set(collected);
                })
              );
              e.target.value = "";
            }}
            style={{ ...input, fontSize: 10, padding: 5 }}
          />
        </div>
      );
      break;
    }

    case "table-rows": {
      const rows = Array.isArray(effective) ? effective : [];
      const cols = Array.isArray(block.headers) ? block.headers.length : (rows[0] || []).length || 2;
      control = (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {Array.from({ length: cols }).map((_, ci) => (
                <input
                  key={ci}
                  type="text"
                  value={(row || [])[ci] ?? ""}
                  onChange={(e) => {
                    const next = rows.map((r) => [...(r || [])]);
                    while (next[ri].length < cols) next[ri].push("");
                    next[ri][ci] = e.target.value;
                    set(next);
                  }}
                  style={{ ...input, padding: "5px 6px", fontSize: 11 }}
                />
              ))}
              <button type="button" onClick={() => set(rows.filter((_, x) => x !== ri))} style={{ ...miniBtn(false), color: "#FF6B8B", borderColor: "rgba(255,62,108,.5)" }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => set([...rows, Array.from({ length: cols }).map(() => "")])} style={addBtn}>
            + Add Row
          </button>
        </div>
      );
      break;
    }

    case "repeater":
      control = <Repeater field={field} value={effective} onChange={set} />;
      break;

    default:
      control = <input type="text" value={stored ?? ""} onChange={(e) => set(e.target.value)} style={input} />;
  }

  return (
    <div>
      {header}
      {control}
      {field.hint && <div style={{ fontSize: 11, color: "#77715f", marginTop: 7, lineHeight: 1.55 }}>{field.hint}</div>}
    </div>
  );
}

export default function Inspector({ block, device, onChange, onClearDevice, onResetSize, breadcrumb, onDuplicate, onDelete }) {
  const [open, setOpen] = useState({ content: true, layout: false, spacing: false, typography: false, background: false, border: false, effects: false, advanced: false });
  if (!block) return null;

  const comp = getComponent(block.type);
  const container = isContainerBlock(block);

  const fieldsFor = (id) => {
    switch (id) {
      case "content":
        return comp ? comp.contentFields || [] : [];
      case "layout":
        return container ? [...CONTAINER_FIELDS, ...LAYOUT_FIELDS] : LAYOUT_FIELDS;
      case "spacing":
        return SPACING_FIELDS;
      case "typography":
        return TYPOGRAPHY_FIELDS;
      case "background":
        return BACKGROUND_FIELDS;
      case "border":
        return BORDER_FIELDS;
      case "effects":
        return EFFECT_FIELDS;
      case "advanced":
        return ADVANCED_FIELDS;
      default:
        return [];
    }
  };

  // Count how many fields in a section already carry a value, so the header can
  // show at a glance where the styling actually lives.
  const touchedCount = (fields) =>
    fields.filter((fl) => {
      const keys = fl.keys || [fl.key];
      return keys.some((k) => {
        const v = block[k];
        return v !== undefined && v !== "" && v !== null && !(Array.isArray(v) && v.length === 0);
      });
    }).length;

  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));
  const expandAll = () => setOpen(Object.fromEntries(SECTIONS.map((sec) => [sec.id, true])));
  const collapseAll = () => setOpen(Object.fromEntries(SECTIONS.map((sec) => [sec.id, false])));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* identity card */}
      <div style={{ background: "linear-gradient(160deg, rgba(201,168,76,.14), rgba(201,168,76,.04))", border: "1px solid rgba(201,168,76,.28)", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(201,168,76,.18)", border: "1px solid rgba(201,168,76,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
            {comp?.icon || "▪"}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F0E8", lineHeight: 1.25 }}>{comp?.name || block.type}</div>
            <div style={{ fontSize: 11, color: "#8b8474", marginTop: 2 }}>{comp?.category || "Block"}</div>
          </div>
        </div>

        {breadcrumb && <div style={{ marginTop: 12 }}>{breadcrumb}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button type="button" onClick={onDuplicate} style={actionBtn}>⧉ Duplicate</button>
          <button type="button" onClick={onResetSize} style={actionBtn}>↺ Reset size</button>
          <button type="button" onClick={onDelete} style={{ ...actionBtn, color: "#FF6B8B", borderColor: "rgba(255,62,108,.4)" }}>✕ Delete</button>
        </div>
      </div>

      {device !== "desktop" && (
        <div style={{ background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.35)", borderRadius: 11, padding: "12px 14px", fontSize: 12, lineHeight: 1.55, color: "#E8DCC0" }}>
          <strong style={{ color: "#C9A84C" }}>Editing {device}.</strong> Fields marked{" "}
          <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8, background: "rgba(201,168,76,.25)", color: "#C9A84C" }}>{device.toUpperCase()}</span>{" "}
          save an override for this size only. Everything else stays inherited from desktop.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button type="button" onClick={expandAll} style={linkBtn}>Expand all</button>
        <span style={{ color: "#3d382f" }}>|</span>
        <button type="button" onClick={collapseAll} style={linkBtn}>Collapse all</button>
      </div>

      {SECTIONS.map((sec) => {
        const fields = fieldsFor(sec.id);
        const isOpen = open[sec.id];
        const touched = touchedCount(fields);
        return (
          <section key={sec.id} style={{ border: `1px solid ${isOpen ? "rgba(201,168,76,.3)" : "rgba(255,255,255,.08)"}`, borderRadius: 13, overflow: "hidden", background: isOpen ? "rgba(255,255,255,.02)" : "transparent" }}>
            <button
              type="button"
              onClick={() => toggle(sec.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: isOpen ? "rgba(201,168,76,.1)" : "transparent",
                border: "none",
                borderBottom: isOpen ? "1px solid rgba(201,168,76,.18)" : "none",
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                color: "#fff",
                fontFamily: "inherit",
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(201,168,76,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#C9A84C", flexShrink: 0 }}>{sec.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: isOpen ? "#F5F0E8" : "#cfc7b6" }}>{sec.label}</span>
                <span style={{ display: "block", fontSize: 11, color: "#77715f", marginTop: 2 }}>{sec.hint}</span>
              </span>
              {touched > 0 && !isOpen && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#C9A84C", background: "rgba(201,168,76,.16)", padding: "2px 8px", borderRadius: 9 }}>{touched}</span>
              )}
              <span style={{ color: "#8b8474", fontSize: 12, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}>▾</span>
            </button>

            {isOpen && (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
                {sec.id === "content" && comp?.description && (
                  <p style={{ fontSize: 12, color: "#8b8474", margin: 0, lineHeight: 1.6 }}>{comp.description}</p>
                )}
                {fields.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#6f6a5d", margin: 0, lineHeight: 1.6 }}>
                    {sec.id === "content"
                      ? "This block holds other blocks. Drop widgets inside it, then style it from the sections below."
                      : "Nothing to configure here for this block."}
                  </p>
                ) : (
                  fields.map((field) => (
                    <Field key={field.key} block={block} field={field} device={device} onChange={onChange} onClearDevice={onClearDevice} />
                  ))
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

const actionBtn = {
  flex: 1,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "#fff",
  padding: "8px 6px",
  borderRadius: 9,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const linkBtn = { background: "none", border: "none", color: "#8b8474", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" };
