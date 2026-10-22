#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar el documento PDF final M7_Evals_Activa360.pdf a partir de M7_Evals_Activa360.md
"""

import os
from fpdf import FPDF

def clean_text(text):
    """Limpia caracteres fuera del rango latin-1 de helvetica"""
    replacements = {
        "—": "-", "–": "-", "“": '"', "”": '"', "‘": "'", "’": "'",
        "🟢": "[PASA]", "🔴": "[FALLO]", "⚠️": "[CRITICO]", "⚖️": "[CALIBRACION]",
        "📈": "[METRICAS]", "🚪": "[COMPUERTA]", "📊": "[REPORTE]", "📋": "[DATASET]",
        "🛡️": "[SEGURIDAD]", "📐": "[PLANTILLA]", "📁": "[CARPETA]", "✅": "[OK]",
        "κ": "Kappa", "Po": "Po", "Pe": "Pe", "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "ñ": "n", "Ñ": "N", "¿": "", "¡": ""
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)
    return text.encode('latin-1', 'replace').decode('latin-1')

class PDFReport(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(100, 100, 100)
        self.cell(100, 8, 'MODULO 7 - EVALS OFFLINE DE IA (ACTIVA360)')
        self.cell(80, 8, 'GRUPO ACTIVOS FIJOS', align='R')
        self.ln(6)
        self.set_draw_color(200, 200, 200)
        self.line(10, 16, 200, 16)
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f'Pagina {self.page_no()}/{{nb}}', align='C')

def md_to_pdf(md_filepath, pdf_filepath):
    pdf = PDFReport()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_text_color(24, 43, 73)
    pdf.cell(180, 10, clean_text("Informe Final de Evals Offline de IA - Modulo 7"))
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(70, 70, 70)
    pdf.cell(180, 7, clean_text("Proyecto Activa360 | Grupo Activos Fijos | Fecha: 29 Septiembre 2026"))
    pdf.ln(8)

    with open(md_filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_text = []

    for line in lines:
        line_clean = clean_text(line.rstrip())
        
        if line_clean.startswith("```"):
            if in_code_block:
                pdf.set_x(10)
                pdf.set_font("Courier", "", 7)
                pdf.set_fill_color(245, 247, 250)
                pdf.set_text_color(30, 30, 30)
                full_code = "\n".join(code_text)
                pdf.multi_cell(180, 4, full_code, border=1, fill=True)
                pdf.ln(3)
                code_text = []
                in_code_block = False
            else:
                in_code_block = True
                code_text = []
            continue

        if in_code_block:
            code_text.append(line_clean)
            continue

        pdf.set_x(10)

        if line_clean.startswith("# "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(24, 43, 73)
            texto = line_clean.replace("# ", "")
            pdf.cell(180, 7, texto)
            pdf.ln(7)
            pdf.set_draw_color(41, 128, 185)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)

        elif line_clean.startswith("## "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(41, 128, 185)
            texto = line_clean.replace("## ", "")
            pdf.cell(180, 6, texto)
            pdf.ln(6)

        elif line_clean.startswith("### "):
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 9.5)
            pdf.set_text_color(50, 50, 50)
            texto = line_clean.replace("### ", "")
            pdf.cell(180, 5, texto)
            pdf.ln(5)

        elif line_clean.startswith("> "):
            pdf.set_font("Helvetica", "I", 8.5)
            pdf.set_text_color(60, 60, 60)
            pdf.set_fill_color(240, 244, 248)
            texto = line_clean.replace("> ", "").replace("**", "")
            pdf.multi_cell(180, 4.5, f"  {texto}", border='L', fill=True)
            pdf.ln(2)

        elif line_clean.startswith("- ") or line_clean.startswith("* "):
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(40, 40, 40)
            texto = line_clean[2:].replace("**", "")
            pdf.multi_cell(180, 4, f"  * {texto}")

        elif line_clean.startswith("|"):
            pdf.set_font("Courier", "", 7)
            pdf.set_text_color(30, 30, 30)
            texto = line_clean.replace("**", "")
            pdf.cell(180, 4, texto)
            pdf.ln(4)

        elif line_clean.strip() == "---":
            pdf.set_draw_color(220, 220, 220)
            pdf.line(10, pdf.get_y()+2, 200, pdf.get_y()+2)
            pdf.ln(4)

        elif line_clean.strip() != "":
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(40, 40, 40)
            texto = line_clean.replace("**", "")
            pdf.multi_cell(180, 4, texto)

    pdf.output(pdf_filepath)
    print(f"[OK] PDF generado exitosamente en: {pdf_filepath}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_file = os.path.join(base_dir, "M7_Evals_Activa360.md")
    pdf_file = os.path.join(base_dir, "M7_Evals_Activa360.pdf")
    md_to_pdf(md_file, pdf_file)
