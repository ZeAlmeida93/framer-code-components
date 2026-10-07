import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"
import { Search, Plus, Minus, Loader2 } from "lucide-react"

const fallbackJobListings = [
    {
        id: 1,
        title: "PROJECT MANAGER (M/F) | Barqueiros",
        description:
            "We are looking for an experienced Project Manager to lead our dynamic team. You will be responsible for planning, overseeing, and leading projects from ideation through to completion. Strong leadership and communication skills are required.",
        applyUrl: "#",
    },
    {
        id: 2,
        title: "3D DESIGNER (M/F) | Barqueiros",
        description:
            "Join our creative team as a 3D Designer. You will be tasked with creating high-quality 3D models, textures, and animations for our upcoming product lines. Proficiency in Blender, Maya, or similar software is essential.",
        applyUrl: "#",
    },
    {
        id: 3,
        title: "COMMERCIAL DIRECTOR (M/F) | Barqueiros",
        description:
            "Seeking a driven Commercial Director to develop and implement commercial strategies according to company goals and objectives aiming to accelerate growth. Exceptional negotiation and strategic planning skills are a must.",
        applyUrl: "#",
    },
    {
        id: 4,
        title: "MAINTENANCE MANAGER (M/F) | Acatel",
        description:
            "The Maintenance Manager will oversee all installation, repair, and upkeep operations of our company's facilities. You will ensure that your colleagues have the best physical resources available to complete their duties according to budget.",
        applyUrl: "#",
    },
    {
        id: 5,
        title: "CIRCULAR KNITTING OPERATOR (M/F) | Barqueiros",
        description:
            "We are hiring a Circular Knitting Operator. The ideal candidate will have experience operating industrial circular knitting machines, ensuring quality control, and maintaining a safe and efficient workspace.",
        applyUrl: "#",
    },
    {
        id: 6,
        title: "SEAMLESS KNITTING OPERATOR (M/F) | Barqueiros",
        description:
            "Looking for a skilled Seamless Knitting Operator. Responsibilities include setting up and operating seamless knitting machines, monitoring production for defects, and performing basic machine maintenance.",
        applyUrl: "#",
    },
]

// Normalization function to handle Strapi v4 (item.attributes), Strapi v5, or flat JSON APIs
// Description is kept as-is (may be a Rich Text block array or a plain string)
const parseStrapiJobItem = (item, index) => {
    if (!item) return null
    const attrs = item.attributes ? item.attributes : item

    return {
        id: item.id || attrs.id || index + 1,
        title:
            attrs.title ||
            attrs.Title ||
            attrs.name ||
            attrs.Name ||
            attrs.job_title ||
            "Untitled Position",
        // Preserve raw value — may be a Strapi Blocks array OR a plain string
        description:
            attrs.description ??
            attrs.Description ??
            attrs.summary ??
            attrs.Summary ??
            attrs.details ??
            "",
        applyUrl:
            attrs.applyUrl ||
            attrs.apply_url ||
            attrs.link ||
            attrs.url ||
            "#",
    }
}

// ---------------------------------------------------------------------------
// Strapi Rich Text (Blocks editor) renderer
// Handles: paragraph, heading, list, list-item, quote, code, text (with marks)
// Falls back gracefully for plain strings or unknown node types
// ---------------------------------------------------------------------------

const renderStrapiTextNode = (node, idx) => {
    if (!node) return null
    if (typeof node === "string") return node

    const { type, text, bold, italic, underline, strikethrough, code, children } = node

    if (type === "text" || text !== undefined) {
        let el = text || ""
        // Apply inline marks
        if (code) el = <code key={idx} style={{ fontFamily: "monospace", backgroundColor: "#f3f4f6", padding: "1px 4px", borderRadius: "3px", fontSize: "0.9em" }}>{el}</code>
        if (bold) el = <strong key={idx}>{el}</strong>
        if (italic) el = <em key={idx}>{el}</em>
        if (underline) el = <u key={idx}>{el}</u>
        if (strikethrough) el = <s key={idx}>{el}</s>
        return <React.Fragment key={idx}>{el}</React.Fragment>
    }

    // Recursive children rendering
    const renderedChildren = Array.isArray(children)
        ? children.map((child, i) => renderStrapiTextNode(child, i))
        : null

    if (type === "link") {
        const href = node.url || "#"
        return (
            <a key={idx} href={href} target="_blank" rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}>
                {renderedChildren}
            </a>
        )
    }

    return <React.Fragment key={idx}>{renderedChildren}</React.Fragment>
}

