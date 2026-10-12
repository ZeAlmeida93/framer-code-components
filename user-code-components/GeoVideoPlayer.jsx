import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * GeoVideoPlayer - Framer Code Component
 * 
 * Componente de vídeo que altera a reprodução dinamicamente com base na
 * geolocalização por IP do utilizador (via Cloudflare Trace API).
 * 
 * Regras estritas:
 * - Sem classes Tailwind CSS.
 * - Estilos 100% em linha com 'fontFamily: inherit' para máxima performance e prevenção do Error Code 5.
 * - Inicia com o vídeo Global e atualiza assim que o país for detetado.
 */

const styles = {
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
}

export default function GeoVideoPlayer({
    videoGlobal = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoPT = "",
    videoES = "",
    videoFR = "",
    videoDE = "",
    videoDK = "",
    autoPlay = true,
    loop = true,
    muted = true,
    controls = false,
    objectFit = "cover",
    borderRadius = 0,
    previewCountry = "auto",
    posterUrl = "",
    style,
    ...restProps
}) {
    // Estado com o código de país extraído do IP (ex: "PT", "ES", "FR", "DE", "DK")
    const [countryCode, setCountryCode] = useState(null)

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
            } catch (err) {
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

    const containerStyle = {
        ...styles.container,
        borderRadius: borderRadius ? `${borderRadius}px` : "0px",
        ...style,
    }

    const videoElementStyle = {
        ...styles.video,
        objectFit: objectFit || "cover",
    }

    return (
        <div style={containerStyle} {...restProps}>
            {activeVideoUrl ? (
                <video
                    key={activeVideoUrl}
                    src={activeVideoUrl}
                    poster={posterUrl || undefined}
                    autoPlay={autoPlay}
                    loop={loop}
                    muted={muted}
                    controls={controls}
                    playsInline
                    style={videoElementStyle}
                />
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

    // 2. Controlos de Reprodução
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        description: "Reproduz automaticamente quando carregado (requer Muted ativado nos browsers).",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        description: "Repete o vídeo continuamente.",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Sem Som (Muted)",
        defaultValue: true,
        description: "Necessário para autoplay na maioria dos browsers.",
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
