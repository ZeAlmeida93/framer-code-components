import React, { useState, useEffect, useRef, useCallback, CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * GeoVideoPlayer - Framer Code Component (TypeScript)
 * 
 * Componente de vídeo que altera a reprodução dinamicamente com base na
 * geolocalização por IP do utilizador (via Cloudflare Trace API).
 * 
 * Regras estritas:
 * - Sem classes Tailwind CSS.
 * - Estilos 100% em linha com 'fontFamily: inherit' para máxima performance e prevenção do Error Code 5.
 * - Inicia com o vídeo Global e atualiza assim que o país for detetado.
 * - Força o Autoplay a qualquer custo: tenta com som; se o browser bloquear,
 *   reproduz imediatamente em silêncio e ativa o som na 1ª interação do utilizador.
 */

interface GeoVideoPlayerProps {
    videoGlobal?: string
    videoPT?: string
    videoES?: string
    videoFR?: string
    videoDE?: string
    videoDK?: string
    autoPlay?: boolean
    forceAutoplay?: boolean
    loop?: boolean
    muted?: boolean
    unmuteOnInteraction?: boolean
    showUnmuteButton?: boolean
    controls?: boolean
    objectFit?: "cover" | "contain" | "fill"
    borderRadius?: number
    previewCountry?: "auto" | "PT" | "ES" | "FR" | "DE" | "DK" | "GLOBAL"
    posterUrl?: string
    style?: CSSProperties
    [key: string]: any
}

const styles: { [key: string]: CSSProperties } = {
    container: {
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: "120px",
        minHeight: "120px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
        fontFamily: "inherit",
        boxSizing: "border-box",
    },
    video: {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
        fontFamily: "inherit",
    },
    placeholder: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        color: "#999999",
        fontFamily: "inherit",
        fontSize: "14px",
        lineHeight: "1.5",
        backgroundColor: "#111111",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
    },
    placeholderTitle: {
        margin: "0 0 8px 0",
        fontWeight: 600,
        color: "#ffffff",
        fontFamily: "inherit",
    },
    placeholderDesc: {
        margin: 0,
        maxWidth: "340px",
        fontSize: "13px",
        fontFamily: "inherit",
    },
    unmuteButton: {
        position: "absolute",
        bottom: "16px",
        left: "16px",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        borderRadius: "24px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
        fontFamily: "inherit",
        userSelect: "none",
        outline: "none",
    },
}

