# EstadoRed: Manual Técnico, Operativo y Guía de Gamificación Cívica

Este repositorio contiene el código fuente de **EstadoRed**, la plataforma de gobernanza y resiliencia cívica en red basada en un sistema de grafos descentralizados estructurales (Tríada) e incentivos de gamificación cívica para Bolivia.

---

## PARTE 1: Manual Técnico y Operativo de EstadoRed
### Guía Definitiva para Equipos de Desarrollo (Devs) y Administración (Admins)

Este documento establece la arquitectura lógica, el flujo de datos, los triggers (disparadores) de gamificación y los protocolos de administración de la plataforma EstadoRed. Su objetivo es alinear el código (Frontend/Backend) con la visión sociopolítica del proyecto.

#### Sección 1: Arquitectura de Base de Datos (Nodos y Redes)
El sistema no es una red social plana; es un grafo estructurado. El Backend debe modelar estas cuatro entidades principales:

1. **Nodo Individual ($N_i$) - Colección `users`**
   * **Definición:** El ciudadano verificando su identidad.
   * **Regla Backend:** Todo $N_i$ DEBE tener obligatoriamente 3 llaves foráneas (Foreign Keys) al registrarse: `id_territorio`, `id_ocupacion`, `id_ideologia`. Si falta una, el onboarding está incompleto.
   * **Privacidad (Frontend):** En la interfaz, el $N_i$ opera bajo un Alias Pseudónimo. Los Admins no deben exponer datos reales en los foros.

2. **Nodo Colectivo ($N_c$) - Colección `collective_nodes`**
   * **Definición y Creación Automática:** Los grupos de identidad (ej. Sindicato, Junta Vecinal). Se crean de forma automática en la base de datos con el registro de los usuarios. Si un ciudadano se registra con un Nodo Colectivo que ya existe en la base de datos, el sistema simplemente agrega a la persona a ese nodo.
   * **Lógica de Enrutamiento y Propuestas:** El Nodo Individual propone exclusivamente dentro de su Nodo Colectivo de origen. Solo ese nodo colectivo puede ver la propuesta (aislamiento del ruido transversal).
   * **Regla Crítica (Respaldo vs. Voto):** Respaldar una propuesta en esta fase NO es votar. El respaldo es únicamente un mecanismo de filtrado para ganar tracción y visibilidad.

3. **Red Territorial ($R_t$) - Colección `territorial_networks`**
   * **Definición:** La agrupación macro geográfica (ej. Municipio de La Paz).
   * **Mecánica de Votación Vinculante:** El voto real se habilita únicamente en una fecha específica (ciclo de decisiones). El voto se ejerce de manera directa o delegada (Voto Líquido) en cada territorio, permitiendo a toda la Red Territorial tomar decisiones sobre las propuestas promovidas.

4. **Nodo Físico ($N_f$) - Colección `physical_nodes`**
   * **Definición:** Ubicaciones reales (Sedes, Tinglados).
   * **Operación Admin/App:** Requieren validación por geolocalización (GPS) o escaneo de código QR rotativo. Aquí se otorgan los puntos de Presencialidad. También están sujetos a fiscalización y Control Social por parte de los ciudadanos.

#### Sección 2: Motor de Gamificación (Lógica Core para Backend)
El sistema opera con dos variables inmutables en la base de datos por cada usuario: **XP (Esfuerzo)** e **IP (Influencia)**.

*Reglas de Negocio Estrictas:*
1. **XP (Experience Points):** Son acumulativos (append-only). Jamás se restan.
2. **IP (Impact Points):** Son dinámicos. Suben si la comunidad te apoya, bajan si tus propuestas son marcadas como spam o si te retiran el Voto Delegado.
3. **El Límite (Soft Cap):** El perfil de ciudadano regular tiene un techo de 1500 IP.
4. **Bóveda de IP (`ip_vault`):** Si un ciudadano supera los 1500 IP, el Backend redirige los puntos excedentes a esta variable oculta, invitándolo a transicionar.

