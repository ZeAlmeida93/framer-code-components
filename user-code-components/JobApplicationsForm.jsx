import React, { useState, useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * JobApplications-Form - Framer Code Component (React / JSX)
 * 
 * Componente Modal / Pop-up de Candidatura ligado à API do Strapi v4/v5.
 * Suporta upload de CV (PDF/DOCX) via multipart FormData, carregamento dinâmico
 * de vagas ativas da Impetus, validação em tempo real e estados visuais completos.
 */

// Lista de habilitações académicas predefinidas
const HABILITACOES_OPTIONS = [
    "Ensino Básico (9º ano)",
    "Ensino Secundário (12º ano)",
    "Curso Técnico / Profissional",
    "CTeSP (Técnico Superior Profissional)",
    "Licenciatura",
    "Pós-Graduação",
    "Mestrado",
    "Doutoramento",
    "Outra Qualificação",
]

// Vagas de fallback caso o Strapi esteja inacessível ou em fase de testes
const FALLBACK_VAGAS = [
    { id: 1, title: "PROJECT MANAGER (M/F) | Barqueiros" },
    { id: 2, title: "3D DESIGNER (M/F) | Barqueiros" },
    { id: 3, title: "COMMERCIAL DIRECTOR (M/F) | Barqueiros" },
    { id: 4, title: "MAINTENANCE MANAGER (M/F) | Acatel" },
    { id: 5, title: "CIRCULAR KNITTING OPERATOR (M/F) | Barqueiros" },
    { id: 6, title: "SEAMLESS KNITTING OPERATOR (M/F) | Barqueiros" },
]

// Normalizador de dados de vagas (compatível com Strapi v4, v5 ou APIs flat)
const parseStrapiVagas = (responseData) => {
    if (!responseData) return []
    const rawList = Array.isArray(responseData.data)
        ? responseData.data
        : Array.isArray(responseData)
        ? responseData
        : []

    return rawList
        .map((item, idx) => {
            if (!item) return null
            const attrs = item.attributes ? item.attributes : item
            const id = item.id ?? attrs.id ?? idx + 1
            const title =
                attrs.title ||
                attrs.Title ||
                attrs.titulo ||
                attrs.Titulo ||
                attrs.name ||
                attrs.Name ||
                attrs.cargo ||
                attrs.Cargo ||
                attrs.job_title ||
                `Vaga #${id}`

            return { id, title }
        })
        .filter(Boolean)
}

// Formatação amigável do tamanho do ficheiro
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Sanitização inteligente e defensiva do URL base do Strapi
export const sanitizeStrapiUrl = (url) => {
    let clean = (url || "").trim()
    if (!clean) return "https://hr.impetusgroup.pt"

    // Correção se o utilizador escreveu apenas o host sem .pt
    if (clean === "hr.impetusgroup" || clean === "https://hr.impetusgroup" || clean === "http://hr.impetusgroup") {
        clean = "https://hr.impetusgroup.pt"
    }

    // Garantir protocolo https:// se não tiver
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        clean = "https://" + clean
    }

    // Remover barra no final
    clean = clean.replace(/\/+$/, "")

    // Remover sufixos como /api, /api/jobs, /api/vagas ou /api/candidaturas caso tenham sido colados
    clean = clean.replace(/\/api(\/(jobs|vagas|candidaturas))?\/?$/, "")

    return clean
}