export default function GeoVideoPlayer({
    videoGlobal = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoPT = "",
    videoES = "",
    videoFR = "",
    videoDE = "",
    videoDK = "",
    autoPlay = true,
    forceAutoplay = true,
    loop = true,
    muted = false,
    unmuteOnInteraction = true,
    showUnmuteButton = true,
    controls = false,
    objectFit = "cover",
    borderRadius = 0,
    previewCountry = "auto",
    posterUrl = "",
    style,
    ...restProps
}: GeoVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    // Estado com o código de país extraído do IP (ex: "PT", "ES", "FR", "DE", "DK")
    const [countryCode, setCountryCode] = useState<string | null>(null)

    // Indica se o áudio foi silenciado preventivamente devido à política de autoplay do navegador
    const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(false)

    // Efeito para detetar a localização através do Cloudflare trace
    useEffect(() => {
        let isMounted = true
        const controller = new AbortController()

        const fetchGeoLocation = async () => {
            try {
                const response = await fetch("https://1.1.1.1/cdn-cgi/trace", {
                    signal: controller.signal,
                })

                if (!response.ok) return

                const rawText = await response.text()

                // Extração linha a linha do valor a seguir a 'loc='
                const lines = rawText.split("\n")
                let detectedLoc = ""

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim()
                    if (line.startsWith("loc=")) {
                        detectedLoc = line.substring(4).trim().toUpperCase()
                        break
                    }
                }

                if (isMounted && detectedLoc) {
                    setCountryCode(detectedLoc)
                }
            } catch (err: any) {
                // Silencia erros de abort quando o componente é desmontado
                if (err.name !== "AbortError") {
                    console.warn("GeoVideoPlayer: Falha ao obter geolocalização do Cloudflare", err)
                }
            }
        }

        fetchGeoLocation()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [])

    // Determina o país ativo (permite teste visual no canvas do Framer com previewCountry)
    const effectiveCountry =
        previewCountry && previewCountry !== "auto"
            ? previewCountry === "GLOBAL"
                ? null
                : previewCountry
            : countryCode

    // Determina o vídeo com base na prioridade geográfica
    // Inicia sempre com o Vídeo Global; quando detetado o país regional, substitui se o link existir
    let activeVideoUrl = videoGlobal

    if (effectiveCountry === "PT" && videoPT && videoPT.trim() !== "") {
        activeVideoUrl = videoPT.trim()
    } else if (effectiveCountry === "ES" && videoES && videoES.trim() !== "") {
        activeVideoUrl = videoES.trim()
    } else if (effectiveCountry === "FR" && videoFR && videoFR.trim() !== "") {
        activeVideoUrl = videoFR.trim()
    } else if (effectiveCountry === "DE" && videoDE && videoDE.trim() !== "") {
        activeVideoUrl = videoDE.trim()
    } else if (effectiveCountry === "DK" && videoDK && videoDK.trim() !== "") {
        activeVideoUrl = videoDK.trim()
    }

    // Função para forçar o autoplay a qualquer custo
    const triggerAutoplay = useCallback(() => {
        const video = videoRef.current
        if (!video || !autoPlay) return

        // Atributos vitais para WebKit / iOS / Safari / Chrome
        video.playsInline = true
        video.setAttribute("playsinline", "")
        video.setAttribute("webkit-playsinline", "")

        // Se o utilizador configurou explicitamente para começar silenciado
        if (muted) {
            video.muted = true
            video.defaultMuted = true
            const playPromise = video.play()
            if (playPromise !== undefined && typeof playPromise.catch === "function") {
                playPromise.catch((err) => {
                    console.warn("GeoVideoPlayer: Falha na reprodução com muted:", err)
                })
            }
            return
        }

        // TENTATIVA 1: Reproduzir COM SOM
        video.muted = false
        video.defaultMuted = false

        const playPromise = video.play()
        if (playPromise !== undefined && typeof playPromise.catch === "function") {
            playPromise
                .then(() => {
                    // Browser autorizou reprodução com som!
                    setIsAudioBlocked(false)
                })
                .catch(() => {
                    // TENTATIVA 2: O browser bloqueou o som.
                    // FORÇAR A QUALQUER CUSTO: mutar e reproduzir imediatamente!
                    setIsAudioBlocked(true)
                    video.muted = true
                    video.defaultMuted = true
                    const fallbackPromise = video.play()
                    if (fallbackPromise !== undefined && typeof fallbackPromise.catch === "function") {
                        fallbackPromise.catch((fallbackErr) => {
                            console.warn("GeoVideoPlayer: Falha no fallback autoplay:", fallbackErr)
                        })
                    }
                })
        }
    }, [autoPlay, muted])

    // Desmutar e ativar som imediatamente
    const unmuteAudio = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        video.muted = false
        video.defaultMuted = false
        const playPromise = video.play()
        if (playPromise !== undefined && typeof playPromise.catch === "function") {
            playPromise.catch(() => {})
        }
        setIsAudioBlocked(false)
    }, [])

    // Dispara a tentativa de reprodução quando o URL do vídeo muda
    useEffect(() => {
        triggerAutoplay()
    }, [activeVideoUrl, triggerAutoplay])

    // Ativa o som no primeiro gesto do utilizador (clique, toque ou tecla em qualquer lugar da página)
    useEffect(() => {
        if (muted || !unmuteOnInteraction || !isAudioBlocked) return

        const handleInteraction = () => {
            unmuteAudio()
        }

        const events = ["pointerdown", "touchstart", "click", "keydown"]
        events.forEach((evt) => {
            window.addEventListener(evt, handleInteraction, { once: true, passive: true })
        })

        return () => {
            events.forEach((evt) => {
                window.removeEventListener(evt, handleInteraction)
            })
        }
    }, [muted, unmuteOnInteraction, isAudioBlocked, unmuteAudio])

    // Callback ref para garantir execução imediata assim que o nó do vídeo é montado no DOM
    const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node
        if (node && autoPlay) {
            node.playsInline = true
            node.setAttribute("playsinline", "")
            node.setAttribute("webkit-playsinline", "")
            triggerAutoplay()
        }
    }, [autoPlay, triggerAutoplay])

    const containerStyle: CSSProperties = {
        ...styles.container,
        borderRadius: borderRadius ? `${borderRadius}px` : "0px",
        cursor: isAudioBlocked && !muted ? "pointer" : "default",
        ...style,
    }

    const videoElementStyle: CSSProperties = {
        ...styles.video,
        objectFit: objectFit || "cover",
    }

    return (
        <div
            style={containerStyle}
            onClick={() => {
                if (isAudioBlocked && !muted) {
                    unmuteAudio()
                }
            }}
            {...restProps}
        >
            {activeVideoUrl ? (
                <>
                    <video
                        ref={handleVideoRef}
                        key={activeVideoUrl}
                        src={activeVideoUrl}
                        poster={posterUrl || undefined}
                        autoPlay={autoPlay}
                        loop={loop}
                        muted={muted}
                        controls={controls}
                        playsInline
                        onCanPlay={triggerAutoplay}
                        onLoadedData={triggerAutoplay}
                        onLoadedMetadata={triggerAutoplay}
                        style={videoElementStyle}
                    />

                    {/* Botão de desbloqueio de som se o browser forçou o silêncio inicial */}
                    {isAudioBlocked && !muted && showUnmuteButton && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                unmuteAudio()
                            }}
                            style={styles.unmuteButton}
                            aria-label="Ativar Som"
                            title="Clique para ativar o som do vídeo"
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
                                style={{ display: "block", flexShrink: 0 }}
                            >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                            <span>Ativar Som</span>
                        </button>
                    )}
                </>
            ) : (
                <div style={styles.placeholder}>
                    <p style={styles.placeholderTitle}>Nenhum Vídeo Configurado</p>
                    <p style={styles.placeholderDesc}>
                        Insira um URL de vídeo nas propriedades do componente no Framer.
                    </p>
                </div>
            )}
        </div>
    )
}

