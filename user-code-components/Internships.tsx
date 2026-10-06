import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const defaultPrograms = [
    {
        id: "1",
        title: "PROFESSIONAL (FIRST-ENTRY)",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        content:
            "The Impetus New Generation program promotes professional internships in a joint partnership between Impetus and the IEFP, providing recent graduates with the opportunity to join various work teams within the company. These professional internships are an initiative that combines previously acquired theoretical training with practical experience in a real work environment, under the close supervision of a company-designated tutor, giving young people the opportunity to gain relevant experience in the job market.\n\nAt Impetus, interns will have access to a dynamic and innovative environment where they can apply their knowledge and develop their skills. Impetus is fully committed to providing a high-quality work experience where skill transfer and the continuous development of our interns is a reality, and where participation in value-added projects for the organization is a core objective. Therefore, we are dedicated to providing a tailored guidance and mentoring program, offering the necessary tools and resources to help them achieve their goals.\nWith a retention rate of over 95% upon completion of the professional internship, internships at Impetus have been the gateway to a successful career for many young people, as well as an opportunity for Impetus to identify and attract talent to the company.",
        applyUrl: "#",
    },
    {
        id: "2",
        title: "COLLEGE DEGREE INTERNSHIPS",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
        content:
            "Impetus is recognized for its commitment to the quality of its products and processes, as well as for its innovative DNA. Through its curricular internships, Impetus annually provides various students from different academic backgrounds with the opportunity to experience professional contact with the textile sector. Through several protocols established between Impetus and various Educational Institutions, the goal is to contribute to the individual, academic, and professional development of the young people who have the opportunity to intern at the company.\n\nConsidering the importance and crucial role of internships in the professional and personal development of students, along with the costs associated with the internship, at Impetus we have a support procedure in place for this type of internship, which includes free lunch in our canteen and a transportation allowance. Academic internships at Impetus also involve reports or master's theses developed by the students, which detail the lessons learned and the takeaways from their experience, always supported by teams specialized in the sector and a dedicated tutor.",
        applyUrl: "#",
    },
    {
        id: "3",
        title: "SUMMER INTERNSHIPS",
        image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
        content:
            "Impetus recognizes the importance of providing special opportunities to our employees' families. With our Summer Internships, we aim to offer our employees' children an enriching and stimulating experience, allowing for the development of skills and the opportunity to explore areas of interest in a real work environment.\n\nThese interns are integrated into Impetus's work teams according to their interests and field of study. The company provides an internship grant and the respective personal accident insurance, as well as other exclusive offers and opportunities during and after the internship period.\n\nWe drive a future for the new Impetus generations who aim to develop themselves in the textile and technology sectors. Moving forward a new sustainable industry!",
        applyUrl: "#",
    },
]

