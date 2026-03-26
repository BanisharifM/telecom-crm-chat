"""Custom CSS styles for the Streamlit application.

Professional CRM dashboard theme with:
- Responsive design (mobile / tablet / desktop)
- Sidebar: fixed on desktop, collapsible on mobile with visible toggle
- Polished metric cards, chat interface, buttons
- Dark theme optimized for data visualization
"""

CUSTOM_CSS = """
<style>
    /* ════════════════════════════════════════════
       FONTS
    ════════════════════════════════════════════ */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }

    /* ════════════════════════════════════════════
       STREAMLIT CHROME — Selective hiding
       Keep header functional for sidebar toggle
    ════════════════════════════════════════════ */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    [data-testid="stDecoration"] {display: none;}
    header[data-testid="stHeader"] {
        background: transparent !important;
        border: none !important;
    }

    /* ════════════════════════════════════════════
       SIDEBAR
    ════════════════════════════════════════════ */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #070B14 0%, #0F1629 50%, #131B2E 100%);
        border-right: 1px solid rgba(30, 41, 59, 0.5);
    }
    [data-testid="stSidebar"] [data-testid="stMarkdown"] p {
        color: #94A3B8;
        font-size: 0.88rem;
    }

    /* Desktop: sidebar always open, hide collapse button */
    @media (min-width: 769px) {
        [data-testid="stSidebarCollapseButton"] {
            display: none !important;
        }
        [data-testid="stSidebar"] {
            min-width: 300px !important;
        }
    }

    /* Mobile/Tablet: styled toggle button */
    @media (max-width: 768px) {
        [data-testid="stSidebarCollapseButton"] {
            visibility: visible !important;
            z-index: 999999 !important;
        }
        [data-testid="stSidebarCollapseButton"] button {
            background: rgba(99, 102, 241, 0.9) !important;
            border: none !important;
            border-radius: 10px !important;
            color: #FFFFFF !important;
            width: 40px !important;
            height: 40px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        [data-testid="stSidebarCollapseButton"] button:hover {
            background: rgba(99, 102, 241, 1) !important;
            transform: scale(1.05);
        }
    }

    /* ════════════════════════════════════════════
       LAYOUT
    ════════════════════════════════════════════ */
    .main .block-container {
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
        max-width: 1200px;
    }

    /* ════════════════════════════════════════════
       KPI METRIC CARDS
    ════════════════════════════════════════════ */
    [data-testid="stMetric"] {
        background: linear-gradient(145deg, #111827 0%, #0D1321 100%);
        border: 1px solid rgba(30, 41, 59, 0.7);
        border-radius: 14px;
        padding: 18px 20px;
        transition: all 0.25s ease;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    [data-testid="stMetric"]:hover {
        border-color: rgba(99, 102, 241, 0.5);
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
        transform: translateY(-2px);
    }
    [data-testid="stMetric"] label {
        color: #64748B !important;
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    [data-testid="stMetric"] [data-testid="stMetricValue"] {
        font-size: 1.65rem !important;
        font-weight: 800 !important;
        color: #F1F5F9 !important;
        letter-spacing: -0.03em;
    }
    [data-testid="stMetric"] [data-testid="stMetricDelta"] {
        font-size: 0.78rem !important;
    }

    /* ════════════════════════════════════════════
       CHAT INTERFACE
    ════════════════════════════════════════════ */
    [data-testid="stChatMessage"] {
        border-radius: 16px;
        margin-bottom: 14px;
        padding: 16px 20px;
        border: 1px solid rgba(30, 41, 59, 0.4);
    }
    /* User bubble */
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.03));
        border-left: 3px solid #3B82F6;
    }
    /* Bot bubble */
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(99, 102, 241, 0.02));
        border-left: 3px solid #6366F1;
    }

    /* Chat input */
    [data-testid="stChatInput"] {
        border-top: 1px solid rgba(30, 41, 59, 0.4);
        padding-top: 14px;
    }
    [data-testid="stChatInput"] textarea {
        border-radius: 14px !important;
        border: 1.5px solid rgba(51, 65, 85, 0.6) !important;
        background: #0C1120 !important;
        padding: 12px 18px !important;
        font-size: 0.95rem !important;
        transition: all 0.2s ease !important;
    }
    [data-testid="stChatInput"] textarea:focus {
        border-color: #6366F1 !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
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
        border: 1px solid rgba(30, 41, 59, 0.7);
        background: linear-gradient(145deg, #111827, #0D1321);
        color: #94A3B8;
        padding: 8px 14px;
        line-height: 1.4;
        text-align: left;
    }
    .stButton > button:hover {
        border-color: #6366F1;
        color: #E2E8F0;
        box-shadow: 0 2px 12px rgba(99, 102, 241, 0.12);
        transform: translateY(-1px);
    }
    .stButton > button:active {
        transform: scale(0.98);
    }
    .stDownloadButton > button {
        border-radius: 10px;
        font-weight: 500;
        border: 1px solid rgba(30, 41, 59, 0.7);
        background: linear-gradient(145deg, #111827, #0D1321);
        color: #94A3B8;
        transition: all 0.2s ease;
    }
    .stDownloadButton > button:hover {
        border-color: #10B981;
        color: #10B981;
    }

    /* ════════════════════════════════════════════
       DATA TABLES
    ════════════════════════════════════════════ */
    [data-testid="stDataFrame"] {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(30, 41, 59, 0.5);
    }

    /* ════════════════════════════════════════════
       SELECTBOX / INPUTS
    ════════════════════════════════════════════ */
    .stSelectbox [data-baseweb="select"] {
        border-radius: 10px !important;
    }
    .stSelectbox label, .stRadio label {
        color: #64748B !important;
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    /* ════════════════════════════════════════════
       DIVIDERS
    ════════════════════════════════════════════ */
    hr {
        border-color: rgba(30, 41, 59, 0.4) !important;
        margin: 1rem 0 !important;
    }

    /* ════════════════════════════════════════════
       SCROLLBAR
    ════════════════════════════════════════════ */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }

    /* ════════════════════════════════════════════
       CUSTOM COMPONENTS
    ════════════════════════════════════════════ */
    /* Hero heading */
    .hero-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #F1F5F9;
        margin-bottom: 2px;
        letter-spacing: -0.03em;
    }
    .hero-subtitle {
        font-size: 0.88rem;
        color: #64748B;
        margin-bottom: 20px;
        line-height: 1.5;
    }

    /* Insight cards on dashboard */
    .insight-card {
        background: linear-gradient(145deg, #111827, #0D1321);
        border: 1px solid rgba(30, 41, 59, 0.5);
        border-left: 3px solid #6366F1;
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 10px;
        font-size: 0.88rem;
        color: #CBD5E1;
        line-height: 1.6;
    }
    .insight-card strong {
        color: #818CF8;
    }

    /* Brand in sidebar */
    .sidebar-brand {
        text-align: center;
        padding: 12px 0 8px;
    }
    .sidebar-brand-icon { font-size: 2.2rem; }
    .sidebar-brand-name {
        font-size: 1.15rem;
        font-weight: 800;
        color: #F1F5F9;
        letter-spacing: -0.02em;
        margin-top: 2px;
    }
    .sidebar-brand-sub {
        font-size: 0.65rem;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-top: 2px;
    }
    .sidebar-section-label {
        font-size: 0.65rem;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 700;
        margin-bottom: 6px;
    }
    .sidebar-footer {
        text-align: center;
        font-size: 0.68rem;
        color: #334155;
        line-height: 1.7;
    }
    .sidebar-footer strong { color: #6366F1; }

    /* ════════════════════════════════════════════
       RESPONSIVE — TABLET (≤768px)
    ════════════════════════════════════════════ */
    @media (max-width: 768px) {
        .main .block-container {
            padding: 1rem 0.8rem !important;
        }
        [data-testid="stMetric"] {
            padding: 12px 14px;
        }
        [data-testid="stMetric"] [data-testid="stMetricValue"] {
            font-size: 1.3rem !important;
        }
        .hero-title { font-size: 1.25rem; }
    }

    /* ════════════════════════════════════════════
       RESPONSIVE — MOBILE (≤480px)
    ════════════════════════════════════════════ */
    @media (max-width: 480px) {
        .main .block-container {
            padding: 0.6rem 0.5rem !important;
        }
        [data-testid="stHorizontalBlock"] > [data-testid="stColumn"] {
            min-width: 48% !important;
        }
        [data-testid="stMetric"] [data-testid="stMetricValue"] {
            font-size: 1.1rem !important;
        }
        [data-testid="stMetric"] label {
            font-size: 0.6rem !important;
        }
        .hero-title { font-size: 1.1rem; }
        .hero-subtitle { font-size: 0.8rem; }
        h1 { font-size: 1.2rem !important; }
        h2 { font-size: 1rem !important; }
        [data-testid="stChatMessage"] {
            padding: 10px 12px;
        }
    }
</style>
"""