addPropertyControls(GeoVideoPlayer, {
    // 1. Campos de Vídeo por Localização
    videoGlobal: {
        type: ControlType.String,
        title: "URL Vídeo Global",
        description: "Vídeo padrão exibido no início e para localizações sem vídeo dedicado.",
        defaultValue: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        placeholder: "https://exemplo.com/video-global.mp4",
    },
    videoPT: {
        type: ControlType.String,
        title: "URL Vídeo Portugal",
        description: "Vídeo exibido para utilizadores localizados em Portugal (PT).",
        defaultValue: "",
        placeholder: "https://exemplo.com/video-portugal.mp4",
    },
    videoES: {
        type: ControlType.String,
        title: "URL Vídeo Espanha",
        description: "Vídeo exibido para utilizadores localizados em Espanha (ES).",
        defaultValue: "",
        placeholder: "https://exemplo.com/video-espanha.mp4",
    },
    videoFR: {
        type: ControlType.String,
        title: "URL Vídeo França",
        description: "Vídeo exibido para utilizadores localizados em França (FR).",
        defaultValue: "",
        placeholder: "https://exemplo.com/video-franca.mp4",
    },
    videoDE: {
        type: ControlType.String,
        title: "URL Vídeo Alemanha",
        description: "Vídeo exibido para utilizadores localizados na Alemanha (DE).",
        defaultValue: "",
        placeholder: "https://exemplo.com/video-alemanha.mp4",
    },
    videoDK: {
        type: ControlType.String,
        title: "URL Vídeo Dinamarca",
        description: "Vídeo exibido para utilizadores localizados na Dinamarca (DK).",
        defaultValue: "",
        placeholder: "https://exemplo.com/video-dinamarca.mp4",
    },

    // 2. Controlos de Reprodução e Autoplay Agressivo
    autoPlay: {
        type: ControlType.Boolean,
        title: "Forçar Autoplay",
        defaultValue: true,
        description: "Força a reprodução automática a qualquer custo (tenta com som; se o browser bloquear, reproduz silenciado).",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Sem Som Inicial",
        defaultValue: false,
        description: "Se desmarcado, tenta tocar com som. Se o browser bloquear, inicia mudo e ativa o som na 1ª interação.",
    },
    unmuteOnInteraction: {
        type: ControlType.Boolean,
        title: "Som na 1ª Interação",
        defaultValue: true,
        description: "Desbloqueia e ativa o som assim que o utilizador clica ou toca em qualquer local da página.",
    },
    showUnmuteButton: {
        type: ControlType.Boolean,
        title: "Botão 'Ativar Som'",
        defaultValue: true,
        description: "Apresenta um botão flutuante para ativar o som quando o navegador bloqueou o áudio inicial.",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        description: "Repete o vídeo continuamente.",
    },
    controls: {
        type: ControlType.Boolean,
        title: "Controlos Nativos",
        defaultValue: false,
        description: "Mostra a barra de controlos do leitor de vídeo.",
    },

    // 3. Estilo e Aspeto Visual
    objectFit: {
        type: ControlType.Enum,
        title: "Ajuste (Fit)",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover (Cobrir)", "Contain (Conter)", "Fill (Preencher)"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Raio dos Cantos",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    posterUrl: {
        type: ControlType.String,
        title: "Imagem Poster (Opcional)",
        defaultValue: "",
        placeholder: "https://exemplo.com/poster.jpg",
    },

    // 4. Teste e Simulação no Editor do Framer
    previewCountry: {
        type: ControlType.Enum,
        title: "Simular País (Canvas)",
        options: ["auto", "PT", "ES", "FR", "DE", "DK", "GLOBAL"],
        optionTitles: [
            "Automático (IP Real)",
            "Portugal (PT)",
            "Espanha (ES)",
            "França (FR)",
            "Alemanha (DE)",
            "Dinamarca (DK)",
            "Global (Forçar Default)",
        ],
        defaultValue: "auto",
        description: "Permite testar e pré-visualizar cada vídeo no canvas do Framer sem precisar de VPN.",
    },
})
