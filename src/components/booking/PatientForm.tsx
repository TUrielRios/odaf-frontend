"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"
import type { CrearPacienteData, ObraSocial } from "../../types"
import { obrasSocialesApi } from "../../api/obras-sociales"
import { pacientesApi } from "../../api"
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Ban
} from "lucide-react"

interface PatientFormProps {
  onPatientData: (data: CrearPacienteData) => void
  loading?: boolean
  submitButtonText?: string
  isAdmin?: boolean
}

type ViewMode = "select" | "dni-search" | "patient-found" | "register"

export const PatientForm: React.FC<PatientFormProps> = ({
  onPatientData,
  loading = false,
  submitButtonText = "Siguiente Paso",
  isAdmin = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("select")
  const [searchDni, setSearchDni] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [foundPatientName, setFoundPatientName] = useState("")
  const [foundPatientEsPami, setFoundPatientEsPami] = useState(false)

  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [formData, setFormData] = useState<CrearPacienteData>({
    apellido: "",
    nombre: "",
    tipo_documento: "DNI",
    numero_documento: "",
    fecha_nacimiento: "",
    sexo: "Masculino",
    telefono: "",
    email: "",
    direccion: "",
    obra_social_id: undefined,
    numero_afiliado: "",
    contacto_emergencia: "",
    telefono_emergencia: "",
    observaciones: "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CrearPacienteData, string>>>({})

  useEffect(() => {
    const fetchObrasSociales = async () => {
      try {
        const data = await obrasSocialesApi.listar()
        setObrasSociales(data)
      } catch (error) {
        console.error("Error fetching obras sociales:", error)
      }
    }
    fetchObrasSociales()
    
    // Load cached patient data
    const cached = localStorage.getItem("odaf_patient_data")
    if (cached) {
      try {
        const parsedData = JSON.parse(cached)
        // No cargamos las observaciones anteriores
        setFormData(prev => ({ ...prev, ...parsedData, observaciones: "" }))
      } catch (e) {
        console.error("Error loading cached patient data:", e)
      }
    }
  }, [])

  // Save to cache whenever formData changes (except observaciones)
  useEffect(() => {
    const dataToCache = { ...formData }
    delete dataToCache.observaciones
    localStorage.setItem("odaf_patient_data", JSON.stringify(dataToCache))
  }, [formData])

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CrearPacienteData, string>> = {}
    if (!formData.nombre.trim()) newErrors.nombre = "Requerido"
    if (!formData.apellido.trim()) newErrors.apellido = "Requerido"
    if (!formData.numero_documento.trim()) newErrors.numero_documento = "Requerido"
    
    if (formData.email?.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) onPatientData(formData)
  }

  const handleChange = (field: keyof CrearPacienteData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleDniSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchDni.trim()) {
      setSearchError("Por favor, ingresa tu número de documento.")
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    try {
      const patient = await pacientesApi.buscarPorDocumento(searchDni.trim())
      if (patient) {
        setFormData({
          apellido: patient.apellido || "",
          nombre: patient.nombre || "",
          tipo_documento: (patient.tipo_documento as "DNI" | "Pasaporte" | "Cédula") || "DNI",
          numero_documento: patient.numero_documento || searchDni.trim(),
          fecha_nacimiento: patient.fecha_nacimiento || "",
          sexo: (patient.sexo as "Masculino" | "Femenino" | "Otro") || "Masculino",
          telefono: patient.telefono || "",
          email: patient.email || "",
          direccion: patient.direccion || "",
          obra_social_id: patient.obra_social_id || undefined,
          numero_afiliado: patient.numero_afiliado || "",
          contacto_emergencia: patient.contacto_emergencia || "",
          telefono_emergencia: patient.telefono_emergencia || "",
          observaciones: "",
        })
        setFoundPatientName(`${patient.nombre} ${patient.apellido}`)
        const obraSocialNombre = obrasSociales.find(os => os.id === patient.obra_social_id)?.nombre || ""
        setFoundPatientEsPami(obraSocialNombre.toLowerCase().includes("pami"))
        setViewMode("patient-found")
      } else {
        setSearchError("No encontramos un paciente registrado con ese DNI. Si es tu primera consulta en ODAF, por favor selecciona la opción 'Primera vez que voy'.")
      }
    } catch (error) {
      console.error("Error searching patient:", error)
      setSearchError("Ocurrió un error al buscar tus datos. Por favor, intenta de nuevo o completa el registro manual.")
    } finally {
      setSearchLoading(false)
    }
  }

  if (viewMode === "select") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto py-6">
        <div className="text-center space-y-2 mb-6">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Paso 4 de 5</p>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">¿Ya te atendiste anteriormente?</h3>
          <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
            Ayúdanos a identificar si ya contamos con tu ficha médica para procesar tu turno en segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Ya soy paciente */}
          <button
            type="button"
            onClick={() => {
              setSearchDni("")
              setSearchError(null)
              setViewMode("dni-search")
            }}
            className="bg-white p-8 sm:p-10 rounded-[2.5rem] border-2 border-gray-100 hover:border-[#026498]/30 hover:shadow-xl hover:shadow-blue-900/5 transition-all text-left flex flex-col items-start gap-6 group hover:scale-[1.01] duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50/50 text-[#026498] flex items-center justify-center group-hover:bg-[#026498] group-hover:text-white transition-all duration-300 shadow-sm">
              <UserCheck size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-gray-900 group-hover:text-[#026498] transition-colors">Ya soy paciente</h4>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                Si ya te atendiste en ODAF, ingresa tu DNI para recuperar tus datos de forma inmediata y reservar al instante.
              </p>
            </div>
          </button>

          {/* Card 2: Primera vez */}
          <button
            type="button"
            onClick={() => {
              setFormData({
                apellido: "",
                nombre: "",
                tipo_documento: "DNI",
                numero_documento: "",
                fecha_nacimiento: "",
                sexo: "Masculino",
                telefono: "",
                email: "",
                direccion: "",
                obra_social_id: undefined,
                numero_afiliado: "",
                contacto_emergencia: "",
                telefono_emergencia: "",
                observaciones: "",
              })
              setViewMode("register")
            }}
            className="bg-white p-8 sm:p-10 rounded-[2.5rem] border-2 border-gray-100 hover:border-[#026498]/30 hover:shadow-xl hover:shadow-blue-900/5 transition-all text-left flex flex-col items-start gap-6 group hover:scale-[1.01] duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50/50 text-[#026498] flex items-center justify-center group-hover:bg-[#026498] group-hover:text-white transition-all duration-300 shadow-sm">
              <UserPlus size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-gray-900 group-hover:text-[#026498] transition-colors">Primera vez que voy</h4>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                Si es tu primera consulta en nuestro centro, completa un sencillo formulario de registro para crear tu ficha.
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (viewMode === "dni-search") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-xl mx-auto py-6">
        <button
          type="button"
          onClick={() => setViewMode("select")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#026498] font-black text-[10px] uppercase tracking-widest transition-all mb-8 group"
        >
          <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <ArrowLeft size={12} strokeWidth={3} />
          </div>
          Volver a selección
        </button>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <UserCheck className="text-[#026498]" size={24} />
              Cargar mis datos
            </h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Ingresa tu tipo y número de documento registrado para buscar tu ficha médica.
            </p>
          </div>

          <form onSubmit={handleDniSearch} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Select
                  label="Tipo"
                  value={formData.tipo_documento}
                  onChange={(e) => handleChange("tipo_documento", e.target.value)}
                  options={[
                    { value: "DNI", label: "DNI" },
                    { value: "Pasaporte", label: "Pasaporte" },
                    { value: "Cédula", label: "Cédula" },
                  ]}
                  className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Número de Documento"
                  value={searchDni}
                  onChange={(e) => {
                    setSearchDni(e.target.value)
                    if (searchError) setSearchError(null)
                  }}
                  placeholder="Ej. 12345678"
                  className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
                  autoFocus
                />
              </div>
            </div>

            {searchError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100/50 text-xs sm:text-sm font-medium animate-in fade-in duration-300">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                <span>{searchError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={searchLoading || !searchDni.trim()}
              className="w-full h-14 sm:h-16 bg-[#026498] text-white font-black rounded-2xl text-base shadow-xl shadow-blue-900/10 hover:bg-[#0c4a6e] transition-all transform hover:-translate-y-0.5 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {searchLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Buscando...</span>
                </>
              ) : (
                <span>Buscar mis datos</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-50 text-center">
            <button
              type="button"
              onClick={() => setViewMode("register")}
              className="text-xs text-gray-400 hover:text-[#026498] font-bold transition-all"
            >
              ¿No eres paciente? Registrarte como primera vez
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === "patient-found") {
    const matchedObraSocialName = obrasSociales.find(os => os.id === formData.obra_social_id)?.nombre || "Particular"

    if (foundPatientEsPami && !isAdmin) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-xl mx-auto py-6">
          <button
            type="button"
            onClick={() => setViewMode("dni-search")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#026498] font-black text-[10px] uppercase tracking-widest transition-all mb-8 group"
          >
            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <ArrowLeft size={12} strokeWidth={3} />
            </div>
            Volver
          </button>

          <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-amber-500/10 shadow-xl shadow-amber-900/5 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm">
                <Ban size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl sm:text-2xl font-black text-gray-900">Turno gestionado por la clínica</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hola <strong className="capitalize">{foundPatientName}</strong>, los turnos para pacientes con <strong>PAMI</strong> son coordinados directamente por nuestro equipo administrativo.
                </p>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-6 space-y-2 text-center">
              <p className="text-sm font-bold text-gray-700">Para solicitar tu turno, comunicate con nosotros:</p>
              <p className="text-lg font-black text-[#026498]">
                (011) 4958-0285
              </p>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Nuestro equipo te asignará el turno en el horario que mejor te convenga.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-xl mx-auto py-6">
        <button
          type="button"
          onClick={() => setViewMode("dni-search")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#026498] font-black text-[10px] uppercase tracking-widest transition-all mb-8 group"
        >
          <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <ArrowLeft size={12} strokeWidth={3} />
          </div>
          Buscar otro documento
        </button>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-emerald-500/10 shadow-xl shadow-green-900/5 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-gray-50">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <span className="text-emerald-600 font-black text-xs uppercase tracking-widest block mb-1">¡Paciente Encontrado!</span>
              <h4 className="text-xl sm:text-2xl font-black text-gray-900 capitalize">{foundPatientName}</h4>
            </div>
          </div>

          <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-50 text-left">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Documento</p>
                <p className="text-sm font-black text-gray-900">{formData.tipo_documento}: {formData.numero_documento}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Obra Social</p>
                <p className="text-sm font-black text-gray-900 capitalize">{matchedObraSocialName}</p>
              </div>
              {formData.email && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Correo Electrónico</p>
                  <p className="text-sm font-black text-gray-900 truncate">{formData.email}</p>
                </div>
              )}
              {formData.telefono && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Teléfono</p>
                  <p className="text-sm font-black text-gray-900">{formData.telefono}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <button
              onClick={() => onPatientData(formData)}
              disabled={loading}
              className="w-full h-16 bg-[#026498] text-white font-black rounded-2xl text-lg shadow-xl shadow-blue-900/10 hover:bg-[#0c4a6e] transition-all transform hover:-translate-y-1 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? "Cargando..." : "Confirmar y Continuar"}
            </button>

            <button
              onClick={() => setViewMode("register")}
              type="button"
              className="w-full h-14 bg-gray-50 hover:bg-gray-100 text-[#026498] font-bold rounded-2xl text-xs uppercase tracking-widest transition-all border border-gray-100 flex items-center justify-center"
            >
              Editar mis datos / Cobertura
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <button
        type="button"
        onClick={() => setViewMode("select")}
        className="flex items-center gap-2 text-gray-400 hover:text-[#026498] font-black text-[10px] uppercase tracking-widest transition-all group"
      >
        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          <ArrowLeft size={12} strokeWidth={3} />
        </div>
        Volver a selección
      </button>

      <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
        {/* Sección 1: Información Personal */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6 sm:space-y-8">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-3">
             <User className="text-[#026498]" size={20} />
             Información Personal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              label="Apellido *"
              value={formData.apellido}
              onChange={(e) => handleChange("apellido", e.target.value)}
              error={errors.apellido}
              placeholder="Tu apellido"
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              error={errors.nombre}
              placeholder="Tu nombre"
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select
              label="Tipo de Documento *"
              value={formData.tipo_documento}
              onChange={(e) => handleChange("tipo_documento", e.target.value)}
              options={[
                { value: "DNI", label: "DNI" },
                { value: "Pasaporte", label: "Pasaporte" },
                { value: "Cédula", label: "Cédula" },
              ]}
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
            <Input
              label="Número de Documento *"
              value={formData.numero_documento}
              onChange={(e) => handleChange("numero_documento", e.target.value)}
              error={errors.numero_documento}
              placeholder="12345678"
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              label="Fecha de Nacimiento"
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
              error={errors.fecha_nacimiento}
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
            <Select
              label="Sexo"
              value={formData.sexo || "Masculino"}
              onChange={(e) => handleChange("sexo", e.target.value)}
              options={[
                { value: "Masculino", label: "Masculino" },
                { value: "Femenino", label: "Femenino" },
                { value: "Otro", label: "Otro" },
              ]}
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <Mail className="absolute right-4 top-[3.2rem] text-gray-300" size={18} />
              <Input
                label="E-mail"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
                placeholder="ejemplo@mail.com"
                className="rounded-xl border-gray-100 bg-gray-50/30 h-12 pr-12"
              />
            </div>
            <div className="relative">
              <Phone className="absolute right-4 top-[3.2rem] text-gray-300" size={18} />
              <Input
                label="Teléfono"
                type="tel"
                value={formData.telefono || ""}
                onChange={(e) => handleChange("telefono", e.target.value)}
                error={errors.telefono}
                placeholder="11 1234 5678"
                className="rounded-xl border-gray-100 bg-gray-50/30 h-12 pr-12"
              />
            </div>
          </div>

          <div className="relative">
            <MapPin className="absolute right-4 top-[3.2rem] text-gray-300" size={18} />
            <Input
              label="Dirección"
              value={formData.direccion || ""}
              onChange={(e) => handleChange("direccion", e.target.value)}
              placeholder="Calle 123, Ciudad"
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12 pr-12"
            />
          </div>
        </div>

        {/* Sección 2: Cobertura Médica */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6 sm:space-y-8">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-3">
             <Shield className="text-[#026498]" size={20} />
             Cobertura Médica
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select
              label="Obra Social"
              value={formData.obra_social_id?.toString() || ""}
              onChange={(e) => handleChange("obra_social_id", e.target.value ? Number(e.target.value) : undefined)}
              options={[
                { value: "", label: "Seleccione una opción" },
                ...obrasSociales
                  .filter((os) => isAdmin || !os.nombre.toLowerCase().includes("pami"))
                  .map((os) => ({ value: os.id.toString(), label: os.nombre }))
              ]}
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
            <Input
              label="Número de Afiliado"
              value={formData.numero_afiliado || ""}
              onChange={(e) => handleChange("numero_afiliado", e.target.value)}
              placeholder="0000000000"
              className="rounded-xl border-gray-100 bg-gray-50/30 h-12"
            />
          </div>
         </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-16 sm:h-20 bg-[#026498] text-white font-black rounded-2xl sm:rounded-[1.5rem] text-lg sm:text-xl shadow-xl shadow-blue-900/10 hover:bg-[#0c4a6e] transition-all transform hover:-translate-y-1 uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? "Cargando..." : submitButtonText}
        </button>
      </form>
    </div>
  )
}