const renderStrapiBlocks = (blocks, baseStyle) => {
    if (!blocks) return null

    // Plain string fallback
    if (typeof blocks === "string") {
        return (
            <p style={{ ...baseStyle, marginTop: 0, marginBottom: "0.75em", whiteSpace: "pre-wrap" }}>
                {blocks}
            </p>
        )
    }

    // HTML string fallback (shouldn't happen with modern Strapi, but just in case)
    if (typeof blocks === "string" && blocks.trim().startsWith("<")) {
        return <div style={baseStyle} dangerouslySetInnerHTML={{ __html: blocks }} />
    }

    if (!Array.isArray(blocks)) return null

    return blocks.map((block, idx) => {
        const children = Array.isArray(block.children)
            ? block.children.map((child, i) => renderStrapiTextNode(child, i))
            : null

        switch (block.type) {
            case "paragraph":
                return (
                    <p key={idx} style={{ ...baseStyle, marginTop: 0, marginBottom: "0.75em" }}>
                        {children}
                    </p>
                )

            case "heading": {
                const level = block.level || 2
                const Tag = `h${Math.min(Math.max(level, 1), 6)}`
                const headingSizes = { 1: "1.5em", 2: "1.3em", 3: "1.1em", 4: "1em", 5: "0.95em", 6: "0.9em" }
                return (
                    <Tag key={idx} style={{ ...baseStyle, fontWeight: 700, fontSize: headingSizes[level] || "1.1em", marginTop: idx === 0 ? 0 : "1em", marginBottom: "0.4em" }}>
                        {children}
                    </Tag>
                )
            }

            case "list": {
                const ListTag = block.format === "ordered" ? "ol" : "ul"
                const listItems = Array.isArray(block.children)
                    ? block.children.map((li, liIdx) => {
                        const liChildren = Array.isArray(li.children)
                            ? li.children.map((child, i) => renderStrapiTextNode(child, i))
                            : null
                        return (
                            <li key={liIdx} style={{ marginBottom: "0.25em" }}>
                                {liChildren}
                            </li>
                        )
                    })
                    : null
                return (
                    <ListTag key={idx} style={{ ...baseStyle, paddingLeft: "1.5em", marginTop: 0, marginBottom: "0.75em" }}>
                        {listItems}
                    </ListTag>
                )
            }

            case "quote":
                return (
                    <blockquote key={idx} style={{ ...baseStyle, borderLeft: "3px solid #d1d5db", paddingLeft: "1em", marginLeft: 0, marginTop: 0, marginBottom: "0.75em", color: "#6b7280", fontStyle: "italic" }}>
                        {children}
                    </blockquote>
                )

            case "code":
                return (
                    <pre key={idx} style={{ backgroundColor: "#f3f4f6", padding: "12px", borderRadius: "6px", overflowX: "auto", marginTop: 0, marginBottom: "0.75em", fontSize: "0.875em" }}>
                        <code style={{ fontFamily: "monospace", color: "#1f2937" }}>
                            {children}
                        </code>
                    </pre>
                )

            case "image":
                if (block.image && block.image.url) {
                    return (
                        <img key={idx} src={block.image.url} alt={block.image.alternativeText || ""}
                            style={{ maxWidth: "100%", borderRadius: "6px", marginBottom: "0.75em" }} />
                    )
                }
                return null

            default:
                // Unknown block type: render children as a paragraph
                return children ? (
                    <p key={idx} style={{ ...baseStyle, marginTop: 0, marginBottom: "0.75em" }}>
                        {children}
                    </p>
                ) : null
        }
    })
}

// Safe wrapper component to prevent render errors bubbling up
const RichTextDescription = ({ description, style }) => {
    try {
        const content = renderStrapiBlocks(description, style)
        return <div style={{ marginTop: 0, marginBottom: 0 }}>{content}</div>
    } catch (err) {
        // Last-resort fallback: render as plain text
        const text = typeof description === "string" ? description : ""
        return <p style={{ ...style, marginTop: 0, marginBottom: 0 }}>{text}</p>
    }
}

