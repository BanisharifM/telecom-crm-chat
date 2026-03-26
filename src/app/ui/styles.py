"""Custom CSS styles for the Streamlit application.

Professional dark CRM theme with:
- Inter font family
- Responsive design (mobile/tablet/desktop)
- Polished metric cards, chat bubbles, buttons
- Sidebar navigation styling
- Clean scrollbars and transitions
"""

CUSTOM_CSS = """
<style>
    /* ════════════════════════════════════════════
       FONTS
    ════════════════════════════════════════════ */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ════════════════════════════════════════════
       HIDE STREAMLIT CHROME
    ════════════════════════════════════════════ */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden !important;}

    /* ════════════════════════════════════════════
       LAYOUT
    ════════════════════════════════════════════ */
    .main .block-container {
        padding-top: 1.2rem;
        padding-bottom: 1rem;
        max-width: 1200px;
    }

    /* ════════════════════════════════════════════
       SIDEBAR
    ════════════════════════════════════════════ */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0B1120 0%, #162036 100%);
        border-right: 1px solid #1E293B;
    }
    [data-testid="stSidebar"] [data-testid="stMarkdown"] p {
        color: #CBD5E1;
    }
    /* Sidebar nav radio buttons */
    [data-testid="stSidebar"] .stRadio > label {
        color: #94A3B8 !important;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    [data-testid="stSidebar"] .stRadio [role="radiogroup"] label {
        padding: 8px 12px !important;
        border-radius: 8px;
        transition: all 0.15s ease;
    }
    [data-testid="stSidebar"] .stRadio [role="radiogroup"] label:hover {
        background: rgba(124, 58, 237, 0.1);
    }
    [data-testid="stSidebar"] .stRadio [role="radiogroup"] label[data-checked="true"] {
        background: rgba(124, 58, 237, 0.15);
        border: 1px solid rgba(124, 58, 237, 0.3);
    }

    /* ════════════════════════════════════════════
       KPI METRIC CARDS
    ════════════════════════════════════════════ */
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #1A2332 0%, #111827 100%);
        border: 1px solid #1E293B;
        border-radius: 14px;
        padding: 18px 20px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    [data-testid="stMetric"]:hover {
        border-color: #7C3AED;
        box-shadow: 0 4px 16px rgba(124, 58, 237, 0.12);
        transform: translateY(-1px);
    }
    [data-testid="stMetric"] label {
        color: #64748B !important;
        font-size: 0.72rem !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
    [data-testid="stMetric"] [data-testid="stMetricValue"] {
        font-size: 1.7rem !important;
        font-weight: 700 !important;
        color: #F1F5F9 !important;
        letter-spacing: -0.02em;
    }
    [data-testid="stMetric"] [data-testid="stMetricDelta"] {
        font-size: 0.8rem !important;
    }

    /* ════════════════════════════════════════════
       CHAT INTERFACE
    ════════════════════════════════════════════ */
    /* Chat messages */
    [data-testid="stChatMessage"] {
        border-radius: 14px;
        border: 1px solid rgba(30, 41, 59, 0.6);
        margin-bottom: 12px;
        padding: 14px 18px;
        backdrop-filter: blur(8px);
    }
    /* User message accent */
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {
        border-left: 3px solid #3B82F6;
        background: rgba(59, 130, 246, 0.04);
    }
    /* Bot message accent */
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) {
        border-left: 3px solid #7C3AED;
        background: rgba(124, 58, 237, 0.04);
    }

    /* Chat input */
    [data-testid="stChatInput"] {
        border-top: 1px solid #1E293B;
        padding-top: 12px;
    }
    [data-testid="stChatInput"] textarea {
        border-radius: 14px !important;
        border: 1.5px solid #334155 !important;
        background: #131B2E !important;
        padding: 12px 16px !important;
        font-size: 0.95rem !important;
        transition: all 0.2s ease !important;
    }
    [data-testid="stChatInput"] textarea:focus {
        border-color: #7C3AED !important;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15) !important;
    }
    [data-testid="stChatInput"] textarea::placeholder {
        color: #475569 !important;
    }

    /* ════════════════════════════════════════════
       BUTTONS
    ════════════════════════════════════════════ */
    .stButton > button {
        border-radius: 10px;
        font-weight: 500;
        font-size: 0.82rem;
        transition: all 0.2s ease;
        border: 1px solid #1E293B;
        background: linear-gradient(135deg, #1A2332, #131B2E);
        color: #CBD5E1;
        padding: 6px 14px;
    }
    .stButton > button:hover {
        border-color: #7C3AED;
        background: linear-gradient(135deg, #1E293B, #1A2332);
        color: #F1F5F9;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
    }
    .stButton > button:active {
        transform: scale(0.98);
    }

    /* Download button */
    .stDownloadButton > button {
        border-radius: 10px;
        font-weight: 500;
        border: 1px solid #1E293B;
        background: linear-gradient(135deg, #1A2332, #131B2E);
        color: #CBD5E1;
    }
    .stDownloadButton > button:hover {
        border-color: #10B981;
        color: #10B981;
    }

    /* ════════════════════════════════════════════
       DATAFRAME / TABLES
    ════════════════════════════════════════════ */
    [data-testid="stDataFrame"] {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #1E293B;
    }

    /* ════════════════════════════════════════════
       EXPANDERS
    ════════════════════════════════════════════ */
    [data-testid="stExpander"] {
        border: 1px solid #1E293B;
        border-radius: 10px;
        background: rgba(20, 27, 46, 0.4);
    }
    [data-testid="stExpander"] summary {
        font-size: 0.85rem;
        color: #94A3B8;
    }

    /* ════════════════════════════════════════════
       SELECTBOX / INPUTS
    ════════════════════════════════════════════ */
    .stSelectbox [data-baseweb="select"] {
        border-radius: 10px !important;
    }

    /* ════════════════════════════════════════════
       DIVIDERS
    ════════════════════════════════════════════ */
    hr {
        border-color: rgba(30, 41, 59, 0.6) !important;
        margin: 0.8rem 0 !important;
    }

    /* ════════════════════════════════════════════
       SCROLLBAR
    ════════════════════════════════════════════ */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }

    /* ════════════════════════════════════════════
       WELCOME HERO
    ════════════════════════════════════════════ */
    .hero-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #F1F5F9;
        margin-bottom: 4px;
        letter-spacing: -0.02em;
    }
    .hero-subtitle {
        font-size: 0.9rem;
        color: #64748B;
        margin-bottom: 16px;
    }

    /* ════════════════════════════════════════════
       INSIGHT CARDS (Dashboard)
    ════════════════════════════════════════════ */
    .insight-card {
        background: linear-gradient(135deg, #1A2332, #111827);
        border: 1px solid #1E293B;
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 8px;
        font-size: 0.88rem;
        color: #CBD5E1;
        line-height: 1.5;
    }
    .insight-card strong {
        color: #7C3AED;
    }

    /* ════════════════════════════════════════════
       RESPONSIVE — MOBILE (<768px)
    ════════════════════════════════════════════ */
    @media (max-width: 768px) {
        .main .block-container {
            padding-top: 0.8rem;
            padding-left: 0.8rem !important;
            padding-right: 0.8rem !important;
        }
        [data-testid="stMetric"] {
            padding: 12px 14px;
        }
        [data-testid="stMetric"] [data-testid="stMetricValue"] {
            font-size: 1.3rem !important;
        }
        [data-testid="stMetric"] label {
            font-size: 0.65rem !important;
        }
        .hero-title {
            font-size: 1.2rem;
        }
        /* Stack columns on mobile */
        [data-testid="stHorizontalBlock"] {
            flex-wrap: wrap;
        }
        [data-testid="stHorizontalBlock"] > [data-testid="stColumn"] {
            min-width: 45% !important;
        }
    }

    /* ════════════════════════════════════════════
       RESPONSIVE — SMALL PHONE (<480px)
    ════════════════════════════════════════════ */
    @media (max-width: 480px) {
        .main .block-container {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
        }
        [data-testid="stHorizontalBlock"] > [data-testid="stColumn"] {
            min-width: 100% !important;
        }
        [data-testid="stMetric"] [data-testid="stMetricValue"] {
            font-size: 1.1rem !important;
        }
        h1 { font-size: 1.3rem !important; }
        h2 { font-size: 1.1rem !important; }
        h3 { font-size: 1rem !important; }
    }

    /* ════════════════════════════════════════════
       SPINNER
    ════════════════════════════════════════════ */
    .stSpinner > div {
        border-top-color: #7C3AED !important;
    }

    /* ════════════════════════════════════════════
       TOOLTIP
    ════════════════════════════════════════════ */
    [data-baseweb="tooltip"] {
        border-radius: 8px !important;
    }
</style>
"""