#### Sección 3: Rutas de Desarrollo (Triggers y Eventos)

##### RUTA A: El Ciudadano (De la Educación a la Influencia)
* **Nivel 1: Ciudadano Informado (Onboarding Legal)**
  * *Condición de Subida de Nivel:* Se sube a Nivel 2 completando cualquiera de los cursos o módulos disponibles. No es obligatorio terminarlos todos para avanzar, fomentando una entrada ágil.
  * *Acciones a programar (Frontend/Backend):*
    * `MODULO_LEY_164_COMPLETADO` -> +30 XP
    * `MODULO_LEY_341_COMPLETADO` -> +30 XP
  * *Trigger de Nivel:* `if (user.completed_courses >= 1) { user.level = 2; unlockFeature('create_proposal'); }`

* **Nivel 2: Ciudadano Propositivo**
  * *Regla de Control Social Ampliado:* El Control Social ejercido mediante propuestas/denuncias no es solo para entes gubernamentales clásicos, sino que se habilita para fiscalizar a los Representantes de la plataforma y a la gestión de los Nodos Físicos.
  * *Acciones a programar:*
    * `CREAR_PROPUESTA_LOCAL` -> +20 XP.
    * `RECIBIR_RESPALDO` -> +5 IP (Sumar al autor. Recordar: Es respaldo, no voto).

* **Nivel 3: Ciudadano Activo (Presencialidad)**
  * *Acciones a programar:*
    * `CHECK_IN_NODO_FISICO` -> +50 XP / +10 IP.
    * `ASISTENTE_VERIFICADO_EVENTO` -> +2 IP al organizador.

* **Nivel 4 y 5: Escalabilidad y El Cuello de Botella**
  * *Acciones a programar:*
    * `PROPUESTA_ESCALA_A_Rt` -> +300 IP.
    * `NUEVO_REFERIDO_VALIDADO` -> +50 XP / +20 IP.
  * *Trigger Crítico (IP CAP):* `if (user.ip >= 1500) { redirectExcessToVault(); promptRepresentativeTransition(); }`

##### RUTA B: El Representante (Estado Actual del MVP)
*NOTA DE FASE DE DESARROLLO:* Por el momento, la plataforma está enfocada exclusivamente en el registro masivo de ciudadanos. El flujo del Representante está simplificado.

*Transición Simplificada:*
1. **Frontend:** Cuando el ciudadano alcanza el límite de IP y decide "Asumir Responsabilidad", el sistema actual no le exige funciones ejecutivas complejas.
2. **Contacto Directo:** Los Representantes solo dejan sus datos de contacto públicos (teléfono, correo, redes) validados en su perfil. Esto sirve para que las bases y los Nodos Colectivos puedan comunicarse directamente con ellos para coordinar acciones, alianzas o fiscalización presencial.
3. **Backend:** `user.profile_type = 'representative_contact'`. Se desocultan sus datos de contacto en la UI para su Red Territorial.

#### Sección 4: Esquema de Base de Datos Sugerido (NoSQL / JSON)
Estructura modelo para Firebase Firestore o MongoDB:
```json
{
 "uid": "12345-abcde",
 "real_data": {
   "name": "Juan Perez",
   "verified_citizenship": true, 
   "contact_info": "+591 70000000"
 },
 "platform_identity": {
   "pseudonym": "CondorAndino",
   "is_public_representative": false,
   "nodes": {
     "territory_id": "rt_lapaz_zona_sur",
     "occupation_id": "nc_salud_enfermeria",
     "ideology_id": "nc_socialdemocracia"
   }
 },
 "gamification": {
   "level": 3,
   "completed_courses": 1,
   "xp_total": 650,
   "ip_total": 120,
   "ip_vault": 0,
   "badges": ["badge_ley_164", "badge_primera_propuesta"]
 },
 "liquid_democracy": {
   "my_delegated_vote_to": null,
   "delegated_votes_received": 0
 }
}
```

