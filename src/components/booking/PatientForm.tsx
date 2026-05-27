"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"
import type { CrearPacienteData, ObraSocial } from "../../types"
import { obrasSocialesApi } from "../../api/obras-sociales"
import { User, Heart, Shield, Phone, Mail, MapPin, FileText } from "lucide-react"

interface PatientFormProps {
  onPatientData: (data: CrearPacienteData) => void
  loading?: boolean
  submitButtonText?: string
}

export const PatientForm: React.FC<PatientFormProps> = ({ 
  onPatientData, 
  loading = false,
  submitButtonText = "Siguiente Paso"
}) => {
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                ...obrasSociales.map((os) => ({ value: os.id.toString(), label: os.nombre }))
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
