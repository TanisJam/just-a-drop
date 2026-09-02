import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos · JustADrop",
  description: "Las reglas para usar JustADrop: simple, efímero y bajo tu responsabilidad.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos" updated="2 de septiembre de 2026">
      <p className="prose__lead">
        JustADrop es un servicio simple: grabás un mensaje de voz, compartís un
        enlace, y se escucha una sola vez antes de destruirse. Al usarlo,
        aceptás estos términos.
      </p>

      <h2>El servicio</h2>
      <p>
        JustADrop te permite crear una gota de voz y compartirla mediante un
        enlace. Cada gota puede reproducirse una única vez; después, se elimina.
        Si nadie la escucha, se elimina a las 24 horas.
      </p>

      <h2>Uso aceptable</h2>
      <p>Sos responsable de lo que grabás y compartís. No uses JustADrop para:</p>
      <ul>
        <li>Contenido ilegal, ni para acosar, amenazar o dañar a otras personas.</li>
        <li>Enviar spam o mensajes masivos no solicitados.</li>
        <li>Material que infrinja derechos de autor u otros derechos de terceros.</li>
        <li>Intentar vulnerar, sobrecargar o interferir con el servicio.</li>
      </ul>

      <h2>Naturaleza efímera</h2>
      <p>
        La destrucción del audio es una característica central, no un error. Una
        vez escuchada o expirada, una gota <strong>no se puede recuperar</strong>.
        No ofrecemos copias de respaldo ni recuperación de contenido.
      </p>

      <h2>Sin garantías</h2>
      <p>
        El servicio se ofrece &laquo;tal cual&raquo; y &laquo;según
        disponibilidad&raquo;, sin garantías de ningún tipo. No garantizamos que
        la entrega, la reproducción o la disponibilidad sean ininterrumpidas o
        libres de errores.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, JustADrop no será responsable
        por daños derivados del uso o la imposibilidad de uso del servicio,
        incluida la pérdida de contenido por su naturaleza efímera.
      </p>

      <h2>Cambios</h2>
      <p>
        Podemos actualizar estos términos. La fecha de arriba refleja la última
        versión; el uso continuado implica su aceptación.
      </p>

      <h2>Contacto</h2>
      <p>
        ¿Consultas? Escribinos a{" "}
        <a href="mailto:hola@justadrop.app">hola@justadrop.app</a>.
      </p>
    </LegalPage>
  );
}
