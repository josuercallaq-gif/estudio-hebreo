/* ===== 1. Utilidades y datos guardados ===== */
const $ = (id) => document.getElementById(id);
const CLAVE = "hebreo-datos-v2"; // misma clave que antes: tu progreso se conserva
const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const INTERVALOS = [0, 1, 2, 4, 7, 15]; // días hasta volver a ver, según el nivel

const LISTA_PALABRAS = PALABRAS.map((p) => ({ ...p, id: p.he }));

// Número de día (sirve para comparar días sin líos de horas)
function hoyNum() {
  const f = new Date();
  return Math.floor(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) / 86400000);
}

function porDefecto() {
  return {
    items: {},      // nivel y próxima fecha de cada palabra o versículo
    log: [],        // últimas calificaciones del repaso (0 a 3)
    dias: {},       // días en que estudiaste
    palabraHoy: 0,  // último día en que marcaste la palabra del día
    horario: { dias: [1, 3, 5], hora: "19:00", minutos: 30 },
    ejLog: [],      // últimas respuestas de ejercicios (1 acierto, 0 fallo)
    fallos: {}      // palabras que has fallado en ejercicios
  };
}

function cargar() {
  try {
    return Object.assign(porDefecto(), JSON.parse(localStorage.getItem(CLAVE)) || {});
  } catch {
    return porDefecto();
  }
}

let datos = cargar();

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* sin almacenamiento */ }
}

function setFondo(texto) {
  $("fondoLetra").textContent = [...(texto || "א")][0];
}

function fmtHora(h) {
  const [hh, mm] = h.split(":").map(Number);
  return (hh % 12 || 12) + ":" + String(mm).padStart(2, "0") + " " + (hh >= 12 ? "pm" : "am");
}

function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Para comparar lo que escribes: sin acentos, sin mayúsculas, "kh/ch" = "j", "tz" = "ts"
function normalizar(t) {
  return t.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/kh|ch/g, "j")
    .replace(/tz/g, "ts")
    .replace(/[^a-z]/g, "");
}

/* ===== 2. Tarjeta que gira ===== */
function htmlTarjeta(id, p) {
  return `
    <div class="tarjeta" id="${id}" role="button" tabindex="0" aria-label="Voltear tarjeta">
      <div class="cara frente">
        <span class="hebreo ${p.clase || ""}" lang="he" dir="rtl">${p.he}</span>
        <span class="pista">${p.pista}</span>
      </div>
      <div class="cara dorso">
        <span class="significado ${p.claseDorso || ""}">${p.es}</span>
        <span class="pronunciacion">${p.tr}</span>
      </div>
    </div>`;
}

function activarTarjeta(el, alVoltear) {
  const voltear = () => {
    el.classList.toggle("volteada");
    if (alVoltear) alVoltear(el.classList.contains("volteada"));
  };
  el.onclick = voltear;
  el.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); voltear(); }
  };
}

/* ===== 3. Sección HOY ===== */
function palabraDeHoy() {
  return PALABRAS[hoyNum() % PALABRAS.length];
}

function pintarHoy() {
  const p = palabraDeHoy();
  $("fechaHoy").textContent = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  $("zonaHoy").innerHTML = htmlTarjeta("tarjetaHoy", { he: p.he, pista: "Toca para ver el significado", es: p.es, tr: p.tr });
  activarTarjeta($("tarjetaHoy"));
  setFondo(p.he);

  const hecho = datos.palabraHoy === hoyNum();
  $("yaEstudie").disabled = hecho;
  $("yaEstudie").textContent = hecho ? "Palabra estudiada ✓" : "Ya la estudié hoy";
  $("mensajeHoy").textContent = hecho ? "Quedó en tu repaso. Vuelve mañana por una palabra nueva." : "";
}

$("yaEstudie").onclick = () => {
  const clave = "p:" + palabraDeHoy().he;
  if (!datos.items[clave]) datos.items[clave] = { lvl: 0, due: hoyNum() + 1 };
  datos.dias[hoyNum()] = true;
  datos.palabraHoy = hoyNum();
  guardar();
  pintarHoy();
};

