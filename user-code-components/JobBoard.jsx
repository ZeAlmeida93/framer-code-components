import React, { useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { Search, Plus, Minus } from "lucide-react"

const jobListings = [
    {
        id: 1,
        title: "PROJECT MANAGER (M/F) | Barqueiros",
        description:
            "We are looking for an experienced Project Manager to lead our dynamic team. You will be responsible for planning, overseeing, and leading projects from ideation through to completion. Strong leadership and communication skills are required.",
    },
    {
        id: 2,
        title: "3D DESIGNER (M/F) | Barqueiros",
        description:
            "Join our creative team as a 3D Designer. You will be tasked with creating high-quality 3D models, textures, and animations for our upcoming product lines. Proficiency in Blender, Maya, or similar software is essential.",
    },
    {
        id: 3,
        title: "COMMERCIAL DIRECTOR (M/F) | Barqueiros",
        description:
            "Seeking a driven Commercial Director to develop and implement commercial strategies according to company goals and objectives aiming to accelerate growth. Exceptional negotiation and strategic planning skills are a must.",
    },
    {
        id: 4,
        title: "MAINTENANCE MANAGER (M/F) | Acatel",
        description:
            "The Maintenance Manager will oversee all installation, repair, and upkeep operations of our company's facilities. You will ensure that your colleagues have the best physical resources available to complete their duties according to budget.",
    },
    {
        id: 5,
        title: "CIRCULAR KNITTING OPERATOR (M/F) | Barqueiros",
        description:
            "We are hiring a Circular Knitting Operator. The ideal candidate will have experience operating industrial circular knitting machines, ensuring quality control, and maintaining a safe and efficient workspace.",
    },
    {
        id: 6,
        title: "SEAMLESS KNITTING OPERATOR (M/F) | Barqueiros",
        description:
            "Looking for a skilled Seamless Knitting Operator. Responsibilities include setting up and operating seamless knitting machines, monitoring production for defects, and performing basic machine maintenance.",
    },
]

export default function JobBoard({
    headingText = "Check our Open Positions.",
    headingFontSize = 48,
    headingFontWeight = 800,
    fontFamilyChoice = "inherit",
    customFontFamily = "",
    widthUnit = "rem",
    widthValue = 56,
}) {
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedJobId, setExpandedJobId] = useState(null)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const [hoveredJobId, setHoveredJobId] = useState(null)
    const [hoveredApplyId, setHoveredApplyId] = useState(null)

    // Load Montserrat and Inter from Google Fonts as fallback options
    React.useEffect(() => {
        const linkId = "framer-job-board-fonts"
        if (!document.getElementById(linkId)) {
            const link = document.createElement("link")
            link.id = linkId
            link.rel = "stylesheet"
            link.href =
                "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800&display=swap"
            document.head.appendChild(link)
        }
    }, [])

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

    // Filter jobs based on the search query
    const filteredJobs = jobListings.filter((job) =>
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
                                fontSize: "0.875rem",
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
                    {filteredJobs.length > 0 ? (
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
                                                fontSize:
                                                    "clamp(1.125rem, 2.5vw, 1.25rem)",
                                                fontWeight: 700,
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
                                                ? "400px"
                                                : "0px",
                                            opacity: isExpanded ? 1 : 0,
                                            paddingBottom: isExpanded
                                                ? "24px"
                                                : "0px",
                                            transition:
                                                "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out",
                                        }}
                                    >
                                        <p
                                            style={{
                                                color: "#4b5563",
                                                lineHeight: 1.625,
                                                paddingRight: "56px",
                                                marginTop: 0,
                                                marginBottom: 0,
                                            }}
                                        >
                                            {job.description}
                                        </p>

                                        {/* Apply Button */}
                                        <button
                                            onMouseEnter={() =>
                                                setHoveredApplyId(job.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredApplyId(null)
                                            }
                                            style={{
                                                fontFamily: "inherit",
                                                marginTop: "16px",
                                                paddingLeft: "24px",
                                                paddingRight: "24px",
                                                paddingTop: "8px",
                                                paddingBottom: "8px",
                                                backgroundColor: isApplyHovered
                                                    ? "#1f2937"
                                                    : "#000000",
                                                color: "#ffffff",
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                                borderRadius: "9999px",
                                                border: "none",
                                                cursor: "pointer",
                                                transition:
                                                    "background-color 0.2s",
                                            }}
                                        >
                                            Apply Now
                                        </button>
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
                            No positions found matching "{searchQuery}".
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(JobBoard, {
    // Controlos do Título (Heading)
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
