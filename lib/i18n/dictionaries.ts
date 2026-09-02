import type { Locale } from "./config";

/**
 * Spanish is the source dictionary; its shape defines the `Dictionary` type,
 * so every locale must provide the same keys. Interpolated strings are
 * expressed as functions. Legal sections always carry both `paragraphs` and
 * `list` (one may be empty) to keep a single, union-free section type.
 */
export const es = {
  common: {
    appName: "JustADrop",
    privacy: "Privacidad",
    terms: "Términos",
    langLabel: "Idioma",
  },
  home: {
    title: "Grabá una gota de voz",
    subtitle: "Se escucha una sola vez",
    micDenied:
      "No se pudo acceder al micrófono. Verificá los permisos en tu navegador.",
    tryAgain: "Intentar de nuevo",
    unsupported:
      "Tu navegador no soporta la grabación de audio. Probá con Chrome o Firefox.",
  },
  record: {
    start: "Iniciar grabación",
    stop: "Detener grabación",
    duration: (time: string) => `Duración: ${time}`,
  },
  play: {
    warningPre: "Este audio se escucha ",
    warningStrong: "una sola vez",
    warningPost:
      ". Una vez que presiones play, no podrás volver a escucharlo.",
    ariaPlay: "Reproducir audio",
  },
  listen: {
    loading: "Cargando…",
    fromSomeone: "Alguien te mandó una gota de voz",
    listening: "Escuchando…",
    progress: "Progreso de reproducción",
    errorTitle: "Algo salió mal",
    playbackError: "Error durante la reproducción",
    startError: "No se pudo iniciar la reproducción",
    unknownError: "Error desconocido",
    finishedTitle: "Este drop fue escuchado",
    finishedDesc: "No podrás volver a escucharlo. Así funciona JustADrop.",
  },
  status: {
    consumedTitle: "Ya fue escuchada",
    consumedDesc:
      "Esta gota de voz ya fue escuchada. Los audios de JustADrop solo se pueden escuchar una vez.",
    expiredTitle: "Expiró",
    expiredDesc:
      "Esta gota de voz expiró. Los audios de JustADrop se eliminan a las 24h si nadie los escucha.",
    newDrop: "Grabar una nueva gota",
  },
  preview: {
    title: "Escuchá antes de enviar",
    subtitle: "Una vez creada la gota, no se puede modificar",
    uploadError: (message: string) => `Error al subir: ${message}`,
    rerecord: "Regrabar",
    cancel: "Cancelar",
    create: "Crear gota",
  },
  upload: {
    uploading: (current: number, total: number) =>
      `Subiendo fragmento ${current} de ${total}…`,
    preparing: "Preparando…",
  },
  shared: {
    ready: "¡Tu gota está lista!",
    expiresNote: "Se eliminará en 24h si nadie la escucha",
    recordAnother: "Grabar otra gota",
    urlLabel: "URL para compartir",
  },
  copy: {
    copy: "Copiar enlace",
    copied: "¡Copiado!",
  },
  share: {
    share: "Compartir",
    aria: "Compartir enlace",
    text: "Escuchá este audio — solo se puede escuchar una vez",
  },
  legal: {
    updatedLabel: "Última actualización",
    contactEmail: "hola@justadrop.app",
    privacy: {
      title: "Privacidad",
      updated: "2 de septiembre de 2026",
      lead:
        "JustADrop está pensado para desaparecer. No creamos perfiles ni guardamos tu voz más de lo estrictamente necesario para entregarla una única vez.",
      sections: [
        {
          heading: "Sin cuentas",
          paragraphs: [
            "No pedimos registro, correo, nombre ni ningún dato personal para grabar o escuchar una gota de voz. No hay perfiles que mantener.",
          ],
          list: [],
        },
        {
          heading: "Qué datos procesamos",
          paragraphs: [],
          list: [
            "El audio que grabás: se almacena de forma temporal y se transmite cifrado, solo para poder entregarlo una vez.",
            "Metadatos técnicos mínimos: duración, formato del audio, marcas de tiempo de creación y un identificador aleatorio del enlace.",
            "Datos técnicos del dispositivo: información básica del navegador necesaria para que la grabación y la reproducción funcionen.",
          ],
        },
        {
          heading: "Cuánto dura",
          paragraphs: [],
          list: [
            "Cada gota se elimina automáticamente después de escucharse una vez.",
            "Si nadie la escucha, se elimina a las 24 horas de creada.",
            "No conservamos copias una vez eliminada.",
          ],
        },
        {
          heading: "Con quién lo compartimos",
          paragraphs: [
            "No vendemos ni compartimos tu audio. Nos apoyamos en proveedores de infraestructura (alojamiento y almacenamiento temporal) únicamente para operar el servicio, y solo durante la vida breve de cada gota.",
          ],
          list: [],
        },
        {
          heading: "El enlace es la llave",
          paragraphs: [
            "El enlace que generás es la única forma de acceder a una gota. Cualquier persona que lo tenga puede escucharla una vez. Compartilo con cuidado.",
          ],
          list: [],
        },
        {
          heading: "Cambios",
          paragraphs: [
            "Podemos actualizar esta política. La fecha de arriba refleja la última versión.",
          ],
          list: [],
        },
      ],
      contact: {
        heading: "Contacto",
        text: "¿Dudas sobre privacidad? Escribinos a",
      },
    },
    terms: {
      title: "Términos",
      updated: "2 de septiembre de 2026",
      lead:
        "JustADrop es un servicio simple: grabás un mensaje de voz, compartís un enlace, y se escucha una sola vez antes de destruirse. Al usarlo, aceptás estos términos.",
      sections: [
        {
          heading: "El servicio",
          paragraphs: [
            "JustADrop te permite crear una gota de voz y compartirla mediante un enlace. Cada gota puede reproducirse una única vez; después, se elimina. Si nadie la escucha, se elimina a las 24 horas.",
          ],
          list: [],
        },
        {
          heading: "Uso aceptable",
          paragraphs: [
            "Sos responsable de lo que grabás y compartís. No uses JustADrop para:",
          ],
          list: [
            "Contenido ilegal, ni para acosar, amenazar o dañar a otras personas.",
            "Enviar spam o mensajes masivos no solicitados.",
            "Material que infrinja derechos de autor u otros derechos de terceros.",
            "Intentar vulnerar, sobrecargar o interferir con el servicio.",
          ],
        },
        {
          heading: "Naturaleza efímera",
          paragraphs: [
            "La destrucción del audio es una característica central, no un error. Una vez escuchada o expirada, una gota no se puede recuperar. No ofrecemos copias de respaldo ni recuperación de contenido.",
          ],
          list: [],
        },
        {
          heading: "Sin garantías",
          paragraphs: [
            "El servicio se ofrece «tal cual» y «según disponibilidad», sin garantías de ningún tipo. No garantizamos que la entrega, la reproducción o la disponibilidad sean ininterrumpidas o libres de errores.",
          ],
          list: [],
        },
        {
          heading: "Limitación de responsabilidad",
          paragraphs: [
            "En la máxima medida permitida por la ley, JustADrop no será responsable por daños derivados del uso o la imposibilidad de uso del servicio, incluida la pérdida de contenido por su naturaleza efímera.",
          ],
          list: [],
        },
        {
          heading: "Cambios",
          paragraphs: [
            "Podemos actualizar estos términos. La fecha de arriba refleja la última versión; el uso continuado implica su aceptación.",
          ],
          list: [],
        },
      ],
      contact: {
        heading: "Contacto",
        text: "¿Consultas? Escribinos a",
      },
    },
  },
};