/* ===== 4. Motor de repaso (sirve para palabras y versículos) ===== */
function crearRepaso(cfg) {
  let cola = [];
  const clave = (it) => cfg.prefijo + it.id;
  const enRepaso = () => cfg.todos.filter((it) => datos.items[clave(it)]);
  const hayNuevos = () => cfg.todos.some((it) => !datos.items[clave(it)]);

  function armar(todos) {
    const h = hoyNum();
    cola = enRepaso().filter((it) => todos || datos.items[clave(it)].due <= h);
  }

  function agregar() {
    cfg.todos
      .filter((it) => !datos.items[clave(it)])
      .slice(0, cfg.agregar.n)
      .forEach((it) => { datos.items[clave(it)] = { lvl: 0, due: hoyNum() }; });
    guardar();
    armar(false);
    render();
  }

  function calificar(r) {
    const it = cola.shift();
    const e = datos.items[clave(it)];
    const h = hoyNum();
    if (r === 0) {
      e.lvl = 0;
      e.due = h;
      cola.push(it); // vuelve a salir al final de esta sesión
    } else {
      e.lvl = Math.min(5, e.lvl + Math.max(0, r - 1));
      e.due = h + Math.max(1, INTERVALOS[e.lvl]);
    }
    datos.log.push(r);
    datos.log = datos.log.slice(-40);
    datos.dias[h] = true;
    guardar();
    render();
  }

  function render() {
    const c = cfg.contenedor;

    if (!cola.length) {
      const hay = enRepaso().length > 0;
      c.innerHTML = `
        <div class="panel vacio">
          <p>${hay ? "Estás al día. No tienes nada pendiente por ahora." : cfg.vacio}</p>
          <div class="botones">
            ${hay ? `<button class="boton" id="${cfg.id}Todo">Repasar todo igual</button>` : ""}
            ${hayNuevos() ? `<button class="boton principal" id="${cfg.id}Nuevo">${cfg.agregar.texto}</button>` : ""}
          </div>
        </div>`;
      setFondo("א");
      if ($(cfg.id + "Todo")) $(cfg.id + "Todo").onclick = () => { armar(true); render(); };
      if ($(cfg.id + "Nuevo")) $(cfg.id + "Nuevo").onclick = agregar;
      return;
    }

    const it = cola[0];
    const p = cfg.pintar(it);
    setFondo(p.he);
    c.innerHTML = `
      <p class="contador">Pendientes: ${cola.length}</p>
      ${htmlTarjeta(cfg.id + "Tarj", p)}
      <div class="botones calif" id="${cfg.id}Calif" hidden>
        <button class="boton" data-r="0">Otra vez</button>
        <button class="boton" data-r="1">Difícil</button>
        <button class="boton" data-r="2">Bien</button>
        <button class="boton principal" data-r="3">Fácil</button>
      </div>
      ${hayNuevos() ? `<button class="enlace" id="${cfg.id}Mas">${cfg.agregar.texto}</button>` : ""}`;

    activarTarjeta($(cfg.id + "Tarj"), (volteada) => { $(cfg.id + "Calif").hidden = !volteada; });
    c.querySelectorAll("[data-r]").forEach((b) => { b.onclick = () => calificar(Number(b.dataset.r)); });
    if ($(cfg.id + "Mas")) $(cfg.id + "Mas").onclick = agregar;
  }

  return { mostrar() { armar(false); render(); } };
}

const repasoVocab = crearRepaso({
  id: "vocab",
  prefijo: "p:",
  contenedor: $("repasoVocab"),
  todos: LISTA_PALABRAS,
  vacio: "Aún no tienes palabras en repaso. Estudia la palabra de hoy o agrega algunas.",
  agregar: { texto: "Agregar 5 palabras nuevas", n: 5 },
  pintar: (p) => ({ he: p.he, pista: "Toca para ver el significado", es: p.es, tr: p.tr })
});

const repasoVers = crearRepaso({
  id: "vers",
  prefijo: "v:",
  contenedor: $("repasoVers"),
  todos: VERSICULOS,
  vacio: "Aún no tienes versículos en repaso.",
  agregar: { texto: "Agregar un versículo nuevo", n: 1 },
  pintar: (v) => ({
    he: v.he,
    clase: "verso",
    pista: v.ref + ". Toca para ver la traducción",
    es: v.es,
    claseDorso: "largo",
    tr: v.tr
  })
});

/* ===== 5. Motor de preguntas (lo usan los ejercicios y la práctica de gramática) ===== */

// Anota cada respuesta: alimenta la barra de precisión y la lista «Mis errores»
function registrarRespuesta(q, ok) {
  datos.ejLog.push(ok ? 1 : 0);
  datos.ejLog = datos.ejLog.slice(-60);
  if (q.clave) {
    if (!ok) {
      datos.fallos[q.clave] = (datos.fallos[q.clave] || 0) + 1;
    } else if (datos.fallos[q.clave]) {
      datos.fallos[q.clave]--;
      if (datos.fallos[q.clave] <= 0) delete datos.fallos[q.clave];
    }
  }
  datos.dias[hoyNum()] = true;
  guardar();
}

