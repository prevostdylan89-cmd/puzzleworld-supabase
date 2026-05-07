import { useState, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X, FileUp } from "lucide-react";

const CATEGORIES = [
  "Paysage", "Animal", "Ville", "Art", "Fantasy",
  "Architecture", "Nature", "Portrait", "Abstrait", "Autre"
];

const EMPTY_ROW = () => ({
  _id: Math.random(),
  title: "", brand: "", piece_count: "", category_tag: "",
  amazon_price: "", asin: "", ean: "", amazon_link: "", image_hd: "", description: "",
  status: null,
});

const COLS = [
  { key: "title",        label: "Titre *",       width: 200, required: true },
  { key: "brand",        label: "Marque",         width: 120 },
  { key: "piece_count",  label: "Pièces",         width: 75,  type: "number" },
  { key: "category_tag", label: "Catégorie",      width: 130, type: "select" },
  { key: "amazon_price", label: "Prix €",         width: 75,  type: "number" },
  { key: "asin",         label: "ASIN",           width: 125 },
  { key: "ean",          label: "EAN-13",         width: 135 },
  { key: "amazon_link",  label: "Lien Amazon",    width: 170 },
  { key: "image_hd",     label: "URL Image",      width: 170 },
  { key: "description",  label: "Description",    width: 170 },
];