#### Sección 5: Guía para Administradores de EstadoRed
1. **Gestión de Nodos Colectivos y Redes:** Los Nodos Colectivos se crean y pueblan automáticamente con el registro orgánico de la gente. El Administrador sí tiene la facultad de crear Nodos Colectivos manualmente, pero su esfuerzo y enfoque principal debe estar en la gestión, mapeo y verificación de los Nodos Físicos ($N_f$) y las Redes Territoriales ($R_t$).
2. **Calendario Electoral Interno:** Eres responsable de configurar en el sistema la "Fecha Específica" en la que se cierran los debates y se habilita el botón de "Votar" (Directo o Delegado) en la Red Territorial.
3. **Auditoría de Representantes:** En esta fase de registro ciudadano, tu labor con los representantes es únicamente verificar que los datos de contacto que hacen públicos (al superar el límite de IP) sean reales y accesibles para la comunidad.

---

## PARTE 2: Guía Técnica de Gamificación Cívica: EstadoRed
### Documento de Lógica para Backend y Frontend (Puntos, Niveles y Transiciones)

Este documento traduce la visión sociopolítica del EstadoRed en reglas de negocio estrictas, fórmulas matemáticas y triggers para los equipos de desarrollo.

#### 1. Reglas Globales del Sistema (Variables Core)
* **XP (Puntos de Experiencia):** Miden la actividad y el esfuerzo individual. Nunca se restan ni tienen límite. Sirven para desbloquear funcionalidades básicas de la app.
* **IP (Puntos de Impacto):** Miden la validación social y el consenso. Pueden subir o bajar (si una propuesta es rechazada por spam). Tienen un "Techo Lógico" en el perfil ciudadano.
* **Regla de Oro Democrática:** 1 Nivel más alto NO significa que el voto de esa persona valga más. 1 Persona = 1 Voto Vinculante siempre. Los niveles desbloquean herramientas de organización y visibilidad algorítmica, no poder de voto.

#### 2. Ruta del Ciudadano (Variables y Triggers)

##### Nivel 1: Ciudadano Informado (Fase de Transición Legal)
* **Enfoque Sociopolítico:** El usuario debe comprender que el EstadoRed es viable HOY mediante el actual marco normativo boliviano, rompiendo el mito de que se requiere destruir el país para cambiar el sistema.
* **Condición de Entrada:** Registro exitoso y validación de identidad (Triplicidad: Territorio, Ocupación, Ideología).
* **Umbral:** 0 XP / 0 IP.
* **Tabla de Ganancia (Acciones de Onboarding Legal):**
  * `MODULO_CIUDADANIA_DIGITAL` (Leyes 164 y 1080 - Validez jurídica de la plataforma): +30 XP.
  * `MODULO_CONTROL_SOCIAL` (Ley 341 - El poder de fiscalizar presupuestos): +30 XP.
  * `MODULO_ORGANIZACION_POLITICA` (Leyes 026, 351, 1096 - Cómo las bases recuperan el poder): +30 XP.
  * `TEST_TRANSICION_ESTADORED` (Evaluación final automatizada por IAsesor): +60 XP.
* **Lógica Backend:** Al alcanzar 150 XP, se dispara el trigger `unlock_level_2` y se otorga el Badge `"badge_fundador_legal"`.

##### Nivel 2: Ciudadano Propositivo (Ejerciendo el Control Social)
* **Condición de Entrada:** 150 XP.
* **Desbloqueo en Frontend:** Se habilita el botón "Crear Propuesta / Denuncia" en su Nodo Colectivo, utilizando las facultades de la Ley 341 aprendidas en el nivel anterior.
* **Tabla de Ganancia:**
  * `ENVIAR_PROPUESTA`: +20 XP. (Anti-spam: Máximo 3 por semana).
  * `VOTO_POSITIVO_RECIBIDO`: +5 IP por cada usuario que apoye su propuesta.
  * `COMENTARIO_CONSTRUCTIVO_RECIBIDO`: +1 IP.