function respuestaDe(q) {
  if (q.respuesta !== undefined) return q.respuesta;
  const t = q.opciones[q.correcta];
  return q.opcionesHe ? H(t) : t;
}

/*
  Una pregunta es un objeto con:
    instruccion, enunciado (opcional), he (true si el enunciado es hebreo), claseEnunciado, ayuda,
    opciones + correcta (índice)  ->  pregunta de elegir
    aceptadas (lista)             ->  pregunta de escribir
    explicacion, respuesta, clave
*/
function sesion(cont, preguntas, alResponder, alTerminar) {
  let i = 0;
  let aciertos = 0;
  const errores = [];

  function pintar() {
    const q = preguntas[i];
    const ultima = i === preguntas.length - 1;
    let respondida = false;

    let ops = null;
    if (q.opciones) {
      ops = q.opciones.map((t, k) => ({ t, ok: k === q.correcta }));
      if (!q.fijo) ops = mezclar(ops);
    }

    const cuerpo = ops
      ? `<div class="opciones ${q.opcionesHe ? "en-hebreo" : ""}">` +
        ops.map((o, k) =>
          `<button type="button" class="opcion" data-k="${k}"${q.opcionesHe ? ' lang="he" dir="rtl"' : ""}>${o.t}</button>`
        ).join("") +
        `</div>`
      : `<form class="escribir" autocomplete="off">
           <input type="text" aria-label="Tu respuesta" autocapitalize="none" spellcheck="false">
           <button class="boton principal" type="submit">Comprobar</button>
         </form>`;

    cont.innerHTML = `
      <p class="contador">Pregunta ${i + 1} de ${preguntas.length}</p>
      <div class="pregunta">
        <p class="instruccion">${q.instruccion}</p>
        ${q.enunciado ? `<div class="enunciado ${q.claseEnunciado || ""}"${q.he ? ' lang="he" dir="rtl"' : ""}>${q.enunciado}</div>` : ""}
        ${q.ayuda ? `<p class="nota">${q.ayuda}</p>` : ""}
        ${cuerpo}
        <div class="feedback" hidden></div>
      </div>`;

    function resolver(ok, marcar) {
      if (respondida) return;
      respondida = true;
      if (ok) aciertos++; else errores.push(q);
      alResponder(q, ok);
      if (marcar) marcar();

      const fb = cont.querySelector(".feedback");
      fb.hidden = false;
      fb.className = "feedback " + (ok ? "bien" : "mal");
      fb.innerHTML = `
        <p class="veredicto">${ok ? "✓ ¡Correcto!" : "✗ Casi. La respuesta es: " + respuestaDe(q)}</p>
        ${q.explicacion ? `<p>${q.explicacion}</p>` : ""}
        <button type="button" class="boton principal sig">${ultima ? "Ver resultado" : "Siguiente"}</button>`;

      const sig = fb.querySelector(".sig");
      sig.focus();
      sig.onclick = () => {
        if (ultima) {
          alTerminar({ aciertos, total: preguntas.length, errores });
        } else {
          i++;
          pintar();
        }
      };
    }

    if (ops) {
      cont.querySelectorAll(".opcion").forEach((b) => {
        b.onclick = () => {
          const k = Number(b.dataset.k);
          resolver(ops[k].ok, () => {
            cont.querySelectorAll(".opcion").forEach((bb, kk) => {
              bb.disabled = true;
              if (ops[kk].ok) {
                bb.classList.add("bien");
                bb.insertAdjacentText("afterbegin", "✓ ");
              } else if (kk === k) {
                bb.classList.add("mal");
                bb.insertAdjacentText("afterbegin", "✗ ");
              }
            });
          });
        };
      });
    } else {
      const form = cont.querySelector(".escribir");
      const caja = form.querySelector("input");
      caja.focus();
      form.onsubmit = (e) => {
        e.preventDefault();
        if (respondida) return;
        const dado = normalizar(caja.value);
        if (!dado) return;
        const ok = q.aceptadas.some((a) => normalizar(a) === dado);
        resolver(ok, () => {
          caja.disabled = true;
          form.querySelector("button").disabled = true;
        });
      };
    }
  }

  pintar();
}

/* ===== 6. Ejercicios activos ===== */
const zonaEj = $("zonaEjercicios");
const LETRAS_TODAS = [...LETRAS, ...FINALES];
const VOCALES_PRUEBA = VOCALES.filter((v) => v.sonido.length === 1);

