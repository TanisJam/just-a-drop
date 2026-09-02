import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacidad · JustADrop",
  description: "Cómo JustADrop trata tu voz: lo mínimo, y por poco tiempo.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacidad" updated="2 de septiembre de 2026">
      <p className="prose__lead">
        JustADrop está pensado para desaparecer. No creamos perfiles ni
        guardamos tu voz más de lo estrictamente necesario para entregarla una
        única vez.
      </p>

      <h2>Sin cuentas</h2>
      <p>
        No pedimos registro, correo, nombre ni ningún dato personal para grabar
        o escuchar una gota de voz. No hay perfiles que mantener.
      </p>

      <h2>Qué datos procesamos</h2>
      <ul>
        <li>
          <strong>El audio que grabás:</strong> se almacena de forma temporal y
          se transmite cifrado, solo para poder entregarlo una vez.
        </li>
        <li>
          <strong>Metadatos técnicos mínimos:</strong> duración, formato del
          audio, marcas de tiempo de creación y un identificador aleatorio del
          enlace.
        </li>
        <li>
          <strong>Datos técnicos del dispositivo:</strong> información básica del
          navegador necesaria para que la grabación y la reproducción funcionen.
        </li>
      </ul>

      <h2>Cuánto dura</h2>
      <ul>
        <li>Cada gota se elimina automáticamente después de escucharse una vez.</li>
        <li>Si nadie la escucha, se elimina a las 24 horas de creada.</li>
        <li>No conservamos copias una vez eliminada.</li>
      </ul>

      <h2>Con quién lo compartimos</h2>
      <p>
        No vendemos ni compartimos tu audio. Nos apoyamos en proveedores de
        infraestructura (alojamiento y almacenamiento temporal) únicamente para
        operar el servicio, y solo durante la vida breve de cada gota.
      </p>

      <h2>El enlace es la llave</h2>
      <p>
        El enlace que generás es la única forma de acceder a una gota. Cualquier
        persona que lo tenga puede escucharla una vez. Compartilo con cuidado.
      </p>

      <h2>Cambios</h2>
      <p>
        Podemos actualizar esta política. La fecha de arriba refleja la última
        versión.
      </p>

      <h2>Contacto</h2>
      <p>
        ¿Dudas sobre privacidad? Escribinos a{" "}
        <a href="mailto:hola@justadrop.app">hola@justadrop.app</a>.
      </p>
    </LegalPage>
  );
}