export default function Internships({
    headerTitle = "NEW GENERATION",
    headerSubtitle = "Our Internship Programs",
    headerTitleFontSize = 32,
    headerTitleFontWeight = 700,
    headerSubtitleFontSize = 18,
    headerSubtitleFontWeight = 500,
    tabFontSize = 14,
    tabActiveFontWeight = 700,
    tabInactiveFontWeight = 500,
    tabWrapBehavior = "wrap",
    bodyFontSize = 14,
    bodyFontWeight = 400,
    bodyLineHeight = 1.7,
    bodyVerticalAlign = "center",
    buttonText = "APPLY HERE",
    buttonFontSize = 13,
    buttonFontWeight = 700,
    fontFamilyChoice = "inherit",
    customFontFamily = "",
    useCustomPadding = false,
    paddingAll = 32,
    paddingTop = 32,
    paddingRight = 32,
    paddingBottom = 32,
    paddingLeft = 32,
    backgroundColor = "#ffffff",
    textColor = "#1a1a1a",
    secondaryTextColor = "#888888",
    accentColor = "#1a1a1a",
    borderColor = "#eaeaea",
    activeTabLineColor = "#1a1a1a",
    programs = defaultPrograms,
}) {
    const [activeTabIndex, setActiveTabIndex] = useState(0)
    const [isFading, setIsFading] = useState(false)

    // Load Montserrat and Inter fonts dynamically from Google Fonts as fallbacks
    useEffect(() => {
        const linkId = "framer-internships-fonts"
        if (!document.getElementById(linkId)) {
            const link = document.createElement("link")
            link.id = linkId
            link.rel = "stylesheet"
            link.href =
                "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&display=swap"
            document.head.appendChild(link)
        }
    }, [])

    // Handle tab change with smooth 1-second ease-in-out crossfade transition
    const handleTabChange = (index) => {
        if (index === activeTabIndex || isFading) return
        setIsFading(true)
        setTimeout(() => {
            setActiveTabIndex(index)
            setIsFading(false)
        }, 500)
    }

    // Ensure valid programs list
    const activePrograms =
        Array.isArray(programs) && programs.length > 0
            ? programs
            : defaultPrograms

    const safeIndex =
        activeTabIndex >= 0 && activeTabIndex < activePrograms.length
            ? activeTabIndex
            : 0

    const currentProgram = activePrograms[safeIndex] || activePrograms[0]

    // Determine font stack order: inherit -> Montserrat -> Inter -> sans-serif
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

    // Determine component padding
    const computedPadding = useCustomPadding
        ? `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
        : `${paddingAll}px`

    // Determine text vertical alignment
    let flexVerticalAlign = "center"
    if (bodyVerticalAlign === "top") flexVerticalAlign = "flex-start"
    if (bodyVerticalAlign === "bottom") flexVerticalAlign = "flex-end"

    // Split content text into paragraphs by double or single line breaks
    const paragraphs = currentProgram.content
        ? currentProgram.content
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
        : []

    return (
        <div
            style={{
                width: "100%",
                backgroundColor: backgroundColor,
                color: textColor,
                fontFamily: computedFontFamily,
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "center",
                padding: computedPadding,
            }}
        >
            <style>{`
                .internships-container {
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                .internships-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-bottom: 24px;
                    border-bottom: 1px solid ${borderColor};
                    margin-bottom: 0px;
                }
                .internships-title {
                    font-size: ${headerTitleFontSize}px;
                    font-weight: ${headerTitleFontWeight};
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    margin: 0;
                    color: ${textColor};
                    line-height: 1.2;
                }
                .internships-subtitle {
                    font-size: ${headerSubtitleFontSize}px;
                    font-weight: ${headerSubtitleFontWeight};
                    color: ${textColor};
                    margin: 0;
                    line-height: 1.2;
                }
                .internships-content-grid {
                    display: flex;
                    flex-direction: row;
                    min-height: 520px;
                }
                .internships-image-col {
                    flex: 1 1 45%;
                    width: 45%;
                    position: relative;
                    overflow: hidden;
                    background-color: #f3f4f6;
                }
                .internships-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .internships-fade-target {
                    opacity: 1;
                    transition: opacity 0.5s ease-in-out;
                    will-change: opacity;
                }
                .internships-fade-target.fading {
                    opacity: 0;
                }
                .internships-details-col {
                    flex: 1 1 55%;
                    width: 55%;
                    padding: 40px 0 24px 48px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;
                    transition: padding 0.3s ease;
                }
                .internships-tabs-nav {
                    display: flex;
                    flex-wrap: ${tabWrapBehavior === "nowrap" ? "nowrap" : "wrap"};
                    column-gap: 28px;
                    row-gap: 14px;
                    border-bottom: 1px solid ${borderColor};
                    margin-bottom: 0px;
                    padding-bottom: 4px;
                    overflow-x: ${tabWrapBehavior === "nowrap" ? "auto" : "visible"};
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .internships-tabs-nav::-webkit-scrollbar {
                    display: none;
                }
                .internships-tab-btn {
                    background: none;
                    border: none;
                    padding: 0 0 10px 0;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: ${tabFontSize}px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    white-space: nowrap;
                    position: relative;
                    transition: color 0.3s ease-in-out;
                    flex-shrink: 0;
                }
                .internships-tab-btn.active {
                    color: ${textColor};
                    font-weight: ${tabActiveFontWeight};
                }
                .internships-tab-btn.inactive {
                    color: ${secondaryTextColor};
                    font-weight: ${tabInactiveFontWeight};
                }
                .internships-tab-btn.inactive:hover {
                    color: ${textColor};
                }
                .internships-tab-btn.active::after {
                    content: "";
                    position: absolute;
                    bottom: -5px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background-color: ${activeTabLineColor};
                    transition: background-color 0.3s ease-in-out;
                }
                .internships-body-wrapper {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: ${flexVerticalAlign};
                    padding: 32px 0;
                }
                .internships-body-text {
                    font-size: ${bodyFontSize}px;
                    font-weight: ${bodyFontWeight};
                    line-height: ${bodyLineHeight};
                    color: ${textColor};
                }
                .internships-body-paragraph {
                    margin: 0 0 20px 0;
                }
                .internships-body-paragraph:last-child {
                    margin-bottom: 0;
                }
                .internships-apply-wrapper {
                    display: flex;
                    justify-content: flex-end;
                    padding-top: 16px;
                }
                .internships-apply-link {
                    color: ${accentColor};
                    font-size: ${buttonFontSize}px;
                    font-weight: ${buttonFontWeight};
                    text-decoration: none;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: inline-block;
                    position: relative;
                    padding-bottom: 4px;
                    border-bottom: 1.5px solid ${accentColor};
                    transition: opacity 0.3s ease-in-out;
                }
                .internships-apply-link:hover {
                    opacity: 0.75;
                }

                @media (max-width: 1280px) {
                    .internships-details-col {
                        padding-left: 32px;
                    }
                    .internships-tabs-nav {
                        column-gap: 20px;
                        row-gap: 12px;
                    }
                }

                @media (max-width: 900px) {
                    .internships-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                        padding-bottom: 16px;
                    }
                    .internships-content-grid {
                        flex-direction: column;
                        min-height: auto;
                    }
                    .internships-image-col {
                        width: 100%;
                        height: 320px;
                        order: 2;
                    }
                    .internships-details-col {
                        width: 100%;
                        padding: 24px 0;
                        order: 1;
                    }
                    .internships-tabs-nav {
                        gap: 16px;
                        margin-bottom: 0px;
                    }
                    .internships-body-wrapper {
                        padding: 24px 0;
                    }
                    .internships-details-col {
                        order: 3;
                    }
                }
            `}</style>

            <div className="internships-container">
                {/* Header Section */}
                <div className="internships-header">
                    <h2 className="internships-title">{headerTitle}</h2>
                    <span className="internships-subtitle">{headerSubtitle}</span>
                </div>

                {/* Main Content Layout */}
                <div className="internships-content-grid">
                    {/* Left Column: Image */}
                    <div className="internships-image-col">
                        <img
                            src={currentProgram.image}
                            alt={currentProgram.title}
                            className={`internships-image internships-fade-target ${isFading ? "fading" : ""
                                }`}
                            loading="lazy"
                        />
                    </div>

                    {/* Right Column: Tabs & Program Information */}
                    <div className="internships-details-col">
                        {/* Navigation Tabs */}
                        <div className="internships-tabs-nav" role="tablist">
                            {activePrograms.map((prog, index) => {
                                const isActive = index === safeIndex
                                return (
                                    <button
                                        key={prog.id || index}
                                        role="tab"
                                        aria-selected={isActive}
                                        className={`internships-tab-btn ${isActive ? "active" : "inactive"
                                            }`}
                                        onClick={() => handleTabChange(index)}
                                    >
                                        {prog.title}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Body Paragraphs - Centered Vertically */}
                        <div className="internships-body-wrapper">
                            <div
                                className={`internships-body-text internships-fade-target ${isFading ? "fading" : ""
                                    }`}
                            >
                                {paragraphs.map((p, pIdx) => (
                                    <p
                                        key={pIdx}
                                        className="internships-body-paragraph"
                                    >
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Apply Link / Action Button */}
                        <div
                            className={`internships-apply-wrapper internships-fade-target ${isFading ? "fading" : ""
                                }`}
                        >
                            <a
                                href={currentProgram.applyUrl || "#"}
                                className="internships-apply-link"
                            >
                                {buttonText}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* Framer Property Controls */
addPropertyControls(Internships, {
    // Top Bar Headers
    headerTitle: {
        type: ControlType.String,
        title: "Header Title",
        defaultValue: "NEW GENERATION",
    },
    headerSubtitle: {
        type: ControlType.String,
        title: "Header Subtitle",
        defaultValue: "Our Internship Programs",
    },

    // Typography Options
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

    // Font Sizes & Weights
    headerTitleFontSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 32,
        min: 16,
        max: 80,
        step: 1,
        unit: "px",
    },
    headerTitleFontWeight: {
        type: ControlType.Enum,
        title: "Title Weight",
        options: [400, 500, 600, 700, 800, 900],
        optionTitles: ["Regular (400)", "Medium (500)", "SemiBold (600)", "Bold (700)", "ExtraBold (800)", "Black (900)"],
        defaultValue: 700,
    },
    headerSubtitleFontSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        defaultValue: 18,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
    },
    headerSubtitleFontWeight: {
        type: ControlType.Enum,
        title: "Subtitle Weight",
        options: [300, 400, 500, 600, 700],
        optionTitles: ["Light (300)", "Regular (400)", "Medium (500)", "SemiBold (600)", "Bold (700)"],
        defaultValue: 500,
    },
    tabFontSize: {
        type: ControlType.Number,
        title: "Tab Size",
        defaultValue: 14,
        min: 10,
        max: 32,
        step: 1,
        unit: "px",
    },
    tabActiveFontWeight: {
        type: ControlType.Enum,
        title: "Active Tab Weight",
        options: [500, 600, 700, 800],
        optionTitles: ["Medium (500)", "SemiBold (600)", "Bold (700)", "ExtraBold (800)"],
        defaultValue: 700,
    },
    tabInactiveFontWeight: {
        type: ControlType.Enum,
        title: "Inactive Tab Weight",
        options: [300, 400, 500, 600],
        optionTitles: ["Light (300)", "Regular (400)", "Medium (500)", "SemiBold (600)"],
        defaultValue: 500,
    },
    tabWrapBehavior: {
        type: ControlType.Enum,
        title: "Tab Wrap Mode",
        options: ["wrap", "nowrap"],
        optionTitles: ["Wrap to Next Line", "Single Line (No Wrap)"],
        defaultValue: "wrap",
    },
    bodyFontSize: {
        type: ControlType.Number,
        title: "Body Size",
        defaultValue: 14,
        min: 10,
        max: 28,
        step: 1,
        unit: "px",
    },
    bodyFontWeight: {
        type: ControlType.Enum,
        title: "Body Weight",
        options: [300, 400, 500, 600],
        optionTitles: ["Light (300)", "Regular (400)", "Medium (500)", "SemiBold (600)"],
        defaultValue: 400,
    },
    bodyLineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.7,
        min: 1.0,
        max: 3.0,
        step: 0.1,
    },
    bodyVerticalAlign: {
        type: ControlType.Enum,
        title: "Text Alignment",
        options: ["center", "top", "bottom"],
        optionTitles: ["Centered (Vertical)", "Top Aligned", "Bottom Aligned"],
        defaultValue: "center",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "APPLY HERE",
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 13,
        min: 10,
        max: 28,
        step: 1,
        unit: "px",
    },
    buttonFontWeight: {
        type: ControlType.Enum,
        title: "Button Weight",
        options: [400, 500, 600, 700, 800],
        optionTitles: ["Regular (400)", "Medium (500)", "SemiBold (600)", "Bold (700)", "ExtraBold (800)"],
        defaultValue: 700,
    },

    // Padding Controls
    useCustomPadding: {
        type: ControlType.Boolean,
        title: "Custom Padding",
        defaultValue: false,
    },
    paddingAll: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.useCustomPadding === true
        },
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.useCustomPadding !== true
        },
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.useCustomPadding !== true
        },
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.useCustomPadding !== true
        },
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.useCustomPadding !== true
        },
    },

    // Colors
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1a1a1a",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Inactive Tab Color",
        defaultValue: "#888888",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent / Apply Color",
        defaultValue: "#1a1a1a",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#eaeaea",
    },
    activeTabLineColor: {
        type: ControlType.Color,
        title: "Active Tab Line",
        defaultValue: "#1a1a1a",
    },

    // Programs Array
    programs: {
        type: ControlType.Array,
        title: "Programs",
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "ID" },
                title: { type: ControlType.String, title: "Tab Title" },
                image: { type: ControlType.Image, title: "Image" },
                content: {
                    type: ControlType.String,
                    title: "Description Text",
                    displayTextArea: true,
                },
                applyUrl: { type: ControlType.String, title: "Apply Link URL" },
            },
        },
        defaultValue: defaultPrograms,
    },
})
