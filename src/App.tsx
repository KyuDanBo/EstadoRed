/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot, increment } from 'firebase/firestore';
import { auth, db } from './firebase';
import GlobeViz from './components/GlobeViz';
import IDCardPreview from './components/IDCardPreview';
import Dashboard from './components/Dashboard';
import EstadoRedLogo from './components/EstadoRedLogo';
import EstatutoInfographic from './components/EstatutoInfographic';
import { ArrowRight, ArrowLeft, Globe2, CheckCircle2, X } from 'lucide-react';

// =======================================================
// PREGUNTAS DEL FORMULARIO (Test de Identidad Política)
// =======================================================
const AVATARES = [
  { emoji: '🦅', tipo: 'Cóndor Andino', desc: 'Vigilancia y Altura' },
  { emoji: '🐻', tipo: 'Oso Jucumari', desc: 'Fuerza Territorial' },
  { emoji: '🐆', tipo: 'Jaguar', desc: 'Acción Rápida' },
  { emoji: '🦙', tipo: 'Llama Fuerte', desc: 'Resistencia Máxima' },
  { emoji: '🦊', tipo: 'Zorro Andino (Tiula)', desc: 'Astucia y Supervivencia' },
  { emoji: '🐸', tipo: 'Rana Gigante', desc: 'Adaptabilidad Extrema' }
];

