// Utilidad de moderación de contenido y filtrado de odio/discriminación
// Para el Muro Cívico de Opiniones

// Lista representativa de términos, insultos, expresiones discriminatorias y de odio
const HATE_SPEECH_KEYWORDS: string[] = [
  'odio', 'matar', 'muerte a', 'mueran', 'exterminar', 'aniquilar',
  'indio de mierda', 'kollas de mierda', 'cambas de mierda', 'raza maldita',
  'cholo de mierda', 'malditos indios', 'malditos collas', 'malditos cambas',
  'bala para', 'hay que matar', 'asesinar', 'plaga', 'escoria',
  'negro de mierda', 'maricon', 'maracos', 'putas', 'violacion', 'violar',
  'nazi', 'fascistas de mierda', 'terroristas', 'degollar', 'linchar'
];

export interface ModerationResult {
  aprobado: boolean;
  motivo?: string;
  contieneInsultos: boolean;
}

/**
 * Evalúa si una opinión cívica cumple con el filtro de no incitación al odio ni discriminación.
 * Permite disidencia, crítica política e indignación constructiva, pero descarta insultos y llamados a violencia.
 */
export function moderarOpinion(texto: string): ModerationResult {
  if (!texto || typeof texto !== 'string') {
    return { aprobado: false, motivo: 'Texto vacío', contieneInsultos: false };
  }

  const normalizado = texto.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quita tildes para comparación robusta

  for (const palabra of HATE_SPEECH_KEYWORDS) {
    const normalizadaKeyword = palabra.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalizado.includes(normalizadaKeyword)) {
      return {
        aprobado: false,
        motivo: 'Contiene lenguaje discriminatorio o incitación al odio/violencia.',
        contieneInsultos: true
      };
    }
  }

  return {
    aprobado: true,
    contieneInsultos: false
  };
}
