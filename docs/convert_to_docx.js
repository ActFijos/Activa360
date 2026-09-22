const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require("docx");
const fs = require("fs");
const path = require("path");

function main() {
  const mdPath = path.resolve(__dirname, "informe_desarrollo_activa360.md");
  const docxPath = path.resolve(__dirname, "informe_desarrollo_activa360.docx");

  if (!fs.existsSync(mdPath)) {
    console.error("No se encontró el archivo markdown en: " + mdPath);
    return;
  }

  console.log("Leyendo: " + mdPath);
  const mdContent = fs.readFileSync(mdPath, "utf-8");
  const lines = mdContent.split("\n");

  const children = [];
  let currentTableRows = [];
  let inTable = false;

  // Estilo de bordes para tablas
  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  };

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      // Ignorar la fila separadora |---|---| de markdown
      const cleanedRows = currentTableRows.filter(row => !row.every(cell => cell.trim().match(/^:?-+:?$/)));
      
      if (cleanedRows.length > 0) {
        const tableRows = cleanedRows.map((rowCells, rowIndex) => {
          const cells = rowCells.map(cellText => {
            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText.trim().replace(/\*\*/g, ""),
                      bold: rowIndex === 0, // Primera fila en negrita (Header)
                      size: 20,
                      font: "Arial"
                    })
                  ]
                })
              ],
              borders: cellBorders,
              shading: rowIndex === 0 ? { fill: "F2F2F2" } : undefined
            });
          });
          return new TableRow({ children: cells });
        });

        children.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }));
        // Añadir espacio después de la tabla
        children.push(new Paragraph({ text: "" }));
      }
      currentTableRows = [];
    }
  };

  for (let line of lines) {
    const cleanLine = line.trim();

    // Manejo de Tablas
    if (cleanLine.startsWith("|") && cleanLine.endsWith("|")) {
      inTable = true;
      const rowCells = cleanLine.split("|").slice(1, -1);
      currentTableRows.push(rowCells);
      continue;
    } else {
      if (inTable) {
        flushTable();
        inTable = false;
      }
    }

    if (cleanLine === "") {
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    // Cabeceras (Headings)
    if (cleanLine.startsWith("# ")) {
      children.push(new Paragraph({
        text: cleanLine.substring(2).replace(/\*\*/g, ""),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 }
      }));
    } else if (cleanLine.startsWith("## ")) {
      children.push(new Paragraph({
        text: cleanLine.substring(3).replace(/\*\*/g, ""),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 }
      }));
    } else if (cleanLine.startsWith("### ")) {
      children.push(new Paragraph({
        text: cleanLine.substring(4).replace(/\*\*/g, ""),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 150, after: 60 }
      }));
    } 
    // Elementos de lista (Bullet points)
    else if (cleanLine.startsWith("* ") || cleanLine.startsWith("- ")) {
      const text = cleanLine.substring(2);
      
      // Parsear negrita simple dentro del texto (ej. **Texto**: Contenido)
      const boldPattern = /\*\*(.*?)\*\*/g;
      const runs = [];
      let lastIndex = 0;
      let match;

      while ((match = boldPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          runs.push(new TextRun({ text: text.substring(lastIndex, match.index), size: 22, font: "Arial" }));
        }
        runs.push(new TextRun({ text: match[1], bold: true, size: 22, font: "Arial" }));
        lastIndex = boldPattern.lastIndex;
      }
      if (lastIndex < text.length) {
        runs.push(new TextRun({ text: text.substring(lastIndex), size: 22, font: "Arial" }));
      }

      children.push(new Paragraph({
        children: runs,
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 }
      }));
    } 
    // Texto Normal (Párrafos)
    else {
      const text = cleanLine;
      const boldPattern = /\*\*(.*?)\*\*/g;
      const runs = [];
      let lastIndex = 0;
      let match;

      while ((match = boldPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          runs.push(new TextRun({ text: text.substring(lastIndex, match.index), size: 22, font: "Arial" }));
        }
        runs.push(new TextRun({ text: match[1], bold: true, size: 22, font: "Arial" }));
        lastIndex = boldPattern.lastIndex;
      }
      if (lastIndex < text.length) {
        runs.push(new TextRun({ text: text.substring(lastIndex), size: 22, font: "Arial" }));
      }

      children.push(new Paragraph({
        children: runs,
        spacing: { before: 80, after: 80 }
      }));
    }
  }

  // Asegurar que si termina en tabla se imprima
  if (inTable) {
    flushTable();
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(docxPath, buffer);
    console.log("Archivo Word generado exitosamente en: " + docxPath);
  }).catch(err => {
    console.error("Error al empacar documento Word:", err);
  });
}

main();
