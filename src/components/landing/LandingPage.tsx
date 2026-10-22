import React, { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Facebook,
  HeartHandshake,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Microscope,
  Phone,
  ScanLine,
  ShieldCheck,
  Smile,
  Stethoscope,
  UserRoundCheck,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import { dentalColors } from '../../config/colors'
import { BookingForm } from '../booking/BookingForm'

interface Specialty {
  title: string
  description: string
  icon: LucideIcon
}

interface TechnologyBenefit {
  title: string
  description: string
}

const specialties: Specialty[] = [
  {
    title: 'Ortodoncia y Ortopedia',
    description:
      'Alineación dental y corrección de la mordida para niños, jóvenes y adultos. Brackets estéticos, convencionales y alineadores invisibles.',
    icon: Smile,
  },
  {
    title: 'Implantes Dentales',
    description:
      'Rehabilitación de piezas ausentes con implantes de titanio y prótesis sobre implantes de apariencia natural.',
    icon: Zap,
  },
  {
    title: 'Cirugías Odontológicas',
    description:
      'Extracciones de piezas retenidas, muelas del juicio y cirugía bucal menor con un abordaje cuidadoso.',
    icon: Stethoscope,
  },
  {
    title: 'Odontopediatría',
    description:
      'Atención cercana para los más chicos, con prevención de caries, selladores y educación en higiene dental.',
    icon: UserRoundCheck,
  },
  {
    title: 'Odontología de Adultos',
    description:
      'Limpieza con ultrasonido, restauraciones estéticas, endodoncias y cuidado periodontal preventivo.',
    icon: Building2,
  },
  {
    title: 'Estética Dental',
    description:
      'Diseño de sonrisa, carillas y blanqueamiento clínico para recuperar armonía, función y naturalidad.',
    icon: BadgeCheck,
  },
]

const technologyBenefits: TechnologyBenefit[] = [
  {
    title: 'Diagnóstico que podés ver',
    description:
      'Observá el estado de tu boca y la planificación del tratamiento en una imagen tridimensional clara.',
  },
  {
    title: 'Precisión milimétrica',
    description:
      'Registros exactos para coronas, carillas, implantes y alineadores con un ajuste más predecible.',
  },
  {
    title: 'Más comodidad, menos espera',
    description:
      'El escaneo se realiza en minutos, sin pastas de impresión, y se comparte de inmediato con el laboratorio.',
  },
]

const navItems = [
  { label: 'Nosotros', id: 'quienes-somos' },
  { label: 'Especialidades', id: 'especialidades' },
  { label: 'Tecnología', id: 'tecnologia' },
  { label: 'Coberturas', id: 'coberturas' },
  { label: 'Contacto', id: 'contacto' },
]

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 antialiased selection:bg-dental-primary selection:text-white">
      {/* Contacto inmediato */}
      <div className="hidden border-b border-white/10 text-white sm:block" style={{ backgroundColor: dentalColors.primaryDark }}>
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-between px-6 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Odontología integral en Lanús Oeste · 33 años de trayectoria
          </p>
          <div className="flex items-center gap-7 text-xs font-medium text-white/85">
            <a href="tel:01177115716" className="flex items-center gap-2 transition-all duration-200 hover:text-white" title="Llamar a ODAF">
              <Phone className="h-3.5 w-3.5" />
              (011) 7711-5716
            </a>
            <a
              href="https://wa.me/5491140483693"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-all duration-200 hover:text-white"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              11 4048-3693
            </a>
            <span className="hidden items-center gap-2 xl:flex">
              <MapPin className="h-3.5 w-3.5" />
              2 de Mayo 2930
            </span>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[88px] max-w-[1400px] items-center justify-between px-5 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex shrink-0 items-center transition-all duration-200 hover:opacity-80"
            aria-label="Volver al inicio"
          >
            <img
              src="/assets/odaf-logo.png"
              alt="ODAF Odontología"
              className="h-12 w-auto object-contain sm:h-14"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </button>

          <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Navegación principal">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="relative py-3 text-[13px] font-semibold text-slate-600 transition-all duration-200 after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-dental-primary after:transition-transform after:duration-200 hover:text-slate-950 hover:after:scale-x-100"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/paciente"
              className="rounded-full px-4 py-3 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950"
            >
              Portal paciente
            </a>
            <button
              type="button"
              onClick={() => scrollToSection('reserva-turno')}
              className="group flex items-center gap-2 rounded-full px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg active:translate-y-0"
              style={{ backgroundColor: dentalColors.primary }}
            >
              Reservar turno
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => scrollToSection('reserva-turno')}
              className="rounded-full px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: dentalColors.primary }}
            >
              Turnos
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
              className="rounded-full p-2.5 text-slate-700 transition-all duration-200 hover:bg-slate-100"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 pb-6 pt-3 shadow-xl md:hidden">
            <nav className="mx-auto max-w-lg" aria-label="Navegación móvil">
              {navItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="flex w-full items-center justify-between border-b border-slate-100 py-4 text-left text-sm font-semibold text-slate-800 transition-all duration-200 hover:pl-1"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-bold text-slate-400">0{index + 1}</span>
                </button>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-5">
                <a href="/paciente" className="rounded-full border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-700">
                  Portal paciente
                </a>
                <a href="/admin" className="rounded-full border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500">
                  Acceso personal
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative border-b border-slate-200 bg-white">
          <div className="mx-auto grid min-h-[700px] max-w-[1400px] grid-cols-1 items-stretch lg:grid-cols-12">
            <div className="flex items-center px-5 py-16 sm:px-8 sm:py-20 lg:col-span-6 lg:px-10 lg:py-24 xl:col-span-5 xl:pr-14">
              <div className="max-w-2xl">
                <h1 className="text-balance text-[clamp(3.25rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-slate-950">
                  Tu salud bucal,
                  <span className="mt-2 block" style={{ color: dentalColors.primary }}>
                    bien cuidada.
                  </span>
                </h1>
                <p className="mt-8 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  Un equipo con 33 años de experiencia, diagnóstico digital y todas las especialidades en un mismo lugar. Odontología clara, precisa y humana.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => scrollToSection('reserva-turno')}
                    className="group flex items-center justify-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl active:translate-y-0"
                    style={{ backgroundColor: dentalColors.primary }}
                  >
                    <CalendarDays className="h-5 w-5" />
                    Sacar turno online
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                  <a
                    href="https://wa.me/5491140483693?text=Hola%20ODAF%20Odontolog%C3%ADa,%20quisiera%20consultar%20por%20un%20turno"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-7 py-4 text-sm font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Consultar por WhatsApp
                  </a>
                </div>

                <div className="mt-12 grid max-w-lg grid-cols-2 gap-6 border-t border-slate-200 pt-7">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: dentalColors.primary }} />
                    <p className="text-xs font-semibold leading-5 text-slate-600">
                      Protocolos estrictos de bioseguridad
                    </p>
                  </div>
                  <div className="flex gap-3 border-l border-slate-200 pl-6">
                    <ScanLine className="mt-0.5 h-5 w-5 shrink-0" style={{ color: dentalColors.primary }} />
                    <p className="text-xs font-semibold leading-5 text-slate-600">
                      Diagnóstico e impresión digital 3D
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[560px] overflow-hidden lg:col-span-6 lg:min-h-[700px] xl:col-span-7">
              <img
                src="/assets/odaf-hero-care.jpg"
                alt="Consulta odontológica profesional y cercana"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute bottom-0 left-0 max-w-[290px] bg-white p-6 sm:bottom-8 sm:left-8 sm:max-w-[340px] sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: dentalColors.primary }}>
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Escuchamos antes de tratar</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Cada plan comienza con un diagnóstico completo y una explicación sin vueltas.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-0 hidden w-24 py-8 text-center text-white lg:block" style={{ backgroundColor: dentalColors.primary }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] [writing-mode:vertical-rl]">
                  Consultorios ODAF · Lanús Oeste
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Datos principales */}
        <section className="text-white" style={{ backgroundColor: dentalColors.primary }}>
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
            {[
              { value: '33', unit: 'años', label: 'de trayectoria continua' },
              { value: '3', unit: 'consultorios', label: 'totalmente equipados' },
              { value: '3D', unit: 'digital', label: 'escáner intraoral' },
              { value: '360°', unit: 'integral', label: 'niños y adultos' },
            ].map((stat, index) => (
              <div
                key={stat.value}
                className={`border-white/20 px-2 py-10 sm:px-6 lg:py-12 ${index % 2 === 0 ? 'border-r' : ''} ${index > 1 ? 'border-t lg:border-t-0' : ''} ${index === 1 ? 'lg:border-r' : ''}`}
              >
                <div className="flex items-end gap-2">
                  <strong className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{stat.value}</strong>
                  <span className="pb-1 text-xs font-bold uppercase tracking-[0.16em] text-white/70">{stat.unit}</span>
                </div>
                <p className="mt-2 text-xs text-white/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quiénes somos */}
        <section id="quienes-somos" className="scroll-mt-24 bg-slate-50 py-24 sm:py-28">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
              <div className="relative lg:col-span-6">
                <div className="relative h-[520px] overflow-hidden sm:h-[600px]">
                  <img
                    src="/assets/odaf-about-team.jpg"
                    alt="Profesionales de ODAF analizando un caso clínico"
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute bottom-0 right-0 flex w-44 flex-col p-6 text-white sm:w-52 sm:p-7" style={{ backgroundColor: dentalColors.primaryDark }}>
                    <Award className="h-7 w-7" />
                    <span className="mt-10 text-4xl font-semibold tracking-[-0.05em]">33+</span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">Años construyendo confianza</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 lg:pl-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: dentalColors.primary }}>
                  Experiencia que se actualiza
                </p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  La confianza de siempre, con la odontología de hoy.
                </h2>
                <p className="mt-7 max-w-xl text-base leading-7 text-slate-600">
                  ODAF cuenta con tres consultorios reacondicionados para la práctica clínica y equipados con rayos X digitales, computadoras en red, cavitadores ultrasónicos, luz halógena y escáner intraoral.
                </p>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Esa tecnología está al servicio de algo más importante: entender a cada paciente, explicar cada alternativa y acompañar todo el tratamiento en un mismo centro.
                </p>

                <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
                  {[
                    'Estándares estrictos de bioseguridad y esterilización',
                    'Tratamientos interdisciplinarios en un solo lugar',
                    'Planes claros, personalizados y explicados paso a paso',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4 py-4">
                      <Check className="h-4 w-4 shrink-0" style={{ color: dentalColors.primary }} strokeWidth={3} />
                      <span className="text-sm font-semibold text-slate-800">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollToSection('especialidades')}
                  className="group mt-8 inline-flex items-center gap-3 text-sm font-bold transition-all duration-200 hover:opacity-70"
                  style={{ color: dentalColors.primary }}
                >
                  Conocé nuestras especialidades
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Especialidades */}
        <section id="especialidades" className="scroll-mt-24 bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
            <div className="grid gap-8 border-b border-slate-300 pb-12 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: dentalColors.primary }}>
                  Especialidades
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Todo lo que tu sonrisa necesita.
                </h2>
              </div>
              <p className="max-w-lg text-base leading-7 text-slate-600 lg:col-span-5 lg:justify-self-end">
                Profesionales formados y aparatología moderna para cuidar la salud, la función y la estética en cada etapa de la vida.
              </p>
            </div>

            <figure className="relative mt-12 h-[300px] overflow-hidden sm:h-[420px]">
              <img
                src="/assets/odaf-specialties-care.jpg"
                alt="Atención odontológica integral en ODAF"
                className="h-full w-full object-cover object-center"
              />
              <figcaption className="absolute bottom-0 left-0 max-w-sm bg-white p-5 text-sm font-semibold leading-6 text-slate-900 sm:p-6">
                Un mismo centro, distintas especialidades trabajando sobre un plan común.
              </figcaption>
            </figure>

            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3">
              {specialties.map((specialty, index) => {
                const Icon = specialty.icon

                return (
                  <article
                    key={specialty.title}
                    className={`group relative min-h-[330px] border-b border-slate-200 px-0 py-10 transition-all duration-300 hover:bg-slate-50 md:px-8 ${index % 2 === 0 ? 'md:border-r' : ''} ${index % 3 !== 2 ? 'lg:border-r' : 'lg:border-r-0'} ${index === 2 ? 'md:border-r lg:border-r-0' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold tracking-[0.18em] text-slate-400">0{index + 1}</span>
                      <Icon className="h-7 w-7 transition-transform duration-300 group-hover:-translate-y-1" style={{ color: dentalColors.primary }} strokeWidth={1.6} />
                    </div>
                    <h3 className="mt-16 max-w-xs text-2xl font-semibold tracking-[-0.035em] text-slate-950">{specialty.title}</h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{specialty.description}</p>
                    <button
                      type="button"
                      onClick={() => scrollToSection('reserva-turno')}
                      className="group/link mt-6 inline-flex items-center gap-2 text-xs font-bold transition-all duration-200 hover:opacity-70"
                      style={{ color: dentalColors.primary }}
                    >
                      Solicitar consulta
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Tecnología 3D */}
        <section id="tecnologia" className="scroll-mt-24 text-white" style={{ backgroundColor: dentalColors.primaryDark }}>
          <div className="mx-auto grid max-w-[1400px] lg:grid-cols-2">
            <div className="relative min-h-[500px] overflow-hidden lg:min-h-[760px]">
              <img
                src="/assets/odaf-digital-scanner.jpg"
                alt="Escaneo intraoral digital con visualización tridimensional"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute bottom-0 right-0 max-w-[310px] bg-white p-6 text-slate-950 sm:p-8">
                <Microscope className="h-7 w-7" style={{ color: dentalColors.primary }} />
                <p className="mt-6 text-lg font-semibold leading-6">Impresión óptica tridimensional en tiempo real</p>
              </div>
            </div>

            <div className="flex items-center px-5 py-20 sm:px-10 lg:px-16 lg:py-24 xl:px-20">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Odontología digital 3D</p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                  Más precisión. Cero moldes incómodos.
                </h2>
                <p className="mt-6 text-base leading-7 text-white/70">
                  El escáner intraoral captura una imagen tridimensional de tu boca en minutos. Así podemos diagnosticar, planificar y mostrarte el tratamiento con mayor claridad.
                </p>

                <div className="mt-10 border-t border-white/20">
                  {technologyBenefits.map((benefit, index) => (
                    <div key={benefit.title} className="grid grid-cols-[42px_1fr] gap-3 border-b border-white/20 py-6">
                      <span className="pt-1 text-xs font-bold text-white/45">0{index + 1}</span>
                      <div>
                        <h3 className="text-base font-bold text-white">{benefit.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/60">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollToSection('reserva-turno')}
                  className="group mt-9 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ color: dentalColors.primaryDark }}
                >
                  Consultar por odontología digital
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Coberturas y pagos */}
        <section id="coberturas" className="scroll-mt-24 bg-slate-50 py-24 sm:py-28">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
            <div className="grid overflow-hidden border border-slate-200 bg-white lg:grid-cols-12">
              <div className="p-8 text-white sm:p-12 lg:col-span-5 lg:p-14" style={{ backgroundColor: dentalColors.primary }}>
                <HeartHandshake className="h-9 w-9" strokeWidth={1.6} />
                <h2 className="mt-12 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                  Distintas coberturas, la misma calidad de atención.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
                  Atendemos pacientes particulares, obras sociales y prepagas. Te ayudamos con presupuestos y documentación para reintegros.
                </p>
                <div className="mt-10 divide-y divide-white/20 border-y border-white/20">
                  {['Pacientes particulares', 'Obras sociales', 'Medicina prepaga'].map((item) => (
                    <div key={item} className="flex items-center justify-between py-4 text-sm font-semibold">
                      {item}
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7">
                <img
                  src="/assets/odaf-coverage-consultation.jpg"
                  alt="Asesoramiento claro sobre tratamientos, coberturas y formas de pago"
                  className="h-64 w-full object-cover object-center sm:h-72"
                />
                <div className="p-8 sm:p-12 lg:p-14">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: dentalColors.primary }}>
                        Medios de pago
                      </p>
                      <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Elegí la opción más cómoda.</h3>
                    </div>
                    <WalletCards className="hidden h-9 w-9 text-slate-300 sm:block" strokeWidth={1.5} />
                  </div>

                  <div className="mt-10 grid sm:grid-cols-2">
                    {[
                      { title: 'Mercado Pago', detail: 'Pago digital' },
                      { title: 'Efectivo', detail: 'En consultorio' },
                      { title: 'Transferencia', detail: 'Transferencia bancaria' },
                      { title: 'Débito / crédito', detail: 'Tarjetas bancarias' },
                    ].map((method, index) => (
                      <div
                        key={method.title}
                        className={`border-slate-200 py-6 sm:px-6 ${index < 2 ? 'border-b' : ''} ${index % 2 === 0 ? 'sm:border-r sm:pl-0' : ''} ${index % 2 === 1 ? 'sm:pr-0' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5" style={{ color: dentalColors.primary }} strokeWidth={1.8} />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{method.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{method.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-9 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
                    Consultanos por las alternativas disponibles para tu tratamiento al momento de solicitar el turno.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reserva de turnos */}
        <section id="reserva-turno" className="scroll-mt-24 bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: dentalColors.primary }}>
                  Agenda online
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Tu próximo turno empieza acá.
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="max-w-lg text-base leading-7 text-slate-600 lg:ml-auto">
                  Elegí el servicio, el profesional y el horario que mejor se adapte a vos. La disponibilidad se actualiza en tiempo real.
                </p>
              </div>
            </div>

            <div className="mt-12 border border-slate-200 bg-slate-50 p-3 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.28)] sm:p-6 lg:p-8">
              <div className="border border-slate-200 bg-white p-2 sm:p-5">
                <BookingForm />
              </div>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="scroll-mt-24 border-t border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-[1400px] lg:grid-cols-12">
            <div className="px-5 py-20 sm:px-8 lg:col-span-5 lg:px-10 lg:py-24 xl:pr-20">
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: dentalColors.primary }}>
                Estamos cerca
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Vení a conocernos en Lanús Oeste.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-6 text-slate-600">
                Encontrá atención integral, tecnología y un equipo que te acompaña en 2 de Mayo 2930.
              </p>

              <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
                <div className="flex gap-4 py-5">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: dentalColors.primary }} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dirección</h3>
                    <p className="mt-1 text-sm text-slate-600">2 de Mayo 2930, (1824) Lanús Oeste</p>
                  </div>
                </div>
                <div className="flex gap-4 py-5">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: dentalColors.primary }} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Horarios de atención</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Lun, Mar, Jue y Vie: 9:00 a 12:30 y 14:00 a 18:30</p>
                    <p className="text-xs leading-5 text-slate-600">Miércoles: 9:00 a 12:30 y 14:00 a 16:00</p>
                  </div>
                </div>
                <div className="flex gap-4 py-5">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: dentalColors.primary }} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Teléfono y WhatsApp</h3>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      <a href="tel:01177115716" className="font-semibold transition-all duration-200 hover:opacity-70" style={{ color: dentalColors.primary }}>
                        (011) 7711-5716
                      </a>
                      <a href="https://wa.me/5491140483693" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 transition-all duration-200 hover:opacity-70">
                        11 4048-3693
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 py-5">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0" style={{ color: dentalColors.primary }} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Correo electrónico</h3>
                    <a href="mailto:odafodonto@gmail.com" className="mt-1 block text-sm text-slate-600 transition-all duration-200 hover:opacity-70">
                      odafodonto@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[500px] lg:col-span-7 lg:min-h-[760px]">
              <iframe
                title="Mapa ubicación ODAF Odontología"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3279.796443423719!2d-58.39424352352223!3d-34.70837026450633!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccce5e4f55555%3A0x6b6e4e5e4e5e4e5e!2s2%20de%20Mayo%202930%2C%20B1824%20Lan%C3%BAs%20Oeste%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar"
                width="100%"
                height="100%"
                className="absolute inset-0 h-full min-h-[500px] w-full border-0 lg:min-h-[760px]"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href="https://www.google.com/maps/search/?api=1&query=2+de+Mayo+2930+Lanus+Oeste"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-5 left-5 flex items-center gap-3 bg-white px-5 py-4 text-xs font-bold text-slate-900 shadow-xl transition-all duration-200 hover:-translate-y-0.5 sm:bottom-8 sm:left-8"
              >
                <MapPin className="h-4 w-4" style={{ color: dentalColors.primary }} />
                Cómo llegar
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Acceso rápido a WhatsApp */}
      <a
        href="https://wa.me/5491140483693?text=Hola%20ODAF%20Odontolog%C3%ADa,%20quisiera%20consultar%20por%20un%20turno"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-0 rounded-full bg-emerald-600 p-4 text-white shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:gap-2 hover:bg-emerald-700 sm:bottom-7 sm:right-7"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100">
          Escribinos
        </span>
      </a>

      <footer className="bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="inline-flex bg-white p-2.5">
                <img
                  src="/assets/odaf-logo.png"
                  alt="ODAF Odontología"
                  className="h-12 w-auto"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
                Consultorios odontológicos en Lanús Oeste. Experiencia, tecnología digital y atención humana para toda la familia.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a
                  href="https://www.instagram.com/odaf_odontologia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Seguir a ODAF en Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-slate-950"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/estetic.lanus"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Seguir a ODAF en Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-slate-950"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <span className="ml-1 text-xs font-semibold text-slate-500">Seguinos en redes</span>
              </div>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Navegación</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => scrollToSection(item.id)} className="transition-all duration-200 hover:text-white">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Accesos</h3>
              <ul className="mt-5 space-y-3 text-sm">
                <li><a href="/paciente" className="transition-all duration-200 hover:text-white">Portal de pacientes</a></li>
                <li><a href="tel:01177115716" className="transition-all duration-200 hover:text-white">(011) 7711-5716</a></li>
                <li><a href="mailto:odafodonto@gmail.com" className="transition-all duration-200 hover:text-white">odafodonto@gmail.com</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-7 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p>© {new Date().getFullYear()} ODAF Consultorios Odontológicos. Todos los derechos reservados.</p>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Información legal">
              <a href="/politica-de-privacidad" className="transition-all duration-200 hover:text-white">Política de privacidad</a>
              <a href="/terminos-de-uso" className="transition-all duration-200 hover:text-white">Términos de uso</a>
            </nav>
            <p>2 de Mayo 2930 · Lanús Oeste · Buenos Aires</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
