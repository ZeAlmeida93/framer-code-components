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
            const documentId = item.documentId || attrs.documentId || (typeof id === "string" ? id : undefined)
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

            return { id, documentId, title }
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
    showTriggerButton = true,
    previewOpen = false,
    modalMaxWidth = 880,
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

    // Bloquear scroll do background (body + html) enquanto o modal estiver aberto e lidar com tecla ESC
    useEffect(() => {
        if (!isModalActive) return

        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow
        const originalBodyPaddingRight = document.body.style.paddingRight

        // Evitar salto de layout compensando a largura da barra de scroll
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`
        }

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleCloseModal()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.documentElement.style.overflow = originalHtmlOverflow
            document.body.style.paddingRight = originalBodyPaddingRight
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isModalActive])

    // Ativação externa do modal (via CustomEvent 'open-job-modal', URL Hash #candidatura, ou clique em links/botões externos)
    useEffect(() => {
        const selectVaga = (vagaId, vagaTitle) => {
            if (vagaId !== undefined && vagaId !== null && String(vagaId).trim() !== "") {
                const targetStr = String(vagaId).trim()
                const matched = vagas.find(
                    (v) => String(v.id) === targetStr || v.documentId === targetStr
                )
                if (matched) {
                    setFormState((prev) => ({
                        ...prev,
                        vagas: matched.documentId || String(matched.id),
                    }))
                    return
                }
                setFormState((prev) => ({ ...prev, vagas: targetStr }))
                return
            }
            if (vagaTitle && vagaTitle.trim() !== "") {
                const titleLower = vagaTitle.toLowerCase().trim()
                const matched = vagas.find((v) =>
                    v.title.toLowerCase().includes(titleLower) || titleLower.includes(v.title.toLowerCase())
                )
                if (matched) {
                    setFormState((prev) => ({
                        ...prev,
                        vagas: matched.documentId || String(matched.id),
                    }))
                }
            }
        }

        const handleOpenEvent = (e) => {
            setIsOpen(true)
            setSubmitSuccess(false)
            setSubmitError(null)
            const detail = e?.detail || {}
            selectVaga(detail.vagaId, detail.vagaTitle)
        }

        const handleHashChange = () => {
            const hash = window.location.hash
            if (hash.startsWith("#candidatura") || hash === "#apply" || hash.startsWith("#job-apply")) {
                setIsOpen(true)
                setSubmitSuccess(false)
                setSubmitError(null)
                const idMatch = hash.match(/#(?:candidatura|job-apply)-(\w+)/)
                if (idMatch && idMatch[1]) {
                    selectVaga(idMatch[1])
                }
            }
        }

        const handleGlobalClick = (e) => {
            const target = e.target
            if (!target) return

            const trigger = target.closest(
                'a[href^="#candidatura"], a[href="#apply"], [data-open-job-modal], [data-open-candidatura], .open-job-modal, .open-candidatura-modal'
            )
            if (trigger) {
                e.preventDefault()
                setIsOpen(true)
                setSubmitSuccess(false)
                setSubmitError(null)

                const vagaId = trigger.getAttribute("data-vaga-id") || trigger.getAttribute("data-job-id")
                const vagaTitle = trigger.getAttribute("data-vaga-title") || trigger.getAttribute("data-job-title")
                const href = trigger.getAttribute("href") || ""
                const idFromHref = href.match(/#candidatura-(\w+)/)?.[1]

                selectVaga(vagaId || idFromHref, vagaTitle || undefined)
            }
        }

        window.addEventListener("open-job-modal", handleOpenEvent)
        window.addEventListener("open-job-application-modal", handleOpenEvent)
        window.addEventListener("hashchange", handleHashChange)
        document.addEventListener("click", handleGlobalClick)

        if (typeof window !== "undefined" && window.location.hash) {
            handleHashChange()
        }

        return () => {
            window.removeEventListener("open-job-modal", handleOpenEvent)
            window.removeEventListener("open-job-application-modal", handleOpenEvent)
            window.removeEventListener("hashchange", handleHashChange)
            document.removeEventListener("click", handleGlobalClick)
        }
    }, [vagas])

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

            // Encontrar a vaga selecionada para obter tanto o documentId (Strapi 5) como o id numérico (Strapi 4)
            let selectedVaga = undefined
            let finalObs = formState.Obs.trim()

            if (formState.vagas && formState.vagas !== "" && formState.vagas !== "spontaneous") {
                selectedVaga = vagas.find(
                    (v) => String(v.documentId) === formState.vagas || String(v.id) === formState.vagas
                )
                const vagaLabel = selectedVaga ? selectedVaga.title : `Vaga #${formState.vagas}`
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

            // Estratégias adaptativas de associação da relação 'vagas' no Strapi (v4 e v5)
            const relationStrategies = []

            if (selectedVaga || (formState.vagas && formState.vagas !== "" && formState.vagas !== "spontaneous")) {
                const docId = selectedVaga?.documentId || (typeof formState.vagas === "string" && formState.vagas.length > 10 ? formState.vagas : undefined)
                const rawNum = selectedVaga?.id ?? Number(formState.vagas)
                const numId = typeof rawNum === "number" && !isNaN(rawNum) ? rawNum : undefined

                // 1. Strapi 5 (documentId)
                if (docId) {
                    relationStrategies.push({ name: "vagas: { connect: [documentId] }", key: "vagas", value: { connect: [docId] } })
                    relationStrategies.push({ name: "vagas: documentId", key: "vagas", value: docId })
                    relationStrategies.push({ name: "vagas: [documentId]", key: "vagas", value: [docId] })
                    relationStrategies.push({ name: "Vagas: { connect: [documentId] }", key: "Vagas", value: { connect: [docId] } })
                    relationStrategies.push({ name: "Vagas: documentId", key: "Vagas", value: docId })
                }

                // 2. Strapi 4 / IDs numéricos
                if (numId !== undefined) {
                    relationStrategies.push({ name: "vagas: { connect: [id] }", key: "vagas", value: { connect: [numId] } })
                    relationStrategies.push({ name: "vagas: [id]", key: "vagas", value: [numId] })
                    relationStrategies.push({ name: "vagas: id", key: "vagas", value: numId })
                    relationStrategies.push({ name: "Vagas: [id]", key: "Vagas", value: [numId] })
                    relationStrategies.push({ name: "Vagas: id", key: "Vagas", value: numId })
                }
            }

            let response = null

            // Tentar associar a vaga com as estratégias suportadas pelo Strapi
            if (relationStrategies.length > 0) {
                for (const strat of relationStrategies) {
                    const payloadWithRelation = {
                        ...candidaturasData,
                        [strat.key]: strat.value,
                    }
                    console.log(`[JobApplications-Form] A tentar envio com ${strat.name}:`, strat.value)

                    try {
                        const res = await fetch(candidaturasEndpoint, {
                            method: "POST",
                            headers: candidaturasHeaders,
                            body: JSON.stringify({ data: payloadWithRelation }),
                        })

                        if (res.ok) {
                            response = res
                            console.log(`[JobApplications-Form] Candidatura criada com sucesso com ${strat.name}!`)
                            break
                        } else {
                            let errJson = null
                            try {
                                errJson = await res.clone().json()
                            } catch (_) {}
                            const errMsg = errJson?.error?.message || res.statusText
                            console.warn(`[JobApplications-Form] Formato ${strat.name} recusado (${res.status}): ${errMsg}`)
                        }
                    } catch (netErr) {
                        console.warn(`[JobApplications-Form] Erro de rede com ${strat.name}:`, netErr)
                    }
                }
            }

            // Fallback de salvaguarda: Se as tentativas de relação falharem (ex: falta de permissão RBAC para ligar relations), submeter sem campo de relação (o dado já está preservado em Obs)
            if (!response || !response.ok) {
                console.warn("[JobApplications-Form] As tentativas diretas de relação falharam ou não há vaga selecionada. A enviar payload base (com vaga em Obs)...")
                response = await fetch(candidaturasEndpoint, {
                    method: "POST",
                    headers: candidaturasHeaders,
                    body: JSON.stringify({ data: candidaturasData }),
                })
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
                    overscroll-behavior: contain;
                    touch-action: none;
                }
                .jaf-modal-dialog {
                    position: relative;
                    width: 100%;
                    max-width: ${modalMaxWidth}px;
                    max-height: 94vh;
                    display: flex;
                    flex-direction: column;
                    background-color: #ffffff;
                    border-radius: ${borderRadius}px;
                    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.06);
                    overflow: hidden;
                    animation: jafSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    font-family: inherit;
                    color: #0f172a;
                    touch-action: auto;
                }
                .jaf-modal-header {
                    padding: 16px 24px 12px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    background-color: #ffffff;
                    flex-shrink: 0;
                }
                .jaf-close-btn {
                    width: 32px;
                    height: 32px;
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
                    margin-left: 12px;
                }
                .jaf-close-btn:hover {
                    background-color: #0f172a;
                    color: #ffffff;
                    border-color: #0f172a;
                }
                .jaf-modal-body {
                    padding: 18px 24px 22px 24px;
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
                .jaf-form-columns {
                    display: grid;
                    grid-template-columns: 1.15fr 0.85fr;
                    gap: 20px;
                    align-items: start;
                }
                .jaf-form-col-left, .jaf-form-col-right {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .jaf-subgrid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .jaf-field-group {
                    display: flex;
                    flex-direction: column;
                }
                @media (max-width: 768px) {
                    .jaf-form-columns {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }
                    .jaf-subgrid {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }
                    .jaf-modal-header {
                        padding: 14px 16px 10px 16px;
                    }
                    .jaf-modal-body {
                        padding: 14px 16px 18px 16px;
                    }
                }
                .jaf-field-label {
                    display: block;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 4px;
                    letter-spacing: 0.01em;
                }
                .jaf-required-star {
                    color: #ef4444;
                    margin-left: 2px;
                }
                .jaf-input, .jaf-select, .jaf-textarea {
                    width: 100%;
                    padding: 8.5px 11px;
                    font-size: 13.5px;
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
                    font-size: 11.5px;
                    color: #ef4444;
                    margin-top: 3px;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }
                .jaf-dropzone {
                    border: 2px dashed #cbd5e1;
                    background-color: #f8fafc;
                    border-radius: 9px;
                    padding: 13px 12px;
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
                    padding: 8px 12px;
                }
                .jaf-rgpd-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 8px 10px;
                    background-color: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .jaf-rgpd-checkbox {
                    width: 15px;
                    height: 15px;
                    margin-top: 2px;
                    accent-color: ${primaryColor};
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .jaf-alert-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    font-size: 12px;
                    line-height: 1.35;
                }
                .jaf-alert-warning {
                    background-color: #fffbeb;
                    border: 1px solid #fde68a;
                    color: #92400e;
                }
                .jaf-alert-danger {
                    background-color: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                }
                .jaf-submit-btn {
                    width: 100%;
                    padding: 11px 16px;
                    background-color: ${primaryColor};
                    color: ${buttonTextColor};
                    font-size: 14px;
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
                    transform: translateY(-1px);
                }
                .jaf-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .jaf-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: ${buttonTextColor};
                    border-radius: 50%;
                    animation: jafSpin 0.7s linear infinite;
                }
            `}</style>

            {/* Trigger Button (Abre o Modal) - Renderizado apenas se showTriggerButton for true */}
            {showTriggerButton && (
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
            )}

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
                                    <div className="jaf-form-columns">
                                        {/* COLUNA ESQUERDA: Dados do Candidato */}
                                        <div className="jaf-form-col-left">
                                            {/* Nome Completo */}
                                            <div className="jaf-field-group">
                                                <label className="jaf-field-label" htmlFor={`nome-${uniqueId}`}>
                                                    Nome Completo <span className="jaf-required-star">*</span>
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

                                            {/* Linha: Email + Telefone */}
                                            <div className="jaf-subgrid">
                                                <div className="jaf-field-group">
                                                    <label className="jaf-field-label" htmlFor={`email-${uniqueId}`}>
                                                        Email <span className="jaf-required-star">*</span>
                                                    </label>
                                                    <input
                                                        id={`email-${uniqueId}`}
                                                        name="Email"
                                                        type="email"
                                                        className={`jaf-input ${errors.Email ? "has-error" : ""}`}
                                                        placeholder="ex: joao@email.com"
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

                                                <div className="jaf-field-group">
                                                    <label className="jaf-field-label" htmlFor={`tel-${uniqueId}`}>
                                                        Telefone
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
                                            </div>

                                            {/* Morada */}
                                            <div className="jaf-field-group">
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

                                            {/* Linha: Morada 2 + Código Postal */}
                                            <div className="jaf-subgrid">
                                                <div className="jaf-field-group">
                                                    <label className="jaf-field-label" htmlFor={`morada2-${uniqueId}`}>
                                                        Morada 2 (Andar, etc.)
                                                    </label>
                                                    <input
                                                        id={`morada2-${uniqueId}`}
                                                        name="Morada2"
                                                        type="text"
                                                        className="jaf-input"
                                                        placeholder="ex: 2º Dto"
                                                        value={formState.Morada2}
                                                        onChange={handleInputChange}
                                                        disabled={isSubmitting}
                                                    />
                                                </div>

                                                <div className="jaf-field-group">
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
                                            </div>

                                            {/* Linha: Habilitações + Vaga Pretendida */}
                                            <div className="jaf-subgrid">
                                                <div className="jaf-field-group">
                                                    <label className="jaf-field-label" htmlFor={`hab-${uniqueId}`}>
                                                        Habilitações
                                                    </label>
                                                    <select
                                                        id={`hab-${uniqueId}`}
                                                        name="HabilitacoesAcademicas"
                                                        className="jaf-select"
                                                        value={formState.HabilitacoesAcademicas}
                                                        onChange={handleInputChange}
                                                        disabled={isSubmitting}
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {HABILITACOES_OPTIONS.map((hab) => (
                                                            <option key={hab} value={hab}>
                                                                {hab}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="jaf-field-group">
                                                    <label className="jaf-field-label" htmlFor={`vaga-${uniqueId}`}>
                                                        Vaga Pretendida
                                                        {isLoadingVagas && (
                                                            <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>
                                                                (...)
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
                                                        <option value="">Selecione a vaga...</option>
                                                        <option value="spontaneous">Candidatura Espontânea</option>
                                                        {vagas.map((vaga) => {
                                                            const optVal = vaga.documentId || String(vaga.id)
                                                            return (
                                                                <option key={optVal} value={optVal}>
                                                                    {vaga.title}
                                                                </option>
                                                            )
                                                        })}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* COLUNA DIREITA: CV, Observações, RGPD e Envio */}
                                        <div className="jaf-form-col-right">
                                            {/* Upload do CV */}
                                            <div className="jaf-field-group">
                                                <label className="jaf-field-label">
                                                    Curriculum Vitae (CV) <span className="jaf-required-star">*</span>
                                                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400, marginLeft: "4px" }}>
                                                        (PDF/DOCX até 10 MB)
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
                                                            width="22"
                                                            height="22"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#64748b"
                                                            strokeWidth="1.75"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            style={{ margin: "0 auto 3px auto", display: "block" }}
                                                        >
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                        <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
                                                            Anexar ou arrastar CV
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                                                            Ficheiros .pdf, .doc e .docx
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="jaf-file-card">
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                                            <svg
                                                                width="20"
                                                                height="20"
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
                                                                        fontSize: "12.5px",
                                                                        fontWeight: 600,
                                                                        color: "#0f172a",
                                                                        whiteSpace: "nowrap",
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        maxWidth: "200px",
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
                                                                padding: "4px",
                                                                borderRadius: "4px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                            title="Remover ficheiro"
                                                        >
                                                            <svg
                                                                width="16"
                                                                height="16"
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
                                            <div className="jaf-field-group">
                                                <label className="jaf-field-label" htmlFor={`obs-${uniqueId}`}>
                                                    Observações / Apresentação
                                                </label>
                                                <textarea
                                                    id={`obs-${uniqueId}`}
                                                    name="Obs"
                                                    rows={2}
                                                    className="jaf-textarea"
                                                    placeholder="Informação adicional relevante sobre si..."
                                                    value={formState.Obs}
                                                    onChange={handleInputChange}
                                                    disabled={isSubmitting}
                                                    style={{ minHeight: "54px", resize: "vertical" }}
                                                />
                                            </div>

                                            {/* Consentimento RGPD */}
                                            <div className="jaf-field-group">
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
                                                            fontSize: "12px",
                                                            color: "#334155",
                                                            lineHeight: 1.35,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Submeto a informação e autorizo o tratamento consoante a{" "}
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
                                                            política de privacidade
                                                        </a>
                                                        .<span className="jaf-required-star">*</span>
                                                    </label>
                                                </div>
                                                {errors.consentimentoRGPD && (
                                                    <div className="jaf-error-text">
                                                        <span>•</span> {errors.consentimentoRGPD}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Alertas Imediatos */}
                                            {validationSummary && (
                                                <div className="jaf-alert-box jaf-alert-warning">
                                                    <span style={{ fontSize: "14px", lineHeight: 1 }}>⚠️</span>
                                                    <div>{validationSummary}</div>
                                                </div>
                                            )}
                                            {submitError && (
                                                <div className="jaf-alert-box jaf-alert-danger">
                                                    <span style={{ fontSize: "14px", lineHeight: 1 }}>❌</span>
                                                    <div>{submitError}</div>
                                                </div>
                                            )}

                                            {/* Botão de Envio */}
                                            <div style={{ marginTop: "4px" }}>
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
                                                                width="15"
                                                                height="15"
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
    showTriggerButton: {
        type: ControlType.Boolean,
        title: "Show Default Button",
        defaultValue: true,
        description: "Ativar para exibir o botão 'Candidatar-me'. Se desativado, o modal abre por CTAs externos.",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Candidatar-me",
        description: "Texto do botão padrão que dispara a abertura do modal",
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Preview Modal",
        defaultValue: false,
        description: "Ativar para pré-visualizar o modal diretamente na tela do Framer",
    },
    modalMaxWidth: {
        type: ControlType.Number,
        title: "Modal Width",
        defaultValue: 880,
        min: 600,
        max: 1200,
        step: 20,
        unit: "px",
        description: "Largura máxima do modal em desktop (evita scroll vertical)",
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
