import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { report, dog_name, dog_breed, dog_weight, symptoms, duration, report_date, followup_questions, user_answers } = await req.json();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addText = (text, x, fontSize, style = 'normal', color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - x - 15);
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, x, y);
      y += fontSize * 0.5;
    });
    y += 2;
  };

  // Header
  doc.setFillColor(22, 128, 108);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PawCoach - Rapport de Pre-diagnostic IA', 15, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date du rapport: ${report_date || new Date().toLocaleDateString('fr-FR')}`, 15, 25);
  doc.text("Ce document est un outil d'aide, pas un diagnostic veterinaire.", 15, 31);

  y = 45;

  // Dog info
  addText('INFORMATIONS DU CHIEN', 15, 12, 'bold', [22, 128, 108]);
  addText(`Nom: ${dog_name || 'N/A'}  |  Race: ${dog_breed || 'N/A'}  |  Poids: ${dog_weight ? dog_weight + ' kg' : 'N/A'}`, 15, 10, 'normal', [60, 60, 60]);
  y += 4;

  // Symptoms
  addText('SYMPTOMES RAPPORTES', 15, 12, 'bold', [22, 128, 108]);
  addText(symptoms || 'Non renseignes', 15, 10, 'normal', [40, 40, 40]);
  if (duration) {
    addText(`Duree: ${duration}`, 15, 10, 'italic', [80, 80, 80]);
  }
  y += 4;

  // Q&A Section
  if (followup_questions?.length && user_answers) {
    addText('QUESTIONS COMPLEMENTAIRES & REPONSES', 15, 12, 'bold', [22, 128, 108]);
    followup_questions.forEach((q, i) => {
      const answer = user_answers[q.id] || 'Non repondu';
      addText(`Q${i + 1}: ${q.question}`, 15, 10, 'bold', [50, 50, 50]);
      addText(`R: ${answer}`, 20, 10, 'normal', [40, 40, 40]);
      y += 2;
    });
    y += 4;
  }

  // Observations
  if (report.observations) {
    addText('OBSERVATIONS CLINIQUES', 15, 12, 'bold', [22, 128, 108]);
    addText(report.observations, 15, 10, 'normal', [40, 40, 40]);
    y += 4;
  }

  // Urgency
  if (report.urgency_level) {
    const urgencyColors = { low: [34, 139, 34], medium: [218, 165, 32], high: [220, 100, 20], emergency: [200, 30, 30] };
    const urgencyLabels = { low: 'Faible', medium: 'Modere', high: 'Eleve', emergency: 'Urgence' };
    const color = urgencyColors[report.urgency_level] || [0, 0, 0];
    addText(`NIVEAU D'URGENCE: ${urgencyLabels[report.urgency_level] || report.urgency_level}`, 15, 12, 'bold', color);
    if (report.urgency_explanation) {
      addText(report.urgency_explanation, 15, 10, 'normal', [40, 40, 40]);
    }
    y += 4;
  }

  // Possible causes
  if (report.possible_causes?.length) {
    addText('PISTES DIAGNOSTIQUES POSSIBLES', 15, 12, 'bold', [22, 128, 108]);
    report.possible_causes.forEach((cause, i) => {
      addText(`${i + 1}. ${cause}`, 20, 10, 'normal', [40, 40, 40]);
    });
    y += 4;
  }

  // Immediate advice
  if (report.immediate_advice?.length) {
    addText('CONSEILS IMMEDIATS', 15, 12, 'bold', [22, 128, 108]);
    report.immediate_advice.forEach(advice => {
      addText(`- ${advice}`, 20, 10, 'normal', [40, 40, 40]);
    });
    y += 4;
  }

  // Disclaimer
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;
  addText('AVERTISSEMENT', 15, 10, 'bold', [150, 50, 50]);
  addText(report.important_note || "Ce pre-diagnostic a ete genere par une intelligence artificielle et ne remplace en aucun cas l'avis d'un veterinaire professionnel.", 15, 9, 'italic', [120, 120, 120]);

  const pdfBytes = doc.output('arraybuffer');

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=prediagnostic-${dog_name || 'chien'}-${report_date || 'rapport'}.pdf`
    }
  });
});