import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, dogId, vetEmail, vetName, sections, accessId, inviteCode } = await req.json();

    // --- OWNER: Invite a vet ---
    if (action === 'invite') {
      if (!dogId || !vetEmail) return Response.json({ error: 'dogId and vetEmail required' }, { status: 400 });

      // Check dog belongs to user
      const dogs = await base44.entities.Dog.filter({ id: dogId, owner: user.email });
      if (!dogs || dogs.length === 0) return Response.json({ error: 'Dog not found or not yours' }, { status: 403 });

      // Check if access already exists
      const existing = await base44.asServiceRole.entities.SharedVetAccess.filter({ dog_id: dogId, vet_email: vetEmail });
      if (existing && existing.length > 0) {
        const active = existing.find(a => a.status !== 'revoked');
        if (active) return Response.json({ error: 'Access already exists', access: active }, { status: 409 });
      }

      // Generate invite code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const access = await base44.asServiceRole.entities.SharedVetAccess.create({
        dog_id: dogId,
        owner_email: user.email,
        vet_email: vetEmail,
        vet_name: vetName || '',
        status: 'pending',
        shared_sections: JSON.stringify(sections || ['vaccine', 'weight', 'vet_visit', 'medication', 'note']),
        invite_code: code,
      });

      // Send invitation email
      const dog = dogs[0];
      await base44.integrations.Core.SendEmail({
        to: vetEmail,
        subject: `PawCoach - ${user.full_name || user.email} partage le carnet de ${dog.name}`,
        body: `
          <h2>🐾 Invitation PawCoach</h2>
          <p><strong>${user.full_name || user.email}</strong> vous invite à accéder au carnet de santé de <strong>${dog.name}</strong> (${dog.breed}).</p>
          <p>Pour accepter, connectez-vous à PawCoach et utilisez le code d'invitation :</p>
          <h1 style="text-align:center; color: #2d8a70; letter-spacing: 4px;">${code}</h1>
          <p>Ou rendez-vous sur le portail vétérinaire de l'application.</p>
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
      
      // Verify vet email matches
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
      const sharedSections = JSON.parse(access.shared_sections || '[]');

      // Fetch dog info
      const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
      if (!dogs || dogs.length === 0) return Response.json({ error: 'Dog not found' }, { status: 404 });
      const dog = dogs[0];

      // Fetch health records filtered by shared sections
      const allRecords = await base44.asServiceRole.entities.HealthRecord.filter({ dog_id: dogId });
      const records = allRecords.filter(r => sharedSections.includes(r.type));

      // Fetch checkins if shared
      let checkins = [];
      if (sharedSections.includes('checkins')) {
        checkins = await base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId });
      }

      // Fetch food scans if shared
      let scans = [];
      if (sharedSections.includes('scans')) {
        scans = await base44.asServiceRole.entities.FoodScan.filter({ dog_id: dogId });
      }

      // Fetch vet notes
      const vetNotes = await base44.asServiceRole.entities.VetNote.filter({ dog_id: dogId });

      return Response.json({ dog, records, checkins, scans, vetNotes, sharedSections });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('vetAccess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});