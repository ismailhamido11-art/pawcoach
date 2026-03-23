import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function buildHealthSummaryHTML(dog, records) {
  const safeRecords = records || [];
  const vaccines = safeRecords.filter(r => r.type === 'vaccine').sort((a,b) => new Date(b.date) - new Date(a.date));
  const weights = safeRecords.filter(r => r.type === 'weight').sort((a,b) => new Date(b.date) - new Date(a.date));
  const visits = safeRecords.filter(r => r.type === 'vet_visit').sort((a,b) => new Date(b.date) - new Date(a.date));
  const meds = safeRecords.filter(r => r.type === 'medication').sort((a,b) => new Date(b.date) - new Date(a.date));

  const age = dog.birth_date ? `${Math.floor((Date.now() - new Date(dog.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))} ans` : 'Non renseigné';
  const lastWeight = weights[0];

  let html = `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-family:Arial,sans-serif;">
      <tr><td style="background:#2d8a70; padding:20px 24px; border-radius:12px 12px 0 0;">
        <h2 style="color:white; margin:0;">🐾 Fiche santé — ${escapeHtml(dog.name)}</h2>
        <p style="color:rgba(255,255,255,0.85); margin:4px 0 0; font-size:14px;">${escapeHtml(dog.breed) || ''} · ${age} · ${dog.sex === 'male' ? 'Mâle' : dog.sex === 'female' ? 'Femelle' : ''} ${dog.neutered ? '(stérilisé)' : ''}</p>
      </td></tr>
      <tr><td style="background:#f8faf9; padding:16px 24px;">
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="background:white; border-radius:8px; border:1px solid #e8ede9; width:33%; text-align:center;">
              <div style="font-size:11px; color:#888;">Poids</div>
              <div style="font-size:18px; font-weight:bold; color:#2d8a70;">${lastWeight ? lastWeight.value + ' kg' : '—'}</div>
              ${lastWeight ? `<div style="font-size:10px; color:#aaa;">${formatDate(lastWeight.date)}</div>` : ''}
            </td>
            <td style="width:8px;"></td>
            <td style="background:white; border-radius:8px; border:1px solid #e8ede9; width:33%; text-align:center;">
              <div style="font-size:11px; color:#888;">Vaccins</div>
              <div style="font-size:18px; font-weight:bold; color:#2d8a70;">${vaccines.length}</div>
              <div style="font-size:10px; color:#aaa;">enregistrés</div>
            </td>
            <td style="width:8px;"></td>
            <td style="background:white; border-radius:8px; border:1px solid #e8ede9; width:33%; text-align:center;">
              <div style="font-size:11px; color:#888;">Visites</div>
              <div style="font-size:18px; font-weight:bold; color:#2d8a70;">${visits.length}</div>
              <div style="font-size:10px; color:#aaa;">enregistrées</div>
            </td>
          </tr>
        </table>
      </td></tr>`;

  // Allergies / Health issues
  if (dog.allergies || dog.health_issues) {
    html += `<tr><td style="background:#f8faf9; padding:0 24px 12px;">
      <div style="background:#fff3f3; border:1px solid #fecaca; border-radius:8px; padding:12px;">
        <strong style="color:#dc2626; font-size:12px;">⚠️ Alertes santé</strong>
        ${dog.allergies ? `<p style="margin:4px 0 0; font-size:13px; color:#333;">Allergies : ${escapeHtml(dog.allergies)}</p>` : ''}
        ${dog.health_issues ? `<p style="margin:4px 0 0; font-size:13px; color:#333;">Problèmes : ${escapeHtml(dog.health_issues)}</p>` : ''}
      </div>
    </td></tr>`;
  }

  // Recent vaccines
  if (vaccines.length > 0) {
    html += `<tr><td style="background:#f8faf9; padding:8px 24px;">
      <p style="font-size:12px; font-weight:bold; color:#555; margin:0 0 6px;">💉 Derniers vaccins</p>`;
    vaccines.slice(0, 5).forEach(v => {
      html += `<div style="background:white; border:1px solid #e8ede9; border-radius:6px; padding:8px 12px; margin-bottom:4px; font-size:13px;">
        <strong>${escapeHtml(v.title)}</strong> — ${formatDate(v.date)}${v.next_date ? ` · <span style="color:#d97706;">Rappel: ${formatDate(v.next_date)}</span>` : ''}
      </div>`;
    });
    html += `</td></tr>`;
  }

  // Recent meds
  if (meds.length > 0) {
    html += `<tr><td style="background:#f8faf9; padding:8px 24px;">
      <p style="font-size:12px; font-weight:bold; color:#555; margin:0 0 6px;">💊 Médicaments récents</p>`;
    meds.slice(0, 5).forEach(m => {
      html += `<div style="background:white; border:1px solid #e8ede9; border-radius:6px; padding:8px 12px; margin-bottom:4px; font-size:13px;">
        <strong>${escapeHtml(m.title)}</strong> — ${formatDate(m.date)}${m.details ? ` · ${escapeHtml(m.details)}` : ''}
      </div>`;
    });
    html += `</td></tr>`;
  }

  // Weight trend
  if (weights.length > 1) {
    html += `<tr><td style="background:#f8faf9; padding:8px 24px;">
      <p style="font-size:12px; font-weight:bold; color:#555; margin:0 0 6px;">⚖️ Évolution du poids</p>`;
    weights.slice(0, 6).forEach(w => {
      html += `<span style="display:inline-block; background:white; border:1px solid #e8ede9; border-radius:20px; padding:4px 10px; margin:2px 4px 2px 0; font-size:12px;">${w.value}kg · ${formatDate(w.date)}</span>`;
    });
    html += `</td></tr>`;
  }

  html += `<tr><td style="background:#f8faf9; padding:16px 24px; border-radius:0 0 12px 12px; text-align:center;">
    <p style="font-size:11px; color:#999; margin:0;">Généré par PawCoach · ${formatDate(new Date().toISOString())}</p>
  </td></tr></table>`;

  return html;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, dogId, vetEmail, vetName, sections, accessId, inviteCode } = await req.json();

    // --- OWNER: Invite a vet ---
    if (action === 'invite') {
      if (!dogId || !vetEmail) return Response.json({ error: 'dogId and vetEmail required' }, { status: 400 });

      const dogs = await base44.entities.Dog.filter({ id: dogId, owner: user.email });
      if (!dogs || dogs.length === 0) return Response.json({ error: 'Dog not found or not yours' }, { status: 403 });

      const existing = await base44.asServiceRole.entities.SharedVetAccess.filter({ dog_id: dogId, vet_email: vetEmail });
      if (existing && existing.length > 0) {
        const active = existing.find(a => a.status !== 'revoked');
        if (active) return Response.json({ error: 'Access already exists', access: active }, { status: 409 });
      }

      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      const code = Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').substring(0, 12).toUpperCase();
      const dog = dogs[0];

      const access = await base44.asServiceRole.entities.SharedVetAccess.create({
        dog_id: dogId,
        owner_email: user.email,
        vet_email: vetEmail,
        vet_name: vetName || '',
        status: 'pending',
        shared_sections: JSON.stringify(sections || ['vaccine', 'weight', 'vet_visit', 'medication', 'note']),
        invite_code: code,
        invite_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      // Fetch health records for summary
      const allRecords = await base44.asServiceRole.entities.HealthRecord.filter({ dog_id: dogId });
      const healthSummary = buildHealthSummaryHTML(dog, allRecords);

      await base44.integrations.Core.SendEmail({
        to: vetEmail,
        subject: `PawCoach — Carnet de santé de ${escapeHtml(dog.name)} (${escapeHtml(dog.breed)})`,
        body: `
          <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
            <p style="font-size:15px; color:#333;">Bonjour${vetName ? ` Dr. ${escapeHtml(vetName)}` : ''},</p>
            <p style="font-size:14px; color:#555;"><strong>${escapeHtml(user.full_name || user.email)}</strong> vous partage le carnet de santé de son chien via PawCoach.</p>
            
            <div style="margin:20px 0;">
              ${healthSummary}
            </div>

            <div style="background:#f0fdf4; border:2px dashed #2d8a70; border-radius:12px; padding:20px; text-align:center; margin:20px 0;">
              <p style="margin:0 0 8px; font-size:13px; color:#555;">Code d'invitation pour accéder au dossier complet :</p>
              <p style="margin:0; font-size:28px; font-weight:bold; color:#2d8a70; letter-spacing:6px;">${code}</p>
            </div>

            <div style="text-align:center; margin:20px 0;">
              <a href="https://paw-coach-care.base44.app/VetPortal" style="display:inline-block; background:#2d8a70; color:white; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:bold; font-size:14px;">Accéder au Portail Vétérinaire</a>
              <p style="font-size:13px; color:#777; margin-top:12px;">Connectez-vous sur le portail, puis entrez le code ci-dessus pour accéder au dossier complet de ${escapeHtml(dog.name)}.</p>
            </div>

            <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
            <p style="font-size:11px; color:#aaa; text-align:center;">PawCoach — Le carnet de santé intelligent pour chiens 🐾</p>
          </div>
        `,
      });

      return Response.json({ success: true, access, inviteCode: code });
    }

    // --- VET: Accept invite ---
    if (action === 'accept') {
      if (!inviteCode) return Response.json({ error: 'inviteCode required' }, { status: 400 });
      const accesses = await base44.asServiceRole.entities.SharedVetAccess.filter({ invite_code: inviteCode, status: 'pending' });
      if (!accesses || accesses.length === 0) return Response.json({ error: 'Invalid or expired invite code' }, { status: 404 });
      const access = accesses[0];
      if (access.invite_expires_at && new Date(access.invite_expires_at) < new Date()) {
        return Response.json({ error: 'Invite code expired. Ask the owner to resend.' }, { status: 410 });
      }
      if (access.vet_email !== user.email) return Response.json({ error: 'This invite is not for you' }, { status: 403 });
      await base44.asServiceRole.entities.SharedVetAccess.update(access.id, {
        status: 'active',
        vet_name: user.full_name || vetName || access.vet_name,
      });
      return Response.json({ success: true, dogId: access.dog_id });
    }

    // --- OWNER: Revoke access ---
    if (action === 'revoke') {
      if (!accessId) return Response.json({ error: 'accessId required' }, { status: 400 });
      const accesses = await base44.asServiceRole.entities.SharedVetAccess.filter({ id: accessId });
      if (!accesses || accesses.length === 0) return Response.json({ error: 'Access not found' }, { status: 404 });
      if (accesses[0].owner_email !== user.email) return Response.json({ error: 'Not authorized' }, { status: 403 });
      await base44.asServiceRole.entities.SharedVetAccess.update(accessId, { status: 'revoked' });
      return Response.json({ success: true });
    }

    // --- OWNER: List shared accesses for a dog ---
    if (action === 'listByDog') {
      if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
      const accesses = await base44.asServiceRole.entities.SharedVetAccess.filter({ dog_id: dogId, owner_email: user.email });
      return Response.json({ accesses: accesses || [] });
    }

    // --- VET: List dogs shared with me ---
    if (action === 'listMyAccess') {
      const accesses = await base44.asServiceRole.entities.SharedVetAccess.filter({ vet_email: user.email, status: 'active' });
      return Response.json({ accesses: accesses || [] });
    }

    // --- VET: Get dog data (with permission check) ---
    if (action === 'getDogData') {
      if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
      const accesses = await base44.asServiceRole.entities.SharedVetAccess.filter({ dog_id: dogId, vet_email: user.email, status: 'active' });
      if (!accesses || accesses.length === 0) return Response.json({ error: 'No active access to this dog' }, { status: 403 });
      const access = accesses[0];
      let sharedSections = [];
      try { sharedSections = JSON.parse(access.shared_sections || '[]'); } catch (parseErr) { console.warn('vetAccess: failed to parse shared_sections:', parseErr?.message || String(parseErr)); }
      const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
      if (!dogs || dogs.length === 0) return Response.json({ error: 'Dog not found' }, { status: 404 });
      const dog = dogs[0];
      const allRecords = await base44.asServiceRole.entities.HealthRecord.filter({ dog_id: dogId });
      const records = (allRecords || []).filter(r => sharedSections.includes(r.type));
      let checkins = [];
      if (sharedSections.includes('checkins')) {
        checkins = (await base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId })) || [];
      }
      let scans = [];
      if (sharedSections.includes('scans')) {
        scans = (await base44.asServiceRole.entities.FoodScan.filter({ dog_id: dogId })) || [];
      }
      const vetNotes = await base44.asServiceRole.entities.VetNote.filter({ dog_id: dogId });
      return Response.json({ dog, records, checkins, scans, vetNotes, sharedSections });
    }

    // --- Generate health summary for PDF/email ---
    if (action === 'getHealthSummary') {
      if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
      const dogs = await base44.entities.Dog.filter({ id: dogId, owner: user.email });
      if (!dogs || dogs.length === 0) return Response.json({ error: 'Dog not found' }, { status: 403 });
      const dog = dogs[0];

      // Fetch en parallele pour performance
      const [records, checkins, growthEntries, dailyLogs] = await Promise.all([
        base44.asServiceRole.entities.HealthRecord.filter({ dog_id: dogId }),
        base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId }),
        base44.asServiceRole.entities.GrowthEntry.filter({ dog_id: dogId }).catch(() => []),
        base44.asServiceRole.entities.DailyLog.filter({ dog_id: dogId }).catch(() => []),
      ]);

      return Response.json({
        success: true,
        dog,
        records,
        checkins,
        growthEntries: growthEntries || [],
        dailyLogs: dailyLogs || [],
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('vetAccess error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});