import React, { useEffect } from 'react'
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { dentalColors } from '../../config/colors'

interface LegalPageProps {
  type: 'privacy' | 'terms'
}

interface LegalSection {
  title: string
  paragraphs: string[]
  items?: string[]
}

interface LegalContent {
  eyebrow: string
  title: string
  introduction: string
  sections: LegalSection[]
}

const legalContent: Record<LegalPageProps['type'], LegalContent> = {
  privacy: {
    eyebrow: 'Protección de datos',
    title: 'Política de privacidad',
    introduction:
      'En ODAF tratamos la información personal y de salud con responsabilidad, confidencialidad y únicamente para las finalidades relacionadas con la atención odontológica y la gestión de turnos.',
    sections: [
      {
        title: '1. Responsable del tratamiento',
        paragraphs: [
          'ODAF Consultorios Odontológicos es responsable del tratamiento de los datos recolectados mediante este sitio, el sistema de turnos y el portal de pacientes. Nuestro domicilio de contacto es 2 de Mayo 2930, Lanús Oeste, Buenos Aires.',
        ],
      },
      {
        title: '2. Información que podemos recopilar',
        paragraphs: [
          'Podemos solicitar datos identificatorios y de contacto, información necesaria para coordinar turnos, datos de cobertura médica y, cuando corresponda, información clínica proporcionada por el paciente o generada durante su atención.',
        ],
        items: [
          'Nombre, documento, teléfono y correo electrónico.',
          'Datos de obra social, prepaga o modalidad de atención.',
          'Turnos, cancelaciones, recordatorios y preferencias horarias.',
          'Antecedentes y documentación clínica necesarios para brindar atención odontológica.',
          'Información técnica básica necesaria para el funcionamiento y la seguridad del sitio.',
        ],
      },
      {
        title: '3. Para qué utilizamos los datos',
        paragraphs: ['La información se utiliza exclusivamente para finalidades vinculadas con nuestros servicios.'],
        items: [
          'Gestionar reservas, reprogramaciones y cancelaciones.',
          'Identificar correctamente al paciente y mantener su historial asistencial.',
          'Enviar confirmaciones, recordatorios e información relacionada con la atención.',
          'Preparar presupuestos, documentación de cobertura y medios de pago.',
          'Proteger la seguridad del sistema y cumplir obligaciones legales o sanitarias.',
        ],
      },
      {
        title: '4. Confidencialidad y seguridad',
        paragraphs: [
          'Los datos relativos a la salud reciben un tratamiento especialmente confidencial. Aplicamos medidas técnicas y organizativas destinadas a evitar accesos, modificaciones, pérdidas o divulgaciones no autorizadas. El acceso se limita al personal y a los profesionales que lo requieren para cumplir sus funciones.',
        ],
      },
      {
        title: '5. Proveedores y destinatarios',
        paragraphs: [
          'Podemos utilizar proveedores tecnológicos, de mensajería, alojamiento o soporte para operar el servicio. Estos terceros sólo reciben la información necesaria para su tarea y deben tratarla de manera confidencial. No vendemos datos personales.',
        ],
      },
      {
        title: '6. Conservación',
        paragraphs: [
          'Conservamos los datos durante el tiempo necesario para brindar la atención, mantener los registros clínicos y administrativos y cumplir los plazos exigidos por la normativa aplicable. Cuando dejan de ser necesarios, se eliminan o anonimizan de forma segura.',
        ],
      },
      {
        title: '7. Tus derechos',
        paragraphs: [
          'Podés solicitar información, acceso, rectificación, actualización o supresión de tus datos conforme a la Ley 25.326. Para hacerlo, escribinos a odafodonto@gmail.com indicando tu nombre, un medio de contacto y el derecho que querés ejercer. Es posible que solicitemos información para verificar tu identidad.',
          'Si considerás que tu solicitud no fue atendida adecuadamente, podés presentar un reclamo ante la Agencia de Acceso a la Información Pública, autoridad de aplicación de la Ley 25.326.',
        ],
      },
      {
        title: '8. Cookies y almacenamiento técnico',
        paragraphs: [
          'El sitio puede utilizar cookies o almacenamiento local estrictamente necesarios para mantener sesiones, recordar preferencias y proteger el acceso al sistema. No utilizamos esta información para vender perfiles personales.',
        ],
      },
      {
        title: '9. Cambios en esta política',
        paragraphs: [
          'Podemos actualizar esta política cuando cambien nuestros servicios o las normas aplicables. La versión vigente será siempre la publicada en esta página.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Condiciones del sitio',
    title: 'Términos de uso',
    introduction:
      'Estos términos regulan el acceso al sitio de ODAF, al sistema de turnos y a los contenidos informativos disponibles. Al utilizar estos servicios, aceptás las condiciones detalladas a continuación.',
    sections: [
      {
        title: '1. Finalidad del sitio',
        paragraphs: [
          'El sitio permite conocer los servicios de ODAF, solicitar turnos, acceder al portal de pacientes y comunicarse con el consultorio. Los contenidos generales tienen carácter informativo y no sustituyen una consulta, diagnóstico o indicación profesional.',
        ],
      },
      {
        title: '2. Turnos online',
        paragraphs: [
          'La solicitud queda sujeta a disponibilidad y a la validación de los datos ingresados. ODAF puede comunicarse para confirmar, reprogramar o solicitar información adicional necesaria para la atención.',
          'Si no podés asistir, te pedimos cancelar o reprogramar con la mayor anticipación posible mediante el sistema o nuestros canales de contacto.',
        ],
      },
      {
        title: '3. Información proporcionada por el usuario',
        paragraphs: [
          'Te comprometés a ingresar información verdadera, actualizada y propia. No debés utilizar la identidad de terceros ni intentar acceder a datos o funciones para los que no tengas autorización.',
        ],
      },
      {
        title: '4. Atención médica y urgencias',
        paragraphs: [
          'La reserva online y los mensajes enviados desde el sitio no constituyen un canal de emergencias. Ante una urgencia médica o una situación que requiera atención inmediata, comunicate con el servicio de emergencias correspondiente.',
        ],
      },
      {
        title: '5. Disponibilidad y modificaciones',
        paragraphs: [
          'Procuramos mantener el sitio disponible y actualizado, pero pueden existir interrupciones por mantenimiento, fallas técnicas o causas externas. Podemos modificar funciones, horarios, profesionales, contenidos o estos términos cuando sea necesario.',
        ],
      },
      {
        title: '6. Propiedad intelectual',
        paragraphs: [
          'El diseño, los textos, las imágenes, el logo y demás contenidos propios de ODAF no pueden reproducirse o utilizarse comercialmente sin autorización previa, salvo los usos permitidos por la legislación vigente.',
        ],
      },
      {
        title: '7. Enlaces externos',
        paragraphs: [
          'El sitio puede incluir accesos a WhatsApp, mapas, redes sociales u otros servicios de terceros. Cada plataforma aplica sus propias condiciones y políticas, por lo que ODAF no controla su disponibilidad ni el tratamiento que realicen fuera de este sitio.',
        ],
      },
      {
        title: '8. Responsabilidad',
        paragraphs: [
          'ODAF no será responsable por daños derivados del uso indebido del sitio, de datos incorrectos proporcionados por el usuario o de interrupciones ajenas a su control, sin perjuicio de las responsabilidades que no puedan excluirse conforme a la legislación aplicable.',
        ],
      },
      {
        title: '9. Privacidad y legislación aplicable',
        paragraphs: [
          'El tratamiento de datos se rige por nuestra Política de privacidad. Estos términos se interpretan conforme a las leyes de la República Argentina y cualquier controversia será sometida a la jurisdicción competente según la normativa aplicable.',
        ],
      },
    ],
  },
}

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const content = legalContent[type]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [type])

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/inicio" className="transition-all duration-200 hover:opacity-80" aria-label="Ir al inicio de ODAF">
            <img src="/assets/odaf-logo.png" alt="ODAF Odontología" className="h-12 w-auto sm:h-14" />
          </a>
          <a href="/inicio" className="group flex items-center gap-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Volver al inicio
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="border-b border-slate-300 pb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: dentalColors.primary }}>
            {content.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl">{content.title}</h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-slate-600">{content.introduction}</p>
          <p className="mt-5 text-xs font-semibold text-slate-400">Última actualización: 30 de septiembre de 2026</p>
        </div>

        <div className="divide-y divide-slate-200">
          {content.sections.map((section) => (
            <section key={section.title} className="py-9">
              <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-950">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ul className="space-y-2 pl-5">
                    {section.items.map((item) => <li key={item} className="list-disc pl-1">{item}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {type === 'privacy' && (
          <a
            href="https://www.argentina.gob.ar/aaip/datospersonales/derechos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold transition-all duration-200 hover:opacity-70"
            style={{ color: dentalColors.primary }}
          >
            Conocer tus derechos ante la AAIP
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <aside className="mt-14 border border-slate-200 bg-white p-7 sm:p-9">
          <h2 className="text-lg font-bold text-slate-950">Contacto</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Si tenés consultas sobre estas condiciones o sobre tus datos, contactanos:</p>
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <a href="mailto:odafodonto@gmail.com" className="flex items-center gap-3 text-slate-700 transition-all duration-200 hover:text-slate-950">
              <Mail className="h-4 w-4 shrink-0" style={{ color: dentalColors.primary }} />
              odafodonto@gmail.com
            </a>
            <a href="tel:01177115716" className="flex items-center gap-3 text-slate-700 transition-all duration-200 hover:text-slate-950">
              <Phone className="h-4 w-4 shrink-0" style={{ color: dentalColors.primary }} />
              (011) 7711-5716
            </a>
            <span className="flex items-center gap-3 text-slate-700">
              <MapPin className="h-4 w-4 shrink-0" style={{ color: dentalColors.primary }} />
              2 de Mayo 2930
            </span>
          </div>
        </aside>
      </main>

      <footer className="bg-slate-950 px-5 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ODAF Consultorios Odontológicos · Lanús Oeste
      </footer>
    </div>
  )
}