function qHeEs(p) {
  const otros = mezclar(LISTA_PALABRAS.filter((x) => x.id !== p.id && x.es !== p.es)).slice(0, 3);
  return {
    id: "heEs:" + p.id,
    instruccion: "¿Qué significa esta palabra?",
    enunciado: p.he, he: true, claseEnunciado: "grande",
    opciones: [p.es, ...otros.map((o) => o.es)], correcta: 0,
    explicacion: `${H(p.he)} se lee «${p.tr}».`,
    clave: "p:" + p.id
  };
}

function qEsHe(p) {
  const otros = mezclar(LISTA_PALABRAS.filter((x) => x.id !== p.id && x.es !== p.es)).slice(0, 3);
  return {
    id: "esHe:" + p.id,
    instruccion: "¿Cómo se dice en hebreo?",
    enunciado: p.es, claseEnunciado: "medio",
    opciones: [p.he, ...otros.map((o) => o.he)], correcta: 0, opcionesHe: true,
    explicacion: `${H(p.he)} se lee «${p.tr}».`,
    clave: "p:" + p.id
  };
}

function qEscTr(p) {
  return {
    id: "escTr:" + p.id,
    instruccion: "Escribe cómo se lee, con letras latinas",
    enunciado: p.he, he: true, claseEnunciado: "grande",
    ayuda: "No importan los acentos ni las mayúsculas.",
    aceptadas: [p.tr], respuesta: `«${p.tr}»`,
    explicacion: `Significa «${p.es}».`,
    clave: "p:" + p.id
  };
}

function qEscEs(p) {
  return {
    id: "escEs:" + p.id,
    instruccion: "Escribe el significado en español",
    enunciado: p.he, he: true, claseEnunciado: "grande",
    ayuda: "No importan los acentos ni las mayúsculas.",
    aceptadas: p.es.split("/").map((s) => s.trim()), respuesta: `«${p.es}»`,
    explicacion: `Se lee «${p.tr}».`,
    clave: "p:" + p.id
  };
}

const sinMarcas = (w) => w.replace(/[\u0591-\u05C7]/g, "");

function qVers(v) {
  const palabras = v.he.split(" ");
  const largas = palabras.map((w, k) => k).filter((k) => sinMarcas(palabras[k]).length >= 3);
  const k = elegir(largas.length ? largas : palabras.map((w, n) => n));
  const correcta = palabras[k];
  const pool = [...new Set(VERSICULOS.filter((x) => x.id !== v.id).flatMap((x) => x.he.split(" ")))]
    .filter((w) => w !== correcta && sinMarcas(w).length >= 3);
  const otras = mezclar(pool).slice(0, 3);
  return {
    id: "vers:" + v.id + ":" + k,
    instruccion: `Completa el versículo (${v.ref})`,
    enunciado: palabras.map((w, n) => (n === k ? "_____" : w)).join(" "),
    he: true, claseEnunciado: "verso",
    ayuda: "Traducción: " + v.es,
    opciones: [correcta, ...otras], correcta: 0, opcionesHe: true,
    explicacion: `${H(v.he)}<br><em>${v.tr}</em>`
  };
}

function qLetra([letra, nombre]) {
  const gemelas = (PARECIDAS[letra] || [])
    .map((g) => LETRAS_TODAS.find((x) => x[0] === g))
    .filter(Boolean);
  const resto = mezclar(LETRAS_TODAS.filter((x) => x[0] !== letra && !gemelas.includes(x)));
  const nombres = [nombre, ...gemelas.map((g) => g[1]), ...resto.map((r) => r[1])].slice(0, 4);
  const aviso = gemelas.length
    ? " No la confundas con " + gemelas.map((g) => `${H(g[0])} (${g[1]})`).join(" ni con ") + "."
    : "";
  return {
    id: "let:" + letra,
    instruccion: "¿Cómo se llama esta letra?",
    enunciado: letra, he: true, claseEnunciado: "grande",
    opciones: nombres, correcta: 0,
    explicacion: `${H(letra)} se llama ${nombre}.${aviso}`
  };
}

function qVocal(v) {
  const sonidos = ["a", "e", "i", "o", "u"];
  return {
    id: "voc:" + v.nombre,
    instruccion: "¿Qué sonido hace esta vocal?",
    enunciado: (v.letra || "ב") + v.marca, he: true, claseEnunciado: "grande",
    opciones: sonidos, correcta: sonidos.indexOf(v.sonido), fijo: true,
    explicacion: `Se llama ${v.nombre} y suena «${v.sonido}».`
  };
}