const DIAGNOSTICO = [
  // EL SOBERANO
  { id: 'alias', titulo: 'EL SOBERANO (Tu Perfil Público)', texto: '1. ¿Cómo quieres que te conozcamos en el Estado Red?', tipo: 'texto', placeholder: 'Alias o Pseudónimo', nota: 'Aquí no pedimos tu nombre legal. Eres un nodo individual y en esta red valen tus ideas y tu representatividad.' },
  { id: 'telefono', titulo: 'VERIFICACIÓN DE IDENTIDAD', texto: '2. Ingresa tu número de contacto (celular/WhatsApp)', tipo: 'texto', placeholder: 'Ej. 70012345', nota: 'Servirá como tu usuario de verificación. No será público.' },
  { id: 'password', titulo: 'VERIFICACIÓN DE IDENTIDAD', texto: '3. Crea una contraseña segura', tipo: 'password', placeholder: 'Mínimo 6 caracteres', nota: 'Esta contraseña protegerá tu nodo.' },
  { id: 'password_confirm', titulo: 'VERIFICACIÓN DE IDENTIDAD', texto: '3.b. Confirma tu contraseña', tipo: 'password', placeholder: 'Repite la contraseña', nota: 'Ambas contraseñas deben coincidir exactamente.' },
  
  // NUEVO: ROL
  { id: 'rol', titulo: 'TU ROL EN LA COMUNIDAD', texto: '4. ¿Desde qué posición vas a participar?', tipo: 'select', opciones: ['Ciudadano (Quiero proponer y participar activamente)', 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)'], nota: 'Esto definirá tu plan de carrera cívica dentro del Estado Red. Ambos roles son igual de importantes.' },

  // DATOS PARA REPRESENTANTES (Si escoge Representante se acaba aquí)
  { id: 'rep_nombre', titulo: 'DATOS DE REPRESENTANTE', texto: 'Ingresa tu nombre completo oficial:', tipo: 'texto', placeholder: 'Ej. Juan Pérez Ayala', dep: { id: 'rol', val: 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)' } },
  { id: 'rep_cargo', titulo: 'DATOS DE REPRESENTANTE', texto: '¿Cuál es tu cargo u ocupación pública actual?', tipo: 'texto', placeholder: 'Ej. Concejal Municipal, Dirigente Vecinal...', dep: { id: 'rol', val: 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)' } },
  { id: 'rep_jur', titulo: 'DATOS DE REPRESENTANTE', texto: '¿Cuál es tu jurisdicción de representación?', tipo: 'texto', placeholder: 'Ej. El Alto, Distrito 5...', dep: { id: 'rol', val: 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)' } },

  // NUEVO: AVATAR (Solo para ciudadanos, por ende dep != representante o lo hacemos directo)
  // Como no hay dep inverso, podemos añadir dep normal a TODOS los de ciudadano, O simplemente usar una condición en avanzarPregunta para "TERMINAR" si es rep_jur.
  { id: 'avatar', titulo: 'TU IDENTIDAD VISUAL', texto: '5. Elige el avatar que te represente', tipo: 'avatar_select', nota: 'Tu avatar visual te acompañará en los debates y propuestas. Elige el animal boliviano con el que te identifiques.' },

  // MÓDULO 1: TU TERRITORIO
  { id: 'departamento', titulo: 'TU TERRITORIO (La Realidad Espacial)', texto: '6.a. ¿Cuál es el departamento en el que habitas e incides?', tipo: 'select', opciones: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'], nota: 'Necesitamos ubicar tu nodo a nivel regional.' },
  { id: 'municipio', titulo: 'TU TERRITORIO (La Realidad Espacial)', texto: '6.b. ¿De qué municipio o distrito eres?', tipo: 'texto', placeholder: 'Ej. Nuestra Señora de La Paz', nota: 'Define tu alcance municipal.' },
  { id: 'comunidad', titulo: 'TU TERRITORIO (La Realidad Espacial)', texto: '6.c. ¿Cuál es tu Junta Vecinal (Ubana) o Comunidad (Rural)?', tipo: 'texto', placeholder: 'Ej. Sopocachi o Comunidad Achocalla', nota: 'Este será tu nodo base para conectarte con tus vecinos.' },

  // MÓDULO 2: TU OCUPACIÓN
  { id: 'sector', titulo: 'TU OCUPACIÓN (La Actividad Principal)', texto: '7. Sector General: ¿En qué gran sector de la sociedad desarrollas tu actividad principal?', tipo: 'select', opciones: ['Educación o Academia', 'Salud', 'Transporte o Logística', 'Minería o Industria', 'Comercio o Gremialismo', 'Agropecuario o Campesino', '¡AÑADIR OTRO SECTOR GENERAL!'] },
  { id: 'sector_otro', titulo: 'TU OCUPACIÓN (La Actividad Principal)', texto: 'Has elegido añadir otro sector. ¿Cuál es?', tipo: 'texto', placeholder: 'Escribe tu sector general...', dep: { id: 'sector', val: '¡AÑADIR OTRO SECTOR GENERAL!' } },
  { id: 'ocupacion', titulo: 'TU OCUPACIÓN (La Actividad Principal)', texto: '8. Ocupación Específica: Basado en tu sector general, ¿cuál es tu ocupación exacta o la de tu organización base?', tipo: 'dynamic_select' },
  { id: 'ocupacion_otro', titulo: 'TU OCUPACIÓN (La Actividad Principal)', texto: 'Has elegido añadir otra ocupación. ¿Cuál es?', tipo: 'texto', placeholder: 'Ejemplo: Estudiantes de Medicina...', dep: { id: 'ocupacion', val: '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!' } },

  // MÓDULO 3: TU IDEOLOGÍA
  { id: 'prioridad', titulo: 'TU IDEOLOGÍA (La Forma de Pensar)', texto: '9. Orientación: Imagina que puedes reformar el Estado. ¿Cuál sería tu prioridad?', tipo: 'select', opciones: [
    '[A] La libertad individual, el libre mercado y la reducción del Estado.',
    '[B] La igualdad económica, la redistribución de la riqueza y el poder popular.',
    '[C] La protección de la Madre Tierra, los animales y nuestros recursos naturales.',
    '[D] La equidad de género, los derechos humanos y la deconstrucción social.',
    '[E] La defensa del individuo, la autogestión sin Estado y el apoyo mutuo.'
  ]},
  { id: 'ideologia', titulo: 'TU IDEOLOGÍA (La Forma de Pensar)', texto: '10. Sugerencia de Ideología: Basado en tus prioridades, ¿cuál es la forma de pensar (Ideología) que te define?', tipo: 'dynamic_ideologia_select' },
  { id: 'ideologia_otro', titulo: 'TU IDEOLOGÍA (La Forma de Pensar)', texto: 'Has elegido crear una nueva ideología. ¿Cómo la definirías?', tipo: 'texto', placeholder: 'Ejemplo: Comunitarismo Tecnológico...', dep: { id: 'ideologia', val: '¡CREAR NUEVA IDEOLOGÍA!' } },

  // DIAGNÓSTICO DEL AGOTAMIENTO POLÍTICO
  { id: 'agotamiento_1', titulo: 'DIAGNÓSTICO DEL AGOTAMIENTO POLÍTICO', texto: '11. Las elecciones pasaron, pero la crisis sigue. ¿Crees que la reconciliación y la estabilidad son posibles bajo el actual sistema de partidos?', tipo: 'select', opciones: ['🔴 No, el sistema de partidos alimenta la división', '🟡 Tal vez, si aparecen líderes diferentes', '🟢 La solución solo vendrá de la ciudadanía organizada'] },
  { id: 'agotamiento_2', titulo: 'DIAGNÓSTICO DEL AGOTAMIENTO POLÍTICO', texto: '12. Viendo las crisis de representación y parálisis estatal, ¿quién sientes que defiende tus intereses reales hoy?', tipo: 'checkbox', opciones: ['Ningún político ni partido', 'Las dirigencias tradicionales', 'Mi gremio/Mi comunidad/Mis vecinos', 'Nadie, estamos huérfanos de representación'] },
  { id: 'agotamiento_3', titulo: 'DIAGNÓSTICO DEL AGOTAMIENTO POLÍTICO', texto: '13. ¿Crees que la tecnología nos permitiría decidir directamente, en lugar de depender de bloqueos o caudillos?', tipo: 'select', opciones: ['Sí, es la evolución que necesitamos', 'No, la tecnología no cambiará la política', 'No estoy seguro'] },

  // ESTADO REAL DE LA AUTONOMÍA
  { id: 'autonomia_1', titulo: 'ESTADO REAL DE LA AUTONOMÍA', texto: '14. Mucho se habla de Autonomía frente al gobierno central, ¿qué opinas sobre ella?', tipo: 'select', opciones: ['Es indispensable pero no se aplica realmente', 'Ha fracasado o es insuficiente', 'Es la única salida para mi región', 'No me queda claro qué es'] },
  { id: 'autonomia_2', titulo: 'ESTADO REAL DE LA AUTONOMÍA', texto: '15. Para cambiar las cosas, hay que conocer las reglas. ¿Conoces la Constitución Política y las normativas de tu región?', tipo: 'select', opciones: ['Conozco la Constitución y las normas de mi región', 'Conozco algo de la Constitución, pero nada de mi región', 'He escuchado de ellas pero no las conozco', 'No conozco ninguna'] },
  { id: 'autonomia_3', titulo: 'ESTADO REAL DE LA AUTONOMÍA', texto: '16. ¿Sabes si tu municipio o territorio ya logró diseñar y aprobar su propia normativa local (Carta Orgánica o Estatuto)?', tipo: 'select', opciones: ['Sí, ya la tenemos', 'Están en proceso de redacción', 'No tenemos normativa propia', 'La verdad, lo desconozco'] },

  // ADULTEZ POLÍTICA
  { id: 'accion_1', titulo: 'ADULTEZ POLÍTICA (Acción)', texto: '17. Si tuvieras el respaldo tecnológico para ser vocero directo de tu grupo, sin afiliarte a ningún partido, ¿asumirías el reto?', tipo: 'select', opciones: ['Sí, estoy listo', 'Me lo pensaría', 'No, prefiero apoyar desde mi trabajo diario'] }
];

const DEPT_COORDS: Record<string, { lat: number, lng: number }> = {
  "La Paz": { lat: -16.5, lng: -68.15 },
  "Santa Cruz": { lat: -17.78, lng: -63.18 },
  "Cochabamba": { lat: -17.38, lng: -66.15 },
  "Oruro": { lat: -17.96, lng: -67.11 },
  "Potosí": { lat: -19.57, lng: -65.75 },
  "Tarija": { lat: -21.53, lng: -64.72 },
  "Chuquisaca": { lat: -19.03, lng: -65.26 },
  "Beni": { lat: -14.83, lng: -64.90 },
  "Pando": { lat: -11.02, lng: -68.76 }
};

const MAPA_OCUPACIONES: Record<string, string[]> = {
  'Educación o Academia': ['Maestros', 'Profesores Universitarios', 'Estudiantes Universitarios', 'Estudiantes de Secundaria', 'Administrativos Escolares', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!'],
  'Salud': ['Médicos', 'Enfermeras/os', 'Trabajadores en farmacia', 'Personal de Apoyo Hospitalario', 'Odontólogos', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!'],
  'Transporte o Logística': ['Transporte Público Terrestre (Micros, Minibuses, Taxis)', 'Transporte Pesado / Carga', 'Transporte Aéreo', 'Conductores por Aplicación', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!'],
  'Minería o Industria': ['Mineros Cooperativistas', 'Mineros Asalariados', 'Obreros Fabriles', 'Ingenieros Industriales', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!'],
  'Comercio o Gremialismo': ['Comerciantes Minoristas', 'Comerciantes Mayoristas', 'Artesanos', 'Vendedores Ambulantes', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!'],
  'Agropecuario o Campesino': ['Campesinos', 'Indígenas Originarios', 'Productores Agroindustriales', 'Ganaderos', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!'],
  'default': ['Profesional Independiente', 'Empleado Público', 'Asalariado Privado', 'Desempleado', '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!']
};

const MAPA_IDEOLOGIAS: Record<string, string[]> = {
  '[A]': ['Capitalista', 'Liberal', 'Libertario', 'Minarquista', 'Anarcocapitalista', '¡CREAR NUEVA IDEOLOGÍA!'],
  '[B]': ['Socialista', 'Marxista', 'Comunitarista', 'Socialdemócrata', '¡CREAR NUEVA IDEOLOGÍA!'],
  '[C]': ['Ecologista', 'Defensor de la Madre Tierra', 'Ambientalista', 'Animalista', '¡CREAR NUEVA IDEOLOGÍA!'],
  '[D]': ['Feminista', 'Progresista', 'Humanista', 'Defensor de DDHH', '¡CREAR NUEVA IDEOLOGÍA!'],
  '[E]': ['Anarquista', 'Mutualista', 'Autogestionario', 'Individualista', '¡CREAR NUEVA IDEOLOGÍA!'],
  'default': ['Pragmático', 'Centrista', '¡CREAR NUEVA IDEOLOGÍA!']
};

export default function App() {
  // --- MEMORIA DE LA APLICACIÓN (Estado) ---
  const [pasoActual, setPasoActual] = useState<'bienvenida' | 'seleccion_pais' | 'formulario' | 'completado' | 'moderacion' | 'dashboard' | 'cargando' | 'que_es_estadored'>('cargando');
  const [zoomTarget, setZoomTarget] = useState<{lat: number, lng: number, altitude: number, radius?: number} | null>(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState('');
  
  // Memoria del Formulario iterativo (el paso actual en las preguntas y las respuestas)
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [errorInput, setErrorInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados pre-login
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [aliasLogin, setAliasLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);

  const [opcionesExtra, setOpcionesExtra] = useState<{
    sectores: string[],
    ocupaciones: Record<string, string[]>,
    ideologias: Record<string, string[]>
  }>({ sectores: [], ocupaciones: {}, ideologias: {} });

  useEffect(() => {
    getDoc(doc(db, 'config', 'options')).then(snap => {
       if (snap.exists()) {
          const data = snap.data();
          setOpcionesExtra({
             sectores: data.sectores || [],
             ocupaciones: data.ocupaciones || {},
             ideologias: data.ideologias || {}
          });
       }
    });
  }, []);

  useEffect(() => {
    let unsubscribeDoc: () => void;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (isLoggingIn) return; // Prevent overwriting state during manual login

      if (user) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (uDoc) => {
          if (uDoc.exists()) {
            setRespuestas(uDoc.data());
            setPasoActual(prev => (prev === 'cargando' || prev === 'bienvenida') ? 'dashboard' : prev);
          } else {
            setPasoActual('bienvenida');
          }
        }, (err) => {
          console.error(err);
          setPasoActual('bienvenida');
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setPasoActual('bienvenida');
      }
    });
    return () => {
      unsubAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [isLoggingIn]);

  // Función: Iniciar interacción interactiva con el globo
  const empezarSeleccionPais = () => {
    setPasoActual('seleccion_pais');
  };

  // Función: Cuando el usuario hace clic en un país del 3D
  const manejarClickEnPais = (nombreDelPais: string) => {
    // Si la persona ya está en el formulario, no hacemos caso al tap
    if (pasoActual !== 'seleccion_pais') return;

    setPaisSeleccionado(nombreDelPais);
    // Cambiamos a la pantalla de formulario automáticamente
    setPasoActual('formulario');
    
    // Zoom general a LATAM/Bolivia si nos entra desde la demo
    setZoomTarget({ lat: -16.29, lng: -63.58, altitude: 1.5 });
  };

  // Efecto: Cuando respondemos nuestro departamento, nos acercamos al mapa
  useEffect(() => {
    // Si ya no estamos en la selección de país, limpiamos o evitamos el zoom de mapa (ya no se ve el globo)
    if (pasoActual === 'formulario' || pasoActual === 'completado') return;

    const dept = respuestas['departamento'];
    if (dept && DEPT_COORDS[dept]) {
      const base = DEPT_COORDS[dept];
      let alt = 0.8;
      let radius = 1.5;
      
      setZoomTarget({ lat: base.lat, lng: base.lng, altitude: alt, radius: radius });
    }
  }, [indicePregunta, respuestas, pasoActual]);

  // Función: Avanzar página en el formulario
  const avanzarPregunta = () => {
    setErrorMessage('');
    const preguntaActual = DIAGNOSTICO[indicePregunta];
    const respuestaDada = respuestas[preguntaActual.id];

    // Obligar a que llenen o seleccionen algo (básico), salvo si es opcional
    const esOpcional = (preguntaActual as any).opcional;
    if (
      !esOpcional && (
        !respuestaDada || 
        (typeof respuestaDada === 'string' && respuestaDada.trim() === '') ||
        (Array.isArray(respuestaDada) && respuestaDada.length === 0)
      )
    ) {
      setErrorInput(true);
      setTimeout(() => setErrorInput(false), 1000); // Quita el error visual en 1 seg
      return;
    }

    if (preguntaActual.id === 'password') {
      if (!respuestaDada || respuestaDada.trim().length < 6) {
        setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
        setErrorInput(true);
        setTimeout(() => setErrorInput(false), 1000);
        return;
      }
    }

    if (preguntaActual.id === 'password_confirm') {
      if (respuestaDada !== respuestas['password']) {
        setErrorMessage("Las contraseñas no coinciden. Por favor, verifícalas.");
        setErrorInput(true);
        setTimeout(() => setErrorInput(false), 1000);
        return;
      }
    }

    let siguienteSubIndice = indicePregunta + 1;
    
    // Si acaba de responder rep_jur y es representante, finalizamos.
    if (respuestas['rol'] === 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)' && preguntaActual.id === 'rep_jur') {
       siguienteSubIndice = DIAGNOSTICO.length;
    } else {
      // Verificar si la siguiente pregunta depende de algo que NO se cumplió
      while (siguienteSubIndice < DIAGNOSTICO.length) {
        const proximaPre = DIAGNOSTICO[siguienteSubIndice];
        
        // Si somos representante, saltamos todo lo de ciudadano
        if (respuestas['rol'] === 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)') {
           if (!proximaPre.dep || proximaPre.dep.id !== 'rol') {
             siguienteSubIndice++;
             continue;
           }
        } else {
           // Somos ciudadano, saltamos las de rep
           if (proximaPre.dep && proximaPre.dep.id === 'rol' && proximaPre.dep.val.includes('Representante')) {
              siguienteSubIndice++;
              continue;
           }
        }

        if (proximaPre.dep && proximaPre.dep.id !== 'rol') {
          if (respuestas[proximaPre.dep.id] !== proximaPre.dep.val) {
            // No se cumple la condición, saltarla
            siguienteSubIndice++;
            continue;
          }
        }
        break; // Encontramos una válida
      }
    }

    if (siguienteSubIndice < DIAGNOSTICO.length) {
      setIndicePregunta(siguienteSubIndice);
    } else {
      // Finalizado: Guardamos al usuario y enviamos a la API
      const isRep = respuestas['rol'] === 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)';

      if (isRep) {
         setPasoActual('cargando');
         // We save to a separate collection or mark as pending representative
         const repData = {
           alias: respuestas['alias']?.trim(),
           rol: respuestas['rol'],
           telefono: respuestas['telefono']?.trim(),
           rep_nombre: respuestas['rep_nombre'],
           rep_cargo: respuestas['rep_cargo'],
           rep_jur: respuestas['rep_jur'],
           status: 'pending_contact',
           createdAt: serverTimestamp()
         };
         
         const emailAlias = respuestas['alias'].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
         const emailToRegister = `${emailAlias}_rep@estadored.app`;

         createUserWithEmailAndPassword(auth, emailToRegister, respuestas['password']).then(cred => {
            setDoc(doc(db, "users", cred.user.uid), repData).then(() => {
                setPasoActual('completado');
            });
         }).catch(console.error);

      } else if (respuestas['alias']) {
        const userId = respuestas['alias'].trim();
        const telefono = respuestas['telefono']?.trim() || '0000';
        const password = respuestas['password'];
        const emailAlias = userId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const emailToRegister = `${emailAlias}@estadored.app`;
        
        createUserWithEmailAndPassword(auth, emailToRegister, password).then(cred => {
          const user = cred.user;
          // Sanitize Territorio
          const cleanTerritorio = respuestas['municipio']?.trim() || respuestas['departamento']?.trim() || 'Nacional';

          // Sanitize Ocupación
          let cleanOcupacion = respuestas['ocupacion_otro']?.trim() || respuestas['ocupacion']?.trim() || respuestas['sector']?.trim() || 'Cívico';
          if (cleanOcupacion.includes('¡AÑADIR') || cleanOcupacion === '') {
            cleanOcupacion = respuestas['sector_otro']?.trim() || respuestas['sector']?.trim() || 'Cívico';
          }
          if (cleanOcupacion.includes('¡AÑADIR') || cleanOcupacion === '') {
            cleanOcupacion = 'Cívico';
          }

          // Sanitize Ideología
          let cleanIdeologia = respuestas['ideologia_otro']?.trim() || respuestas['ideologia']?.trim() || 'Pragmático';
          if (cleanIdeologia.includes('¡CREAR') || cleanIdeologia === '') {
            cleanIdeologia = 'Pragmático';
          }

          const profileData = {
            ...respuestas,
            alias: userId,
            rol: respuestas['rol'] || 'Ciudadano',
            avatar: respuestas['avatar'] || '🦙',
            accion_2: respuestas['accion_2'] || '',
            telegram: respuestas['telegram'] || '',
            triada: {
              territorio: cleanTerritorio,
              ocupacion: cleanOcupacion,
              ideologia: cleanIdeologia
            },
            gamification: {
              current_profile: 'citizen',
              level: 1,
              xp_total: 0,
              ip_total: 0,
              ip_vault: 0,
              badges: [],
              streaks: {
                consecutive_weeks: 1,
                multiplier: 1.0
              }
            },
            liquid_democracy: {
              delegated_to: null,
              received_delegations: 0
            },
            stats: { xp: 0, ip: 0 },
            createdAt: serverTimestamp()
          };
          
          Object.assign(respuestas, profileData); // Mantener para el UI actual
          setDoc(doc(db, "users", user.uid), profileData).then(() => {
            // Register and increment collective node counters
            const registerNode = async (type: 'territorio' | 'ocupacion' | 'ideologia', val: string) => {
              const nodeId = `${type}_${val.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
              const nodeRef = doc(db, 'collective_nodes', nodeId);
              try {
                const nodeSnap = await getDoc(nodeRef);
                if (!nodeSnap.exists()) {
                  await setDoc(nodeRef, {
                    id: nodeId,
                    name: val,
                    type: type,
                    memberCount: 1,
                    createdAt: serverTimestamp()
                  });
                  // Notificar al bot de Telegram
                  fetch('/api/notify-new-node', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: type, name: val })
                  }).catch(e => console.error(e));
                } else {
                  await setDoc(nodeRef, {
                    memberCount: increment(1)
                  }, { merge: true });
                }
              } catch (err) {
                console.error('Error registering collective node:', err);
              }
            };

            registerNode('territorio', cleanTerritorio);
            registerNode('ocupacion', cleanOcupacion);
            registerNode('ideologia', cleanIdeologia);
          }).catch(err => {
            console.error('Error firestore:', err);
          });

          // Agregar opciones nuevas a metadata
          getDoc(doc(db, 'config', 'options')).then(snap => {
            let data = snap.exists() ? snap.data() : { sectores: [], ocupaciones: {}, ideologias: {} };
            let changed = false;

            if (respuestas['sector_otro']) {
              if (!data.sectores) data.sectores = [];
              if (!data.sectores.includes(respuestas['sector_otro'])) {
                data.sectores.push(respuestas['sector_otro']);
                changed = true;
              }
            }

            if (respuestas['ocupacion_otro']) {
              const sect = respuestas['sector_otro'] || respuestas['sector'] || 'default';
              if (!data.ocupaciones) data.ocupaciones = {};
              if (!data.ocupaciones[sect]) data.ocupaciones[sect] = [];
              if (!data.ocupaciones[sect].includes(respuestas['ocupacion_otro'])) {
                data.ocupaciones[sect].push(respuestas['ocupacion_otro']);
                changed = true;
              }
            }

            if (respuestas['ideologia_otro']) {
              const pref = (respuestas['prioridad'] || '').substring(0, 3) || 'default';
              if (!data.ideologias) data.ideologias = {};
              if (!data.ideologias[pref]) data.ideologias[pref] = [];
              if (!data.ideologias[pref].includes(respuestas['ideologia_otro'])) {
                data.ideologias[pref].push(respuestas['ideologia_otro']);
                changed = true;
              }
            }

            if (changed) {
              setDoc(doc(db, 'config', 'options'), data, { merge: true }).catch(console.error);
            }
          }).catch(console.error);

          // Enviar al backend para que Soberano-AI procese
          fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               userId: user.uid,
               alias: respuestas['alias'],
               territorio: cleanTerritorio,
               ocupacion: cleanOcupacion,
               ideologia: cleanIdeologia,
               accion_2: respuestas['accion_2']
            })
          }).catch(err => console.error("Error al enviar:", err));
        }).catch(err => console.error('Error auth:', err));
        
      }
      setPasoActual('completado');
    }
  };

  // Función: Manejar Ingreso Existente
  const [passwordLogin, setPasswordLogin] = useState('');
  
  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasLogin.trim() || !passwordLogin.trim()) return;
    
    setErrorLogin('');
    setIsLoggingIn(true);
    const userId = aliasLogin.trim();
    const emailAlias = userId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailLogin = `${emailAlias}@estadored.app`;
    
    const isAdminCredentials = userId.toLowerCase() === 'admin' && passwordLogin === 'administrador';

    try {
      // Ingreso con Email y Password
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      } catch (authErr: any) {
        if (isAdminCredentials) {
          // Programmatically build the admin user if they don't exist yet
          cred = await createUserWithEmailAndPassword(auth, 'admin@estadored.app', 'administrador');
        } else {
          throw authErr;
        }
      }
      
      const userDocRef = doc(db, "users", cred.user.uid);
      let userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() && isAdminCredentials) {
        // Seed the administrator profile data
        const adminProfileData = {
          alias: 'admin',
          rol: 'Admin',
          avatar: '👑',
          isAdmin: true,
          triada: {
            territorio: 'Nacional',
            ocupacion: 'Administración de Red',
            ideologia: 'Equilibrio'
          },
          stats: { xp: 999, ip: 999 },
          email: 'admin@estadored.app',
          configInitialSetupDone: false,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, adminProfileData);
        userDoc = await getDoc(userDocRef);
      }
      
      if (userDoc.exists()) {
        setRespuestas(userDoc.data());
        setPasoActual('dashboard');
        setMostrarLogin(false);
      } else {
        // En caso de fallar o si se migra, buscamos por alias
        const q = query(collection(db, "users"), where("alias", "==", userId));
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty) {
            setRespuestas(querySnapshot.docs[0].data());
            setPasoActual('dashboard');
            setMostrarLogin(false);
        } else {
            setErrorLogin('No se encontró información del nodo.');
        }
      }
    } catch(err) {
      console.error(err);
      setErrorLogin('Credenciales inválidas o error de conexión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Función: Ir hacia atras
  const retrocederPregunta = () => {
    let prevIndex = indicePregunta - 1;
    // Retroceder hasta encontrar una pregunta válida (cuyas dependencias se cumplan o no tenga dependencias)
    while (prevIndex > 0) {
      const prevPre = DIAGNOSTICO[prevIndex];
      if (prevPre.dep) {
        if (respuestas[prevPre.dep.id] !== prevPre.dep.val) {
          prevIndex--;
          continue;
        }
      }
      break;
    }
    if (prevIndex >= 0) setIndicePregunta(prevIndex);
  };

  // Atajo para obtener pregunta actual
  const preguntaActiva = DIAGNOSTICO[indicePregunta];
  
  // Opciones dinámicas para el render actual
  let opcionesMapeadas = preguntaActiva.opciones;
  if (preguntaActiva.id === 'sector') {
    const defaultOptions = ['Educación o Academia', 'Salud', 'Transporte o Logística', 'Minería o Industria', 'Comercio o Gremialismo', 'Agropecuario o Campesino'];
    opcionesMapeadas = Array.from(new Set([...defaultOptions, ...opcionesExtra.sectores, '¡AÑADIR OTRO SECTOR GENERAL!']));
  } else if (preguntaActiva.tipo === 'dynamic_select') {
    const sectorSeleccionado = respuestas['sector'] === '¡AÑADIR OTRO SECTOR GENERAL!' ? respuestas['sector_otro'] : respuestas['sector'];
    const def = MAPA_OCUPACIONES[sectorSeleccionado || 'default'] || MAPA_OCUPACIONES['default'];
    const extra = opcionesExtra.ocupaciones[sectorSeleccionado || 'default'] || [];
    const cleanDef = def.filter(x => !x.includes('¡AÑADIR'));
    opcionesMapeadas = Array.from(new Set([...cleanDef, ...extra, '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!']));
  } else if (preguntaActiva.tipo === 'dynamic_ideologia_select') {
    const prioridad = respuestas['prioridad'] || '';
    const prefix = prioridad.substring(0, 3); // '[A]' etc.
    const def = MAPA_IDEOLOGIAS[prefix] || MAPA_IDEOLOGIAS['default'];
    const extra = opcionesExtra.ideologias[prefix] || [];
    const cleanDef = def.filter(x => !x.includes('¡CREAR'));
    opcionesMapeadas = Array.from(new Set([...cleanDef, ...extra, '¡CREAR NUEVA IDEOLOGÍA!']));
  }

  return (
    <div className="flex h-[100dvh] w-full bg-creambg text-charcoal font-sans overflow-hidden relative paper-texture">
      
      {/* =======================================================
          PANTALLA DE BIENVENIDA (Superpuesta en la parte superior)
          ======================================================= */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center md:justify-start md:pt-16 px-4 transition-all duration-1000 pointer-events-none ${
          pasoActual !== 'bienvenida' ? 'opacity-0 scale-110' : 'opacity-100 bg-charcoal/10 backdrop-blur-xs'
        }`}
      >
        <div className={`bg-white/94 backdrop-blur-lg border border-warmgray/80 p-8 md:p-10 stone-card shadow-xl max-w-lg w-full text-center relative overflow-hidden transition-all duration-300 ${
          pasoActual === 'bienvenida' ? 'pointer-events-auto' : 'pointer-events-none'
        }`}>
          {/* Earth-toned background decor */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-sandbrown-light/10 rounded-full blur-3xl -z-10"></div>
          
          <EstadoRedLogo showText={true} textSize="lg" className="mb-6" />
          
          <div className="h-[2px] w-12 bg-palmgreen mx-auto mb-6 opacity-70 rounded-full"></div>
          
          {!mostrarLogin ? (
            <div className="flex flex-col gap-4">
              <button 
                onClick={empezarSeleccionPais}
                className="stone-btn w-full bg-palmgreen hover:bg-palmgreen-dark text-white border border-palmgreen/20 p-5 shadow-md flex items-center justify-center cursor-pointer"
              >
                <span className="font-semibold text-sm md:text-base flex items-center justify-center gap-3">
                  <Globe2 className="w-5 h-5 shrink-0 text-skyblue-light" /> 
                  Girar el globo y elegir territorio
                </span>
              </button>
              
              <button 
                onClick={() => setMostrarLogin(true)}
                className="stone-btn w-full bg-white hover:bg-warmgray/40 text-charcoal/90 border border-warmgray-dark/80 p-3.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Ingresar a mi Nodo Existente
              </button>
            </div>
          ) : (
            <form onSubmit={manejarLogin} className="w-full flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-350">
               <h2 className="font-serif text-charcoal text-xl font-bold mb-1">Acceso al Estado Red</h2>
               <input 
                 type="text" 
                 placeholder="Tu Alias o Pseudónimo..." 
                 value={aliasLogin}
                 onChange={(e) => { setAliasLogin(e.target.value); setErrorLogin(''); }}
                 className="w-full stone-input bg-creambg/50 border border-warmgray-dark rounded-xl px-4 py-3.5 text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown"
                 autoFocus
               />
               <input 
                 type="password" 
                 placeholder="Tu Contraseña..." 
                 value={passwordLogin}
                 onChange={(e) => { setPasswordLogin(e.target.value); setErrorLogin(''); }}
                 className="w-full stone-input bg-creambg/50 border border-warmgray-dark rounded-xl px-4 py-3.5 text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown"
               />
               {errorLogin && <p className="text-rust text-xs text-left px-2 font-medium">{errorLogin}</p>}
               <div className="flex gap-2.5 w-full mt-2">
                 <button 
                   type="button" 
                   onClick={() => setMostrarLogin(false)} 
                   className="stone-btn px-4 py-3.5 bg-warmgray/50 text-charcoal/80 hover:bg-warmgray border border-warmgray-dark rounded-xl transition-all w-1/3 text-xs font-bold uppercase tracking-wide"
                 >
                   Volver
                 </button>
                 <button 
                   type="submit" 
                   className="stone-btn px-4 py-3.5 bg-sandbrown hover:bg-sandbrown-dark text-white border border-sandbrown/20 rounded-xl transition-all w-2/3 font-semibold shadow-md shadow-sandbrown/10 uppercase tracking-wide text-xs"
                 >
                   Ingresar a la Red
                 </button>
               </div>
            </form>
          )}
        </div>
        
        {/* Botón de ¿Qué es EstadoRed? */}
        <button
          onClick={() => setPasoActual('que_es_estadored')}
          className={`mt-6 text-sm font-semibold uppercase tracking-wider text-charcoal/80 bg-white/60 backdrop-blur-md px-6 py-3 border border-warmgray shadow-sm hover:bg-white hover:text-charcoal hover:shadow-md transition-all rounded-xl pointer-events-auto ${pasoActual === 'bienvenida' ? 'opacity-100' : 'opacity-0 hidden'}`}
        >
          ¿Qué es EstadoRed?
        </button>
      </div>

      {/* =======================================================
          PANEL IZQUIERDO: FORMULARIO (Wizard basado en tu doc)
          ======================================================= */}
      <aside 
        className={`w-full md:w-[500px] h-[100dvh] flex flex-col z-10 bg-[#FAF9F5]/95 backdrop-blur-2xl border-r border-[#ECE8DE] shadow-xl transition-all duration-700 ease-in-out ${
          pasoActual === 'formulario' || pasoActual === 'completado' ? 'translate-x-0 relative opacity-100 pointer-events-auto' : '-translate-x-full absolute opacity-0 pointer-events-none'
        }`}
      >
        {pasoActual === 'formulario' && (
          <>
            <header className="p-6 pb-4 shrink-0">
              <h1 className="text-2xl font-extrabold tracking-tighter text-charcoal drop-shadow-sm">
                Estado<span className="text-sandbrown">Red</span>
              </h1>
              <div className="mt-2 text-sandbrown font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sandbrown shadow-[0_0_8px_rgba(160,106,66,0.5)]"></span> 
                Nodo Conectado: {paisSeleccionado}
              </div>
            </header>

            <div className="px-6 py-4 flex-1 flex flex-col overflow-y-auto">
              <div className="md:hidden w-full mb-6 relative h-48 rounded-xl overflow-hidden pointer-events-none self-center">
                <div className="absolute inset-0 scale-[0.6] origin-top">
                  <IDCardPreview respuestas={respuestas} pasoActual={pasoActual} />
                </div>
              </div>
              <div className="my-auto w-full">
                {/* Barra de progreso visual */}
                <div className="w-full bg-warmgray h-1.5 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-sandbrown h-full transition-all duration-300"
                  style={{ width: `${((indicePregunta + 1) / DIAGNOSTICO.length) * 100}%` }}
                ></div>
              </div>

              {/* Render de las preguntas */}
              <h2 className="text-base md:text-lg font-serif font-black tracking-tight text-charcoal mb-2 leading-snug">
                {preguntaActiva.titulo}
              </h2>
              <p className="text-xs md:text-sm text-charcoal/70 font-medium mb-6 leading-relaxed">{preguntaActiva.texto}</p>
              
              <div className="space-y-4 relative">
                {preguntaActiva.nota && (
                  <p className="text-[11px] md:text-xs text-sandbrown/80 mb-5 font-semibold italic border-l-2 border-sandbrown/30 pl-3 py-1">
                    {preguntaActiva.nota}
                  </p>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold animate-pulse mb-3">
                    ⚠️ {errorMessage}
                  </div>
                )}
                {/* Caso 1: Un SELECCIONADOR desplegable */}
                {(preguntaActiva.tipo === 'select' || preguntaActiva.tipo === 'dynamic_select' || preguntaActiva.tipo === 'dynamic_ideologia_select') && (
                  <select 
                    value={respuestas[preguntaActiva.id] || ''}
                    onChange={(e) => setRespuestas({ ...respuestas, [preguntaActiva.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (respuestas[preguntaActiva.id] || (preguntaActiva as any).opcional)) avanzarPregunta(); }}
                    className={`w-full stone-input bg-white border ${errorInput && (!respuestas[preguntaActiva.id]) && !(preguntaActiva as any).opcional ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-[#ECE8DE]'} px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown transition-all appearance-none cursor-pointer`}
                  >
                    <option value="" disabled>Selecciona tu respuesta...</option>
                    {opcionesMapeadas?.map(opt => (
                      <option key={opt} value={opt} className="bg-white text-charcoal">{opt}</option>
                    ))}
                  </select>
                )}

                {/* Caso 2: Un Área de TEXTO libre */}
                {preguntaActiva.tipo === 'textarea' && (
                  <textarea 
                    rows={4}
                    maxLength={250}
                    placeholder={preguntaActiva.placeholder}
                    value={respuestas[preguntaActiva.id] || ''}
                    onChange={(e) => setRespuestas({ ...respuestas, [preguntaActiva.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && (respuestas[preguntaActiva.id] || (preguntaActiva as any).opcional)) { e.preventDefault(); avanzarPregunta(); } }}
                    className={`w-full stone-input bg-white border ${errorInput && (!respuestas[preguntaActiva.id]) && !(preguntaActiva as any).opcional ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-[#ECE8DE]'} px-4 py-3 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown transition-all resize-none`}
                  ></textarea>
                )}

                {/* Caso 3: TEXTO corto o PASSWORD */}
                {(preguntaActiva.tipo === 'texto' || preguntaActiva.tipo === 'password') && (
                  <input 
                    type={preguntaActiva.tipo}
                    placeholder={preguntaActiva.placeholder}
                    value={respuestas[preguntaActiva.id] || ''}
                    onChange={(e) => setRespuestas({ ...respuestas, [preguntaActiva.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (respuestas[preguntaActiva.id] || (preguntaActiva as any).opcional)) avanzarPregunta(); }}
                    className={`w-full stone-input bg-white border ${errorInput && (!respuestas[preguntaActiva.id]) && !(preguntaActiva as any).opcional ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-[#ECE8DE]'} px-4 py-3 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown transition-all`}
                    autoFocus
                  />
                )}
                
                <p className="text-xs text-sandbrown mt-2 ml-1 flex items-center gap-1.5 opacity-80">
                  <span className="w-1.5 h-1.5 rounded-full bg-sandbrown"></span>
                  Presiona <kbd className="bg-warmgray border border-warmgray-dark px-1 rounded text-[10px] uppercase font-mono text-charcoal/70">Enter ↵</kbd> para avanzar
                </p>

                {/* Caso 4: Selección de Avatar */}
                {preguntaActiva.tipo === 'avatar_select' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVATARES.map(av => {
                      const isSelected = respuestas[preguntaActiva.id] === av.emoji;
                      return (
                        <button
                          key={av.emoji}
                          onClick={() => {
                            setRespuestas({ ...respuestas, [preguntaActiva.id]: av.emoji });
                            // Pequeño delay visual antes de avanzar
                            setTimeout(avanzarPregunta, 300);
                          }}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isSelected ? 'bg-sandbrown/10 border-sandbrown shadow-sm' : 'bg-white border-[#ECE8DE] hover:border-sandbrown/50 hover:bg-warmgray/50'}`}
                        >
                          <span className="text-4xl mb-2">{av.emoji}</span>
                          <span className={`text-[10px] uppercase tracking-widest font-bold text-center ${isSelected ? 'text-sandbrown-dark' : 'text-charcoal/60'}`}>{av.tipo}</span>
                          <span className="text-[9px] text-charcoal/40 text-center mt-1">{av.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Caso 5: CHECKBOX múltiple */}
                {preguntaActiva.tipo === 'checkbox' && (
                  <div className={`space-y-2 p-2 rounded-lg border ${errorInput && (!respuestas[preguntaActiva.id] || respuestas[preguntaActiva.id].length === 0) ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-transparent'}`}>
                    {opcionesMapeadas?.map(opt => {
                      const seleccionados = respuestas[preguntaActiva.id] || [];
                      const isSelected = seleccionados.includes(opt);
                      return (
                        <label key={opt} className="flex items-center gap-3 p-3 bg-white border border-[#ECE8DE] rounded-xl cursor-pointer hover:bg-warmgray/30 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-sandbrown bg-white border-[#ECE8DE] rounded"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const current = Array.isArray(respuestas[preguntaActiva.id]) ? [...respuestas[preguntaActiva.id]] : [];
                              if (checked) {
                                setRespuestas({ ...respuestas, [preguntaActiva.id]: [...current, opt] });
                              } else {
                                setRespuestas({ ...respuestas, [preguntaActiva.id]: current.filter(item => item !== opt) });
                              }
                            }}
                          />
                          <span className="text-sm text-charcoal/80">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Botones de Navegación del Formulario */}
                <div className="flex gap-3 pt-6">
                  {indicePregunta > 0 && (
                    <button 
                      onClick={retrocederPregunta} 
                      className="px-4 py-3 rounded-xl border border-[#ECE8DE] text-charcoal/50 hover:text-charcoal hover:bg-warmgray/40 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={avanzarPregunta}
                    className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md text-white uppercase tracking-wider text-sm stone-btn cursor-pointer
                      ${indicePregunta === DIAGNOSTICO.length - 1 ? 'bg-palmgreen hover:bg-palmgreen-dark' : 'bg-sandbrown hover:bg-sandbrown-dark'}
                    `}
                  >
                    {indicePregunta === DIAGNOSTICO.length - 1 ? 'Terminar Perfil' : 'Siguiente'} 
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

        {pasoActual === 'completado' && (
          <div className="px-6 py-5 flex-1 flex flex-col overflow-y-auto w-full text-charcoal animate-in fade-in duration-300">
            <div className="my-auto w-full flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-sandbrown/10 border border-sandbrown/30 rounded-full flex items-center justify-center mb-5 shrink-0">
                <CheckCircle2 className="w-8 h-8 text-sandbrown" />
              </div>
              
              {respuestas['rol'] === 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)' ? (
                <>
                  <h2 className="text-2xl font-serif font-bold text-charcoal mb-4 leading-tight">
                    Gracias por tu interés
                  </h2>
                  <p className="text-charcoal/80 text-base mb-6 leading-relaxed font-serif">
                    "Nos contactaremos contigo para llevar al siguiente paso nuestro EstadoRed"
                  </p>
                  <button 
                    onClick={() => {
                       window.location.reload();
                    }}
                    className="stone-btn w-full px-6 py-4 mt-2 bg-warmgray/50 hover:bg-warmgray text-charcoal/80 font-bold tracking-wider uppercase transition-all shadow-sm flex flex-col items-center justify-center gap-0.5 shrink-0 cursor-pointer rounded-xl border border-warmgray-dark"
                  >
                    <span>Volver al Inicio</span>
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-serif font-bold text-charcoal mb-2 leading-tight">
                    ¡Identidad Registrada,<br/><span className="text-sandbrown font-bold">{respuestas['alias']}</span>!
                  </h2>
                  
                  <p className="text-charcoal/80 text-xs mb-5 leading-relaxed">
                    Ya no eres un simple votante de asamblea; eres un Nodo Individual activo y soberano. Según tus elecciones, esta es tu Triada Constitutiva en el Estado Red:
                  </p>
                  
                  <div className="text-left bg-[#FAF9F5] border border-[#ECE8DE] p-5 rounded-xl mb-4 space-y-3.5 text-xs text-charcoal/80 shadow-sm w-full font-serif">
                    <p className="flex items-start gap-3">
                      <span className="text-lg">📍</span> 
                      <span><b className="text-charcoal font-mono uppercase tracking-wider text-[10px]">TERRITORIO:</b> Habitas en <b className="text-sandbrown">{respuestas['comunidad'] || respuestas['municipio'] || 'Comunidad'}</b>{respuestas['municipio'] && ` (${respuestas['municipio']})` } en <b className="text-sandbrown">{respuestas['departamento'] || 'La Paz'}</b>.</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-lg">🛠️</span> 
                      <span><b className="text-charcoal font-mono uppercase tracking-wider text-[10px]">OCUPACIÓN:</b> Eres parte del nodo de <b className="text-sandbrown">{respuestas['ocupacion_otro'] || respuestas['ocupacion'] || respuestas['sector'] || 'Cívico'}</b>.</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-lg">🧠</span> 
                      <span><b className="text-charcoal font-mono uppercase tracking-wider text-[10px]">IDEOLOGÍA:</b> Comulgas con la visión de <b className="text-sandbrown">{respuestas['ideologia_otro'] || respuestas['ideologia'] || 'Pragmático'}</b>.</span>
                    </p>
                  </div>

                  {(respuestas['ocupacion'] === '¡AÑADIR NUEVA OCUPACIÓN ESPECÍFICA!' || respuestas['ideologia'] === '¡CREAR NUEVA IDEOLOGÍA!') && (
                    <div className="bg-sandbrown/5 border border-sandbrown/20 p-3 rounded-lg mb-6 text-left w-full">
                      <p className="text-[10px] text-sandbrown-dark leading-relaxed font-semibold">
                        🌾 Has constituido una nueva categoría de red. Esta identidad quedará inaugurada para futuros nodos soberanos del territorio.
                      </p>
                    </div>
                  )}

                  <div className="text-left mb-6 space-y-3 w-full">
                    <h3 className="font-bold text-charcoal text-xs font-mono uppercase tracking-wider border-b border-warmgray pb-1.5">Canales Comunitarios:</h3>
                    <p className="text-[11px] text-charcoal/60 leading-relaxed">
                      Garantiza tu coordinación cívica diaria participando de los canales autogestionados de cooperación y alertas:
                    </p>
                    
                    {/* WHATSAPP INFOLINE */}
                    <div className="bg-palmgreen/5 border border-palmgreen/20 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                       <div className="flex items-center gap-2">
                         <span className="text-xl">📢</span>
                         <div>
                           <p className="text-xs font-bold text-palmgreen-dark uppercase tracking-wider">Muro de Información (WhatsApp)</p>
                           <p className="text-[10px] text-charcoal/60">Canal oficial libre de spam para recibir boletines y alertas críticas.</p>
                         </div>
                       </div>
                       <a 
                         href="https://whatsapp.com/channel/0029Vb7wKedGpLHH6kcqxA44" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="mt-1 bg-palmgreen hover:bg-palmgreen-dark transition-colors text-white text-center text-xs font-bold py-2 px-3 rounded-lg uppercase tracking-wider block shadow-sm"
                       >
                         Entrar al Canal de WhatsApp
                       </a>
                    </div>

                    {/* Telegram links */}
                    <div className="bg-skyblue/5 border border-skyblue/20 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                       <div className="flex items-center gap-2 pb-2 border-b border-skyblue/10">
                         <span className="text-xl">👥</span>
                         <div>
                           <p className="text-xs font-bold text-skyblue-dark uppercase tracking-wider">Asambleas de Identidad en Telegram</p>
                           <p className="text-[10px] text-charcoal/60">Salas de debate y foros cívicos para tu perfil de red.</p>
                         </div>
                       </div>

                       {respuestas['telegram'] && (
                         <div className="bg-white border border-[#ECE8DE] p-2 rounded text-[10px] text-charcoal/80 font-mono shadow-inner">
                           ✓ Registrado apodo de Telegram: <b className="text-sandbrown">{respuestas['telegram']}</b>. El nodo asambleísta te dará de alta.
                         </div>
                       )}

                       <div className="flex flex-col gap-2">
                         <a 
                           href={`https://t.me/mock_estadored_territorio_${(respuestas['departamento'] || respuestas['municipio'] || 'nacional').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center justify-between bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] transition-all text-charcoal/80 p-2.5 rounded-lg text-xs shadow-sm"
                         >
                           <span>📍 <b>Territorial:</b> {respuestas['departamento'] || respuestas['municipio'] || 'Nacional'}</span>
                           <span className="text-[10px] font-bold uppercase text-skyblue hover:underline">Unirse ⚡</span>
                         </a>

                         <a 
                           href={`https://t.me/mock_estadored_ocupacion_${(respuestas['ocupacion_otro'] || respuestas['ocupacion'] || respuestas['sector'] || 'civico').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center justify-between bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] transition-all text-charcoal/80 p-2.5 rounded-lg text-xs shadow-sm"
                         >
                           <span>🛠️ <b>Sectorial:</b> {respuestas['ocupacion_otro'] || respuestas['ocupacion'] || respuestas['sector'] || 'Cívico'}</span>
                           <span className="text-[10px] font-bold uppercase text-[#0088cc] hover:underline">Unirse ⚡</span>
                         </a>

                         <a 
                           href={`https://t.me/mock_estadored_ideologia_${(respuestas['ideologia_otro'] || respuestas['ideologia'] || 'pragmatico').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center justify-between bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] transition-all text-charcoal/80 p-2.5 rounded-lg text-xs shadow-sm"
                         >
                           <span>🧠 <b>Ideológico:</b> {respuestas['ideologia_otro'] || respuestas['ideologia'] || 'Pragmático'}</span>
                           <span className="text-[10px] font-bold uppercase text-skyblue hover:underline">Unirse ⚡</span>
                         </a>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setPasoActual('moderacion');
                    }}
                    className="stone-btn w-full px-6 py-4 mt-2 bg-sandbrown hover:bg-sandbrown-dark text-white font-bold tracking-wider uppercase transition-all shadow-md flex flex-col items-center justify-center gap-0.5 shrink-0 cursor-pointer rounded-xl"
                  >
                    <span>Ingresar a mi red y proponer</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            PANTALLA DE MODERACIÓN E IASesor
            ======================================================= */}
        {pasoActual === 'moderacion' && (
          <div className="px-6 py-8 flex flex-col overflow-y-auto w-full h-full bg-creambg relative justify-center">
            <div className="max-w-md mx-auto bg-white border border-warmgray rounded-2xl p-8 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 bg-skyblue/10 border border-skyblue/30 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-charcoal">IAsesor de Moderación</h2>
              <div className="text-sm text-charcoal/80 space-y-4 text-left bg-warmgray/10 p-4 rounded-xl border border-warmgray-dark/20">
                <p>
                  Bienvenido al EstadoRed. Antes de ingresar, debes conocer nuestras reglas de convivencia de <b>Tolerancia Cero al Odio, pero Tolerancia Absoluta a la Disidencia</b>.
                </p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>El <strong className="text-skyblue-dark">IAsesor</strong> bloquea automáticamente insultos, ataques personales y discursos de odio visceral.</li>
                  <li>Cualquier opinión, por más contraria o disidente que sea al status quo, será respetada y publicada si se expresa de forma constructiva.</li>
                  <li>No necesitas Ciudadanía Digital gubernamental en esta fase de asamblea; eres libre de opinar como nodo soberano usando tu alias.</li>
                </ul>
              </div>
              <button 
                onClick={() => setPasoActual('dashboard')}
                className="w-full py-4 bg-sandbrown hover:bg-sandbrown-dark text-white font-bold rounded-xl uppercase tracking-wider transition-all shadow-md mt-4"
              >
                Acepto y Entro
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* =======================================================
          FONDOS DINÁMICOS (Globo o Red de Puntos)
          ======================================================= */}
      <div className={`transition-all duration-1000 z-0 ${
        (pasoActual === 'bienvenida' || pasoActual === 'seleccion_pais') ? 'w-full absolute inset-0 pointer-events-auto' : 'absolute md:static inset-0 md:flex-1 pointer-events-none'
      } ${(pasoActual === 'dashboard' || pasoActual === 'moderacion' || pasoActual === 'que_es_estadored') ? 'hidden' : ''}`}>
        {/* Mostramos el Globo cuando estamos en bienvenida o selección de país */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${(pasoActual === 'bienvenida' || pasoActual === 'seleccion_pais') ? 'opacity-100' : 'opacity-0'}`}>
          <GlobeViz onCountryClick={manejarClickEnPais} zoomConfig={zoomTarget} />
        </div>

        {/* Mostramos la Tarjeta de Identificación al estar contestando o al acabar */}
        <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${(pasoActual === 'formulario' || pasoActual === 'completado') ? 'opacity-100 delay-500 hidden md:block' : 'opacity-0'} flex items-center justify-center`}>
           <IDCardPreview respuestas={respuestas} pasoActual={pasoActual} />
        </div>

        {/* Indicador flotante durante la selección de país */}
        {pasoActual === 'seleccion_pais' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/94 backdrop-blur-md border border-warmgray-dark px-6 py-3.5 rounded-full text-charcoal text-xs font-semibold tracking-wider font-sans shadow-md pointer-events-none">
            Gira el globo y selecciona tu territorio para continuar...
          </div>
        )}
      </div>

      {/* SECCIÓN ESPECIAL: ¿QUÉ ES ESTADORED? (PÁGINA APARTE COMPLETA) */}
      {pasoActual === 'que_es_estadored' && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#FAF9F5] overflow-y-auto no-scrollbar animate-in fade-in duration-350">
          <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#ECE8DE] z-50 px-6 py-4 flex justify-between items-center shadow-xs">
            <button onClick={() => setPasoActual('bienvenida')} className="cursor-pointer transition hover:opacity-80">
              <EstadoRedLogo showText={true} textSize="sm" />
            </button>
          </header>

          <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8 pb-20">
            <div className="bg-white border border-[#ECE8DE] rounded-3xl p-6 md:p-10 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sandbrown-light/10 rounded-full blur-l -z-10"></div>
              
              <div className="max-w-2xl">
                <div className="mb-6">
                  <span className="inline-block text-[10.5px] font-bold tracking-[0.2em] text-sandbrown border border-sandbrown/20 bg-sandbrown/5 px-4 py-1.5 rounded-full uppercase shadow-sm">
                    Soberanía de Red Funcional
                  </span>
                </div>
                <h1 className="font-serif font-black text-3xl md:text-4xl text-charcoal tracking-tight leading-tight mb-5">
                  ¿Qué es EstadoRed?
                </h1>
                <div className="h-[2px] w-12 bg-palmgreen opacity-70 rounded-full mb-8"></div>
                
                <div className="text-sm md:text-[15px] text-charcoal/85 space-y-4 leading-relaxed font-serif pt-2">
                  <p>
                    EstadoRed surge frente al colapso del sistema representativo tradicional. En lugar de depender de partidos políticos que fragmentan la sociedad boliviana, proponemos una soberanía de red funcional basada en intereses y competencias directas de cada ciudadano.
                  </p>
                  <p>
                    Sustituimos la polarización política tradicional y la violencia de los bloqueos sectoriales por la fuerza del consenso digital transparente, auditado e incorruptible a través de nuestra triada natural civil: Territorio, Ocupación e Ideología.
                  </p>
                </div>
              </div>
            </div>

            <EstatutoInfographic />
          </main>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {pasoActual === 'dashboard' && <Dashboard respuestas={respuestas} />}
      
      {/* PANTALLA DE CARGA */}
      {pasoActual === 'cargando' && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-creambg text-sandbrown paper-texture">
          <EstadoRedLogo showText={true} textSize="md" className="mb-4 animate-pulse" />
        </div>
      )}
    </div>
  );
}