export default function BulkAddPuzzles({ onClose }) {
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const update = (_id, field, value) => {
    setRows(r => r.map(row => row._id === _id ? { ...row, [field]: value } : row));
  };

  const addRow = () => setRows(r => [...r, EMPTY_ROW()]);

  const removeRow = (_id) => {
    setRows(r => {
      const next = r.filter(row => row._id !== _id);
      return next.length ? next : [EMPTY_ROW()];
    });
  };

  const parseCSVLine = (line, separator) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.trim().split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("Le fichier CSV est vide ou invalide");
        return;
      }

      const separator = lines[0].includes(";") ? ";" : ",";
      const headers = parseCSVLine(lines[0], separator).map(h => h.toLowerCase().replace(/"/g, ""));

      const titleIndex  = headers.findIndex(h => h.includes("titre") || h.includes("title"));
      const amazonIndex = headers.findIndex(h => h.includes("amazon") || h.includes("lien"));
      const asinIndex   = headers.findIndex(h => h.includes("asin"));
      const brandIndex  = headers.findIndex(h => h.includes("marque") || h.includes("brand"));
      const imageIndex  = headers.findIndex(h => h.includes("image"));

      if (titleIndex === -1) {
        toast.error("Colonne 'titre' introuvable dans le CSV");
        return;
      }

      const newRows = lines.slice(1).map(line => {
        const cols = parseCSVLine(line, separator).map(c => c.replace(/"/g, ""));
        return {
          ...EMPTY_ROW(),
          title:       titleIndex !== -1  ? (cols[titleIndex] || "")  : "",
          amazon_link: amazonIndex !== -1 ? (cols[amazonIndex] || "") : "",
          asin:        asinIndex !== -1   ? (cols[asinIndex] || "")   : "",
          brand:       brandIndex !== -1  ? (cols[brandIndex] || "")  : "",
          image_hd:    imageIndex !== -1  ? (cols[imageIndex] || "")  : "",
        };
      }).filter(r => r.title.trim());

      if (!newRows.length) {
        toast.error("Aucune ligne valide trouvée dans le CSV");
        return;
      }

      setRows(r => [...r.filter(row => row.title.trim()), ...newRows]);
      toast.success(`${newRows.length} ligne(s) importée(s) depuis le CSV`);
    };

    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 1) return;
    const start = lines[0].toLowerCase().includes("titre") ? 1 : 0;
    const newRows = lines.slice(start).map(line => {
      const cols = line.split("\t");
      return {
        ...EMPTY_ROW(),
        title:        cols[0] || "",
        brand:        cols[1] || "",
        piece_count:  cols[2] || "",
        category_tag: cols[3] || "",
        amazon_price: cols[4] || "",
        asin:         cols[5] || "",
        ean:          cols[6] || "",
        amazon_link:  cols[7] || "",
        image_hd:     cols[8] || "",
        description:  cols[9] || "",
      };
    });
    setRows(r => [...r.filter(row => row.title.trim()), ...newRows]);
    e.preventDefault();
    toast.success(`${newRows.length} ligne(s) collée(s) depuis le presse-papier`);
  };

  const handleSubmit = async () => {
    const valid = rows.filter(r => r.title.trim());
    if (!valid.length) {
      toast.error("Aucun puzzle avec un titre à envoyer");
      return;
    }
    setLoading(true);
    setRows(r => r.map(row => ({ ...row, status: row.title.trim() ? "loading" : null })));

    let successCount = 0;
    let errorCount = 0;

    for (const row of valid) {
      const payload = {
        title:        row.title.trim(),
        brand:        row.brand.trim() || null,
        piece_count:  row.piece_count ? parseInt(row.piece_count) : null,
        category_tag: row.category_tag || null,
        amazon_price: row.amazon_price ? parseFloat(row.amazon_price) : null,
        asin:         row.asin.trim() || null,
        ean:          row.ean.trim() || null,
        amazon_link:  row.amazon_link.trim() || null,
        image_hd:     row.image_hd.trim() || null,
        description:  row.description.trim() || null,
        status:       'active',
      };

      const { error } = await supabase.from("puzzle_catalog").insert(payload);

      if (error) {
        console.error("Insert error:", error);
        errorCount++;
        setRows(r => r.map(r2 => r2._id === row._id ? { ...r2, status: "error" } : r2));
      } else {
        successCount++;
        setRows(r => r.map(r2 => r2._id === row._id ? { ...r2, status: "done" } : r2));
      }
    }

    setLoading(false);
    if (successCount > 0) toast.success(`${successCount} puzzle(s) ajouté(s) avec succès !`);
    if (errorCount > 0) toast.error(`${errorCount} erreur(s) — vérifie la console`);
  };

  const clearDone = () => {
    const remaining = rows.filter(r => r.status !== "done");
    setRows(remaining.length ? remaining : [EMPTY_ROW()]);
  };

  const doneCount = rows.filter(r => r.status === "done").length;
  const errorCount = rows.filter(r => r.status === "error").length;
  const validCount = rows.filter(r => r.title.trim()).length;

  const cellStyle = {
    padding: "3px 4px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const inputStyle = {
    width: "100%",
    fontSize: "12px",
    padding: "4px 7px",
    height: "28px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "6px",
    color: "inherit",
    outline: "none",
  };

  return (
    <div style={{ padding: "1.5rem", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "8px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>Ajout rapide — collection communautaire</h2>
          <p style={{ fontSize: "12px", opacity: 0.6, margin: "3px 0 0" }}>
            Saisie ligne par ligne · Tab pour avancer · Entrée pour nouvelle ligne · Coller depuis Google Sheets · Importer CSV
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {doneCount > 0 && (
            <span style={{ fontSize: "12px", background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "3px 10px", borderRadius: "99px" }}>
              {doneCount} ajouté{doneCount > 1 ? "s" : ""}
            </span>
          )}
          {errorCount > 0 && (
            <span style={{ fontSize: "12px", background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: "99px" }}>
              {errorCount} erreur{errorCount > 1 ? "s" : ""}
            </span>
          )}
          {doneCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearDone}>
              Effacer les ajoutés
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus size={14} className="mr-1" /> Ligne
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleCSVImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            style={{ borderColor: "rgba(99,102,241,0.5)", color: "#818cf8" }}
          >
            <FileUp size={14} className="mr-1" /> Importer CSV
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || validCount === 0}
            style={{ background: "#f97316", border: "none", color: "white" }}
          >
            <Upload size={14} className="mr-1" />
            {loading ? "Envoi..." : `Envoyer ${validCount} puzzle(s)`}
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1200px", fontSize: "12px" }}
          onPaste={handlePaste}>
          <colgroup>
            <col style={{ width: "30px" }} />
            {COLS.map(c => <col key={c.key} style={{ width: c.width + "px" }} />)}
            <col style={{ width: "32px" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.05)" }}>
              <th style={{ ...cellStyle, padding: "8px 6px", textAlign: "center", fontWeight: 500, opacity: 0.5, fontSize: "11px" }}>#</th>
              {COLS.map(c => (
                <th key={c.key} style={{ ...cellStyle, padding: "8px 6px", textAlign: "left", fontWeight: 500, opacity: 0.7, whiteSpace: "nowrap" }}>
                  {c.label}
                </th>
              ))}
              <th style={cellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowBg = row.status === "done"
                ? "rgba(34,197,94,0.1)"
                : row.status === "error"
                ? "rgba(239,68,68,0.1)"
                : row.status === "loading"
                ? "rgba(255,255,255,0.03)"
                : "transparent";

              return (
                <tr key={row._id} style={{ background: rowBg }}>
                  <td style={{ ...cellStyle, textAlign: "center", opacity: 0.4, fontSize: "11px" }}>
                    {row.status === "done" ? "✓" : row.status === "error" ? "!" : i + 1}
                  </td>
                  {COLS.map(c => (
                    <td key={c.key} style={cellStyle}>
                      {c.type === "select" ? (
                        <select
                          value={row[c.key]}
                          onChange={e => update(row._id, c.key, e.target.value)}
                          style={{ ...inputStyle }}
                        >
                          <option value="">—</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      ) : (
                        <input
                          type={c.type === "number" ? "number" : "text"}
                          value={row[c.key]}
                          onChange={e => update(row._id, c.key, e.target.value)}
                          placeholder={c.required ? "Requis" : ""}
                          style={{
                            ...inputStyle,
                            borderColor: c.required && !row[c.key] && row.status === "error"
                              ? "rgba(239,68,68,0.6)" : undefined
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              if (i === rows.length - 1) addRow();
                              setTimeout(() => {
                                const allRows = document.querySelectorAll("tbody tr");
                                const nextRow = allRows[i + 1];
                                if (nextRow) nextRow.querySelector("input,select")?.focus();
                              }, 50);
                            }
                          }}
                        />
                      )}
                    </td>
                  ))}
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    <button
                      onClick={() => removeRow(row._id)}
                      style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4, color: "inherit", padding: "2px 4px" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: "11px", opacity: 0.45, marginTop: "8px" }}>
        Astuce : CSV avec colonnes "titre", "asin", "marque", "image", "lien amazon" (séparateur virgule ou point-virgule) · ou colle depuis Google Sheets
      </p>
    </div>
  );
}