const palabraAlAzar = () => elegir(LISTA_PALABRAS);

const MODOS = [
  { id: "heEs", titulo: "Hebreo a español", desc: "Ves la palabra y eliges qué significa.", uno: () => qHeEs(palabraAlAzar()) },
  { id: "esHe", titulo: "Español a hebreo", desc: "Ves el significado y eliges la palabra.", uno: () => qEsHe(palabraAlAzar()) },
  { id: "escTr", titulo: "Escribe cómo se lee", desc: "Ves la palabra y escribes su pronunciación.", uno: () => qEscTr(palabraAlAzar()) },
  { id: "escEs", titulo: "Escribe el significado", desc: "Ves la palabra y la traduces escribiendo.", uno: () => qEscEs(palabraAlAzar()) },
  { id: "vers", titulo: "Completa el versículo", desc: "Falta una palabra: elige la correcta.", uno: () => qVers(elegir(VERSICULOS)) },
  { id: "letras", titulo: "Alfabeto", desc: "Reconoce letras, también las que se parecen.", uno: () => qLetra(elegir(LETRAS_TODAS)) },
  { id: "vocales", titulo: "Vocales", desc: "Une cada marca con su sonido.", uno: () => qVocal(elegir(VOCALES_PRUEBA)) }
];

const MODO_MEZCLA = {
  id: "mezcla",
  titulo: "Mezcla de todo",
  desc: "Una ronda variada con todos los tipos de ejercicio.",
  uno: () => elegir(MODOS).uno()
};

function palabrasConFallos() {
  return LISTA_PALABRAS.filter((p) => datos.fallos["p:" + p.id]);
}

const MODO_ERRORES = {
  id: "errores",
  titulo: "Mis errores",
  desc: "",
  uno: () => elegir([qHeEs, qEsHe, qEscTr, qEscEs])(elegir(palabrasConFallos()))
};

// Arma una ronda sin repetir preguntas
function armarRonda(modo, n) {
  const vistos = new Set();
  const lista = [];
  for (let intento = 0; lista.length < n && intento < n * 15; intento++) {
    const q = modo.uno();
    if (!vistos.has(q.id)) {
      vistos.add(q.id);
      lista.push(q);
    }
  }
  return lista;
}

function menuEjercicios() {
  setFondo("א");
  const fallos = palabrasConFallos().length;
  const modos = [MODO_MEZCLA, ...MODOS, MODO_ERRORES];

  zonaEj.innerHTML = `
    <p class="nota-clara">Cada ronda tiene hasta 10 preguntas. Lo que falles se guarda en «Mis errores».</p>
    <div class="modos">
      ${modos.map((m) => {
        const bloqueado = m.id === "errores" && !fallos;
        const desc = m.id === "errores"
          ? (fallos ? `${fallos} palabra${fallos === 1 ? "" : "s"} por reforzar.` : "Aún no tienes errores guardados.")
          : m.desc;
        return `<button class="modo" data-m="${m.id}" ${bloqueado ? "disabled" : ""}><strong>${m.titulo}</strong><span>${desc}</span></button>`;
      }).join("")}
    </div>`;

  zonaEj.querySelectorAll(".modo").forEach((b) => {
    b.onclick = () => iniciarRonda(modos.find((m) => m.id === b.dataset.m));
  });
}

function iniciarRonda(modo) {
  if (modo.id === "errores" && !palabrasConFallos().length) { menuEjercicios(); return; }
  const preguntas = armarRonda(modo, 10);
  if (!preguntas.length) { menuEjercicios(); return; }
  window.scrollTo(0, 0);
  sesion(zonaEj, preguntas, registrarRespuesta, (r) => resultadoRonda(modo, r));
}

function resultadoRonda(modo, r) {
  const pct = Math.round((r.aciertos / r.total) * 100);
  const msg = pct === 100 ? "Ronda perfecta."
    : pct >= 70 ? "Muy bien, vas por buen camino."
    : "Repasa lo que fallaste y vuelve a intentarlo.";

  zonaEj.innerHTML = `
    <div class="panel resultado">
      <p class="grande-num">${r.aciertos} de ${r.total}</p>
      <p>${msg}</p>
      ${r.errores.length ? `
        <h3>Para repasar</h3>
        <ul class="fallos">
          ${r.errores.map((q) => {
            const que = q.enunciado && !q.enunciado.includes("_____")
              ? (q.he ? H(q.enunciado) : q.enunciado)
              : q.instruccion;
            return `<li>${que}: ${respuestaDe(q)}</li>`;
          }).join("")}
        </ul>` : ""}
      <div class="botones">
        <button class="boton principal" id="otraRonda">Otra ronda</button>
        <button class="boton" id="otroEjercicio">Elegir otro ejercicio</button>
      </div>
    </div>`;

  $("otraRonda").onclick = () => iniciarRonda(modo);
  $("otroEjercicio").onclick = menuEjercicios;
}