* **Lógica Backend:** Al alcanzar 500 XP y 100 IP, se dispara `unlock_level_3`.

##### Nivel 3: Ciudadano Activo (Consolidación Presencial)
* **Condición de Entrada:** 500 XP y 100 IP.
* **Desbloqueo en Frontend:** Se habilita la opción "Organizar Debate/Sala" y el acceso a check-in en los "Nodos Físicos".
* **Tabla de Ganancia:**
  * `ASISTIR_REUNION_VERIFICADA` (Check-in GPS/QR en sede vecinal/sindical): +50 XP / +10 IP.
  * `ORGANIZAR_REUNION`: +100 XP.
  * `ASISTENTE_EN_TU_REUNION`: +2 IP por cada asistente verificado (Fomenta el poder de convocatoria real).
* **Lógica Backend:** Al alcanzar 1000 XP y 500 IP, se dispara `unlock_level_4`.

##### Nivel 4: Ciudadano Influyente (El Apoyo Cruzado)
* **Condición de Entrada:** 1000 XP and 500 IP.
* **Desbloqueo en Frontend:** Se habilita el botón "Solicitar Apoyo Cruzado" (Llevar propuesta del Gremio a toda la Red Municipal).
* **Tabla de Ganancia:**
  * `LIDERAR_PROYECTO`: +200 XP.
  * `PROYECTO_APROBADO_MUNICIPIO`: +300 IP (Gran inyección de impacto).
  * `PROPUESTA_REPLICADA` (Otro municipio o sector copia tu idea): +100 IP.
* **Lógica Backend:** Al alcanzar 2000 XP y 1000 IP, se dispara `unlock_level_5`.

##### Nivel 5: Ciudadano Líder (El Cuello de Botella)
* **Condición de Entrada:** 2000 XP y 1000 IP.
* **Desbloqueo en Frontend:** Herramienta "Crear Comunidad/Subnodo" y "Mentorear Nuevo Usuario".
* **Tabla de Ganancia:**
  * `IMPARTIR_CURSO_NORMATIVA` (Ayudar a Nivel 1 a pasar los tests): +150 XP.
  * `NUEVO_USUARIO_REFERIDO_VALIDADO`: +50 XP / +20 IP.
* **EL LÍMITE DE IMPACTO (Soft Cap):**
  * El máximo de IP que un "Ciudadano" puede acumular es 1500 IP.
  * *Lógica de Transición:* Cuando un usuario de Nivel 5 llega a 1500 IP, cualquier IP adicional entra en una "Bóveda de Contención" (`ip_vault`).
  * *Acción Frontend:* Pantalla modal de logro épico: "Has alcanzado el límite de influencia ciudadana. Tienes [X] puntos de impacto en espera. Para administrar presupuestos del SICOES y formalizar alianzas políticas, debes aceptar la responsabilidad de Representante Público".

#### 3. La Transición: De Ciudadano a Representante
Para evitar que existan "super-ciudadanos" con influencia desmedida sin escrutinio público, el sistema los obliga a dar la cara.

* **Botón de Transición (`switch_to_representative_profile`):**
  * *Backend Requisitos:* Perfil público obligatorio, declaración de ocupación verificada (Firma Digital Ley 164), foto real, habilitación de métricas de rendición de cuentas.
  * *Al aceptar:* El contador de IP se desbloquea, los IP de la "Bóveda" se suman, y el usuario entra al Árbol de Representante.

#### 4. Ruta del Representante (Variables y Triggers)

##### Nivel 1: Representante Visible
* **Condición:** Haber aceptado la transición (Mínimo 1500 IP acumulados previos).
* **Desbloqueo en Frontend:** Panel de Estadísticas Públicas, Botón "Recibir Votos Delegados" (Democracia Líquida).
* **Tabla de Ganancia:**
  * `COMPLETAR_PERFIL_PUBLICO_FIRMA_DIGITAL`: +200 XP.
  * `VOTO_DELEGADO_RECIBIDO`: +10 IP (Por cada ciudadano que le confía su voto).
  * *Nota Backend:* Si un ciudadano le retira el voto delegado, el Representante pierde esos -10 IP automáticamente (IP dinámico).