export type Dictionary = typeof es;

export const en: Dictionary = {
  common: {
    appName: "JustADrop",
    privacy: "Privacy",
    terms: "Terms",
    langLabel: "Language",
  },
  home: {
    title: "Record a drop of voice",
    subtitle: "It plays only once",
    micDenied:
      "Couldn't access the microphone. Check your browser permissions.",
    tryAgain: "Try again",
    unsupported:
      "Your browser doesn't support audio recording. Try Chrome or Firefox.",
  },
  record: {
    start: "Start recording",
    stop: "Stop recording",
    duration: (time: string) => `Duration: ${time}`,
  },
  play: {
    warningPre: "This audio plays ",
    warningStrong: "only once",
    warningPost:
      ". Once you press play, you won't be able to listen to it again.",
    ariaPlay: "Play audio",
  },
  listen: {
    loading: "Loading…",
    fromSomeone: "Someone sent you a drop of voice",
    listening: "Playing…",
    progress: "Playback progress",
    errorTitle: "Something went wrong",
    playbackError: "Error during playback",
    startError: "Couldn't start playback",
    unknownError: "Unknown error",
    finishedTitle: "This drop has been heard",
    finishedDesc: "You won't be able to play it again. That's how JustADrop works.",
  },
  status: {
    consumedTitle: "Already played",
    consumedDesc:
      "This drop of voice has already been played. JustADrop audios can only be heard once.",
    expiredTitle: "Expired",
    expiredDesc:
      "This drop of voice expired. JustADrop audios are deleted after 24h if no one listens.",
    newDrop: "Record a new drop",
  },
  preview: {
    title: "Listen before sending",
    subtitle: "Once the drop is created, it can't be changed",
    uploadError: (message: string) => `Upload error: ${message}`,
    rerecord: "Re-record",
    cancel: "Cancel",
    create: "Create drop",
  },
  upload: {
    uploading: (current: number, total: number) =>
      `Uploading chunk ${current} of ${total}…`,
    preparing: "Preparing…",
  },
  shared: {
    ready: "Your drop is ready!",
    expiresNote: "It will be deleted in 24h if no one listens",
    recordAnother: "Record another drop",
    urlLabel: "URL to share",
  },
  copy: {
    copy: "Copy link",
    copied: "Copied!",
  },
  share: {
    share: "Share",
    aria: "Share link",
    text: "Listen to this audio — it can only be played once",
  },
  legal: {
    updatedLabel: "Last updated",
    contactEmail: "hola@justadrop.app",
    privacy: {
      title: "Privacy",
      updated: "September 2, 2026",
      lead:
        "JustADrop is meant to disappear. We don't build profiles or keep your voice any longer than strictly needed to deliver it once.",
      sections: [
        {
          heading: "No accounts",
          paragraphs: [
            "We don't ask for sign-up, email, name, or any personal data to record or listen to a drop of voice. There are no profiles to maintain.",
          ],
          list: [],
        },
        {
          heading: "What we process",
          paragraphs: [],
          list: [
            "The audio you record: stored temporarily and transmitted encrypted, only so it can be delivered once.",
            "Minimal technical metadata: duration, audio format, creation timestamps, and a random identifier for the link.",
            "Basic device data: browser information needed for recording and playback to work.",
          ],
        },
        {
          heading: "How long it lasts",
          paragraphs: [],
          list: [
            "Each drop is deleted automatically after it's played once.",
            "If no one listens, it's deleted 24 hours after creation.",
            "We keep no copies once it's deleted.",
          ],
        },
        {
          heading: "Who we share it with",
          paragraphs: [
            "We don't sell or share your audio. We rely on infrastructure providers (hosting and temporary storage) solely to operate the service, and only during each drop's brief life.",
          ],
          list: [],
        },
        {
          heading: "The link is the key",
          paragraphs: [
            "The link you generate is the only way to access a drop. Anyone who has it can listen once. Share it carefully.",
          ],
          list: [],
        },
        {
          heading: "Changes",
          paragraphs: [
            "We may update this policy. The date above reflects the latest version.",
          ],
          list: [],
        },
      ],
      contact: {
        heading: "Contact",
        text: "Questions about privacy? Write to us at",
      },
    },
    terms: {
      title: "Terms",
      updated: "September 2, 2026",
      lead:
        "JustADrop is a simple service: you record a voice message, share a link, and it plays only once before being destroyed. By using it, you accept these terms.",
      sections: [
        {
          heading: "The service",
          paragraphs: [
            "JustADrop lets you create a drop of voice and share it through a link. Each drop can be played only once; after that, it's deleted. If no one listens, it's deleted after 24 hours.",
          ],
          list: [],
        },
        {
          heading: "Acceptable use",
          paragraphs: [
            "You are responsible for what you record and share. Don't use JustADrop for:",
          ],
          list: [
            "Illegal content, or to harass, threaten, or harm others.",
            "Sending spam or unsolicited bulk messages.",
            "Material that infringes copyright or other third-party rights.",
            "Attempting to breach, overload, or interfere with the service.",
          ],
        },
        {
          heading: "Ephemeral by nature",
          paragraphs: [
            "Destroying the audio is a core feature, not a bug. Once played or expired, a drop can't be recovered. We offer no backups or content recovery.",
          ],
          list: [],
        },
        {
          heading: "No warranties",
          paragraphs: [
            "The service is provided “as is” and “as available,” without warranties of any kind. We don't guarantee that delivery, playback, or availability will be uninterrupted or error-free.",
          ],
          list: [],
        },
        {
          heading: "Limitation of liability",
          paragraphs: [
            "To the maximum extent permitted by law, JustADrop will not be liable for damages arising from the use of, or inability to use, the service, including content loss due to its ephemeral nature.",
          ],
          list: [],
        },
        {
          heading: "Changes",
          paragraphs: [
            "We may update these terms. The date above reflects the latest version; continued use implies acceptance.",
          ],
          list: [],
        },
      ],
      contact: {
        heading: "Contact",
        text: "Questions? Write to us at",
      },
    },
  },
};

export const dictionaries: Record<Locale, Dictionary> = { es, en };