/* ===== 7. Gramática viva ===== */

// Práctica de 3 preguntas al final de cada tema
function activarPracticas() {
  document.querySelectorAll(".practica").forEach((cont) => {
    const preguntas = EJ_GRAMATICA[cont.dataset.tema];
    if (!preguntas) return;

    function inicio() {
      cont.innerHTML = `<button type="button" class="boton chico">Practicar este tema (${preguntas.length} preguntas)</button>`;
      cont.querySelector("button").onclick = comenzar;
    }

    function comenzar() {
      sesion(cont, mezclar(preguntas), registrarRespuesta, (r) => {
        cont.innerHTML = `
          <div class="pregunta">
            <p class="resultado-mini">Acertaste ${r.aciertos} de ${r.total}.</p>
            <p class="nota">${r.aciertos === r.total ? "Tema dominado por ahora." : "Relee la explicación y vuelve a intentarlo."}</p>
            <div class="botones">
              <button type="button" class="boton chico" data-a="repetir">Repetir</button>
              <button type="button" class="boton chico" data-a="cerrar">Cerrar</button>
            </div>
          </div>`;
        cont.querySelector('[data-a="repetir"]').onclick = comenzar;
        cont.querySelector('[data-a="cerrar"]').onclick = inicio;
      });
    }

    inicio();
  });
}

// Tapar los nombres de letras o vocales y revelarlos al tocar
function activarTapado(idGrid, idBoton) {
  const grid = $(idGrid);
  const boton = $(idBoton);

  boton.onclick = () => {
    const tapado = grid.classList.toggle("tapado");
    grid.querySelectorAll(".celda").forEach((c) => c.classList.remove("visible"));
    boton.textContent = tapado ? "Mostrar los nombres" : "Tapar nombres y probarme";
  };

  grid.onclick = (e) => {
    const celda = e.target.closest(".celda");
    if (celda && grid.classList.contains("tapado")) celda.classList.toggle("visible");
  };
}

const filasTabla = (filas) =>
  filas.map(([a, b, c]) => `<tr><td lang="he">${a}</td><td>${b}</td><td>${c}</td></tr>`).join("");

// Tablas de verbos
let verboSel = 0;
let tiempoSel = "presente";

const NOMBRES_TIEMPO = { presente: "Presente", pasado: "Pasado", futuro: "Futuro" };
const NOTAS_TIEMPO = {
  presente: "El presente no cambia por persona, solo por género y número. Para decir «yo aprendo» se junta el pronombre: " + H("אֲנִי לוֹמֵד") + ".",
  pasado: "En el pasado, el final de la palabra indica quién hace la acción.",
  futuro: "En el futuro, el inicio de la palabra indica quién hace la acción (" + H("א") + " yo, " + H("ת") + " tú, " + H("י") + " él, " + H("נ") + " nosotros)."
};

function pintarVerbos() {
  const v = VERBOS[verboSel];

  $("verboSel").innerHTML = VERBOS.map((x, i) =>
    `<option value="${i}" ${i === verboSel ? "selected" : ""}>${x.infTr} (${x.es})</option>`).join("");
  $("verboSel").onchange = () => { verboSel = Number($("verboSel").value); pintarVerbos(); };

  $("infoVerbo").innerHTML = `${H(v.inf)} (${v.infTr}) · raíz ${H(v.raiz)}`;

  $("tiemposVerbo").innerHTML = Object.keys(NOMBRES_TIEMPO).map((t) =>
    `<button type="button" class="dia ${t === tiempoSel ? "activo" : ""}" data-t="${t}" aria-pressed="${t === tiempoSel}">${NOMBRES_TIEMPO[t]}</button>`).join("");
  document.querySelectorAll("#tiemposVerbo .dia").forEach((b) => {
    b.onclick = () => { tiempoSel = b.dataset.t; pintarVerbos(); };
  });

  $("notaVerbo").innerHTML = NOTAS_TIEMPO[tiempoSel];
  $("tablaVerbo").innerHTML = filasTabla(v[tiempoSel]);
}

// Familias de palabras por raíz
let raizSel = 0;