##### Nivel 2: Representante Interactivo
* **Condición:** 3000 XP y 2000 IP.
* **Desbloqueo Frontend:** Herramienta "Asamblea de Rendición de Cuentas" interactiva.
* **Tabla de Ganancia:**
  * `RESPONDER_DUDA_CIUDADANA` (con voto positivo de la comunidad): +10 XP / +5 IP.
  * `ASAMBLEA_VERIFICADA`: +150 XP / +50 IP (+2 IP extra por asistente presencial/digital).

##### Nivel 3: Representante de Resultados
* **Condición:** 5000 XP y 4000 IP.
* **Desbloqueo Frontend:** Herramienta "Presentar Proyecto de Ley/Presupuesto" al sistema SIGEP/SICOES.
* **Tabla de Ganancia:**
  * `PRESENTAR_PROYECTO_FORMAL`: +300 XP.
  * `PROYECTO_EJECUTADO_EXITOSAMENTE` (validado por oráculos físicos/ciudadanos): +1000 IP.
  * `INCUMPLIMIENTO_RENDICION` (Penalización severa): -500 IP (Alerta roja en su perfil).

##### Nivel 4: Representante Colaborativo
* **Condición:** 8000 XP y 8000 IP.
* **Desbloqueo Frontend:** Panel de "Pactos y Alianzas".
* **Tabla de Ganancia:**
  * `FORJAR_ALIANZA` (Aprobada por la base de votos delegados de ambos representantes): +200 XP / +300 IP.
  * `PROYECTO_CONJUNTO_EXITOSO`: +800 IP.

##### Nivel 5: Representante de Impacto Nacional
* **Condición:** 12000 XP y 15000 IP.
* **Desbloqueo Frontend:** Promoción algorítmica al muro de la "Red Nacional".
* **Tabla de Ganancia:**
  * `POLITICA_REPLICADA_NACIONALMENTE`: +2000 IP.
  * `MACRO_COMUNIDAD_CONSOLIDADA` (Mantenimiento de >10,000 votos delegados por más de 6 meses): Multiplicador pasivo x1.2 en ganancia de IP mensual.

#### 5. Estructura Recomendada para la Base de Datos (JSON/NoSQL)
Para el equipo de Backend (ej. Firestore/MongoDB), el objeto del usuario debe manejar la gamificación separada del núcleo de identidad:
```json
{
 "user_id": "uid_12345",
 "identity": {
   "territory": "id_zona_sur",
   "occupation": "id_salud",
   "ideology": "id_liberal"
 },
 "gamification": {
   "current_profile": "citizen", 
   "level": 3,
   "xp_total": 850,
   "ip_total": 240,
   "ip_vault": 0, 
   "badges": ["id_badge_fundador_legal", "id_badge_puente"],
   "streaks": {
     "consecutive_weeks": 4,
     "multiplier": 1.1
   }
 },
 "liquid_democracy": {
   "delegated_to": null, 
   "received_delegations": 0 
 }
}
```

#### 6. Notas Finales para Frontend (UX/UI)
1. **Animaciones de Onboarding Legal:** Los módulos del Nivel 1 no deben sentirse como un "examen aburrido de leyes". Usa micro-interacciones. Cuando ganan los 30 XP por la "Ley de Participación y Control Social", muestra un tooltip que diga: "¡Poder Desbloqueado! Ahora la Constitución respalda tu derecho a auditar".
2. **Transparencia (Tooltips):** Al pasar el cursor o tocar los puntos (XP/IP), la interfaz debe mostrar exactamente de dónde vinieron ("+5 IP por tu denuncia de baches en Zona Sur"). El usuario debe entender la trazabilidad de su influencia.