export default function JobApplicationsForm({
    strapiUrl = "https://hr.impetusgroup.pt",
    apiToken = "",
    buttonText = "Candidatar-me",
    previewOpen = false,
    modalTitle = "Candidatura de Emprego",
    modalSubtitle = "Junte-se à equipa do Grupo Impetus. Preencha os seus dados e anexe o seu CV.",
    submitButtonText = "Submeter Candidatura",
    privacyPolicyUrl = "https://www.impetusgroup.pt/politica-de-privacidade",
    primaryColor = "#000000",
    buttonTextColor = "#ffffff",
    borderRadius = 16,
    fontFamilyChoice = "inherit",
    style,
}) {
    const [uniqueId] = useState(() => "jaf_" + Math.random().toString(36).substring(2, 9))
    const [isOpen, setIsOpen] = useState(false)
    const [vagas, setVagas] = useState([])
    const [isLoadingVagas, setIsLoadingVagas] = useState(false)
    const [vagasLoadError, setVagasLoadError] = useState(null)

    // Estado do formulário
    const initialFormState = {
        Nome: "",
        Email: "",
        Telefone: "",
        Morada: "",
        Morada2: "",
        CodigoPostal: "",
        HabilitacoesAcademicas: "",
        vagas: "",
        Obs: "",
        consentimentoRGPD: false,
    }

    const [formState, setFormState] = useState(initialFormState)
    const [cvFile, setCvFile] = useState(null)
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [validationSummary, setValidationSummary] = useState(null)
    const [isDragging, setIsDragging] = useState(false)

    const fileInputRef = useRef(null)
    const modalContentRef = useRef(null)
    const modalBodyRef = useRef(null)

    // Se previewOpen estiver ativo no Framer Canvas, mantém o modal visível para edição
    const isModalActive = isOpen || previewOpen

    // Carregar lista de vagas ativas do Strapi ao montar
    useEffect(() => {
        let isMounted = true
        const fetchVagas = async () => {
            setIsLoadingVagas(true)
            setVagasLoadError(null)

            try {
                const cleanBaseUrl = sanitizeStrapiUrl(strapiUrl)
                const endpoint = `${cleanBaseUrl}/api/vagas?populate=*`

                const headers = {
                    Accept: "application/json",
                }
                if (apiToken && apiToken.trim() !== "") {
                    headers["Authorization"] = `Bearer ${apiToken.trim()}`
                }

                const res = await fetch(endpoint, { headers })
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }

                const json = await res.json()
                const parsed = parseStrapiVagas(json)

                if (isMounted) {
                    if (parsed.length > 0) {
                        setVagas(parsed)
                    } else {
                        setVagas(FALLBACK_VAGAS)
                    }
                }
            } catch (err) {
                console.warn("[JobApplications-Form] Erro ao carregar vagas da API:", err)
                if (isMounted) {
                    setVagasLoadError("Não foi possível carregar as vagas em tempo real.")
                    setVagas(FALLBACK_VAGAS)
                }
            } finally {
                if (isMounted) {
                    setIsLoadingVagas(false)
                }
            }
        }

        fetchVagas()
        return () => {
            isMounted = false
        }
    }, [strapiUrl, apiToken])

    // Bloquear scroll do body quando o modal está aberto e lidar com tecla ESC
    useEffect(() => {
        if (!isModalActive) return

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleCloseModal()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isModalActive])

    const handleOpenModal = () => {
        setIsOpen(true)
        setSubmitSuccess(false)
        setSubmitError(null)
        setValidationSummary(null)
    }

    const handleCloseModal = () => {
        setIsOpen(false)
    }

    const handleResetForm = () => {
        setFormState(initialFormState)
        setCvFile(null)
        setErrors({})
        setSubmitSuccess(false)
        setSubmitError(null)
        setValidationSummary(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Validação de ficheiro CV (PDF ou DOCX até 10 MB)
    const validateAndSetFile = (file) => {
        if (!file) return

        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        const validExtensions = [".pdf", ".doc", ".docx"]
        const fileNameLower = file.name.toLowerCase()
        const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext))

        if (!validTypes.includes(file.type) && !hasValidExt) {
            setErrors((prev) => ({
                ...prev,
                CV: "Formato inválido. Por favor anexe um ficheiro PDF ou DOCX.",
            }))
            return
        }

        const maxSize = 10 * 1024 * 1024 // 10 MB
        if (file.size > maxSize) {
            setErrors((prev) => ({
                ...prev,
                CV: "O ficheiro excede o tamanho máximo de 10 MB.",
            }))
            return
        }

        setCvFile(file)
        setErrors((prev) => ({ ...prev, CV: undefined }))
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        validateAndSetFile(file)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        validateAndSetFile(file)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleRemoveFile = () => {
        setCvFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        const isCheckbox = type === "checkbox"

        setFormState((prev) => ({
            ...prev,
            [name]: isCheckbox ? checked : value,
        }))

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    // Validação de todos os campos antes da submissão com feedback imediato
    const validateForm = () => {
        const newErrors = {}
        const missingFields = []

        if (!formState.Nome.trim()) {
            newErrors.Nome = "O Nome completo é obrigatório."
            missingFields.push("Nome Completo")
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formState.Email.trim()) {
            newErrors.Email = "O Email é obrigatório."
            missingFields.push("Email")
        } else if (!emailRegex.test(formState.Email.trim())) {
            newErrors.Email = "Por favor insira um endereço de email válido."
            missingFields.push("Email com formato válido")
        }

        if (!cvFile) {
            newErrors.CV = "O anexo do Curriculum Vitae (CV) é obrigatório."
            missingFields.push("Anexo do CV (PDF ou DOCX)")
        }

        if (!formState.consentimentoRGPD) {
            newErrors.consentimentoRGPD =
                "É obrigatório aceitar o tratamento de dados segundo a política de privacidade da Impetus."
            missingFields.push("Consentimento RGPD")
        }

        setErrors(newErrors)

        if (missingFields.length > 0) {
            const summaryMsg = `Por favor preencha os campos obrigatórios em falta: ${missingFields.join(", ")}.`
            setValidationSummary(summaryMsg)
            console.warn("[JobApplications-Form] Validação local falhou:", newErrors)

            setTimeout(() => {
                if (modalBodyRef.current) {
                    const firstErrorEl = modalBodyRef.current.querySelector(
                        ".has-error, .jaf-dropzone.has-error, .jaf-rgpd-container"
                    )
                    if (firstErrorEl) {
                        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                }
            }, 50)

            return false
        }

        setValidationSummary(null)
        return true
    }

    // Submissão do formulário para o Strapi v4/v5 em 2 passos (upload do ficheiro seguido de criação da candidatura)
    // Este método resolve o bloqueio de CORS gerado pelo Microsoft-IIS em pedidos multipart em endpoints de coleção
    const handleSubmit = async (e) => {
        if (e && typeof e.preventDefault === "function") {
            e.preventDefault()
        }

        console.log("[JobApplications-Form] Clique no botão de submissão registado.")

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        setSubmitError(null)
        setValidationSummary(null)

        try {
            const cleanBaseUrl = sanitizeStrapiUrl(strapiUrl)

            // PASSO 1: Upload do ficheiro CV para o endpoint dedicado /api/upload
            let uploadedFileId = null

            if (cvFile) {
                console.log("[JobApplications-Form] Passo 1: A carregar CV para", `${cleanBaseUrl}/api/upload`)
                const uploadFormData = new FormData()
                uploadFormData.append("files", cvFile)

                const uploadHeaders = {
                    Accept: "application/json",
                }
                if (apiToken && apiToken.trim() !== "") {
                    uploadHeaders["Authorization"] = `Bearer ${apiToken.trim()}`
                }

                const uploadRes = await fetch(`${cleanBaseUrl}/api/upload`, {
                    method: "POST",
                    headers: uploadHeaders,
                    body: uploadFormData,
                })

                if (!uploadRes.ok) {
                    let uploadErr = `Falha no upload do CV (${uploadRes.status} ${uploadRes.statusText})`
                    try {
                        const errJson = await uploadRes.json()
                        if (errJson?.error?.message) uploadErr = errJson.error.message
                    } catch (_) {}
                    throw new Error(uploadErr)
                }

                const uploadData = await uploadRes.json()
                const fileItem = Array.isArray(uploadData) ? uploadData[0] : uploadData
                uploadedFileId = fileItem?.id || fileItem?.documentId || null
                console.log("[JobApplications-Form] Passo 1 concluído com sucesso. ID do CV no Strapi:", uploadedFileId)
            }

            if (!uploadedFileId) {
                throw new Error("Não foi possível carregar o ficheiro do CV para o servidor.")
            }

            // PASSO 2: Criar a candidatura com os dados em JSON e o ID do ficheiro CV
            const candidaturasData = {
                Nome: formState.Nome.trim(),
                Email: formState.Email.trim(),
                Telefone: formState.Telefone.trim() || undefined,
                Morada: formState.Morada.trim() || undefined,
                Morada2: formState.Morada2.trim() || undefined,
                CodigoPostal: formState.CodigoPostal.trim() || undefined,
                HabilitacoesAcademicas: formState.HabilitacoesAcademicas || undefined,
                CV: uploadedFileId,
            }

            // Associar vaga e salvaguardar no campo Obs
            let finalObs = formState.Obs.trim()
            if (formState.vagas && formState.vagas !== "" && formState.vagas !== "spontaneous") {
                const numericVagaId = Number(formState.vagas)
                const vagaVal = isNaN(numericVagaId) ? formState.vagas : numericVagaId
                candidaturasData.Vagas = vagaVal

                const foundVaga = vagas.find((v) => String(v.id) === String(formState.vagas))
                const vagaLabel = foundVaga ? foundVaga.title : `Vaga #${formState.vagas}`
                finalObs = finalObs
                    ? `[Vaga Pretendida: ${vagaLabel}]\n\n${finalObs}`
                    : `[Vaga Pretendida: ${vagaLabel}]`
            } else if (formState.vagas === "spontaneous") {
                finalObs = finalObs ? `[Candidatura Espontânea]\n\n${finalObs}` : `[Candidatura Espontânea]`
            }

            if (finalObs) {
                candidaturasData.Obs = finalObs
            }

            const candidaturasEndpoint = `${cleanBaseUrl}/api/candidaturas`
            console.log("[JobApplications-Form] Passo 2: A registar candidatura em", candidaturasEndpoint, candidaturasData)

            const candidaturasHeaders = {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
            if (apiToken && apiToken.trim() !== "") {
                candidaturasHeaders["Authorization"] = `Bearer ${apiToken.trim()}`
            }

            let response = await fetch(candidaturasEndpoint, {
                method: "POST",
                headers: candidaturasHeaders,
                body: JSON.stringify({ data: candidaturasData }),
            })

            // Se o schema do Strapi não aceitar a chave 'Vagas', tentar novamente sem ela (o dado já está gravado em Obs)
            if (!response.ok && candidaturasData.Vagas) {
                let isInvalidKey = false
                try {
                    const clone = response.clone()
                    const errData = await clone.json()
                    if (
                        errData?.error?.message?.includes("Invalid key") ||
                        errData?.error?.name === "ValidationError"
                    ) {
                        isInvalidKey = true
                    }
                } catch (_) {}

                if (isInvalidKey) {
                    console.warn("[JobApplications-Form] A tentar envio sem campo Vagas no objeto JSON...")
                    delete candidaturasData.Vagas
                    response = await fetch(candidaturasEndpoint, {
                        method: "POST",
                        headers: candidaturasHeaders,
                        body: JSON.stringify({ data: candidaturasData }),
                    })
                }
            }

            console.log("[JobApplications-Form] Resposta HTTP recebida:", response.status, response.statusText)

            if (!response.ok) {
                let errorDetails = `Erro HTTP ${response.status} (${response.statusText})`

                if (response.status === 403) {
                    errorDetails =
                        "Permissão Negada (403 Forbidden). Verifique nas definições do Strapi se este API Token tem permissões ativas para 'Candidatura (create)' e para o plugin 'Upload (upload)'."
                }

                try {
                    const errorJson = await response.json()
                    console.warn("[JobApplications-Form] Detalhes do erro retornado pelo Strapi:", errorJson)

                    if (errorJson?.error?.details?.errors?.length) {
                        const fieldErrors = errorJson.error.details.errors
                            .map((errItem) => errItem.message)
                            .join(" | ")
                        errorDetails = `Validação no Strapi: ${fieldErrors}`
                    } else if (errorJson?.error?.message) {
                        errorDetails = errorJson.error.message
                    } else if (errorJson?.message) {
                        errorDetails = errorJson.message
                    }
                } catch (_) {
                    // Resposta não é JSON
                }

                throw new Error(errorDetails)
            }

            const responseData = await response.json().catch(() => null)
            console.log("[JobApplications-Form] Candidatura registada com sucesso:", responseData)
            setSubmitSuccess(true)
        } catch (err) {
            console.error("[JobApplications-Form] Erro ao submeter candidatura:", err)
            setSubmitError(
                err.message ||
                    "Não foi possível enviar a sua candidatura. Verifique os dados, a ligação à internet ou o token da API."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const computedFontFamily =
        fontFamilyChoice === "Inter"
            ? "'Inter', sans-serif"
            : fontFamilyChoice === "Montserrat"
            ? "'Montserrat', sans-serif"
            : "inherit"

    return (
        <div
            id={uniqueId}
            style={{
                display: "inline-block",
                fontFamily: computedFontFamily,
                ...style,
            }}
        >
            {/* Estilos CSS Scoped & Keyframes para Framer */}
            <style>{`
                #${uniqueId} * {
                    box-sizing: border-box;
                }
                @keyframes jafFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes jafSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(18px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes jafSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .jaf-btn-trigger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 13px 26px;
                    background-color: ${primaryColor};
                    color: ${buttonTextColor};
                    font-size: 15px;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    border: none;
                    border-radius: ${borderRadius}px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
                    font-family: inherit;
                }
                .jaf-btn-trigger:hover {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
                }
                .jaf-btn-trigger:active {
                    transform: translateY(0);
                }
                .jaf-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    background-color: rgba(10, 10, 12, 0.65);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    animation: jafFadeIn 0.2s ease-out forwards;
                }
                .jaf-modal-dialog {
                    position: relative;
                    width: 100%;
                    max-width: 680px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    background-color: #ffffff;
                    border-radius: ${borderRadius}px;
                    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.06);
                    overflow: hidden;
                    animation: jafSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    font-family: inherit;
                    color: #0f172a;
                }
                .jaf-modal-header {
                    padding: 22px 28px 16px 28px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    background-color: #ffffff;
                }
                .jaf-close-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                    background-color: #f8fafc;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                .jaf-close-btn:hover {
                    background-color: #0f172a;
                    color: #ffffff;
                    border-color: #0f172a;
                }
                .jaf-modal-body {
                    padding: 24px 28px;
                    overflow-y: auto;
                    overscroll-behavior: contain;
                }
                .jaf-modal-body::-webkit-scrollbar {
                    width: 6px;
                }
                .jaf-modal-body::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 3px;
                }
                .jaf-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .jaf-col-full {
                    grid-column: 1 / -1;
                }
                @media (max-width: 600px) {
                    .jaf-grid {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }
                    .jaf-modal-header {
                        padding: 18px 20px 14px 20px;
                    }
                    .jaf-modal-body {
                        padding: 18px 20px;
                    }
                }
                .jaf-field-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 6px;
                    letter-spacing: 0.01em;
                }
                .jaf-required-star {
                    color: #ef4444;
                    margin-left: 3px;
                }
                .jaf-input, .jaf-select, .jaf-textarea {
                    width: 100%;
                    padding: 11px 13px;
                    font-size: 14px;
                    color: #0f172a;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
                    font-family: inherit;
                }
                .jaf-input:focus, .jaf-select:focus, .jaf-textarea:focus {
                    background-color: #ffffff;
                    border-color: ${primaryColor};
                    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
                }
                .jaf-input.has-error, .jaf-select.has-error, .jaf-textarea.has-error {
                    border-color: #ef4444;
                    background-color: #fef2f2;
                }
                .jaf-error-text {
                    font-size: 12px;
                    color: #ef4444;
                    margin-top: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .jaf-dropzone {
                    border: 2px dashed #cbd5e1;
                    background-color: #f8fafc;
                    border-radius: 10px;
                    padding: 22px 16px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .jaf-dropzone:hover, .jaf-dropzone.is-dragging {
                    border-color: ${primaryColor};
                    background-color: #f1f5f9;
                }
                .jaf-dropzone.has-error {
                    border-color: #ef4444;
                    background-color: #fef2f2;
                }
                .jaf-file-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background-color: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 10px 14px;
                    margin-top: 8px;
                }
                .jaf-rgpd-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 14px;
                    background-color: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .jaf-rgpd-checkbox {
                    width: 18px;
                    height: 18px;
                    margin-top: 2px;
                    accent-color: ${primaryColor};
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .jaf-submit-btn {
                    width: 100%;
                    padding: 14px 20px;
                    background-color: ${primaryColor};
                    color: ${buttonTextColor};
                    font-size: 15px;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.1s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: inherit;
                }
                .jaf-submit-btn:hover:not(:disabled) {
                    opacity: 0.92;
                }
                .jaf-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .jaf-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: ${buttonTextColor};
                    border-radius: 50%;
                    animation: jafSpin 0.7s linear infinite;
                }
            `}</style>

            {/* Trigger Button (Abre o Modal) */}
            <button
                type="button"
                className="jaf-btn-trigger"
                onClick={handleOpenModal}
                aria-haspopup="dialog"
                aria-expanded={isModalActive}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span>{buttonText}</span>
            </button>

            {/* Modal Overlay & Pop-up Dialog */}
            {isModalActive && (
                <div
                    className="jaf-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleCloseModal()
                        }
                    }}
                    role="presentation"
                >
                    <div
                        ref={modalContentRef}
                        className="jaf-modal-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`jaf-title-${uniqueId}`}
                        aria-describedby={`jaf-desc-${uniqueId}`}
                    >
                        {/* Header com Título e Botão Fechar */}
                        <div className="jaf-modal-header">
                            <div>
                                <span
                                    style={{
                                        display: "inline-block",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "#64748b",
                                        marginBottom: "4px",
                                    }}
                                >
                                    IMPETUS CAREERS
                                </span>
                                <h2
                                    id={`jaf-title-${uniqueId}`}
                                    style={{
                                        margin: "0 0 4px 0",
                                        fontSize: "20px",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    {modalTitle}
                                </h2>
                                <p
                                    id={`jaf-desc-${uniqueId}`}
                                    style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        color: "#64748b",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {modalSubtitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="jaf-close-btn"
                                onClick={handleCloseModal}
                                aria-label="Fechar janela"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Corpo do Modal */}
                        <div ref={modalBodyRef} className="jaf-modal-body">
                            {/* ESTADO 1: SUCESSO APÓS SUBMISSÃO */}
                            {submitSuccess ? (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "36px 16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            borderRadius: "50%",
                                            backgroundColor: "#dcfce7",
                                            color: "#15803d",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 20px auto",
                                        }}
                                    >
                                        <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <h3
                                        style={{
                                            fontSize: "22px",
                                            fontWeight: 700,
                                            color: "#0f172a",
                                            margin: "0 0 8px 0",
                                        }}
                                    >
                                        Candidatura Enviada com Sucesso!
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#475569",
                                            maxWidth: "460px",
                                            margin: "0 auto 24px auto",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Agradecemos o seu interesse em integrar a equipa do Grupo Impetus.
                                        A nossa equipa de Recursos Humanos irá analisar o seu perfil e entrará em
                                        contacto assim que oportuno.
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "12px",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={handleResetForm}
                                            style={{
                                                padding: "10px 20px",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "8px",
                                                backgroundColor: "#ffffff",
                                                color: "#0f172a",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Enviar outra candidatura
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            style={{
                                                padding: "10px 24px",
                                                border: "none",
                                                borderRadius: "8px",
                                                backgroundColor: primaryColor,
                                                color: buttonTextColor,
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Concluir
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ESTADO 2: FORMULÁRIO DE CANDIDATURA */
                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="jaf-grid">
                                        {/* Nome (Obrigatório) */}
                                        <div className="jaf-col-full">
                                            <label className="jaf-field-label" htmlFor={`nome-${uniqueId}`}>
                                                Nome Completo
                                                <span className="jaf-required-star">*</span>
                                            </label>
                                            <input
                                                id={`nome-${uniqueId}`}
                                                name="Nome"
                                                type="text"
                                                className={`jaf-input ${errors.Nome ? "has-error" : ""}`}
                                                placeholder="ex: João Silva"
                                                value={formState.Nome}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                required
                                            />
                                            {errors.Nome && (
                                                <div className="jaf-error-text">
                                                    <span>•</span> {errors.Nome}
                                                </div>
                                            )}
                                        </div>

                                        {/* Email (Obrigatório) */}
                                        <div>
                                            <label className="jaf-field-label" htmlFor={`email-${uniqueId}`}>
                                                Email
                                                <span className="jaf-required-star">*</span>
                                            </label>
                                            <input
                                                id={`email-${uniqueId}`}
                                                name="Email"
                                                type="email"
                                                className={`jaf-input ${errors.Email ? "has-error" : ""}`}
                                                placeholder="ex: joao.silva@email.com"
                                                value={formState.Email}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                required
                                            />
                                            {errors.Email && (
                                                <div className="jaf-error-text">
                                                    <span>•</span> {errors.Email}
                                                </div>
                                            )}
                                        </div>

                                        {/* Telefone */}
                                        <div>
                                            <label className="jaf-field-label" htmlFor={`tel-${uniqueId}`}>
                                                Telefone / Telemóvel
                                            </label>
                                            <input
                                                id={`tel-${uniqueId}`}
                                                name="Telefone"
                                                type="tel"
                                                className="jaf-input"
                                                placeholder="ex: +351 912 345 678"
                                                value={formState.Telefone}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Morada */}
                                        <div className="jaf-col-full">
                                            <label className="jaf-field-label" htmlFor={`morada-${uniqueId}`}>
                                                Morada
                                            </label>
                                            <input
                                                id={`morada-${uniqueId}`}
                                                name="Morada"
                                                type="text"
                                                className="jaf-input"
                                                placeholder="ex: Rua Principal, nº 123"
                                                value={formState.Morada}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Morada 2 */}
                                        <div>
                                            <label className="jaf-field-label" htmlFor={`morada2-${uniqueId}`}>
                                                Morada 2 (Andar, Porta, etc.)
                                            </label>
                                            <input
                                                id={`morada2-${uniqueId}`}
                                                name="Morada2"
                                                type="text"
                                                className="jaf-input"
                                                placeholder="ex: 2º Direito"
                                                value={formState.Morada2}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Código Postal */}
                                        <div>
                                            <label className="jaf-field-label" htmlFor={`cp-${uniqueId}`}>
                                                Código Postal
                                            </label>
                                            <input
                                                id={`cp-${uniqueId}`}
                                                name="CodigoPostal"
                                                type="text"
                                                className="jaf-input"
                                                placeholder="ex: 4750-123"
                                                value={formState.CodigoPostal}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Habilitações Académicas */}
                                        <div>
                                            <label className="jaf-field-label" htmlFor={`hab-${uniqueId}`}>
                                                Habilitações Académicas
                                            </label>
                                            <select
                                                id={`hab-${uniqueId}`}
                                                name="HabilitacoesAcademicas"
                                                className="jaf-select"
                                                value={formState.HabilitacoesAcademicas}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            >
                                                <option value="">Selecione as habilitações...</option>
                                                {HABILITACOES_OPTIONS.map((hab) => (
                                                    <option key={hab} value={hab}>
                                                        {hab}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Vagas (Select Dinâmico via Strapi) */}
                                        <div>
                                            <label className="jaf-field-label" htmlFor={`vaga-${uniqueId}`}>
                                                Vaga Pretendida
                                                {isLoadingVagas && (
                                                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>
                                                        (a carregar...)
                                                    </span>
                                                )}
                                            </label>
                                            <select
                                                id={`vaga-${uniqueId}`}
                                                name="vagas"
                                                className="jaf-select"
                                                value={formState.vagas}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting || isLoadingVagas}
                                            >
                                                <option value="">Selecione uma vaga ou espontânea...</option>
                                                <option value="spontaneous">Candidatura Espontânea</option>
                                                {vagas.map((vaga) => (
                                                    <option key={vaga.id} value={vaga.id}>
                                                        {vaga.title}
                                                    </option>
                                                ))}
                                            </select>
                                            {vagasLoadError && (
                                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                                                    A apresentar vagas em modo de contingência.
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload do CV (Obrigatório) */}
                                        <div className="jaf-col-full">
                                            <label className="jaf-field-label">
                                                Curriculum Vitae (CV)
                                                <span className="jaf-required-star">*</span>
                                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400, marginLeft: "6px" }}>
                                                    (PDF ou DOCX até 10 MB)
                                                </span>
                                            </label>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                style={{ display: "none" }}
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                            />

                                            {!cvFile ? (
                                                <div
                                                    className={`jaf-dropzone ${isDragging ? "is-dragging" : ""} ${
                                                        errors.CV ? "has-error" : ""
                                                    }`}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDrop={handleDrop}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                >
                                                    <svg
                                                        width="32"
                                                        height="32"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#64748b"
                                                        strokeWidth="1.75"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        style={{ margin: "0 auto 8px auto", display: "block" }}
                                                    >
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                                                        Clique para anexar ou arraste o ficheiro aqui
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                        Suporta ficheiros .pdf, .doc e .docx
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="jaf-file-card">
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                                        <svg
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke={primaryColor}
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            style={{ flexShrink: 0 }}
                                                        >
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                            <line x1="16" y1="13" x2="8" y2="13" />
                                                            <line x1="16" y1="17" x2="8" y2="17" />
                                                            <polyline points="10 9 9 9 8 9" />
                                                        </svg>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div
                                                                style={{
                                                                    fontSize: "13px",
                                                                    fontWeight: 600,
                                                                    color: "#0f172a",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {cvFile.name}
                                                            </div>
                                                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                                {formatFileSize(cvFile.size)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveFile}
                                                        style={{
                                                            border: "none",
                                                            background: "transparent",
                                                            color: "#ef4444",
                                                            cursor: "pointer",
                                                            padding: "6px",
                                                            borderRadius: "4px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                        title="Remover ficheiro"
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}

                                            {errors.CV && (
                                                <div className="jaf-error-text">
                                                    <span>•</span> {errors.CV}
                                                </div>
                                            )}
                                        </div>

                                        {/* Observações / Mensagem */}
                                        <div className="jaf-col-full">
                                            <label className="jaf-field-label" htmlFor={`obs-${uniqueId}`}>
                                                Observações / Carta de Apresentação
                                            </label>
                                            <textarea
                                                id={`obs-${uniqueId}`}
                                                name="Obs"
                                                rows={3}
                                                className="jaf-textarea"
                                                placeholder="Partilhe alguma informação adicional relevante sobre si..."
                                                value={formState.Obs}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Consentimento RGPD (Obrigatório) */}
                                        <div className="jaf-col-full">
                                            <div
                                                className="jaf-rgpd-container"
                                                style={{
                                                    borderColor: errors.consentimentoRGPD ? "#ef4444" : "#e2e8f0",
                                                    backgroundColor: errors.consentimentoRGPD ? "#fef2f2" : "#f8fafc",
                                                }}
                                            >
                                                <input
                                                    id={`rgpd-${uniqueId}`}
                                                    name="consentimentoRGPD"
                                                    type="checkbox"
                                                    className="jaf-rgpd-checkbox"
                                                    checked={formState.consentimentoRGPD}
                                                    onChange={handleInputChange}
                                                    disabled={isSubmitting}
                                                    required
                                                />
                                                <label
                                                    htmlFor={`rgpd-${uniqueId}`}
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "#334155",
                                                        lineHeight: 1.5,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Submeto a informação e cedo os meus dados para tratamento
                                                    consoante a{" "}
                                                    <a
                                                        href={privacyPolicyUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: primaryColor,
                                                            textDecoration: "underline",
                                                            fontWeight: 600,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        política de privacidade da Impetus
                                                    </a>
                                                    .
                                                    <span className="jaf-required-star">*</span>
                                                </label>
                                            </div>
                                            {errors.consentimentoRGPD && (
                                                <div className="jaf-error-text">
                                                    <span>•</span> {errors.consentimentoRGPD}
                                                </div>
                                            )}
                                        </div>

                                        {/* Alertas Imediatos Próximos do Botão */}
                                        {validationSummary && (
                                            <div
                                                className="jaf-col-full"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "10px",
                                                    padding: "12px 14px",
                                                    backgroundColor: "#fffbeb",
                                                    border: "1px solid #fde68a",
                                                    borderRadius: "8px",
                                                    color: "#92400e",
                                                    fontSize: "13px",
                                                    lineHeight: 1.4,
                                                    marginTop: "6px",
                                                }}
                                            >
                                                <span style={{ fontSize: "16px", lineHeight: 1 }}>⚠️</span>
                                                <div>
                                                    <strong>Atenção:</strong> {validationSummary}
                                                </div>
                                            </div>
                                        )}

                                        {submitError && (
                                            <div
                                                className="jaf-col-full"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "10px",
                                                    padding: "12px 14px",
                                                    backgroundColor: "#fef2f2",
                                                    border: "1px solid #fecaca",
                                                    borderRadius: "8px",
                                                    color: "#991b1b",
                                                    fontSize: "13px",
                                                    lineHeight: 1.4,
                                                    marginTop: "6px",
                                                }}
                                            >
                                                <span style={{ fontSize: "16px", lineHeight: 1 }}>❌</span>
                                                <div>
                                                    <strong>Erro no Envio:</strong> {submitError}
                                                </div>
                                            </div>
                                        )}

                                        {/* Botão de Submissão com clique garantido */}
                                        <div className="jaf-col-full" style={{ marginTop: "12px" }}>
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                className="jaf-submit-btn"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="jaf-spinner" />
                                                        <span>A submeter candidatura...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <line x1="22" y1="2" x2="11" y2="13" />
                                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                        </svg>
                                                        <span>{submitButtonText}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Aliases para export
export { JobApplicationsForm as JobApplications_Form }

// Controlos de Propriedade do Framer (Property Controls)
addPropertyControls(JobApplicationsForm, {
    strapiUrl: {
        type: ControlType.String,
        title: "Strapi URL",
        defaultValue: "https://hr.impetusgroup.pt",
        description: "URL base da instância Strapi (ex: https://hr.impetusgroup.pt)",
    },
    apiToken: {
        type: ControlType.String,
        title: "API Token",
        defaultValue: "",
        description: "Bearer Token para endpoints protegidos no Strapi",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Candidatar-me",
        description: "Texto do botão que dispara a abertura do modal",
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Preview Modal",
        defaultValue: false,
        description: "Ativar para pré-visualizar o modal diretamente na tela do Framer",
    },
    modalTitle: {
        type: ControlType.String,
        title: "Modal Title",
        defaultValue: "Candidatura de Emprego",
    },
    modalSubtitle: {
        type: ControlType.String,
        title: "Modal Subtitle",
        defaultValue: "Junte-se à equipa do Grupo Impetus. Preencha os seus dados e anexe o seu CV.",
    },
    submitButtonText: {
        type: ControlType.String,
        title: "Submit Text",
        defaultValue: "Submeter Candidatura",
    },
    privacyPolicyUrl: {
        type: ControlType.String,
        title: "Privacy URL",
        defaultValue: "https://www.impetusgroup.pt/politica-de-privacidade",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#000000",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#ffffff",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    fontFamilyChoice: {
        type: ControlType.Enum,
        title: "Font Family",
        options: ["inherit", "Inter", "Montserrat"],
        optionTitles: ["Website (Inherit)", "Inter", "Montserrat"],
        defaultValue: "inherit",
    },
})