function pintarRaices() {
  $("chipsRaices").innerHTML = RAICES.map((r, i) =>
    `<button type="button" class="dia ${i === raizSel ? "activo" : ""}" data-i="${i}" lang="he" aria-pressed="${i === raizSel}">${r.raiz}</button>`).join("");
  document.querySelectorAll("#chipsRaices .dia").forEach((b) => {
    b.onclick = () => { raizSel = Number(b.dataset.i); pintarRaices(); };
  });

  const r = RAICES[raizSel];
  $("familiaRaiz").innerHTML = `
    <p>La raíz ${H(r.raiz)} expresa la idea de <strong>${r.idea}</strong>.</p>
    <table>
      <thead><tr><th>Hebreo</th><th>Se lee</th><th>Significa</th></tr></thead>
      <tbody>${filasTabla(r.familia)}</tbody>
    </table>`;
}

function pintarGramatica() {
  $("gridLetras").innerHTML = LETRAS_TODAS.map(([l, n]) =>
    `<button type="button" class="celda"><span lang="he">${l}</span><small>${n}</small></button>`).join("");

  $("gridVocales").innerHTML = VOCALES.map((v) =>
    `<button type="button" class="celda"><span lang="he">${(v.letra || "ב") + v.marca}</span><small>${v.nombre}: ${v.sonido}</small></button>`).join("");

  $("tablaPronombres").innerHTML = PRONOMBRES.map(([he, tr, es]) =>
    `<tr><td lang="he">${he}</td><td>${tr}</td><td>${es}</td></tr>`).join("");

  activarTapado("gridLetras", "tapaLetras");
  activarTapado("gridVocales", "tapaVocales");
  pintarVerbos();
  pintarRaices();
  activarPracticas();
}

/* ===== 8. Progreso ===== */
function pintarProgreso() {
  const dominados = (prefijo, lista) =>
    lista.filter((it) => { const e = datos.items[prefijo + it.id]; return e && e.lvl >= 4; }).length;

  const h = hoyNum();
  const nV = dominados("p:", LISTA_PALABRAS);
  const nVs = dominados("v:", VERSICULOS);

  // Calidad del repaso: promedio de tus calificaciones (0 = Otra vez, 3 = Fácil)
  const n = datos.log.length;
  const calidad = n ? (datos.log.reduce((a, b) => a + b, 0) / (3 * n)) * 100 : 0;
  const mensajeCalidad = calidad >= 80 ? "Excelente: recuerdas casi todo sin esfuerzo."
    : calidad >= 50 ? "Vas bien. Sigue repasando para subirla."
    : "Repasa con calma: es normal que al inicio cueste.";

  // Precisión en ejercicios: aciertos sobre tus últimas respuestas
  const nEj = datos.ejLog.length;
  const precision = nEj ? (datos.ejLog.reduce((a, b) => a + b, 0) / nEj) * 100 : 0;
  const porReforzar = Object.keys(datos.fallos).length;
  const notaPrecision = nEj
    ? `Tus últimas ${nEj} respuestas. ` + (porReforzar
      ? `Tienes ${porReforzar} palabra${porReforzar === 1 ? "" : "s"} por reforzar en Ejercicios, «Mis errores».`
      : "No tienes errores pendientes.")
    : "Haz una ronda de ejercicios para medirla.";

  // Constancia: días estudiados en los últimos 7 contra los días de tu horario
  let semana = 0;
  for (let i = 0; i < 7; i++) if (datos.dias[h - i]) semana++;
  const plan = Math.max(1, datos.horario.dias.length);

  let racha = 0;
  let d = datos.dias[h] ? h : h - 1;
  while (datos.dias[d]) { racha++; d--; }

  const barras = [
    { t: "Vocabulario dominado", pct: (nV / PALABRAS.length) * 100, txt: `${nV} de ${PALABRAS.length}`,
      nota: "Una palabra cuenta como dominada cuando la recuerdas bien varias veces seguidas." },
    { t: "Versículos dominados", pct: (nVs / VERSICULOS.length) * 100, txt: `${nVs} de ${VERSICULOS.length}`,
      nota: "Igual que las palabras: se dominan con repasos buenos y espaciados." },
    { t: "Calidad de tus repasos", pct: calidad, txt: n ? Math.round(calidad) + "%" : "Sin datos",
      nota: n ? mensajeCalidad : "Califica tus repasos para medir qué tan bien estás estudiando." },
    { t: "Precisión en ejercicios", pct: precision, txt: nEj ? Math.round(precision) + "%" : "Sin datos",
      nota: notaPrecision },
    { t: "Constancia de la semana", pct: Math.min(100, (semana / plan) * 100), txt: `${semana} de ${plan} días`,
      nota: `Racha actual: ${racha} día${racha === 1 ? "" : "s"} seguidos.` }
  ];

  $("barras").innerHTML = barras.map((b) => `
    <div>
      <div class="barra-cab"><span>${b.t}</span><span>${b.txt}</span></div>
      <div class="pista-barra"><div class="relleno" style="width:${Math.round(b.pct)}%"></div></div>
      <p class="nota">${b.nota}</p>
    </div>`).join("");
}

