export function calculateGamification(profile: any) {
  const g = profile?.gamification || {};
  let currentXP = g.xp_total !== undefined ? g.xp_total : (profile?.stats?.xp || 0);
  let currentIP = g.ip_total !== undefined ? g.ip_total : (profile?.stats?.ip || 0);
  
  const isRep = profile?.rol?.toLowerCase().includes('representante') || g.current_profile === 'representative';

  let level = 1;
  let maxXP = 100;
  let maxIP = 0;
  let title = isRep ? 'Representante Visible' : 'Ciudadano Informado';

  if (!isRep) {
    if (currentXP >= 2000 && currentIP >= 1000) { level = 5; title = 'Ciudadano Líder'; maxXP = 5000; maxIP = 1500; }
    else if (currentXP >= 1000 && currentIP >= 500) { level = 4; title = 'Ciudadano Influyente'; maxXP = 2000; maxIP = 1000; }
    else if (currentXP >= 500 && currentIP >= 100) { level = 3; title = 'Ciudadano Activo'; maxXP = 1000; maxIP = 500; }
    else if (currentXP >= 150) { level = 2; title = 'Ciudadano Propositivo'; maxXP = 500; maxIP = 100; }
    else { level = 1; maxXP = 150; maxIP = 10; } // maxIP 10 just for visual progress
    
    if (currentIP > 1500) { currentIP = 1500; } // Soft Cap Limit
  } else {
    if (currentXP >= 12000 && currentIP >= 15000) { level = 5; title = 'Representante de Impacto Nacional'; maxXP = 20000; maxIP = 20000; }
    else if (currentXP >= 8000 && currentIP >= 8000) { level = 4; title = 'Representante Colaborativo'; maxXP = 12000; maxIP = 15000; }
    else if (currentXP >= 5000 && currentIP >= 4000) { level = 3; title = 'Representante de Resultados'; maxXP = 8000; maxIP = 8000; }
    else if (currentXP >= 3000 && currentIP >= 2000) { level = 2; title = 'Representante Interactivo'; maxXP = 5000; maxIP = 4000; }
    else { level = 1; title = 'Representante Visible'; maxXP = 3000; maxIP = 2000; }
  }

  return { level, title, currentXP, currentIP, maxXP, maxIP, isRep };
}