export default function JobBoard({
    strapiUrl = "https://hr.impetusgroup.pt/api/jobs",
    apiToken = "",
    useFallbackOnFailure = true,
    headingText = "Check our Open Positions.",
    headingFontSize = 48,
    headingFontWeight = 800,
    jobTitleFontSize = 20,
    jobTitleFontWeight = 700,
    jobDescFontSize = 16,
    jobDescFontWeight = 400,
    inputFontSize = 14,
    buttonFontSize = 14,
    buttonFontWeight = 600,
    fontFamilyChoice = "inherit",
    customFontFamily = "",
    widthUnit = "rem",
    widthValue = 56,
}) {
    const [jobs, setJobs] = useState(fallbackJobListings)
    const [isLoading, setIsLoading] = useState(false)
    const [fetchError, setFetchError] = useState(null)

    const [searchQuery, setSearchQuery] = useState("")
    const [expandedJobId, setExpandedJobId] = useState(null)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const [hoveredJobId, setHoveredJobId] = useState(null)
    const [hoveredApplyId, setHoveredApplyId] = useState(null)

    // Load Montserrat and Inter from Google Fonts as fallback options
    useEffect(() => {
        const linkId = "framer-job-board-fonts"
        if (!document.getElementById(linkId)) {
            const link = document.createElement("link")
            link.id = linkId
            link.rel = "stylesheet"
            link.href =
                "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap"
            document.head.appendChild(link)
        }
    }, [])

    // Fetch jobs from Strapi CMS API
    useEffect(() => {
        if (!strapiUrl || strapiUrl.trim() === "") {
            setJobs(useFallbackOnFailure ? fallbackJobListings : [])
            setIsLoading(false)
            return
        }

        let isMounted = true
        setIsLoading(true)
        setFetchError(null)

        const headers = {
            "Content-Type": "application/json",
        }
        if (apiToken && apiToken.trim() !== "") {
            headers["Authorization"] = `Bearer ${apiToken.trim()}`
        }

        fetch(strapiUrl.trim(), { headers })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }
                return res.json()
            })
            .then((data) => {
                if (!isMounted) return
                const rawList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : []

                const parsed = rawList
                    .map((item, idx) => parseStrapiJobItem(item, idx))
                    .filter(Boolean)

                if (parsed.length > 0) {
                    setJobs(parsed)
                } else if (useFallbackOnFailure) {
                    setJobs(fallbackJobListings)
                } else {
                    setJobs([])
                }
                setIsLoading(false)
            })
            .catch((err) => {
                if (!isMounted) return
                console.warn("Strapi API Fetch Error:", err)
                setFetchError(err.message)
                if (useFallbackOnFailure) {
                    setJobs(fallbackJobListings)
                } else {
                    setJobs([])
                }
                setIsLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [strapiUrl, apiToken, useFallbackOnFailure])

    // Determine font family stack based on backoffice property controls
    let computedFontFamily = 'inherit, "Montserrat", "Inter", sans-serif'
    if (fontFamilyChoice === "Montserrat") {
        computedFontFamily = '"Montserrat", "Inter", sans-serif'
    } else if (fontFamilyChoice === "Inter") {
        computedFontFamily = '"Inter", "Montserrat", sans-serif'
    } else if (
        fontFamilyChoice === "Custom" &&
        customFontFamily &&
        customFontFamily.trim() !== ""
    ) {
        computedFontFamily = `"${customFontFamily.trim()}", "Montserrat", "Inter", sans-serif`
    }

    // Determine max width from backoffice property controls
    const computedMaxWidth = `${widthValue}${widthUnit}`

    // Filter jobs based on search query
    const filteredJobs = jobs.filter((job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Handle accordion toggle
    const toggleJob = (id) => {
        if (expandedJobId === id) {
            setExpandedJobId(null)
        } else {
            setExpandedJobId(id)
        }
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: computedFontFamily,
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "64px",
                paddingBottom: "64px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    maxWidth: computedMaxWidth,
                    width: "100%",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                {/* Heading */}
                <h1
                    style={{
                        fontSize:
                            typeof headingFontSize === "number"
                                ? `${headingFontSize}px`
                                : headingFontSize,
                        fontWeight: headingFontWeight,
                        textAlign: "center",
                        letterSpacing: "-0.025em",
                        color: "#111827",
                        marginBottom: "40px",
                        marginTop: 0,
                    }}
                >
                    {headingText}
                </h1>

                {/* Search Bar Container */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "64px",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: "32rem",
                        }}
                    >
                        {/* Search Icon */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: 0,
                                paddingLeft: "16px",
                                display: "flex",
                                alignItems: "center",
                                pointerEvents: "none",
                            }}
                        >
                            <Search
                                style={{
                                    height: "20px",
                                    width: "20px",
                                    color: "#9ca3af",
                                }}
                            />
                        </div>

                        {/* Input Field */}
                        <input
                            type="text"
                            placeholder="Search for a Job Description"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            style={{
                                fontFamily: "inherit",
                                fontSize: `${inputFontSize}px`,
                                display: "block",
                                width: "100%",
                                paddingLeft: "48px",
                                paddingRight: "16px",
                                paddingTop: "12px",
                                paddingBottom: "12px",
                                border: isInputFocused
                                    ? "1px solid #000000"
                                    : "1px solid #d1d5db",
                                borderRadius: "9999px",
                                lineHeight: "1.25rem",
                                backgroundColor: "#ffffff",
                                outline: "none",
                                color: "#000000",
                                boxShadow: isInputFocused
                                    ? "0 0 0 1px #000000"
                                    : "none",
                                transition:
                                    "border-color 0.2s, box-shadow 0.2s",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </div>

                {/* Job List Accordion */}
                <div
                    style={{
                        borderTop: "1px solid #d1d5db",
                    }}
                >
                    {isLoading ? (
                        <div
                            style={{
                                paddingTop: "48px",
                                paddingBottom: "48px",
                                textAlign: "center",
                                color: "#6b7280",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <Loader2
                                style={{
                                    width: "24px",
                                    height: "24px",
                                    animation: "spin 1s linear infinite",
                                }}
                            />
                            <span>Loading open positions...</span>
                            <style>{`
                                @keyframes spin {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => {
                            const isExpanded = expandedJobId === job.id
                            const isHeaderHovered = hoveredJobId === job.id
                            const isApplyHovered = hoveredApplyId === job.id

                            return (
                                <div
                                    key={job.id}
                                    style={{
                                        borderBottom: "1px solid #d1d5db",
                                    }}
                                >
                                    {/* Accordion Header (Clickable) */}
                                    <button
                                        onClick={() => toggleJob(job.id)}
                                        onMouseEnter={() =>
                                            setHoveredJobId(job.id)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredJobId(null)
                                        }
                                        aria-expanded={isExpanded}
                                        style={{
                                            fontFamily: "inherit",
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingTop: "24px",
                                            paddingBottom: "24px",
                                            backgroundColor: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            outline: "none",
                                            textAlign: "left",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: `${jobTitleFontSize}px`,
                                                fontWeight: jobTitleFontWeight,
                                                color: "#111827",
                                                textAlign: "left",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.025em",
                                            }}
                                        >
                                            {job.title}
                                        </span>

                                        {/* Circular Plus/Minus Icon */}
                                        <div
                                            style={{
                                                flexShrink: 0,
                                                marginLeft: "16px",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "9999px",
                                                border: isHeaderHovered
                                                    ? "1px solid #000000"
                                                    : "1px solid #9ca3af",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: isHeaderHovered
                                                    ? "#000000"
                                                    : "#4b5563",
                                                transition:
                                                    "border-color 0.2s, color 0.2s",
                                            }}
                                        >
                                            {isExpanded ? (
                                                <Minus
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                    }}
                                                />
                                            ) : (
                                                <Plus
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </button>

                                    {/* Accordion Content (Description) */}
                                    <div
                                        style={{
                                            overflow: "hidden",
                                            maxHeight: isExpanded
                                                ? "fit-content"
                                                : "0px",
                                            opacity: isExpanded ? 1 : 0,
                                            paddingBottom: isExpanded
                                                ? "24px"
                                                : "0px",
                                            transition:
                                                "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out",
                                        }}
                                    >
                                        <RichTextDescription
                                            description={job.description}
                                            style={{
                                                fontSize: `${jobDescFontSize}px`,
                                                fontWeight: jobDescFontWeight,
                                                color: "#4b5563",
                                                lineHeight: 1.625,
                                                paddingRight: "56px",
                                            }}
                                        />

                                        {/* Apply Button */}
                                        <a
                                            href={job.applyUrl || "#"}
                                            target={
                                                job.applyUrl &&
                                                    job.applyUrl !== "#"
                                                    ? "_blank"
                                                    : "_self"
                                            }
                                            rel="noopener noreferrer"
                                            onMouseEnter={() =>
                                                setHoveredApplyId(job.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredApplyId(null)
                                            }
                                            style={{
                                                fontFamily: "inherit",
                                                fontSize: `${buttonFontSize}px`,
                                                fontWeight: buttonFontWeight,
                                                display: "inline-block",
                                                textDecoration: "none",
                                                marginTop: "16px",
                                                paddingLeft: "24px",
                                                paddingRight: "24px",
                                                paddingTop: "8px",
                                                paddingBottom: "8px",
                                                backgroundColor: isApplyHovered
                                                    ? "#1f2937"
                                                    : "#000000",
                                                color: "#ffffff",
                                                borderRadius: "9999px",
                                                border: "none",
                                                cursor: "pointer",
                                                transition:
                                                    "background-color 0.2s",
                                            }}
                                        >
                                            Apply Now
                                        </a>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div
                            style={{
                                paddingTop: "48px",
                                paddingBottom: "48px",
                                textAlign: "center",
                                color: "#6b7280",
                            }}
                        >
                            {searchQuery
                                ? `No positions found matching "${searchQuery}".`
                                : "No open positions available at the moment."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(JobBoard, {
    // Configurações do Strapi CMS API
    strapiUrl: {
        type: ControlType.String,
        title: "Strapi API Endpoint",
        defaultValue: "https://hr.impetusgroup.pt/api/jobs",
    },
    apiToken: {
        type: ControlType.String,
        title: "API Token (Optional)",
        defaultValue: "",
    },
    useFallbackOnFailure: {
        type: ControlType.Boolean,
        title: "Fallback Sample Data",
        defaultValue: true,
    },

    // Controlos do Título Principal (Heading)
    headingText: {
        type: ControlType.String,
        title: "Heading Text",
        defaultValue: "Check our Open Positions.",
    },
    headingFontSize: {
        type: ControlType.Number,
        title: "Heading Size",
        defaultValue: 48,
        min: 16,
        max: 120,
        step: 1,
        unit: "px",
    },
    headingFontWeight: {
        type: ControlType.Enum,
        title: "Heading Weight",
        options: [400, 500, 600, 700, 800, 900],
        optionTitles: [
            "400 (Regular)",
            "500 (Medium)",
            "600 (SemiBold)",
            "700 (Bold)",
            "800 (ExtraBold)",
            "900 (Black)",
        ],
        defaultValue: 800,
    },

    // Controlos do Título das Vagas (Job Titles)
    jobTitleFontSize: {
        type: ControlType.Number,
        title: "Job Title Size",
        defaultValue: 20,
        min: 12,
        max: 60,
        step: 1,
        unit: "px",
    },
    jobTitleFontWeight: {
        type: ControlType.Enum,
        title: "Job Title Weight",
        options: [400, 500, 600, 700, 800, 900],
        optionTitles: [
            "400 (Regular)",
            "500 (Medium)",
            "600 (SemiBold)",
            "700 (Bold)",
            "800 (ExtraBold)",
            "900 (Black)",
        ],
        defaultValue: 700,
    },

    // Controlos da Descrição das Vagas (Job Description)
    jobDescFontSize: {
        type: ControlType.Number,
        title: "Description Size",
        defaultValue: 16,
        min: 10,
        max: 36,
        step: 1,
        unit: "px",
    },
    jobDescFontWeight: {
        type: ControlType.Enum,
        title: "Description Weight",
        options: [300, 400, 500, 600, 700],
        optionTitles: [
            "300 (Light)",
            "400 (Regular)",
            "500 (Medium)",
            "600 (SemiBold)",
            "700 (Bold)",
        ],
        defaultValue: 400,
    },

    // Controlos do Campo de Pesquisa (Search Input)
    inputFontSize: {
        type: ControlType.Number,
        title: "Search Text Size",
        defaultValue: 14,
        min: 10,
        max: 32,
        step: 1,
        unit: "px",
    },

    // Controlos do Botão (Apply Button)
    buttonFontSize: {
        type: ControlType.Number,
        title: "Button Text Size",
        defaultValue: 14,
        min: 10,
        max: 32,
        step: 1,
        unit: "px",
    },
    buttonFontWeight: {
        type: ControlType.Enum,
        title: "Button Weight",
        options: [400, 500, 600, 700, 800],
        optionTitles: [
            "400 (Regular)",
            "500 (Medium)",
            "600 (SemiBold)",
            "700 (Bold)",
            "800 (ExtraBold)",
        ],
        defaultValue: 600,
    },

    // Controlos de Tipografia (Font Family)
    fontFamilyChoice: {
        type: ControlType.Enum,
        title: "Font Family",
        options: ["inherit", "Montserrat", "Inter", "Custom"],
        optionTitles: [
            "Website (Inherit)",
            "Montserrat",
            "Inter",
            "Custom Font",
        ],
        defaultValue: "inherit",
    },
    customFontFamily: {
        type: ControlType.String,
        title: "Custom Font Name",
        defaultValue: "Arial",
        hidden(props) {
            return props.fontFamilyChoice !== "Custom"
        },
    },

    // Controlos de Dimensão e Largura (Width)
    widthUnit: {
        type: ControlType.Enum,
        title: "Width Unit",
        options: ["rem", "px", "%", "vw"],
        optionTitles: [
            "rem",
            "px (Pixels)",
            "% (Percentage)",
            "vw (Viewport)",
        ],
        defaultValue: "rem",
    },
    widthValue: {
        type: ControlType.Number,
        title: "Width Value",
        defaultValue: 56,
        min: 1,
        max: 2000,
        step: 1,
    },
})