/* ===== 9. Horario ===== */
function proximaSesion() {
  const hr = datos.horario;
  if (!hr.dias.length) return null;
  const ahora = new Date();
  const [hh, mm] = hr.hora.split(":").map(Number);
  for (let i = 0; i < 8; i++) {
    const f = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i, hh, mm);
    if (hr.dias.includes(f.getDay()) && f > ahora) return { fecha: f, i };
  }
  return null;
}

function pintarHorario() {
  const hr = datos.horario;

  $("dias").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) =>
    `<button class="dia ${hr.dias.includes(d) ? "activo" : ""}" data-d="${d}" aria-pressed="${hr.dias.includes(d)}">${DIAS_SEMANA[d].slice(0, 3)}</button>`).join("");

  document.querySelectorAll("#dias .dia").forEach((b) => {
    b.onclick = () => {
      const d = Number(b.dataset.d);
      hr.dias = hr.dias.includes(d) ? hr.dias.filter((x) => x !== d) : [...hr.dias, d];
      guardar();
      pintarHorario();
    };
  });

  $("hora").value = hr.hora;
  $("duracion").value = String(hr.minutos);

  const prox = proximaSesion();
  if (!prox) {
    $("proxima").textContent = "Elige al menos un día para ver tu próxima sesión.";
  } else {
    const cuando = prox.i === 0 ? "Hoy" : prox.i === 1 ? "Mañana" : DIAS_SEMANA[prox.fecha.getDay()];
    $("proxima").textContent = `Próxima sesión: ${cuando} a las ${fmtHora(hr.hora)} (${hr.minutos} min)`;
  }
}

$("hora").onchange = () => { datos.horario.hora = $("hora").value || "19:00"; guardar(); pintarHorario(); };
$("duracion").onchange = () => { datos.horario.minutos = Number($("duracion").value); guardar(); pintarHorario(); };

$("descargarIcs").onclick = () => {
  const prox = proximaSesion();
  if (!prox) { alert("Elige al menos un día de estudio."); return; }

  const hr = datos.horario;
  const cod = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const p2 = (n) => String(n).padStart(2, "0");
  const fmt = (d) => d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + "T" + p2(d.getHours()) + p2(d.getMinutes()) + "00";
  const fin = new Date(prox.fecha.getTime() + hr.minutos * 60000);
  const sello = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lineas = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EstudioHebreo//ES",
    "BEGIN:VEVENT",
    "UID:hebreo-" + Date.now() + "@estudiohebreo",
    "DTSTAMP:" + sello,
    "DTSTART:" + fmt(prox.fecha),
    "DTEND:" + fmt(fin),
    "RRULE:FREQ=WEEKLY;BYDAY=" + hr.dias.map((d) => cod[d]).join(","),
    "SUMMARY:Estudiar hebreo",
    "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:Hora de estudiar hebreo", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ];

  const blob = new Blob([lineas.join("\r\n")], { type: "text/calendar" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "estudio-hebreo.ics";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
};

/* ===== 10. Navegación ===== */
const vistas = {
  hoy: pintarHoy,
  vocabulario: () => repasoVocab.mostrar(),
  versiculos: () => repasoVers.mostrar(),
  ejercicios: menuEjercicios,
  gramatica: () => setFondo("א"),
  progreso: () => { setFondo("א"); pintarProgreso(); },
  horario: () => { setFondo("א"); pintarHorario(); }
};

function ir(nombre) {
  if (!vistas[nombre]) nombre = "hoy";
  Object.keys(vistas).forEach((v) => { $("vista-" + v).hidden = v !== nombre; });
  document.querySelectorAll(".menu button").forEach((b) => {
    b.classList.toggle("activo", b.dataset.vista === nombre);
  });
  vistas[nombre]();
  location.hash = nombre;
  window.scrollTo(0, 0);
}

document.querySelectorAll(".menu button").forEach((b) => {
  b.onclick = () => ir(b.dataset.vista);
});

pintarGramatica();
ir(location.hash.slice(1) || "hoy");